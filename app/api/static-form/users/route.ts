import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { User } from "@/models/User"

export async function GET() {
  try {
    await connectDB()
    
    const users = await User.find({ 
      role: { $in: ["user", "user_juniors", "service", "service_juniors", "consumable", "consumable_juniors", "branch_sales", "branch_sales_juniors", "branch_service", "branch_service_juniors", "branch_consumable", "branch_consumable_juniors"] }
    }).select("_id name email role").sort({ name: 1 })
    
    return NextResponse.json({ users })
  } catch (error: any) {
    console.error("Get users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
