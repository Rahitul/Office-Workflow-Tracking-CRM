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
      .select("fromLocation toLocation vehicleType hours minutes segments createdAt")
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
    const { fromLocation, toLocation, vehicleType, hours, minutes, segments } = body

    if (!fromLocation || !toLocation) {
      return NextResponse.json({ error: "Both locations are required" }, { status: 400 })
    }

    const normFrom = fromLocation.trim()
    const normTo = toLocation.trim()

    const candidateSegments = Array.isArray(segments) && segments.length > 0
      ? segments.map((s: any) => ({ vehicleType: (s.vehicleType || "Bus").trim(), hours: Number(s.hours) || 0, minutes: Number(s.minutes) || 0 }))
      : [{ vehicleType: (vehicleType || "Bus").trim(), hours: Number(hours) || 0, minutes: Number(minutes) || 0 }]

    const existingByLocations = await TravelTime.find({
      fromLocation: { $regex: new RegExp(`^${normFrom.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      toLocation: { $regex: new RegExp(`^${normTo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    })
    const segmentsKey = (segs: { vehicleType: string; hours: number; minutes: number }[]) =>
      segs.map(s => `${s.vehicleType.toLowerCase()}:${s.hours * 60 + s.minutes}`).join("|")
    const candidateKey = segmentsKey(candidateSegments)
    const duplicate = existingByLocations.find((entry: any) => {
      const entrySegs = (Array.isArray(entry.segments) && entry.segments.length > 0)
        ? entry.segments.map((s: any) => ({ vehicleType: s.vehicleType, hours: s.hours, minutes: s.minutes }))
        : [{ vehicleType: entry.vehicleType, hours: entry.hours, minutes: entry.minutes }]
      return segmentsKey(entrySegs) === candidateKey
    })
    if (duplicate) {
      return NextResponse.json({ error: "A travel time for this route with the same segments already exists. Please edit the existing entry instead." }, { status: 409 })
    }

    let finalVehicleType = vehicleType || "Bus"
    let finalHours = Number(hours)
    let finalMinutes = Number(minutes)
    let finalSegments: { vehicleType: string; hours: number; minutes: number }[] = []

    if (Array.isArray(segments) && segments.length > 0) {
      finalSegments = segments.map((seg: any) => ({
        vehicleType: seg.vehicleType || "Bus",
        hours: Number(seg.hours) || 0,
        minutes: Number(seg.minutes) || 0,
      }))
      const totalMins = finalSegments.reduce((sum, seg) => sum + seg.hours * 60 + seg.minutes, 0)
      finalVehicleType = finalSegments[0].vehicleType
      finalHours = Math.floor(totalMins / 60)
      finalMinutes = totalMins % 60
    } else {
      if (hours == null || minutes == null) {
        return NextResponse.json({ error: "Hours and minutes are required" }, { status: 400 })
      }
    }

    const travelTime = new TravelTime({
      fromLocation: normFrom,
      toLocation: normTo,
      vehicleType: finalVehicleType,
      hours: finalHours,
      minutes: finalMinutes,
      segments: finalSegments.length > 0 ? finalSegments : [],
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
