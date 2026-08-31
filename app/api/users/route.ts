import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { User } from "@/models/User"
import { Branch } from "@/models/Branch"
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
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const allowedRoles = ["admin", "accounts", "esbd", "consumable", "user", "service", "marketing", "logistics", "esbd_juniors", "accounts_juniors", "consumable_juniors", "service_juniors", "marketing_juniors", "user_juniors", "logistics_juniors", "frontdesk", "branch_manager", "branch_manager_juniors", "branch_service", "branch_service_juniors", "branch_sales", "branch_sales_juniors", "branch_consumable", "branch_consumable_juniors", "branch_accounts", "branch_accounts_juniors"]
    if (!allowedRoles.includes(payload.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const users = await User.find().select("-passwordHash").lean().sort({ createdAt: -1 })
    
    const branchIds = [...new Set(users.map((u: any) => u.branch?.toString()).filter(Boolean))]
    const branches = branchIds.length > 0
      ? await Branch.find({ _id: { $in: branchIds } }).select("name").lean()
      : []
    const branchMap = Object.fromEntries(branches.map((b: any) => [b._id.toString(), b.name]))

    const usersWithBranch = users.map((u: any) => ({
      ...u,
      branch: u.branch ? { _id: u.branch.toString(), name: branchMap[u.branch.toString()] || "Unknown" } : undefined,
    }))

    return NextResponse.json({ users: usersWithBranch })
  } catch (error: any) {
    console.error("Get users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}