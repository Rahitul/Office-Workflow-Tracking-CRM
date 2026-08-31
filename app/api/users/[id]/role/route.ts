import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { User } from "@/models/User"
import { verifyAccessToken } from "@/lib/auth"
import { z } from "zod"

const updateRoleSchema = z.object({
  role: z.enum(["admin", "user", "accounts", "service", "esbd", "marketing", "consumable", "logistics", "esbd_juniors", "accounts_juniors", "consumable_juniors", "service_juniors", "marketing_juniors", "user_juniors", "logistics_juniors", "frontdesk", "branch_manager", "branch_manager_juniors", "branch_service", "branch_service_juniors", "branch_sales", "branch_sales_juniors", "branch_consumable", "branch_consumable_juniors", "branch_accounts", "branch_accounts_juniors"]),
})

export async function PATCH(
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
    const body = await request.json()
    const validatedData = updateRoleSchema.parse(body)
    
    const user = await User.findByIdAndUpdate(
      id,
      { role: validatedData.role },
      { new: true }
    ).select("-passwordHash")
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    return NextResponse.json({ user })
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Update user role error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}