import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { CompanyForService } from "@/models/CompanyForService"
import { verifyAccessToken, TokenPayload } from "@/lib/auth"
import { normalizeLocation, firstLocationFields, CompanyLocationInput } from "@/lib/company-location"

const ALLOWED_ROLES = [
  "service",
  "admin",
  "esbd",
  "branch_manager",
  "branch_manager_juniors",
  "branch_sales",
  "branch_sales_juniors",
  "branch_consumable",
  "branch_consumable_juniors",
  "branch_service",
  "branch_service_juniors",
  "branch_accounts",
  "branch_accounts_juniors",
]

function isAllowed(payload: TokenPayload | null) {
  return payload && ALLOWED_ROLES.includes(payload.role)
}

export async function GET() {
  try {
    await connectDB()

    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyAccessToken(accessToken)
    if (!isAllowed(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const companies = await CompanyForService.find({})
      .select("name group category location contactPerson contactNumber locations createdAt")
      .sort({ createdAt: -1 })

    return NextResponse.json({ companies })
  } catch (error: any) {
    console.error("Get companies error:", error)
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
    if (!isAllowed(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    if (!payload) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, group, category, locations } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 })
    }

    const companyGroup = group && group.trim() ? group.trim() : "Not a group of company"
    const companyCategory = category && category.trim() ? category.trim() : ""

    let companyLocations: Array<ReturnType<typeof normalizeLocation>> = []
    if (locations && Array.isArray(locations) && locations.length > 0) {
      companyLocations = locations.map((loc: CompanyLocationInput) => normalizeLocation(loc || {}))
    }

    const validLocations = companyLocations.filter((loc) => loc.location !== "")
    if (validLocations.length === 0) {
      return NextResponse.json({ error: "At least one location is required" }, { status: 400 })
    }

    const company = new CompanyForService({
      name: name.trim(),
      group: companyGroup,
      category: companyCategory,
      ...firstLocationFields(validLocations[0]),
      locations: validLocations,
      createdBy: payload.userId,
    })

    try {
      await company.save()
    } catch (error: any) {
      if (error?.code === 11000) {
        return NextResponse.json({ error: "A company with this name and location already exists" }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json({ message: "Company created successfully", company }, { status: 201 })
  } catch (error: any) {
    console.error("Create company error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
