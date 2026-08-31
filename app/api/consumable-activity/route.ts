import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { ConsumableActivity } from "@/models/ConsumableActivity"
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

    const body = await request.json()
    const { activityDate, userId, calls, visits, quotation, quotationQty, orders, orderQty, orderValueBlackAndWhite, orderValueColor, orderValueDuplicatorInk, orderValueDuplicatorMaster, orderValueMps, bill, billQty, billValueBlackAndWhite, billValueColor, billValueDuplicatorInk, billValueDuplicatorMaster, billValueMps } = body

    if (!activityDate || !userId) {
      return NextResponse.json({ error: "Activity date and user ID are required" }, { status: 400 })
    }

    const [year, month, day] = activityDate.split("-").map(Number)
    const date = new Date(Date.UTC(year, month - 1, day))

    const filter = { activityDate: date, userId }
    const update = {
      $set: {
        calls: calls ?? 0,
        visits: visits ?? 0,
        quotation: quotation ?? 0,
        quotationQty: quotationQty ?? 0,
        orders: orders ?? 0,
        orderQty: orderQty ?? 0,
        orderValueBlackAndWhite: orderValueBlackAndWhite ?? 0,
        orderValueColor: orderValueColor ?? 0,
        orderValueDuplicatorInk: orderValueDuplicatorInk ?? 0,
        orderValueDuplicatorMaster: orderValueDuplicatorMaster ?? 0,
        orderValueMps: orderValueMps ?? 0,
        bill: bill ?? 0,
        billQty: billQty ?? 0,
        billValueBlackAndWhite: billValueBlackAndWhite ?? 0,
        billValueColor: billValueColor ?? 0,
        billValueDuplicatorInk: billValueDuplicatorInk ?? 0,
        billValueDuplicatorMaster: billValueDuplicatorMaster ?? 0,
        billValueMps: billValueMps ?? 0,
        submittedAt: new Date(),
      },
    }

    const result = await ConsumableActivity.findOneAndUpdate(filter, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    })

    const status = result.submittedAt === update.$set.submittedAt ? 200 : 201
    return NextResponse.json({ activity: result }, { status })
  } catch (error: any) {
    console.error("Consumable activity POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    let userId = searchParams.get("userId")

    if (payload.role === "consumable_juniors") {
      userId = payload.userId
    }

    const query: any = {}

    if (startDate || endDate) {
      query.activityDate = {}
      if (startDate) {
        const [y, m, d] = startDate.split("-").map(Number)
        query.activityDate.$gte = new Date(Date.UTC(y, m - 1, d))
      }
      if (endDate) {
        const [y, m, d] = endDate.split("-").map(Number)
        query.activityDate.$lte = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999))
      }
    }

    if (userId) {
      query.userId = userId
    }

    const activities = await ConsumableActivity.find(query)
      .populate("userId", "name email")
      .sort({ activityDate: -1 })

    return NextResponse.json({ activities })
  } catch (error: any) {
    console.error("Consumable activity GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
