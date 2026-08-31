import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { CompanyForService } from "@/models/CompanyForService"
import { verifyAccessToken } from "@/lib/auth"

export async function GET() {
  try {
    await connectDB()

    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyAccessToken(accessToken)
    if (!payload || (payload.role !== "service" && payload.role !== "admin" && payload.role !== "esbd" && payload.role !== "branch_manager" && payload.role !== "branch_manager_juniors" && payload.role !== "branch_sales" && payload.role !== "branch_sales_juniors" && payload.role !== "branch_consumable" && payload.role !== "branch_consumable_juniors" && payload.role !== "branch_service" && payload.role !== "branch_service_juniors" && payload.role !== "branch_accounts" && payload.role !== "branch_accounts_juniors")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const groups = await CompanyForService.distinct("group")
    const groupsSet = new Set(groups as string[])
    groupsSet.add("Not a group of company")
    const sortedGroups = Array.from(groupsSet).sort()

    return NextResponse.json({ groups: sortedGroups })
  } catch (error: any) {
    console.error("Get groups error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}