import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { CompanyForService } from "@/models/CompanyForService"
import { verifyAccessToken } from "@/lib/auth"
import { normalizeLocation, firstLocationFields, CompanyLocationInput } from "@/lib/company-location"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params

    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = await verifyAccessToken(accessToken)
    if (!payload || (payload.role !== "service" && payload.role !== "admin" && payload.role !== "esbd" && payload.role !== "branch_manager" && payload.role !== "branch_manager_juniors" && payload.role !== "branch_sales" && payload.role !== "branch_sales_juniors" && payload.role !== "branch_consumable" && payload.role !== "branch_consumable_juniors" && payload.role !== "branch_service" && payload.role !== "branch_service_juniors" && payload.role !== "branch_accounts" && payload.role !== "branch_accounts_juniors")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, group, category, locations } = body

    const companyGroup = group && group.trim() ? group.trim() : "Not a group of company"
    const companyCategory = category && category.trim() ? category.trim() : ""

    let companyLocations: Array<ReturnType<typeof normalizeLocation>> = []
    if (locations && Array.isArray(locations) && locations.length > 0) {
      companyLocations = locations.map((loc: CompanyLocationInput) => normalizeLocation(loc || {}))
    }

    if (companyLocations.length === 0) {
      return NextResponse.json({ error: "At least one location is required" }, { status: 400 })
    }

    const company = await CompanyForService.findByIdAndUpdate(
      id,
      { 
        name, 
        group: companyGroup,
        category: companyCategory,
        ...firstLocationFields(companyLocations[0]),
        locations: companyLocations
      },
      { returnDocument: "after" }
    )

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Company updated successfully", company })
  } catch (error: any) {
    console.error("Update company error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params

    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = await verifyAccessToken(accessToken)
    if (!payload || (payload.role !== "service" && payload.role !== "admin" && payload.role !== "esbd" && payload.role !== "branch_manager" && payload.role !== "branch_manager_juniors" && payload.role !== "branch_sales" && payload.role !== "branch_sales_juniors" && payload.role !== "branch_consumable" && payload.role !== "branch_consumable_juniors" && payload.role !== "branch_service" && payload.role !== "branch_service_juniors" && payload.role !== "branch_accounts" && payload.role !== "branch_accounts_juniors")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const company = await CompanyForService.findByIdAndDelete(id)
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Company deleted successfully" })
  } catch (error: any) {
    console.error("Delete company error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
