import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { Appointment } from "@/models/Appointment"
import { AppointmentForm } from "@/models/AppointmentForm"
import { verifyAccessToken } from "@/lib/auth"

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const adminAppointments = searchParams.get("admin") === "true"
    
    if (payload.role === "admin") {
      if (type === "requested") {
        const requestedAppointments = await Appointment.find({ isRequested: true })
          .sort({ createdAt: -1 })
          .populate("requestedBy", "name email")
          .populate("formData")
        return NextResponse.json({ appointments: requestedAppointments })
      }
      
      const appointments = await Appointment.find({ 
        createdByRole: "admin",
        isRequested: false
      }).sort({ date: 1, time: 1 })
      
      return NextResponse.json({ appointments })
    }
    
    if (adminAppointments) {
      const adminAppts = await Appointment.find({ 
        createdByRole: "admin",
        isRequested: false,
        isCompleted: false
      }).sort({ date: 1, time: 1 })
      return NextResponse.json({ appointments: adminAppts })
    }
    
    const appointments = await Appointment.find({
      $or: [
        { createdBy: payload.userId },
        { isRequested: true, status: "approved" }
      ]
    }).sort({ date: 1, time: 1 })
    
    return NextResponse.json({ appointments })
  } catch (error: any) {
    console.error("Get appointments error:", error)
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const { 
      customerName, companyName, designation, location, date, time, endTime, visitPurpose,
      isRequested, formData
    } = body
    
    if (!customerName || !companyName || !designation || !location || !date || !time || !visitPurpose) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }
    
    let formDataId = null
    
    if (isRequested && formData) {
      const newFormData = new AppointmentForm({
        ...formData,
        submittedBy: payload.userId
      })
      await newFormData.save()
      formDataId = newFormData._id
    }
    
    const appointment = new Appointment({
      customerName,
      companyName,
      designation,
      location,
      date: new Date(date),
      time,
      endTime: endTime || "",
      visitPurpose,
      createdBy: payload.userId,
      isRequested: isRequested || false,
      requestedBy: isRequested ? payload.userId : null,
      status: isRequested ? "pending" : undefined,
      formData: formDataId,
      createdByRole: payload.role,
    })
    
    await appointment.save()
    
    return NextResponse.json(
      { message: "Appointment created successfully", appointment },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Create appointment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}