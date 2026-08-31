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
    const travelTime = await TravelTime.findByIdAndUpdate(
      id,
      {
        fromLocation: body.fromLocation,
        toLocation: body.toLocation,
        vehicleType: body.vehicleType || "Bus",
        hours: Number(body.hours),
        minutes: Number(body.minutes),
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
