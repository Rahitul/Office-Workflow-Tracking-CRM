import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { Company } from "@/models/Company"
import { Product } from "@/models/Product"
import { Training } from "@/models/Training"
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
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 })
    }
    
    const company = await Company.findById(id)
    if (company?.isProtected) {
      return NextResponse.json({ error: "Cannot delete protected company" }, { status: 400 })
    }
    
    await Product.deleteMany({ companyId: id })
    await Company.findByIdAndDelete(id)
    
    return NextResponse.json({ message: "Company deleted successfully" })
  } catch (error: any) {
    console.error("Delete company error:", error)
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
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 })
    }
    
    const body = await request.json()
    const { name } = body
    
    const company = await Company.findById(id)
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }
    
    if (company.isProtected) {
      return NextResponse.json({ error: "Cannot modify protected company" }, { status: 400 })
    }
    
    if (name) {
      const existingCompany = await Company.findOne({ name, _id: { $ne: id } })
      if (existingCompany) {
        return NextResponse.json({ error: "Company name already exists" }, { status: 400 })
      }
      company.name = name
    }
    
    await company.save()
    
    return NextResponse.json({ message: "Company updated successfully", company })
  } catch (error: any) {
    console.error("Update company error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}