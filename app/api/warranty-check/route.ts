import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyAccessToken } from "@/lib/auth"
import { runWarrantyCheck } from "@/lib/warranty-notifier"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyAccessToken(accessToken)
    if (!payload || (payload.role !== "service" && payload.role !== "admin" && payload.role !== "esbd")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const result = await runWarrantyCheck()

    return NextResponse.json({ message: "Warranty check completed", ...result })
  } catch (error) {
    console.error("Warranty check endpoint error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
