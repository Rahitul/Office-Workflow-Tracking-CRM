import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { KpiTarget } from "@/models/KpiTarget"
import { verifyAccessToken } from "@/lib/auth"

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
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (payload.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const result = await KpiTarget.aggregate([
      { $group: { _id: { year: "$year", month: "$month" } } },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 1 },
    ])

    if (result.length === 0) {
      return NextResponse.json({ targets: [], month: null, year: null })
    }

    const { month, year } = result[0]._id

    const targets = await KpiTarget.find({ month, year })
      .populate("userId", "name email")
      .sort({ userId: 1 })
      .lean()

    return NextResponse.json({ targets, month, year })
  } catch (error) {
    console.error("Failed to fetch previous KPI targets:", error)
    return NextResponse.json({ error: "Failed to fetch previous targets" }, { status: 500 })
  }
}
