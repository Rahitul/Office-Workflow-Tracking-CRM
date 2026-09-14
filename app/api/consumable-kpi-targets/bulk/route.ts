import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { ConsumableKpiTarget } from "@/models/ConsumableKpiTarget"
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
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (payload.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { month, year, targets } = body

    if (!month || !year || !targets || !Array.isArray(targets)) {
      return NextResponse.json(
        { error: "Month, year, and targets array are required" },
        { status: 400 }
      )
    }

    let savedCount = 0
    for (const t of targets) {
      await ConsumableKpiTarget.findOneAndUpdate(
        { userId: t.userId, month, year },
        {
          $set: {
            userId: t.userId,
            month,
            year,
            callsTarget: t.callsTarget ?? 0,
            visitsTarget: t.visitsTarget ?? 0,
            quotationTarget: t.quotationTarget ?? 0,
            orderAmountTarget: t.orderAmountTarget ?? 0,
            orderValueBlackAndWhite: t.orderValueBlackAndWhite ?? 0,
            orderValueColor: t.orderValueColor ?? 0,
            orderValueDuplicatorInk: t.orderValueDuplicatorInk ?? 0,
            orderValueDuplicatorMaster: t.orderValueDuplicatorMaster ?? 0,
            orderValueMps: t.orderValueMps ?? 0,
            billAmountTarget: t.billAmountTarget ?? 0,
            billValueBlackAndWhite: t.billValueBlackAndWhite ?? 0,
            billValueColor: t.billValueColor ?? 0,
            billValueDuplicatorInk: t.billValueDuplicatorInk ?? 0,
            billValueDuplicatorMaster: t.billValueDuplicatorMaster ?? 0,
            billValueMps: t.billValueMps ?? 0,
          },
        },
        { upsert: true }
      )
      savedCount++
    }

    return NextResponse.json({ saved: savedCount })
  } catch (error) {
    console.error("Failed to bulk save consumable KPI targets:", error)
    return NextResponse.json({ error: "Failed to bulk save targets" }, { status: 500 })
  }
}
