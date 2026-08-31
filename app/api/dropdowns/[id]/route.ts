import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { DropdownOption } from "@/models/DropdownOption"
import { verifyAccessToken, TokenPayload } from "@/lib/auth"

const ALLOWED_ROLES = ["service", "esbd", "admin", "branch_manager", "branch_manager_juniors"]

function isAllowed(payload: TokenPayload | null) {
  return payload && ALLOWED_ROLES.includes(payload.role)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params

    const option = await DropdownOption.findByIdAndDelete(id)
    if (!option) {
      return NextResponse.json({ error: "Dropdown option not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Dropdown option deleted successfully" })
  } catch (error: any) {
    console.error("Delete dropdown option error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
