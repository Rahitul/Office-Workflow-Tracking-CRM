import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { BranchServiceTarget } from "@/models/BranchServiceTarget"
import { verifyAccessToken } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get("branchId")
    const userId = searchParams.get("userId")
    const month = searchParams.get("month")
    const year = searchParams.get("year")

    const filter: Record<string, unknown> = {}
    if (branchId) filter.branchId = branchId
    if (userId) filter.userId = userId
    if (month) filter.month = parseInt(month)
    if (year) filter.year = parseInt(year)

    const targets = await BranchServiceTarget.find(filter)
      .populate("branchId", "name code")
      .populate("userId", "name")
      .sort({ year: -1, month: -1 })
      .lean()

    return NextResponse.json({ targets })
  } catch (error: any) {
    console.error("Get branch service targets error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await connectDB()
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const payload = await verifyAccessToken(accessToken)
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { branchId, userId, month, year, phoneCallsTarget, quotationsTarget, ordersTarget, billsTarget } = body

    if (!branchId || !userId || !month || !year) {
      return NextResponse.json({ error: "branchId, userId, month, and year are required" }, { status: 400 })
    }

    const target = await BranchServiceTarget.findOneAndUpdate(
      { branchId, userId, month: parseInt(month), year: parseInt(year) },
      {
        $set: {
          branchId,
          userId,
          month: parseInt(month),
          year: parseInt(year),
          phoneCallsTarget: phoneCallsTarget || 0,
          quotationsTarget: quotationsTarget || 0,
          ordersTarget: ordersTarget || 0,
          billsTarget: billsTarget || 0,
        },
      },
      { upsert: true, returnDocument: "after" }
    )

    return NextResponse.json({ target })
  } catch (error: any) {
    console.error("Set branch service target error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
