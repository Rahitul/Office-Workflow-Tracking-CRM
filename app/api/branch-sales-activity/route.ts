import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { BranchSalesActivity } from "@/models/BranchSalesActivity"
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

    const body = await request.json()

    // Sanitize visits subdocuments
    if (body.visits && Array.isArray(body.visits)) {
      body.visits = body.visits.map((v: any) => ({
        customerName: v.customerName || "",
        contactPersonName: v.contactPersonName || "",
        contactPersonPhone: v.contactPersonPhone || "",
        primaryPurpose: v.primaryPurpose || "N/A",
        productsDiscussed: Array.isArray(v.productsDiscussed) ? v.productsDiscussed : [],
        outcome: v.outcome || "N/A",
        nextActionRequired: v.nextActionRequired || "",
        nextActionDate: v.nextActionDate || null,
      }))
    }

    console.log("BranchSalesActivity POST body:", JSON.stringify(body, null, 2))

    const activityDateStr = body.activityDate || new Date().toISOString().split("T")[0]
    const [y, m, d] = activityDateStr.split("-").map(Number)
    const activityDate = new Date(Date.UTC(y, m - 1, d))

    const existing = await BranchSalesActivity.findOne({
      activityDate,
      userId: payload.userId,
    })

    const updateData = { ...body, submittedAt: new Date() }
    delete updateData.activityDate

    if (existing) {
      const activity = await BranchSalesActivity.findOneAndUpdate(
        { _id: existing._id },
        { $set: updateData },
        { new: true }
      ).populate("userId", "name email")
      return NextResponse.json({ activity })
    } else {
      const activity = await BranchSalesActivity.create({
        ...body,
        activityDate,
        userId: payload.userId,
      })
      return NextResponse.json({ activity }, { status: 201 })
    }
  } catch (error: any) {
    console.error("Save branch sales activity error:", error?.message || error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
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

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const userId = searchParams.get("userId")

    const filter: Record<string, unknown> = {}
    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {}
      if (startDate) {
        const [sy, sm, sd] = startDate.split("-").map(Number)
        dateFilter.$gte = new Date(Date.UTC(sy, sm - 1, sd))
      }
      if (endDate) {
        const [ey, em, ed] = endDate.split("-").map(Number)
        dateFilter.$lte = new Date(Date.UTC(ey, em - 1, ed, 23, 59, 59, 999))
      }
      filter.activityDate = dateFilter
    }
    if (userId) {
      filter.userId = userId
    } else if (payload.role !== "admin") {
      filter.userId = payload.userId
    }

    const activities = await BranchSalesActivity.find(filter)
      .populate("userId", "name email")
      .sort({ activityDate: -1 })
      .lean()

    return NextResponse.json({ activities })
  } catch (error: any) {
    console.error("Get branch sales activities error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
