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
    
    const form = await Form.findById(formId)
    if (!form || form.createdBy.toString() !== payload.userId) {
      return NextResponse.json({ error: "Form not found or access denied" }, { status: 404 })
    }
    
    const responses = await Response.find({ formId: new mongoose.Types.ObjectId(formId) })
    const totalResponses = responses.length
    
    if (totalResponses === 0) {
      return NextResponse.json({
        formId,
        totalResponses: 0,
        completionRate: 0,
        avgCompletionTime: 0,
        fields: [],
      })
    }
    
    const assignedUsers = form.assignedTo.length > 0 
      ? form.assignedTo.length 
      : await User.countDocuments()
    
    const completionRate = totalResponses / assignedUsers
    
    const avgCompletionTime = responses.reduce((sum, r) => sum + r.completionTimeSeconds, 0) / totalResponses
    
    const fieldAggregations = form.fields.map((field: any) => {
      const aggregation: Record<string, number> = {}
      
      responses.forEach((response) => {
        const answer = response.answers.find((a: any) => a.fieldId === field.fieldId)
        if (answer) {
          const value = answer.value
          
          if (Array.isArray(value)) {
            value.forEach((v) => {
              aggregation[v] = (aggregation[v] || 0) + 1
            })
          } else if (value !== undefined && value !== null) {
            const key = String(value)
            aggregation[key] = (aggregation[key] || 0) + 1
          }
        }
      })
      
      return {
        fieldId: field.fieldId,
        label: field.label,
        type: field.type,
        aggregation,
      }
    })
    
    return NextResponse.json({
      formId,
      totalResponses,
      completionRate: Math.min(completionRate, 1),
      avgCompletionTime: Math.round(avgCompletionTime),
      fields: fieldAggregations,
    })
  } catch (error: any) {
    console.error("Get analytics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}