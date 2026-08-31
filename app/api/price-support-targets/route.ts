import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
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

    const query: Record<string, unknown> = {}
    
    if (projectClientName) query.projectClientName = projectClientName
    if (month) query.month = parseInt(month)
    if (year) query.year = parseInt(year)

    const targets = await PriceSupportTarget.find(query)
      .populate("setByUserId", "name email")
      .sort({ year: -1, month: -1 })
      .lean()

    return NextResponse.json({ targets })
  } catch (error) {
    console.error("Failed to fetch price support targets:", error)
    return NextResponse.json({ error: "Failed to fetch price support targets" }, { status: 500 })
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
      projectClientName,
      month,
      year,
      amountBDT,
      gpMargin,
      executiveName,
    } = body

    if (!projectClientName || !month || !year || !amountBDT || !gpMargin || !executiveName) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const existingTarget = await PriceSupportTarget.findOne({
      projectClientName,
      month,
      year,
    })

    if (existingTarget) {
      return NextResponse.json({ 
        error: `Price support target already exists for ${projectClientName} in this month/year` 
      }, { status: 409 })
    }

    const target = new PriceSupportTarget({
      projectClientName,
      month,
      year,
      amountBDT,
      gpMargin,
      executiveName,
      setByUserId: new mongoose.Types.ObjectId(payload.userId),
    })

    await target.save()
    return NextResponse.json({ target }, { status: 201 })
  } catch (error) {
    console.error("Failed to create price support target:", error)
    return NextResponse.json({ error: "Failed to create price support target" }, { status: 500 })
  }
}