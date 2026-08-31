import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
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
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }
    
    const product = await Product.findById(id)
    if (product?.isProtected) {
      return NextResponse.json({ error: "Cannot delete protected product" }, { status: 400 })
    }
    
    await Training.deleteMany({ productId: id })
    await Product.findByIdAndDelete(id)
    
    return NextResponse.json({ message: "Product deleted successfully" })
  } catch (error: any) {
    console.error("Delete product error:", error)
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
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }
    
    const body = await request.json()
    const { name, companyId } = body
    
    const product = await Product.findById(id)
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    
    if (product.isProtected) {
      return NextResponse.json({ error: "Cannot modify protected product" }, { status: 400 })
    }
    
    if (companyId) {
      const existingProduct = await Product.findOne({ companyId, name: name || product.name, _id: { $ne: id } })
      if (existingProduct) {
        return NextResponse.json({ error: "Product already exists under this company" }, { status: 400 })
      }
      product.companyId = companyId
    }
    
    if (name) {
      const existingProduct = await Product.findOne({ companyId: product.companyId, name, _id: { $ne: id } })
      if (existingProduct) {
        return NextResponse.json({ error: "Product already exists under this company" }, { status: 400 })
      }
      product.name = name
    }
    
    if (body.description !== undefined) {
      product.description = body.description
    }
    
    await product.save()
    
    return NextResponse.json({ message: "Product updated successfully", product })
  } catch (error: any) {
    console.error("Update product error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}