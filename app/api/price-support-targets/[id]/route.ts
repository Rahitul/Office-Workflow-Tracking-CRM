import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { PriceSupportTarget } from "@/models/PriceSupportTarget"
import { verifyAccessToken } from "@/lib/auth"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const payload = await verifyAccessToken(accessToken)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    
    if (payload.role !== "accounts" && payload.role !== "admin") {
      return NextResponse.json({ error: "Accounts or Admin access required" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { amountBDT, gpMargin } = body

    const updateData: Record<string, number> = {}
    if (amountBDT !== undefined) updateData.amountBDT = parseFloat(amountBDT)
    if (gpMargin !== undefined) updateData.gpMargin = parseFloat(gpMargin)

    const target = await PriceSupportTarget.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )

    if (!target) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 })
    }

    return NextResponse.json({ target })
  } catch (error) {
    console.error("Failed to update price support target:", error)
    return NextResponse.json({ error: "Failed to update price support target" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const payload = await verifyAccessToken(accessToken)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    
    if (payload.role !== "accounts" && payload.role !== "admin") {
      return NextResponse.json({ error: "Accounts or Admin access required" }, { status: 403 })
    }

    const { id } = await params

    const target = await PriceSupportTarget.findByIdAndDelete(id)

    if (!target) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Target deleted successfully" })
  } catch (error) {
    console.error("Failed to delete price support target:", error)
    return NextResponse.json({ error: "Failed to delete price support target" }, { status: 500 })
  }
}