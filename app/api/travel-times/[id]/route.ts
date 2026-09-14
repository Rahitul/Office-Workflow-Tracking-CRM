import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { TravelTime } from "@/models/TravelTime"
import { verifyAccessToken } from "@/lib/auth"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params

    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = await verifyAccessToken(accessToken)
    if (!payload || (payload.role !== "service" && payload.role !== "admin" && payload.role !== "esbd" && payload.role !== "branch_manager" && payload.role !== "branch_manager_juniors")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()

    const normFrom = (body.fromLocation || "").trim()
    const normTo = (body.toLocation || "").trim()

    if (normFrom && normTo) {
      const candidateSegments = Array.isArray(body.segments) && body.segments.length > 0
        ? body.segments.map((s: any) => ({ vehicleType: (s.vehicleType || "Bus").trim(), hours: Number(s.hours) || 0, minutes: Number(s.minutes) || 0 }))
        : [{ vehicleType: (body.vehicleType || "Bus").trim(), hours: Number(body.hours) || 0, minutes: Number(body.minutes) || 0 }]

      const existingByLocations = await TravelTime.find({
        _id: { $ne: id },
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
        return NextResponse.json({ error: "A travel time for this route with the same segments already exists." }, { status: 409 })
      }
    }

    let finalVehicleType = body.vehicleType || "Bus"
    let finalHours = Number(body.hours)
    let finalMinutes = Number(body.minutes)
    let finalSegments: { vehicleType: string; hours: number; minutes: number }[] = []

    if (Array.isArray(body.segments) && body.segments.length > 0) {
      finalSegments = body.segments.map((seg: any) => ({
        vehicleType: seg.vehicleType || "Bus",
        hours: Number(seg.hours) || 0,
        minutes: Number(seg.minutes) || 0,
      }))
      const totalMins = finalSegments.reduce((sum, seg) => sum + seg.hours * 60 + seg.minutes, 0)
      finalVehicleType = finalSegments[0].vehicleType
      finalHours = Math.floor(totalMins / 60)
      finalMinutes = totalMins % 60
    }

    const travelTime = await TravelTime.findByIdAndUpdate(
      id,
      {
        fromLocation: normFrom || body.fromLocation,
        toLocation: normTo || body.toLocation,
        vehicleType: finalVehicleType,
        hours: finalHours,
        minutes: finalMinutes,
        segments: finalSegments.length > 0 ? finalSegments : [],
      },
      { returnDocument: "after" }
    )

    if (!travelTime) {
      return NextResponse.json({ error: "Travel time not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Travel time updated successfully", travelTime })
  } catch (error: any) {
    console.error("Update travel time error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params

    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = await verifyAccessToken(accessToken)
    if (!payload || (payload.role !== "service" && payload.role !== "admin" && payload.role !== "esbd" && payload.role !== "branch_manager" && payload.role !== "branch_manager_juniors")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const travelTime = await TravelTime.findByIdAndDelete(id)
    if (!travelTime) {
      return NextResponse.json({ error: "Travel time not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Travel time deleted successfully" })
  } catch (error: any) {
    console.error("Delete travel time error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
