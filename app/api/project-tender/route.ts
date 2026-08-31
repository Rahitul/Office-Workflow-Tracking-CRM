import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { ProjectTender } from "@/models/ProjectTender"
import { verifyAccessToken } from "@/lib/auth"

const ALLOWED_ROLES = ["user", "user_juniors", "consumable", "consumable_juniors", "service", "service_juniors", "esbd", "admin"]

export async function GET(request: Request) {
  try {
    await connectDB()
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = await verifyAccessToken(accessToken)
    if (!payload || !ALLOWED_ROLES.includes(payload.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const filter: Record<string, unknown> = {}

    if (type && ["project", "tender"].includes(type)) {
      filter.type = type
    }

    if (payload.role !== "admin") {
      filter.createdBy = payload.userId
    } else {
      const createdBy = searchParams.get("createdBy")
      if (createdBy) filter.createdBy = createdBy
    }

    const records = await ProjectTender.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })

    return NextResponse.json({ success: true, data: records })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch records" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await connectDB()
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = await verifyAccessToken(accessToken)
    if (!payload || !ALLOWED_ROLES.includes(payload.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()

    const [y, m, d] = body.date.split("-").map(Number)
    const utcDate = new Date(Date.UTC(y, m - 1, d))

    const record = await ProjectTender.create({
      ...body,
      date: utcDate,
      ...(body.tentativeCloseDate && {
        tentativeCloseDate: (() => {
          const [ty, tm, td] = body.tentativeCloseDate.split("-").map(Number)
          return new Date(Date.UTC(ty, tm - 1, td))
        })(),
      }),
      createdBy: payload.userId,
      username: body.username || payload.email?.split("@")[0] || "User",
      statusHistory: [
        {
          status: "pending",
          changedAt: new Date(),
          byName: body.username || payload.email?.split("@")[0] || "User",
          remarks: "Submitted",
        },
      ],
    })

    return NextResponse.json({ success: true, data: record }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to create record" }, { status: 500 })
  }
}
