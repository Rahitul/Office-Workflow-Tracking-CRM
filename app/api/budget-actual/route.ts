import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { BudgetActual } from "@/models/BudgetActual"
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

    const budgets = await BudgetActual.find(query)
      .populate("setByUserId", "name email")
      .sort({ year: -1, month: -1 })
      .lean()

    return NextResponse.json({ budgets })
  } catch (error) {
    console.error("Failed to fetch budget actual:", error)
    return NextResponse.json({ error: "Failed to fetch budget actual" }, { status: 500 })
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
    const { field, month, year, budgetAmount } = body

    if (!field || !month || !year || !budgetAmount) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const existingBudget = await BudgetActual.findOne({
      field,
      month,
      year,
    })

    if (existingBudget) {
      existingBudget.budgetAmount = budgetAmount
      await existingBudget.save()
      return NextResponse.json({ budget: existingBudget })
    }

    const budget = new BudgetActual({
      field,
      month,
      year,
      budgetAmount,
      setByUserId: new mongoose.Types.ObjectId(payload.userId),
    })

    await budget.save()
    return NextResponse.json({ budget }, { status: 201 })
  } catch (error) {
    console.error("Failed to create budget actual:", error)
    return NextResponse.json({ error: "Failed to create budget actual" }, { status: 500 })
  }
}