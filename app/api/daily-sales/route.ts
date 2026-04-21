import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { DailySalesEntry } from "@/models/DailySalesEntry"
import { SalesTarget } from "@/models/SalesTarget"
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
    const targetType = searchParams.get("targetType")
    const targetId = searchParams.get("targetId")
    const month = searchParams.get("month")
    const year = searchParams.get("year")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const query: Record<string, unknown> = {}
    
    if (targetType) query.targetType = targetType
    if (targetId) query.targetId = targetId
    if (month) query.month = parseInt(month)
    if (year) query.year = parseInt(year)
    if (startDate || endDate) {
      query.entryDate = {}
      if (startDate) (query.entryDate as Record<string, unknown>).$gte = startDate
      if (endDate) (query.entryDate as Record<string, unknown>).$lte = endDate
    }

    const entries = await DailySalesEntry.find(query)
      .populate("enteredByUserId", "name email")
      .sort({ entryDate: -1 })
      .lean()

    return NextResponse.json({ entries })
  } catch (error) {
    console.error("Failed to fetch daily sales entries:", error)
    return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 })
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
    
    if (payload.role !== "accounts" && payload.role !== "admin") {
      return NextResponse.json({ error: "Accounts or Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const {
      salesTargetId,
      targetType,
      targetId,
      targetName,
      month,
      year,
      entryDate,
      amountBDT,
      notes,
    } = body

    if (!salesTargetId || !targetType || !targetId || !targetName || !month || !year || !entryDate || !amountBDT) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (!["department", "branch", "salesman"].includes(targetType)) {
      return NextResponse.json({ error: "Invalid target type" }, { status: 400 })
    }

    const salesTarget = await SalesTarget.findById(salesTargetId)
    if (!salesTarget) {
      return NextResponse.json({ error: "Sales target not found" }, { status: 404 })
    }

    const existingEntry = await DailySalesEntry.findOne({
      targetId,
      entryDate,
    })

    if (existingEntry) {
      existingEntry.amountBDT = amountBDT
      existingEntry.notes = notes || ""
      await existingEntry.save()
      return NextResponse.json({ entry: existingEntry })
    }

    const entry = new DailySalesEntry({
      salesTargetId: new mongoose.Types.ObjectId(salesTargetId),
      targetType,
      targetId,
      targetName,
      month,
      year,
      entryDate,
      amountBDT,
      notes: notes || "",
      enteredByUserId: new mongoose.Types.ObjectId(payload.userId),
    })

    await entry.save()
    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    console.error("Failed to create daily sales entry:", error)
    return NextResponse.json({ error: "Failed to create entry" }, { status: 500 })
  }
}