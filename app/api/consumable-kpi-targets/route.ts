import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { ConsumableKpiTarget } from "@/models/ConsumableKpiTarget"
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

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const month = searchParams.get("month")
    const year = searchParams.get("year")

    const query: any = {}

    if (payload.role !== "admin" && payload.role !== "consumable") {
      query.userId = payload.userId
    } else if (userId) {
      query.userId = userId
    }

    if (month) query.month = parseInt(month)
    if (year) query.year = parseInt(year)

    const targets = await ConsumableKpiTarget.find(query)
      .populate("userId", "name email")
      .sort({ year: -1, month: -1 })

    return NextResponse.json({ targets })
  } catch (error: any) {
    console.error("Consumable KPI targets GET error:", error)
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
    const { userId, month, year, callsTarget, visitsTarget, quotationTarget, orderAmountTarget, orderValueBlackAndWhite, orderValueColor, orderValueDuplicatorInk, orderValueDuplicatorMaster, orderValueMps, billAmountTarget, billValueBlackAndWhite, billValueColor, billValueDuplicatorInk, billValueDuplicatorMaster, billValueMps } = body

    if (!userId || !month || !year) {
      return NextResponse.json({ error: "User ID, month, and year are required" }, { status: 400 })
    }

    const filter = { userId, month, year }
    const update = {
      $set: {
        callsTarget: callsTarget ?? 0,
        visitsTarget: visitsTarget ?? 0,
        quotationTarget: quotationTarget ?? 0,
        orderAmountTarget: orderAmountTarget ?? 0,
        orderValueBlackAndWhite: orderValueBlackAndWhite ?? 0,
        orderValueColor: orderValueColor ?? 0,
        orderValueDuplicatorInk: orderValueDuplicatorInk ?? 0,
        orderValueDuplicatorMaster: orderValueDuplicatorMaster ?? 0,
        orderValueMps: orderValueMps ?? 0,
        billAmountTarget: billAmountTarget ?? 0,
        billValueBlackAndWhite: billValueBlackAndWhite ?? 0,
        billValueColor: billValueColor ?? 0,
        billValueDuplicatorInk: billValueDuplicatorInk ?? 0,
        billValueDuplicatorMaster: billValueDuplicatorMaster ?? 0,
        billValueMps: billValueMps ?? 0,
      },
    }

    const target = await ConsumableKpiTarget.findOneAndUpdate(filter, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    })

    return NextResponse.json({ target })
  } catch (error: any) {
    console.error("Consumable KPI targets POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Target ID is required" }, { status: 400 })
    }

    await ConsumableKpiTarget.findByIdAndDelete(id)

    return NextResponse.json({ message: "Target deleted" })
  } catch (error: any) {
    console.error("Consumable KPI targets DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
