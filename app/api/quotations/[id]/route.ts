import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { Quotation } from "@/models/Quotation"
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

    if (!["service", "admin", "service_juniors", "esbd", "esbd_juniors", "branch_manager", "branch_manager_juniors", "branch_service", "branch_service_juniors", "branch_sales", "branch_sales_juniors", "branch_consumable", "branch_consumable_juniors", "branch_accounts", "branch_accounts_juniors"].includes(payload.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const updateData: Record<string, unknown> = {}
    if (body.amount !== undefined) updateData.amount = body.amount
    if (body.billDate !== undefined) updateData.billDate = new Date(body.billDate)
    if (body.engineer !== undefined) updateData.engineer = body.engineer
    if (body.department !== undefined) updateData.department = body.department

    if (body.status === "Follow Up") {
      const existing = await Quotation.findById(id)
      if (!existing) {
        return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
      }
      const nextNum = (existing.followUpAt || []).length + 1
      updateData.status = `Follow Up ${nextNum}`
      updateData.followUpAt = [...(existing.followUpAt || []), new Date()]
      updateData.followUpLogs = [
        ...((existing.followUpLogs || []) as Array<{ date: Date; userId: string; userName: string; remarks: string }>),
        { date: new Date(), userId: payload.userId, userName: body.followUpUser || "", remarks: body.followUpRemarks || "" },
      ]
    } else if (body.status !== undefined) {
      updateData.status = body.status
    }

    if (body.status === "Approved") {
      updateData.approvedAt = new Date()
    } else if (body.status === "Cancelled") {
      updateData.cancelledAt = new Date()
    } else if (body.status === "Revised") {
      updateData.revisedAt = new Date()
    } else if (body.status === "Lost") {
      updateData.lostAt = new Date()
      if (body.lostRemarks !== undefined) updateData.lostRemarks = body.lostRemarks
    }

    const quotation = await Quotation.findByIdAndUpdate(id, updateData, { new: true })

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: quotation })
  } catch (error) {
    console.error("Error updating quotation:", error)
    return NextResponse.json({ success: false, error: "Failed to update quotation" }, { status: 500 })
  }
}
