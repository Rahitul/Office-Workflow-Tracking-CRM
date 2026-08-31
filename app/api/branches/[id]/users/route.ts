import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import { connectDB } from "@/lib/db"
import { Branch } from "@/models/Branch"
import { User } from "@/models/User"
import { verifyAccessToken } from "@/lib/auth"

export async function GET(
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
    const branch = await Branch.findById(id).select("users")
    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 })
    }
    const branchUserIds = branch.users.map((u: mongoose.Types.ObjectId) => u.toString())
    const available = await User.find({
      _id: { $nin: branchUserIds },
    }).select("name email role").sort({ name: 1 })
    return NextResponse.json({ users: available })
  } catch (error: any) {
    console.error("Get available users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
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
    const { name, email, password, role } = await request.json()
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({ name, email, passwordHash, role: role || "branch_manager", branch: id })
    await Branch.findByIdAndUpdate(id, { $push: { users: user._id } })
    return NextResponse.json({ message: "User created and added to branch" }, { status: 201 })
  } catch (error: any) {
    console.error("Add user to branch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
