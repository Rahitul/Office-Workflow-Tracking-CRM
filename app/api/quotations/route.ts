import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { Quotation } from "@/models/Quotation"
import { User } from "@/models/User"
import { Branch } from "@/models/Branch"
import { verifyAccessToken } from "@/lib/auth"

const branchRoles = [
  "branch_manager", "branch_manager_juniors",
  "branch_service", "branch_service_juniors",
  "branch_sales", "branch_sales_juniors",
  "branch_consumable", "branch_consumable_juniors",
  "branch_accounts", "branch_accounts_juniors",
]

const hoRoles = [
  "service", "service_juniors", "esbd", "esbd_juniors",
]

async function generateQuotationId(engineerName: string, category: string): Promise<string> {
  const count = await Quotation.countDocuments()
  const year = String(new Date().getFullYear())
  const seq = String(count + 1).padStart(2, "0")
  const cat = category.charAt(0).toUpperCase() + category.slice(1)

  if (category !== "service") {
    return `${seq}-${cat}-${year}`
  }

  const engineer = await User.findOne({ name: engineerName }).lean()
  let branchName: string | undefined
  if (engineer?.branch) {
    const branch = await Branch.findById(engineer.branch).select("name").lean()
    branchName = (branch as any)?.name
  }
  if (engineer && branchRoles.includes(engineer.role) && branchName) {
    return `${seq}-${branchName}-${cat}-${year}`
  }
  return `${seq}-HO-${cat}-${year}`
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
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const allowedRoles = ["service", "admin", "service_juniors", "esbd", "esbd_juniors", "branch_service", "branch_service_juniors", "branch_manager", "branch_manager_juniors", "branch_sales", "branch_sales_juniors", "branch_consumable", "branch_consumable_juniors"]
    if (!allowedRoles.includes(payload.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const category = body.category || "service"
    const quotationId = await generateQuotationId(body.engineerName, category)

    let amount = body.amount
    if (body.products && body.products.length > 0) {
      amount = body.products.reduce((sum: number, p: any) => {
        return sum + (p.models || []).reduce((ms: number, m: any) => ms + (m.totalPrice || 0), 0)
      }, 0)
    }

    const quotation = await Quotation.create({
      ...body,
      quotationId,
      amount,
      quotationDate: new Date(body.quotationDate),
      category,
      status: "Pending",
      createdBy: payload.userId,
    })

    return NextResponse.json({ success: true, data: quotation }, { status: 201 })
  } catch (error) {
    console.error("Error creating quotation:", error)
    return NextResponse.json({ success: false, error: "Failed to create quotation" }, { status: 500 })
  }
}

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

    if (!["service", "admin", "service_juniors", "esbd", "esbd_juniors", "branch_manager", "branch_manager_juniors", "branch_service", "branch_service_juniors", "branch_sales", "branch_sales_juniors", "branch_consumable", "branch_consumable_juniors", "branch_accounts", "branch_accounts_juniors"].includes(payload.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const createdBy = searchParams.get("createdBy")
    const billable = searchParams.get("billable")
    const category = searchParams.get("category")

    const filter: Record<string, unknown> = {}
    if (createdBy) filter.createdBy = createdBy
    if (billable === "true") filter.billDate = { $exists: true }
    if (category) filter.category = category

    const quotations = await Quotation.find(filter)
      .sort({ createdAt: -1 })

    return NextResponse.json({ success: true, data: quotations })
  } catch (error) {
    console.error("Error fetching quotations:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch quotations" }, { status: 500 })
  }
}
