import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { User } from "@/models/User"

export async function GET() {
  try {
    await connectDB()
    
    const users = await User.find({ role: "user" }).select("_id name email").sort({ name: 1 })
    
    return NextResponse.json({ users })
  } catch (error: any) {
    console.error("Get users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
