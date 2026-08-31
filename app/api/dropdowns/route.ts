import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { DropdownOption } from "@/models/DropdownOption"
import { verifyAccessToken, TokenPayload } from "@/lib/auth"

const ALLOWED_ROLES = ["service", "esbd", "admin", "branch_manager", "branch_manager_juniors"]

const VALID_KINDS = ["product_category", "product_type", "model_name", "department", "option", "sla", "customer_category", "call_type", "company_category", "quotation_type", "designation", "problem"]

function isAllowed(payload: TokenPayload | null) {
  return payload && ALLOWED_ROLES.includes(payload.role)
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
    if (!isAllowed(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const kind = searchParams.get("kind")
    const parent = searchParams.get("parent")

    const filter: Record<string, string> = {}
    if (kind && VALID_KINDS.includes(kind)) filter.kind = kind
    if (parent) filter.parent = parent

    const options = await DropdownOption.find(filter)
      .select("kind label parent createdAt")
      .sort({ label: 1 })

    return NextResponse.json({ options })
  } catch (error: any) {
    console.error("Get dropdown options error:", error)
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
    if (!isAllowed(payload) || !payload) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const kind = body.kind
    const label = (body.label || "").trim()
    const parent = (body.parent || "").trim()

    if (!kind || !VALID_KINDS.includes(kind)) {
      return NextResponse.json({ error: "Invalid dropdown kind" }, { status: 400 })
    }

    if (!label) {
      return NextResponse.json({ error: "Label is required" }, { status: 400 })
    }

    if (kind === "product_type" && !parent) {
      return NextResponse.json({ error: "Product type must belong to a product category" }, { status: 400 })
    }

    if (kind === "model_name" && !parent) {
      return NextResponse.json({ error: "Model name must belong to a product type" }, { status: 400 })
    }

    const option = new DropdownOption({
      kind,
      label,
      parent: kind === "product_type" || kind === "model_name" ? parent : "",
      createdBy: payload.userId,
    })

    try {
      await option.save()
    } catch (error: any) {
      if (error?.code === 11000) {
        return NextResponse.json({ error: "This dropdown option already exists" }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json({ message: "Dropdown option created successfully", option }, { status: 201 })
  } catch (error: any) {
    console.error("Create dropdown option error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
