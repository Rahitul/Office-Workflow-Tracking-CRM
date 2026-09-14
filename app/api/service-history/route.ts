import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { ServiceHistory } from "@/models/ServiceHistory"
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
    if (!payload || (payload.role !== "service" && payload.role !== "admin" && payload.role !== "esbd" && payload.role !== "service_juniors" && payload.role !== "esbd_juniors")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const records = await ServiceHistory.find()
      .populate("machineId", "machineId customerName brandName modelName serialNumber department location")
      .populate("engineerId", "name email")
      .sort({ callDate: -1, createdAt: -1 })

    return NextResponse.json({ records })
  } catch (error: any) {
    console.error("Get all service history error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
