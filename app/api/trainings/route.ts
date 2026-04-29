import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { Training } from "@/models/Training"
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
    if (!payload || (payload.role !== "esbd" && payload.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")
    
    const query: any = {}
    if (productId) {
      query.productId = productId
    }
    
    const trainings = await Training.find(query)
      .populate({
        path: "productId",
        select: "name companyId",
        populate: { path: "companyId", select: "name" }
      })
      .select("title description content duration createdAt")
      .sort({ createdAt: -1 })
    
    return NextResponse.json({ trainings })
  } catch (error: any) {
    console.error("Get trainings error:", error)
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
    if (!payload || (payload.role !== "esbd" && payload.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    const body = await request.json()
    const { title, productId, description, content, duration } = body
    
    if (!title || !productId) {
      return NextResponse.json({ error: "Title and product are required" }, { status: 400 })
    }
    
    const training = new Training({
      title,
      productId,
      description: description || "",
      content: content || "",
      duration: duration || "",
      createdBy: payload.userId,
    })
    
    await training.save()
    
    return NextResponse.json(
      { message: "Training created successfully", training },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Create training error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}