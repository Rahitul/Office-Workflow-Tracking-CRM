import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { ServiceTask } from "@/models/ServiceTask"
import { verifyAccessToken } from "@/lib/auth"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params

    const body = await request.json()

    const updateData: Record<string, unknown> = {}
    if (body.status !== undefined) updateData.status = body.status
    if (body.assignedEngineer !== undefined) updateData.assignedEngineer = body.assignedEngineer
    if (body.receivedBy !== undefined) updateData.receivedBy = body.receivedBy
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.department !== undefined) updateData.department = body.department
    if (body.fromLocation !== undefined) updateData.fromLocation = body.fromLocation
    if (body.toLocation !== undefined) updateData.toLocation = body.toLocation
    if (body.vehicleType !== undefined) updateData.vehicleType = body.vehicleType
    if (body.gapAssignedToAcknowledge !== undefined) updateData.gapAssignedToAcknowledge = body.gapAssignedToAcknowledge
    if (body.gapAcknowledgeToTravelStarted !== undefined) updateData.gapAcknowledgeToTravelStarted = body.gapAcknowledgeToTravelStarted
    if (body.gapTravelStartedToCheckedIn !== undefined) updateData.gapTravelStartedToCheckedIn = body.gapTravelStartedToCheckedIn
    if (body.gapCheckedInToChecklistSubmitted !== undefined) updateData.gapCheckedInToChecklistSubmitted = body.gapCheckedInToChecklistSubmitted
    if (body.gapChecklistSubmittedToCompleted !== undefined) updateData.gapChecklistSubmittedToCompleted = body.gapChecklistSubmittedToCompleted

    if (body.status === "Acknowledge") {
      updateData.acknowledgedAt = new Date()
      if (body.lat !== undefined) updateData.acknowledgedLat = body.lat
      if (body.lng !== undefined) updateData.acknowledgedLng = body.lng
    } else if (body.status === "Travel Started") {
      updateData.travelStartedAt = new Date()
      if (body.lat !== undefined) updateData.travelStartedLat = body.lat
      if (body.lng !== undefined) updateData.travelStartedLng = body.lng
    } else if (body.status === "Checked In") {
      updateData.checkedInAt = new Date()
      if (body.lat !== undefined) updateData.checkedInLat = body.lat
      if (body.lng !== undefined) updateData.checkedInLng = body.lng
    } else if (body.status === "Checklist Submitted") {
      updateData.checklistSubmittedAt = new Date()
      if (body.lat !== undefined) updateData.checklistSubmittedLat = body.lat
      if (body.lng !== undefined) updateData.checklistSubmittedLng = body.lng
    } else if (body.status === "Completed") {
      updateData.completedAt = new Date()
      if (body.lat !== undefined) updateData.completedLat = body.lat
      if (body.lng !== undefined) updateData.completedLng = body.lng
    }

    if (body.resetTimestamps) {
      updateData.acknowledgedAt = null
      updateData.acknowledgedLat = null
      updateData.acknowledgedLng = null
      updateData.travelStartedAt = null
      updateData.travelStartedLat = null
      updateData.travelStartedLng = null
      updateData.checkedInAt = null
      updateData.checkedInLat = null
      updateData.checkedInLng = null
      updateData.checklistSubmittedAt = null
      updateData.checklistSubmittedLat = null
      updateData.checklistSubmittedLng = null
      updateData.completedAt = null
      updateData.completedLat = null
      updateData.completedLng = null
    }

    if (body.priority !== undefined && body.priority > 0 && !body.skipSwap) {
      const engineerId = body.assignedEngineer
      const currentTask = await ServiceTask.findById(id).select("assignedEngineer priority").lean()
      if (currentTask) {
        const oldPriority = currentTask.priority
        const targetEngineer = engineerId || currentTask.assignedEngineer
        if (oldPriority !== body.priority && targetEngineer) {
          const conflictTask = await ServiceTask.findOne({
            _id: { $ne: id },
            assignedEngineer: targetEngineer,
            priority: body.priority,
          }).select("_id")
          if (conflictTask) {
            await ServiceTask.findByIdAndUpdate(conflictTask._id, { priority: oldPriority })
          }
        }
      }
    }

    const task = await ServiceTask.findByIdAndUpdate(id, updateData, { new: true })
      .populate("assignedEngineer", "name email")
      .populate("receivedBy", "name email")
      .populate("createdBy", "name email")
      .lean()

    if (!task) {
      return NextResponse.json({ success: false, error: "Call/Case not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: task })
  } catch (error) {
    console.error("Error updating service task:", error)
    return NextResponse.json({ success: false, error: "Failed to update service call/case" }, { status: 500 })
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (payload.role !== "service" && payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const task = await ServiceTask.findByIdAndDelete(id)

    if (!task) {
      return NextResponse.json({ success: false, error: "Call/Case not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Call/Case deleted" })
  } catch (error) {
    console.error("Error deleting service task:", error)
    return NextResponse.json({ success: false, error: "Failed to delete service call/case" }, { status: 500 })
  }
}
