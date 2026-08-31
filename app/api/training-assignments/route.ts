import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import mongoose from "mongoose"
import { connectDB } from "@/lib/db"
import { TrainingAssignment } from "@/models/TrainingAssignment"
import { Training } from "@/models/Training"
import { Product } from "@/models/Product"
import { Company } from "@/models/Company"
import { User } from "@/models/User"
import { verifyAccessToken } from "@/lib/auth"
import { trainingAssignmentSchema } from "@/lib/validations/training"
import { sendTrainingAssignedEmail } from "@/lib/email"

export async function GET() {
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
    
    let query = {}
    if (["esbd", "service", "admin"].includes(payload.role)) {
      if (payload.role === "admin") {
        query = {}
      } else {
        query = { assignedBy: payload.userId }
      }
    } else {
      query = { assignedTo: payload.userId }
    }
    
    const assignments = await TrainingAssignment.find(query)
      .populate("trainingId", "title description content productId")
      .populate("trainingId.productId", "name companyId")
      .populate("trainingId.productId.companyId", "name")
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email")
      .select("priority status assignedAt startedAt completedAt trainingId assignedTo assignedBy brandName productName month")
      .sort({ createdAt: -1 })
    
    return NextResponse.json({ assignments })
  } catch (error) {
    console.error("Get assignments error:", error)
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
    if (!payload || (!["esbd", "service", "admin"].includes(payload.role))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    const body = await request.json()
    const { trainingId, assignedTo, priority, month } = body
    
    if (!trainingId || !assignedTo || assignedTo.length === 0) {
      return NextResponse.json({ error: "Training and users are required" }, { status: 400 })
    }
    
    const training = await Training.findById(trainingId)
    if (!training) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 })
    }
    
    let brandName = ""
    let productName = ""
    if (training.productId) {
      const product = await Product.findById(training.productId).populate("companyId", "name")
      if (product) {
        productName = product.name || ""
        if (product.companyId && typeof product.companyId === "object") {
          brandName = product.companyId.name || ""
        }
      }
    }
    
    const assignments = []
    for (const userId of assignedTo) {
      const existing = await TrainingAssignment.findOne({
        trainingId: new mongoose.Types.ObjectId(trainingId),
        assignedTo: new mongoose.Types.ObjectId(userId),
      })
      
      if (!existing) {
        const assignment = new TrainingAssignment({
          trainingId: new mongoose.Types.ObjectId(trainingId),
          assignedTo: new mongoose.Types.ObjectId(userId),
          assignedBy: new mongoose.Types.ObjectId(payload.userId),
          priority: priority || "medium",
          brandName: brandName,
          productName: productName,
          month: month || "",
        })
        await assignment.save()
        assignments.push(assignment)

        const user = await User.findById(userId).select("email name")
        if (user?.email) {
          await sendTrainingAssignedEmail({
            to: user.email,
            trainingTitle: training.title,
            priority: priority || "medium",
            month: month || "",
            brandName: brandName,
            productName: productName,
          })
        }
      }
    }
    
    return NextResponse.json(
      { message: "Training assigned successfully", assignments },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create assignment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}