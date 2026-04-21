import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { Appointment } from "@/models/Appointment"
import { AppointmentForm } from "@/models/AppointmentForm"
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
    if (!payload || payload.role !== "user") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    const appointments = await Appointment.find({
      $or: [
        { createdBy: payload.userId },
        { isRequested: true, requestedBy: payload.userId }
      ]
    })
      .sort({ date: -1, createdAt: -1 })
      .populate("formData")
    
    return NextResponse.json({ appointments })
  } catch (error: any) {
    console.error("Get user appointments error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}