import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { PriceSupportEntry } from "@/models/PriceSupportEntry"
import { PriceSupportTarget } from "@/models/PriceSupportTarget"
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
    const projectClientName = searchParams.get("projectClientName")
    const month = searchParams.get("month")
    const year = searchParams.get("year")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const query: Record<string, unknown> = {}
    
    if (projectClientName) query.projectClientName = projectClientName
    if (month) query.month = parseInt(month)
    if (year) query.year = parseInt(year)
    if (startDate || endDate) {
      query.entryDate = {}
      if (startDate) (query.entryDate as Record<string, unknown>).$gte = startDate
      if (endDate) (query.entryDate as Record<string, unknown>).$lte = endDate
    }

    const entries = await PriceSupportEntry.find(query)
      .populate("enteredByUserId", "name email")
      .sort({ entryDate: -1 })
      .lean()

    return NextResponse.json({ entries })
  } catch (error) {
    console.error("Failed to fetch daily price support entries:", error)
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
      priceSupportTargetId,
      projectClientName,
      month,
      year,
      entryDate,
      amountBDT,
      gpMargin,
      executiveName,
      notes,
    } = body

    if (!projectClientName || !month || !year || !entryDate || !amountBDT || !gpMargin || !executiveName) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    let priceSupportTarget = null
    if (priceSupportTargetId) {
      priceSupportTarget = await PriceSupportTarget.findById(priceSupportTargetId)
      if (!priceSupportTarget) {
        return NextResponse.json({ error: "Price support target not found" }, { status: 404 })
      }
    }

    const existingEntry = await PriceSupportEntry.findOne({
      projectClientName,
      entryDate,
    })

    if (existingEntry) {
      existingEntry.amountBDT = amountBDT
      existingEntry.gpMargin = gpMargin
      existingEntry.executiveName = executiveName
      existingEntry.notes = notes || ""
      await existingEntry.save()
      return NextResponse.json({ entry: existingEntry })
    }

    const entryData: Record<string, unknown> = {
      projectClientName,
      month,
      year,
      entryDate,
      amountBDT,
      gpMargin,
      executiveName,
      notes: notes || "",
      enteredByUserId: new mongoose.Types.ObjectId(payload.userId),
    }

    if (priceSupportTargetId) {
      entryData.priceSupportTargetId = new mongoose.Types.ObjectId(priceSupportTargetId)
    }

    const entry = new PriceSupportEntry(entryData)

    await entry.save()
    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    console.error("Failed to create daily price support entry:", error)
    return NextResponse.json({ error: "Failed to create entry" }, { status: 500 })
  }
}