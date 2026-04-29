import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { TrainingAssignment } from "@/models/TrainingAssignment"
import { verifyAccessToken } from "@/lib/auth"

type Params = Promise<{ id: string }>

export async function PUT(request: Request, { params }: { params: Params }) {
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
    
    const { id } = await params
    const body = await request.json()
    const { priority, status } = body
    
    const assignment = await TrainingAssignment.findById(id)
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }
    
    const isEsbdOrAdmin = payload.role === "esbd" || payload.role === "admin"
    const isAssignedUser = assignment.assignedTo.toString() === payload.userId
    
    if (!isEsbdOrAdmin && !isAssignedUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    if (priority && isEsbdOrAdmin) {
      assignment.priority = priority
    }
    
    if (status) {
      if (isAssignedUser && !isEsbdOrAdmin) {
        if (status === "in_progress" || status === "completed") {
          assignment.status = status
          if (status === "completed") {
            assignment.completedAt = new Date()
          }
        }
      } else if (isEsbdOrAdmin) {
        assignment.status = status
        if (status === "completed") {
          assignment.completedAt = new Date()
        }
      }
    }
    
    await assignment.save()
    
    return NextResponse.json({ message: "Assignment updated successfully", assignment })
  } catch (error) {
    console.error("Update assignment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    await connectDB()
    
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const payload = await verifyAccessToken(accessToken)
    if (!payload || (payload.role !== "esbd" && payload.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    const { id } = await params
    
    const assignment = await TrainingAssignment.findByIdAndDelete(id)
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }
    
    return NextResponse.json({ message: "Assignment deleted successfully" })
  } catch (error) {
    console.error("Delete assignment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}