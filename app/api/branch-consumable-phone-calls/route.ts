import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { BranchConsumablePhoneCall } from "@/models/BranchConsumablePhoneCall"
import { verifyAccessToken } from "@/lib/auth"
import mongoose from "mongoose"

export async function POST(request: Request) {
  try {
    await connectDB()

    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = await verifyAccessToken(accessToken)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const body = await request.json()
    const { type, date, companyName, contactPersonName, contactPersonPhone, product, causeForCall, outcomeFromCall, isLeadSearch, leadFound, outgoingCallType, feedbackType } = body

    if (!type || !["cold", "follow-up"].includes(type)) {
      return NextResponse.json({ error: "Invalid call type" }, { status: 400 })
    }
    if (!date || !companyName || !contactPersonName || !contactPersonPhone) {
      return NextResponse.json({ error: "Date, company name, contact person, and phone are required" }, { status: 400 })
    }

    const call = new BranchConsumablePhoneCall({
      userId: new mongoose.Types.ObjectId(payload.userId),
      type,
      date,
      companyName,
      contactPersonName,
      contactPersonPhone,
      product: product || "",
      causeForCall: causeForCall || "",
      outcomeFromCall: outcomeFromCall || "",
      isLeadSearch: isLeadSearch || false,
      leadFound: leadFound || "",
      outgoingCallType: outgoingCallType || "Sales",
      feedbackType: feedbackType || "",
    })

    await call.save()

    return NextResponse.json({ message: "Call saved successfully", call }, { status: 201 })
  } catch (error: any) {
    console.error("Save branch consumable phone call error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    await connectDB()

    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = await verifyAccessToken(accessToken)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const userIdParam = searchParams.get("userId")

    const query: Record<string, unknown> = {}

    const selfOnlyRoles = ["branch_manager", "branch_manager_juniors", "branch_service", "branch_service_juniors", "branch_sales", "branch_sales_juniors", "branch_consumable", "branch_consumable_juniors", "branch_accounts", "branch_accounts_juniors"]
    if (selfOnlyRoles.includes(payload.role)) {
      query.userId = new mongoose.Types.ObjectId(payload.userId)
    } else if (userIdParam) {
      query.userId = new mongoose.Types.ObjectId(userIdParam)
    }

    if (type && ["cold", "follow-up"].includes(type)) {
      query.type = type
    }

    if (startDate || endDate) {
      const dateFilter: Record<string, string> = {}
      if (startDate) dateFilter.$gte = startDate
      if (endDate) dateFilter.$lte = endDate
      query.date = dateFilter
    }

    const calls = await BranchConsumablePhoneCall.find(query)
      .populate("userId", "name email")
      .sort({ createdAt: -1 })

    return NextResponse.json({ calls })
  } catch (error: any) {
    console.error("Get branch consumable phone calls error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
