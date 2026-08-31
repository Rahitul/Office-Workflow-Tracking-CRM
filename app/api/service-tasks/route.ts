import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { ServiceTask } from "@/models/ServiceTask"
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

    if (!["service", "admin", "esbd", "service_juniors", "esbd_juniors", "branch_manager", "branch_manager_juniors", "branch_service", "branch_service_juniors", "branch_sales", "branch_sales_juniors", "branch_consumable", "branch_consumable_juniors", "branch_accounts", "branch_accounts_juniors"].includes(payload.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()

    const existing = await ServiceTask.findOne({ taskId: body.taskId })
    if (existing) {
      return NextResponse.json({ error: "Call/Case ID already exists" }, { status: 409 })
    }

    const task = await ServiceTask.create({
      ...body,
      customerGroup: body.customerGroup || "Not a group of company",
      status: body.status || "Assigned",
      createdBy: payload.userId,
    })

    return NextResponse.json({ success: true, data: task }, { status: 201 })
  } catch (error) {
    console.error("Error creating service task:", error)
    return NextResponse.json({ success: false, error: "Failed to create service call/case" }, { status: 500 })
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

    if (!["service", "admin", "esbd", "service_juniors", "esbd_juniors", "branch_manager", "branch_manager_juniors", "branch_service", "branch_service_juniors", "branch_sales", "branch_sales_juniors", "branch_consumable", "branch_consumable_juniors", "branch_accounts", "branch_accounts_juniors"].includes(payload.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const createdBy = searchParams.get("createdBy")
    const assignedTo = searchParams.get("assignedTo")
    const status = searchParams.get("status")
    const countOnly = searchParams.get("countOnly") === "true"

    let filter: Record<string, unknown> = {}
    if (createdBy && assignedTo) {
      filter.$or = [{ createdBy }, { assignedEngineer: assignedTo }]
    } else if (createdBy) {
      filter.createdBy = createdBy
    } else if (assignedTo) {
      filter.assignedEngineer = assignedTo
    }
    if (status) filter.status = status

    if (countOnly) {
      const count = await ServiceTask.countDocuments(filter)
      return NextResponse.json({ success: true, count })
    }

    const tasks = await ServiceTask.find(filter)
      .sort({ createdAt: -1 })
      .populate("assignedEngineer", "name email")
      .populate("receivedBy", "name email")
      .populate("createdBy", "name email")
      .lean()

    return NextResponse.json({ success: true, data: tasks })
  } catch (error) {
    console.error("Error getting service tasks:", error)
    return NextResponse.json({ success: false, error: "Failed to get service calls/cases" }, { status: 500 })
  }
}
