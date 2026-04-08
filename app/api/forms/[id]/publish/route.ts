import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { Form } from "@/models/Form"
import { verifyAccessToken } from "@/lib/auth"

export async function PATCH(
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
    
    form.status = "published"
    await form.save()
    
    return NextResponse.json({ message: "Form published successfully", form })
  } catch (error: any) {
    console.error("Publish form error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}