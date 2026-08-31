import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { Machine } from "@/models/Machine"
import { verifyAccessToken } from "@/lib/auth"

async function getNextMachineId(): Promise<number> {
  const ids = await Machine.find({ machineId: { $regex: /^\d+$/ } })
    .select("machineId")
    .lean()
  const max = ids.reduce((highest, m) => {
    const num = parseInt(String(m.machineId), 10)
    return Number.isNaN(num) ? highest : Math.max(highest, num)
  }, 0)
  return max + 1
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
    if (!payload || (payload.role !== "service" && payload.role !== "admin" && payload.role !== "esbd" && payload.role !== "service_juniors" && payload.role !== "esbd_juniors")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const distinct = searchParams.get("distinct")

    if (distinct) {
      const values = await Machine.distinct(distinct)
      return NextResponse.json({ values })
    }

    const machines = await Machine.find({})
      .select("machineId customerName customerGroup location contactPerson contactNumber email address department brandName modelName serialNumber productCategory productType option sla billNumber billDate warrantyExpired notes createdAt")
      .sort({ createdAt: -1 })

    const nextId = await getNextMachineId()

    return NextResponse.json({ machines, nextId })
  } catch (error: any) {
    console.error("Get machines error:", error)
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
    if (!payload || (payload.role !== "service" && payload.role !== "admin" && payload.role !== "esbd" && payload.role !== "service_juniors" && payload.role !== "esbd_juniors")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()

    if (!body.customerName) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 })
    }

    const nextId = await getNextMachineId()

    const machine = new Machine({
      machineId: String(nextId),
      customerName: body.customerName,
      customerGroup: body.customerGroup || "",
      location: body.location || "",
      contactPerson: body.contactPerson || "",
      contactNumber: body.contactNumber || "",
      email: body.email || "",
      address: body.address || "",
      department: body.department || "",
      brandName: body.brandName || "",
      modelName: body.modelName || "",
      serialNumber: body.serialNumber || "",
      productCategory: body.productCategory || "",
      productType: body.productType || "",
      option: body.option || "",
      sla: body.sla || "",
      billNumber: body.billNumber || "",
      billDate: body.billDate || null,
      warrantyExpired: body.warrantyExpired || null,
      notes: body.notes || "",
      createdBy: payload.userId,
    })

    await machine.save()

    return NextResponse.json(
      { message: "Machine created successfully", machine },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Create machine error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
