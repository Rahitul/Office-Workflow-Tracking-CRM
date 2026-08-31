import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { Product } from "@/models/Product"
import { verifyAccessToken } from "@/lib/auth"

export async function GET(request: Request) {
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
    
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")
    
    const query: any = {}
    if (companyId) {
      query.companyId = companyId
    }
    
    const products = await Product.find(query)
      .populate("companyId", "name")
      .select("name description isProtected companyId createdAt")
      .sort({ createdAt: -1 })
    
    return NextResponse.json({ products })
  } catch (error: any) {
    console.error("Get products error:", error)
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
    const { name, companyId, description, isProtected } = body
    
    if (!name || !companyId) {
      return NextResponse.json({ error: "Product name and company are required" }, { status: 400 })
    }
    
    const existingProduct = await Product.findOne({ companyId, name })
    if (existingProduct) {
      return NextResponse.json({ error: "Product already exists under this company" }, { status: 400 })
    }
    
    const product = new Product({
      name,
      companyId,
      description: description || "",
      isProtected: isProtected || false,
      createdBy: payload.userId,
    })
    
    await product.save()
    
    return NextResponse.json(
      { message: "Product created successfully", product },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Create product error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}