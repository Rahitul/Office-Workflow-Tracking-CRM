import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { ProjectTender } from "@/models/ProjectTender"
import { User } from "@/models/User"
import { verifyAccessToken } from "@/lib/auth"

const ALLOWED_ROLES = ["user", "user_juniors", "consumable", "consumable_juniors", "service", "service_juniors", "esbd", "admin"]

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = await verifyAccessToken(accessToken)
    if (!payload || !ALLOWED_ROLES.includes(payload.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const record = await ProjectTender.findById(id).populate("createdBy", "name email")

    if (!record) return NextResponse.json({ error: "Record not found" }, { status: 404 })

    if (payload.role !== "admin" && record.createdBy._id.toString() !== payload.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ success: true, data: record })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch record" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = await verifyAccessToken(accessToken)
    if (!payload || !ALLOWED_ROLES.includes(payload.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const record = await ProjectTender.findById(id)
    if (!record) return NextResponse.json({ error: "Record not found" }, { status: 404 })

    if (payload.role !== "admin" && record.createdBy.toString() !== payload.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const updateData: Record<string, unknown> = {}

    let actorName = record.username || payload.email?.split("@")[0] || "User"
    try {
      const actor = await User.findById(payload.userId).select("name")
      if (actor?.name) actorName = actor.name
    } catch {
      // ignore name lookup failure
    }

    const historyEntries: { status: string; changedAt: Date; byName: string; remarks?: string }[] = []

    // Resubmit — user re-editing after revision
    if (body.resubmit === true) {
      const [y, m, d] = body.date.split("-").map(Number)
      updateData.date = new Date(Date.UTC(y, m - 1, d))
      updateData.category = body.category
      updateData.address = body.address
      updateData.locationDistrict = body.locationDistrict
      if (body.tentativeCloseDate) {
        const [ty, tm, td] = body.tentativeCloseDate.split("-").map(Number)
        updateData.tentativeCloseDate = new Date(Date.UTC(ty, tm - 1, td))
      }
      updateData.projectName = body.projectName
      updateData.companyName = body.companyName
      updateData.contactPersonName = body.contactPersonName
      updateData.contactPersonNumber = body.contactPersonNumber
      updateData.products = body.products
      updateData.requiresSupport = body.requiresSupport
      updateData.supportRequirements = body.requiresSupport ? (body.supportRequirements || []) : []
      updateData.requestedPrice = Number(body.requestedPrice)
      updateData.businessPromotionAmount = Number(body.businessPromotionAmount)
      if (body.documentPurchaseAmount !== undefined) updateData.documentPurchaseAmount = Number(body.documentPurchaseAmount)
      if (body.securityDepositAmount !== undefined) updateData.securityDepositAmount = Number(body.securityDepositAmount)
      updateData.adminStatus = "pending"
      updateData.adminRemarks = ""
      updateData.status = "pending"
      updateData.negotiablePriceApproved = false
      historyEntries.push({ status: "pending", changedAt: new Date(), byName: actorName, remarks: "Resubmitted after revision" })
    }

    // Admin actions
    if (payload.role === "admin") {
      if (body.adminStatus === "approved") {
        updateData.adminStatus = "approved"
        updateData.adminRemarks = body.adminRemarks || ""
        historyEntries.push({ status: "approved", changedAt: new Date(), byName: actorName, remarks: body.adminRemarks || "Approved by admin" })
      } else if (body.adminStatus === "revised") {
        updateData.adminStatus = "revised"
        if (body.adminRemarks !== undefined) updateData.adminRemarks = body.adminRemarks
        historyEntries.push({ status: "revised", changedAt: new Date(), byName: actorName, remarks: body.adminRemarks || "Revised by admin" })
      }
      if (body.priceRevision === true) {
        updateData.status = "quotation_submitted"
        updateData.negotiablePriceApproved = false
        if (body.adminRemarks !== undefined) updateData.adminRemarks = body.adminRemarks
        historyEntries.push({ status: "price_revised", changedAt: new Date(), byName: actorName, remarks: body.adminRemarks || "Price revised by admin" })
      }
      if (body.negotiablePriceApproved !== undefined) {
        updateData.negotiablePriceApproved = body.negotiablePriceApproved
        if (body.negotiablePriceApproved === true) {
          historyEntries.push({ status: "price_approved", changedAt: new Date(), byName: actorName, remarks: "Price approved by admin" })
        }
      }
    }

    // User workflow updates (only when not resubmitting)
    if (!body.resubmit) {
      if (body.status !== undefined && body.status !== record.status) {
        updateData.status = body.status
        historyEntries.push({
          status: body.status,
          changedAt: new Date(),
          byName: actorName,
          remarks: body.status === "lost" ? (body.lostRemarks || "Marked as lost") : undefined,
        })
      }
      if (body.negotiablePrice !== undefined) updateData.negotiablePrice = body.negotiablePrice
      if (body.billNumber !== undefined) updateData.billNumber = body.billNumber
      if (body.billDate !== undefined) {
        const [y2, m2, d2] = body.billDate.split("-").map(Number)
        updateData.billDate = new Date(Date.UTC(y2, m2 - 1, d2))
      }
      if (body.lostRemarks !== undefined) updateData.lostRemarks = body.lostRemarks
    }

    const updated = await ProjectTender.findByIdAndUpdate(id, updateData, { new: true }).populate("createdBy", "name email")

    if (!updated) return NextResponse.json({ error: "Record not found" }, { status: 404 })

    if (historyEntries.length > 0) {
      updated.statusHistory.push(...historyEntries)
      await updated.save()
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to update record" }, { status: 500 })
  }
}
