import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { Training } from "@/models/Training"
import { TrainingAssignment } from "@/models/TrainingAssignment"
import { verifyAccessToken } from "@/lib/auth"

interface Params {
  params: Promise<{ id: string }>
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    await connectDB()
    
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const payload = await verifyAccessToken(accessToken)
    if (!payload || (payload.role !== "esbd" && payload.role !== "service" && payload.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ error: "Training ID is required" }, { status: 400 })
    }
    
    await TrainingAssignment.deleteMany({ trainingId: id })
    await Training.findByIdAndDelete(id)
    
    return NextResponse.json({ message: "Training deleted successfully" })
  } catch (error: any) {
    console.error("Delete training error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    await connectDB()
    
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const payload = await verifyAccessToken(accessToken)
    if (!payload || (payload.role !== "esbd" && payload.role !== "service" && payload.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ error: "Training ID is required" }, { status: 400 })
    }
    
    const body = await request.json()
    const { title } = body
    
    const training = await Training.findById(id)
    if (!training) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 })
    }
    
    if (title) {
      training.title = title
    }
    
    await training.save()
    
    return NextResponse.json({ message: "Training updated successfully", training })
  } catch (error: any) {
    console.error("Update training error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}