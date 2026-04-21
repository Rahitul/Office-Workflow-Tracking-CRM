import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { Appointment } from "@/models/Appointment"
import { verifyAccessToken } from "@/lib/auth"
import mongoose from "mongoose"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const payload = await verifyAccessToken(accessToken)
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    const { id } = await params
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid appointment ID" }, { status: 400 })
    }
    
    const body = await request.json()
    const { isCompleted, status } = body
    
    const updateData: any = {}
    if (typeof isCompleted === "boolean") {
      updateData.isCompleted = isCompleted
    }
    if (status === "approved" || status === "rejected") {
      updateData.status = status
    }
    
    const appointment = await Appointment.findOneAndUpdate(
      { _id: id },
      { $set: updateData },
      { new: true }
    )
    
    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }
    
    return NextResponse.json({ message: "Appointment updated successfully", appointment })
  } catch (error: any) {
    console.error("Update appointment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const payload = await verifyAccessToken(accessToken)
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    const { id } = await params
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid appointment ID" }, { status: 400 })
    }
    
    const appointment = await Appointment.findOneAndDelete({ _id: id, createdBy: payload.userId })
    
    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }
    
    return NextResponse.json({ message: "Appointment deleted successfully" })
  } catch (error: any) {
    console.error("Delete appointment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}