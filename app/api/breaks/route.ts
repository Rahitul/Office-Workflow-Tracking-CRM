import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { BreakRecord } from "@/models/BreakRecord"
import { ServiceTask } from "@/models/ServiceTask"
import { verifyAccessToken } from "@/lib/auth"

export async function POST(request: Request) {
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

    const body = await request.json()
    const { userId, completedTaskId } = body

    if (!userId || !completedTaskId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const today = new Date().toISOString().split("T")[0]

    const existingCount = await BreakRecord.countDocuments({ userId, completedTaskId })
    const breakNumber = existingCount + 1

    const existing = await BreakRecord.findOne({ userId, completedTaskId, breakNumber })
    if (existing) {
      return NextResponse.json({ success: true, data: existing })
    }

    const record = await BreakRecord.create({
      userId,
      completedTaskId,
      breakNumber,
      startedAt: new Date(),
      date: today,
    })

    return NextResponse.json({ success: true, data: record })
  } catch (error) {
    console.error("Error creating break record:", error)
    return NextResponse.json({ success: false, error: "Failed to create break record" }, { status: 500 })
  }
}

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const date = searchParams.get("date")
    const month = searchParams.get("month")
    const year = searchParams.get("year")
    const active = searchParams.get("active")

    const filter: Record<string, unknown> = {}
    if (userId) filter.userId = userId
    if (date) filter.date = date
    if (month && year) {
      const prefix = `${year}-${month.padStart(2, "0")}`
      filter.date = { $regex: `^${prefix}` }
    }
    if (active === "true") filter.endedAt = null

    const records = await BreakRecord.find(filter)
      .populate("userId", "name email role")
      .populate("completedTaskId", "customerName problem taskId")
      .sort({ startedAt: -1 })

    return NextResponse.json({ success: true, data: records })
  } catch (error) {
    console.error("Error fetching break records:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch break records" }, { status: 500 })
  }
}
