import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { PriceSupportEntry } from "@/models/PriceSupportEntry"
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
    const { amountBDT, gpMargin, notes } = body

    const updateData: Record<string, unknown> = {}
    if (amountBDT !== undefined) updateData.amountBDT = parseFloat(amountBDT)
    if (gpMargin !== undefined) updateData.gpMargin = parseFloat(gpMargin)
    if (notes !== undefined) updateData.notes = notes

    const entry = await PriceSupportEntry.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    return NextResponse.json({ entry })
  } catch (error) {
    console.error("Failed to update daily price support entry:", error)
    return NextResponse.json({ error: "Failed to update entry" }, { status: 500 })
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

    const entry = await PriceSupportEntry.findByIdAndDelete(id)

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Entry deleted successfully" })
  } catch (error) {
    console.error("Failed to delete daily price support entry:", error)
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 })
  }
}