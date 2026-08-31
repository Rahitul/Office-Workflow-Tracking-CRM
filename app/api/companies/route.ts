import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { Company } from "@/models/Company"
import { verifyAccessToken } from "@/lib/auth"

export async function GET() {
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
    
    const companies = await Company.find({})
      .select("name description isProtected createdAt createdBy")
      .sort({ createdAt: -1 })
    
    return NextResponse.json({ companies })
  } catch (error: any) {
    console.error("Get companies error:", error)
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
    if (!payload || (payload.role !== "esbd" && payload.role !== "service" && payload.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    const body = await request.json()
    const { name, description, isProtected } = body
    
    if (!name) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 })
    }
    
    const existingCompany = await Company.findOne({ name })
    if (existingCompany) {
      return NextResponse.json({ error: "Company already exists" }, { status: 400 })
    }
    
    const company = new Company({
      name,
      description: description || "",
      isProtected: isProtected || false,
      createdBy: payload.userId,
    })
    
    await company.save()
    
    return NextResponse.json(
      { message: "Company created successfully", company },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Create company error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}