import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { Checklist } from "@/models/Checklist"
import { verifyAccessToken } from "@/lib/auth"

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

    if (!["service", "admin", "service_juniors", "esbd_juniors", "branch_manager", "branch_manager_juniors", "branch_service", "branch_service_juniors", "branch_sales", "branch_sales_juniors", "branch_consumable", "branch_consumable_juniors", "branch_accounts", "branch_accounts_juniors"].includes(payload.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()

    const existing = await Checklist.findOne({ taskId: body.taskId })
    if (existing) {
      return NextResponse.json({ error: "Checklist already exists for this call/case" }, { status: 409 })
    }

    const checklist = await Checklist.create({
      ...body,
      date: new Date(body.date),
      createdBy: payload.userId,
    })

    return NextResponse.json({ success: true, data: checklist }, { status: 201 })
  } catch (error) {
    console.error("Error creating checklist:", error)
    return NextResponse.json({ success: false, error: "Failed to create checklist" }, { status: 500 })
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

    if (!["service", "admin", "service_juniors", "esbd_juniors", "branch_manager", "branch_manager_juniors", "branch_service", "branch_service_juniors", "branch_sales", "branch_sales_juniors", "branch_consumable", "branch_consumable_juniors", "branch_accounts", "branch_accounts_juniors"].includes(payload.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get("taskId")

    let filter: Record<string, unknown> = {}
    if (taskId) filter.taskId = taskId

    const checklists = await Checklist.find(filter)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email")
      .lean()

    return NextResponse.json({ success: true, data: checklists })
  } catch (error) {
    console.error("Error getting checklists:", error)
    return NextResponse.json({ success: false, error: "Failed to get checklists" }, { status: 500 })
  }
}
