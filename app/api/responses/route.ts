import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { Response } from "@/models/Response"
import { Form } from "@/models/Form"
import { verifyAccessToken } from "@/lib/auth"
import { submitResponseSchema } from "@/lib/validations/response"

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
    
    const responses = await Response.find({ userId: payload.userId })
      .populate("formId", "title")
      .sort({ submittedAt: -1 })
    
    return NextResponse.json({ responses })
  } catch (error: any) {
    console.error("Get my responses error:", error)
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
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    
    const body = await request.json()
    const validatedData = submitResponseSchema.parse(body)
    
    const form = await Form.findById(validatedData.formId)
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 })
    }
    
    const hasAccess = form.assignedTo.map((id: any) => id.toString()).includes(payload.userId) ||
      (form.assignedTo.length === 0 && form.status === "published")
    
    if (!hasAccess) {
      return NextResponse.json({ error: "Form not assigned to you" }, { status: 403 })
    }
    
    const existingResponse = await Response.findOne({
      formId: validatedData.formId,
      userId: payload.userId,
    })
    
    if (existingResponse && !form.allowResubmission) {
      return NextResponse.json(
        { error: "You have already submitted this form" },
        { status: 409 }
      )
    }
    
    const completionTimeSeconds = validatedData.startTime
      ? Math.floor((Date.now() - validatedData.startTime) / 1000)
      : 0
    
    const response = new Response({
      formId: validatedData.formId,
      userId: payload.userId,
      submittedAt: new Date(),
      completionTimeSeconds,
      answers: validatedData.answers,
    })
    
    await response.save()
    
    return NextResponse.json(
      { message: "Response submitted successfully", response },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Submit response error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}