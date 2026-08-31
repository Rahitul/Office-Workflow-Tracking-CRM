import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { LeadTransfer } from "@/models/LeadTransfer"
import { Notification } from "@/models/Notification"
import { verifyAccessToken } from "@/lib/auth"
import mongoose from "mongoose"

export async function POST(request: Request) {
  try {
    await connectDB()

    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyAccessToken(accessToken)
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const lead = await LeadTransfer.create(body)

    try {
      if (body.toSalesPerson && mongoose.Types.ObjectId.isValid(body.toSalesPerson)) {
        await Notification.create({
          recipientUserId: new mongoose.Types.ObjectId(body.toSalesPerson),
          type: "lead_transfer",
          title: "New Lead Received",
          message: `You have received a new lead from ${body.employeeName || "a colleague"}. Company: ${body.companyName}`,
          relatedId: lead._id,
        })
      }
    } catch (notifError) {
      console.error("Notification creation failed (lead was saved):", notifError)
    }

    return NextResponse.json({ success: true, data: lead }, { status: 201 })
  } catch (error) {
    console.error("Error creating lead transfer:", error)
    const message = error instanceof Error ? error.message : "Failed to create lead transfer"
    return NextResponse.json({ success: false, error: "Failed to create lead transfer", details: message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    await connectDB()
    
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const payload = await verifyAccessToken(accessToken)
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    
    let leads
    if (type === "received") {
      const userId = searchParams.get("userId")
      leads = await LeadTransfer.find({ toSalesPerson: userId }).sort({ createdAt: -1 }).populate("fromUser", "name email").lean()
    } else if (type === "sent") {
      const userId = searchParams.get("userId")
      leads = await LeadTransfer.find({ fromUser: userId }).sort({ createdAt: -1 }).populate("toSalesPerson", "name email").lean()
    } else {
      leads = await LeadTransfer.find().sort({ createdAt: -1 }).populate("fromUser", "name email").populate("toSalesPerson", "name email").lean()
    }
    
    return NextResponse.json({ success: true, data: leads })
  } catch (error) {
    console.error("Error getting lead transfers:", error)
    return NextResponse.json({ success: false, error: "Failed to get lead transfers" }, { status: 500 })
  }
}