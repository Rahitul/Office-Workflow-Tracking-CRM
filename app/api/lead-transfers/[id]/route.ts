import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { LeadTransfer } from "@/models/LeadTransfer"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ success: false, error: "Lead ID is required" }, { status: 400 })
    }
    
    const body = await request.json()
    const { status } = body
    
    const lead = await LeadTransfer.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).lean()
    
    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, data: lead })
  } catch (error) {
    console.error("Error updating lead status:", error)
    return NextResponse.json({ success: false, error: "Failed to update lead status" }, { status: 500 })
  }
}