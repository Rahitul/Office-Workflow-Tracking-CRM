import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { FilterDate } from "@/models/FilterDate"
import { verifyAccessToken } from "@/lib/auth"

export async function GET() {
  try {
    await connectDB()

    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyAccessToken(accessToken)
    if (!payload) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const record = await FilterDate.findOne({ userId: payload.userId }).lean()

    return NextResponse.json({ from: record?.from || "", to: record?.to || "", department: record?.department || "" })
  } catch (error) {
    console.error("Get filter dates error:", error)
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
    if (!payload) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()

    await FilterDate.findOneAndUpdate(
      { userId: payload.userId },
      { from: body.from || "", to: body.to || "", department: body.department || "" },
      { upsert: true, new: true }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Save filter dates error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
