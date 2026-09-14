import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { BillTarget } from "@/models/BillTarget"
import { verifyAccessToken } from "@/lib/auth"

const ALLOWED_ROLES = ["service", "esbd", "branch_manager", "admin"]

export async function GET(request: Request) {
  try {
    await connectDB()

    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = await verifyAccessToken(accessToken)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    if (!ALLOWED_ROLES.includes(payload.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month")
    const year = searchParams.get("year")

    if (month && year) {
      const targets = await BillTarget.find({
        month: parseInt(month),
        year: parseInt(year),
      })
        .populate("userId", "name email role")
        .populate("setByUserId", "name")
        .lean()

      return NextResponse.json({ success: true, data: targets })
    }

    const targets = await BillTarget.find({})
      .populate("userId", "name email role")
      .populate("setByUserId", "name")
      .sort({ year: -1, month: -1 })
      .lean()

    return NextResponse.json({ success: true, data: targets })
  } catch (error) {
    console.error("Failed to fetch bill targets:", error)
    return NextResponse.json({ error: "Failed to fetch bill targets" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await connectDB()

    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = await verifyAccessToken(accessToken)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    if (!ALLOWED_ROLES.includes(payload.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json()
    const { month, year, targets } = body

    if (!targets || !Array.isArray(targets)) {
      return NextResponse.json({ error: "Targets array is required" }, { status: 400 })
    }

    if (!month || !year) {
      return NextResponse.json({ error: "month and year are required" }, { status: 400 })
    }

    let savedCount = 0
    for (const t of targets) {
      if (!t.userId || t.targetAmount === undefined) continue

      await BillTarget.findOneAndUpdate(
        { userId: t.userId, month, year },
        {
          $set: {
            userId: t.userId,
            month,
            year,
            targetAmount: t.targetAmount,
            setByUserId: payload.userId,
          },
        },
        { upsert: true }
      )
      savedCount++
    }

    return NextResponse.json({ success: true, saved: savedCount })
  } catch (error) {
    console.error("Failed to save bill targets:", error)
    return NextResponse.json({ error: "Failed to save bill targets" }, { status: 500 })
  }
}