import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { BillTarget } from "@/models/BillTarget"
import { verifyAccessToken } from "@/lib/auth"

const ALLOWED_ROLES = ["service", "esbd", "branch_manager", "admin"]

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = await verifyAccessToken(accessToken)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    if (!ALLOWED_ROLES.includes(payload.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const body = await request.json()
    const { targetAmount } = body

    if (targetAmount === undefined) {
      return NextResponse.json({ error: "targetAmount is required" }, { status: 400 })
    }

    const target = await BillTarget.findByIdAndUpdate(
      id,
      { $set: { targetAmount, setByUserId: payload.userId } },
      { new: true }
    )

    if (!target) return NextResponse.json({ error: "Target not found" }, { status: 404 })

    return NextResponse.json({ success: true, data: target })
  } catch (error) {
    console.error("Failed to update bill target:", error)
    return NextResponse.json({ error: "Failed to update bill target" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = await verifyAccessToken(accessToken)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    if (!ALLOWED_ROLES.includes(payload.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const target = await BillTarget.findByIdAndDelete(id)
    if (!target) return NextResponse.json({ error: "Target not found" }, { status: 404 })

    return NextResponse.json({ success: true, message: "Target deleted" })
  } catch (error) {
    console.error("Failed to delete bill target:", error)
    return NextResponse.json({ error: "Failed to delete bill target" }, { status: 500 })
  }
}
