import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import { connectDB } from "@/lib/db"
import { Branch } from "@/models/Branch"
import { User } from "@/models/User"
import { verifyAccessToken } from "@/lib/auth"

export async function GET() {
  try {
    await connectDB()
    const branches = await Branch.find()
      .sort({ name: 1 })
      .populate("users", "name email role")
    return NextResponse.json({ branches })
  } catch (error: any) {
    console.error("Get branches error:", error)
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
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { name, code, address, users } = await request.json()
    if (!name || !code) {
      return NextResponse.json({ error: "Name and code are required" }, { status: 400 })
    }
    const existing = await Branch.findOne({ code })
    if (existing) {
      return NextResponse.json({ error: "Branch code already exists" }, { status: 409 })
    }
    const branch = await Branch.create({ name, code, address: address || "" })

    const userIds: mongoose.Types.ObjectId[] = []
    if (users && users.length > 0) {
      for (const u of users) {
        if (!u.name || !u.email || !u.password) {
          return NextResponse.json({ error: `User ${u.email || "entry"} missing required fields` }, { status: 400 })
        }
        const existingUser = await User.findOne({ email: u.email })
        if (existingUser) {
          return NextResponse.json({ error: `User with email ${u.email} already exists` }, { status: 409 })
        }
        const passwordHash = await bcrypt.hash(u.password, 12)
        const createdUser = await User.create({
          name: u.name,
          email: u.email,
          passwordHash,
          role: u.role,
          branch: branch._id,
        })
        userIds.push(createdUser._id)
      }
      await Branch.findByIdAndUpdate(branch._id, { $push: { users: { $each: userIds } } })
    }

    return NextResponse.json({ branch }, { status: 201 })
  } catch (error: any) {
    console.error("Create branch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
