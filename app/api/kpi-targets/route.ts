import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { KpiTarget } from "@/models/KpiTarget"
import { verifyAccessToken } from "@/lib/auth"
import mongoose from "mongoose"

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

    const query: Record<string, unknown> = {}
    
    if (payload.role === "admin") {
      if (userId) query.userId = new mongoose.Types.ObjectId(userId)
    } else {
      query.userId = new mongoose.Types.ObjectId(payload.userId)
    }
    
    if (month) query.month = parseInt(month)
    if (year) query.year = parseInt(year)

    const targets = await KpiTarget.find(query)
      .populate("userId", "name email")
      .sort({ year: -1, month: -1 })
      .lean()

    return NextResponse.json({ targets })
  } catch (error) {
    console.error("Failed to fetch KPI targets:", error)
    return NextResponse.json({ error: "Failed to fetch KPI targets" }, { status: 500 })
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
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    
    if (payload.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const {
      userId,
      month,
      year,
      coldCallsMade,
      followUpCallsMade,
      newAppointmentsFixed,
      customerVisitsCompleted,
      salesEmailsSent,
      ordersClosedTodayValue,
      quotationsIssuedTodayValue,
    } = body

    if (!userId || !month || !year) {
      return NextResponse.json({ error: "User, month, and year are required" }, { status: 400 })
    }

    const existingTarget = await KpiTarget.findOne({
      userId,
      month,
      year,
    })

    if (existingTarget) {
      existingTarget.coldCallsMade = coldCallsMade ?? existingTarget.coldCallsMade
      existingTarget.followUpCallsMade = followUpCallsMade ?? existingTarget.followUpCallsMade
      existingTarget.newAppointmentsFixed = newAppointmentsFixed ?? existingTarget.newAppointmentsFixed
      existingTarget.customerVisitsCompleted = customerVisitsCompleted ?? existingTarget.customerVisitsCompleted
      existingTarget.salesEmailsSent = salesEmailsSent ?? existingTarget.salesEmailsSent
      existingTarget.ordersClosedTodayValue = ordersClosedTodayValue ?? existingTarget.ordersClosedTodayValue
      existingTarget.quotationsIssuedTodayValue = quotationsIssuedTodayValue ?? existingTarget.quotationsIssuedTodayValue
      await existingTarget.save()
      return NextResponse.json({ target: existingTarget })
    }

    const target = new KpiTarget({
      userId,
      month,
      year,
      coldCallsMade: coldCallsMade ?? 0,
      followUpCallsMade: followUpCallsMade ?? 0,
      newAppointmentsFixed: newAppointmentsFixed ?? 0,
      customerVisitsCompleted: customerVisitsCompleted ?? 0,
      salesEmailsSent: salesEmailsSent ?? 0,
      ordersClosedTodayValue: ordersClosedTodayValue ?? 0,
      quotationsIssuedTodayValue: quotationsIssuedTodayValue ?? 0,
    })

    await target.save()
    return NextResponse.json({ target }, { status: 201 })
  } catch (error) {
    console.error("Failed to create/update KPI target:", error)
    return NextResponse.json({ error: "Failed to create KPI target" }, { status: 500 })
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
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    
    if (payload.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Target ID is required" }, { status: 400 })
    }

    await KpiTarget.findByIdAndDelete(id)
    return NextResponse.json({ message: "Target deleted successfully" })
  } catch (error) {
    console.error("Failed to delete KPI target:", error)
    return NextResponse.json({ error: "Failed to delete target" }, { status: 500 })
  }
}