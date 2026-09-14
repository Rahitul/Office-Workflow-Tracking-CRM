import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { BreakRecord } from "@/models/BreakRecord"
import { verifyAccessToken } from "@/lib/auth"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()

    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = await verifyAccessToken(accessToken)
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (!["service", "admin", "esbd", "service_juniors", "esbd_juniors", "branch_manager", "branch_manager_juniors", "branch_service", "branch_service_juniors", "branch_sales", "branch_sales_juniors", "branch_consumable", "branch_consumable_juniors", "branch_accounts", "branch_accounts_juniors"].includes(payload.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    if (body.action === "endBreak") {
      const record = await BreakRecord.findById(id)
      if (!record) return NextResponse.json({ error: "Break record not found" }, { status: 404 })

      const now = new Date()
      const durationSeconds = Math.floor((now.getTime() - record.startedAt.getTime()) / 1000)

      record.endedAt = now
      record.durationSeconds = durationSeconds
      await record.save()

      return NextResponse.json({ success: true, data: record })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error updating break record:", error)
    return NextResponse.json({ success: false, error: "Failed to update break record" }, { status: 500 })
  }
}
