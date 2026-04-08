import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { Response } from "@/models/Response"
import { Form } from "@/models/Form"
import { User } from "@/models/User"
import { verifyAccessToken } from "@/lib/auth"
import mongoose from "mongoose"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ formId: string }> }
) {
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
    
    const { formId } = await params
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "25")
    const search = searchParams.get("search") || ""
    const sortBy = searchParams.get("sortBy") || "submittedAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"
    
    const form = await Form.findById(formId)
    if (!form || form.createdBy.toString() !== payload.userId) {
      return NextResponse.json({ error: "Form not found or access denied" }, { status: 404 })
    }
    
    const query: any = { formId: new mongoose.Types.ObjectId(formId) }
    
    if (search) {
      query.$or = [
        { "answers.value": { $regex: search, $options: "i" } },
      ]
    }
    
    const skip = (page - 1) * limit
    const sort: any = { [sortBy]: sortOrder === "asc" ? 1 : -1 }
    
    const [responses, total] = await Promise.all([
      Response.find(query)
        .populate("userId", "name email")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Response.countDocuments(query),
    ])
    
    return NextResponse.json({
      responses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error: any) {
    console.error("Get form responses error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}