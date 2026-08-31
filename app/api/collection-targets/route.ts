import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { CollectionTarget } from "@/models/CollectionTarget"
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

    const query: Record<string, unknown> = {}
    
    if (targetType) query.targetType = targetType
    if (targetId) query.targetId = targetId
    if (month) query.month = parseInt(month)
    if (year) query.year = parseInt(year)

    const targets = await CollectionTarget.find(query)
      .populate("setByUserId", "name email")
      .sort({ year: -1, month: -1 })
      .lean()

    return NextResponse.json({ targets })
  } catch (error) {
    console.error("Failed to fetch collection targets:", error)
    return NextResponse.json({ error: "Failed to fetch collection targets" }, { status: 500 })
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
      targetType,
      targetId,
      targetName,
      month,
      year,
      amountBDT,
    } = body

    if (!targetType || !targetId || !targetName || !month || !year || !amountBDT) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (!["department", "branch", "salesman", "company"].includes(targetType)) {
      return NextResponse.json({ error: "Invalid target type" }, { status: 400 })
    }

    const existingTarget = await CollectionTarget.findOne({
      targetType,
      targetId,
      month,
      year,
    })

    if (existingTarget) {
      return NextResponse.json({ 
        error: `Collection target already exists for ${targetName} in this month/year` 
      }, { status: 409 })
    }

    const target = new CollectionTarget({
      targetType,
      targetId,
      targetName,
      month,
      year,
      amountBDT,
      setByUserId: new mongoose.Types.ObjectId(payload.userId),
    })

    await target.save()
    return NextResponse.json({ target }, { status: 201 })
  } catch (error) {
    console.error("Failed to create collection target:", error)
    return NextResponse.json({ error: "Failed to create collection target" }, { status: 500 })
  }
}