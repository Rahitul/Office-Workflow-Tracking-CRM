import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { TravelTime } from "@/models/TravelTime"
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
    if (!payload || (payload.role !== "service" && payload.role !== "admin" && payload.role !== "esbd" && payload.role !== "branch_manager" && payload.role !== "branch_manager_juniors")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const travelTimes = await TravelTime.find({})
      .select("fromLocation toLocation vehicleType hours minutes createdAt")
      .sort({ createdAt: -1 })

    return NextResponse.json({ travelTimes })
  } catch (error: any) {
    console.error("Get travel times error:", error)
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
    if (!payload || (payload.role !== "service" && payload.role !== "admin" && payload.role !== "esbd" && payload.role !== "branch_manager" && payload.role !== "branch_manager_juniors")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { fromLocation, toLocation, vehicleType, hours, minutes } = body

    if (!fromLocation || !toLocation) {
      return NextResponse.json({ error: "Both locations are required" }, { status: 400 })
    }

    if (hours == null || minutes == null) {
      return NextResponse.json({ error: "Hours and minutes are required" }, { status: 400 })
    }

    const travelTime = new TravelTime({
      fromLocation,
      toLocation,
      vehicleType: vehicleType || "Bus",
      hours: Number(hours),
      minutes: Number(minutes),
      createdBy: payload.userId,
    })

    await travelTime.save()

    return NextResponse.json(
      { message: "Travel time created successfully", travelTime },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Create travel time error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
