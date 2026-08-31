import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { CollectionTarget } from "@/models/CollectionTarget"
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
    const { amountBDT } = body

    if (!amountBDT) {
      return NextResponse.json({ error: "Amount is required" }, { status: 400 })
    }

    const target = await CollectionTarget.findByIdAndUpdate(
      id,
      { amountBDT: parseFloat(amountBDT) },
      { new: true }
    )

    if (!target) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 })
    }

    return NextResponse.json({ target })
  } catch (error) {
    console.error("Failed to update collection target:", error)
    return NextResponse.json({ error: "Failed to update collection target" }, { status: 500 })
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

    const target = await CollectionTarget.findByIdAndDelete(id)

    if (!target) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Target deleted successfully" })
  } catch (error) {
    console.error("Failed to delete collection target:", error)
    return NextResponse.json({ error: "Failed to delete collection target" }, { status: 500 })
  }
}