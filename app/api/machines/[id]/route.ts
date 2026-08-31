import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { Machine } from "@/models/Machine"
import { verifyAccessToken } from "@/lib/auth"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()

    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyAccessToken(accessToken)
    if (!payload || (payload.role !== "service" && payload.role !== "admin" && payload.role !== "esbd" && payload.role !== "service_juniors" && payload.role !== "esbd_juniors")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params

    const machine = await Machine.findById(id)
      .select("machineId customerName customerGroup location contactPerson contactNumber email address department brandName modelName serialNumber productCategory productType option sla billNumber billDate warrantyExpired notes createdAt")

    if (!machine) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 })
    }

    return NextResponse.json({ machine })
  } catch (error: any) {
    console.error("Get machine error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
