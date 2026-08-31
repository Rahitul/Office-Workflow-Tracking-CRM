import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { Branch } from "@/models/Branch"
import { verifyAccessToken } from "@/lib/auth"

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
    const { name, code, address } = await request.json()
    const branch = await Branch.findByIdAndUpdate(
      id,
      { name, code, address },
      { new: true }
    )
    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 })
    }
    return NextResponse.json({ branch })
  } catch (error: any) {
    console.error("Update branch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
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
    const branch = await Branch.findByIdAndDelete(id)
    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "Branch deleted" })
  } catch (error: any) {
    console.error("Delete branch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
