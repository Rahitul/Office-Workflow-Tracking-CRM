import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { ServiceHistory } from "@/models/ServiceHistory"
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

    const records = await ServiceHistory.find({ machineId: id })
      .populate("engineerId", "name email")
      .sort({ callDate: -1, createdAt: -1 })

    return NextResponse.json({ records })
  } catch (error: any) {
    console.error("Get service history error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const body = await request.json()

    if (!body.callDate) {
      return NextResponse.json({ error: "Call date is required" }, { status: 400 })
    }

    if (!body.engineerId) {
      return NextResponse.json({ error: "Engineer is required" }, { status: 400 })
    }

    const bwMeterReading = Number(body.bwMeterReading) || 0
    const colorMeterReading = Number(body.colorMeterReading) || 0
    const printerHeadLife = Number(body.printerHeadLife) || 0
    const copyBW = Number(body.copyBW) || 0
    const printBW = Number(body.printBW) || 0
    const scan = Number(body.scan) || 0

    const record = new ServiceHistory({
      machineId: id,
      callDate: body.callDate,
      problem: body.problem || "",
      solution: body.solution || "",
      ewTaka: (!body.ewTaka || body.ewTaka === "0") ? "Not Applicable" : body.ewTaka,
      bwMeterReading,
      colorMeterReading,
      printerHeadLife,
      copyBW,
      printBW,
      scan,
      total: bwMeterReading + colorMeterReading,
      attendTime: body.attendTime || null,
      endTime: body.endTime || null,
      userComments: body.userComments || "",
      engineerId: body.engineerId,
      createdBy: payload.userId,
    })

    await record.save()

    return NextResponse.json(
      { message: "Service history added successfully", record },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Create service history error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
