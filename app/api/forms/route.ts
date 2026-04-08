import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { Form } from "@/models/Form"
import { verifyAccessToken, TokenPayload } from "@/lib/auth"
import { createFormSchema } from "@/lib/validations/form"

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
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    
    if (payload.role !== "admin") {
      const forms = await Form.find({
        $or: [
          { assignedTo: payload.userId },
          { assignedTo: { $size: 0 } }
        ],
        status: "published"
      }).select("title description status createdAt deadline")
      
      return NextResponse.json({ forms })
    }
    
    const forms = await Form.find({ createdBy: payload.userId })
      .select("title description status assignedTo createdAt deadline")
      .sort({ createdAt: -1 })
    
    return NextResponse.json({ forms })
  } catch (error: any) {
    console.error("Get forms error:", error)
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
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    const body = await request.json()
    const validatedData = createFormSchema.parse(body)
    
    const form = new Form({
      title: validatedData.title,
      description: validatedData.description || "",
      createdBy: payload.userId,
      status: validatedData.status || "draft",
      allowResubmission: validatedData.allowResubmission || false,
      deadline: validatedData.deadline ? new Date(validatedData.deadline) : null,
      fields: validatedData.fields || [],
    })
    
    await form.save()
    
    return NextResponse.json(
      { message: "Form created successfully", form },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Create form error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}