import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { Form } from "@/models/Form"
import { verifyAccessToken } from "@/lib/auth"
import { updateFormSchema } from "@/lib/validations/form"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    const { id } = await params
    const form = await Form.findById(id)
    
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 })
    }
    
    const hasAccess = payload.role === "admin" 
      ? form.createdBy.toString() === payload.userId
      : form.assignedTo.map((id: any) => id.toString()).includes(payload.userId) || 
        (form.assignedTo.length === 0 && form.status === "published")
    
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    return NextResponse.json({ form })
  } catch (error: any) {
    console.error("Get form error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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
    
    const { id } = await params
    const form = await Form.findById(id)
    
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 })
    }
    
    if (form.createdBy.toString() !== payload.userId) {
      return NextResponse.json({ error: "Not the owner" }, { status: 403 })
    }
    
    const body = await request.json()
    const validatedData = updateFormSchema.parse(body)
    
    const updatedForm = await Form.findByIdAndUpdate(id, validatedData, { new: true })
    
    return NextResponse.json({ form: updatedForm })
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Update form error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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
    
    const { id } = await params
    const form = await Form.findById(id)
    
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 })
    }
    
    if (form.createdBy.toString() !== payload.userId) {
      return NextResponse.json({ error: "Not the owner" }, { status: 403 })
    }
    
    await Form.findByIdAndDelete(id)
    
    return NextResponse.json({ message: "Form deleted successfully" })
  } catch (error: any) {
    console.error("Delete form error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}