import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { BudgetActual } from "@/models/BudgetActual"
import { BudgetActualEntry } from "@/models/BudgetActualEntry"
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
    const field = searchParams.get("field")
    const month = searchParams.get("month")
    const year = searchParams.get("year")

    const query: Record<string, unknown> = {}
    
    if (field) query.field = field
    if (month) query.month = parseInt(month)
    if (year) query.year = parseInt(year)

    const entries = await BudgetActualEntry.find(query)
      .populate("setByUserId", "name email")
      .sort({ entryDate: -1 })
      .lean()

    return NextResponse.json({ entries })
  } catch (error) {
    console.error("Failed to fetch budget actual entries:", error)
    return NextResponse.json({ error: "Failed to fetch budget actual entries" }, { status: 500 })
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
    const { field, month, year, entryDate, actualAmount, notes } = body

    if (!field || !month || !year || !entryDate || !actualAmount) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const budget = await BudgetActual.findOne({
      field,
      month,
      year,
    })

    if (!budget) {
      return NextResponse.json({ 
        error: `No budget set for ${field} in this month/year. Please set budget first.` 
      }, { status: 404 })
    }

    const entry = new BudgetActualEntry({
      budgetActualId: budget._id,
      field,
      month,
      year,
      entryDate,
      actualAmount,
      notes: notes || "",
      setByUserId: new mongoose.Types.ObjectId(payload.userId),
    })

    await entry.save()
    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    console.error("Failed to create budget actual entry:", error)
    return NextResponse.json({ error: "Failed to create budget actual entry" }, { status: 500 })
  }
}