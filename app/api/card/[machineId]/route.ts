import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Machine } from "@/models/Machine"
import { ServiceHistory } from "@/models/ServiceHistory"
import crypto from "crypto"

const CARD_FIELDS =
  "machineId customerName customerGroup location contactPerson contactNumber email address department brandName modelName serialNumber productCategory productType option sla billNumber billDate warrantyExpired notes createdAt"

function safeEqual(a: string, b: string): boolean {
  const hashA = crypto.createHash("sha256").update(a).digest()
  const hashB = crypto.createHash("sha256").update(b).digest()
  return crypto.timingSafeEqual(hashA, hashB)
}

export async function GET(request: Request, { params }: { params: Promise<{ machineId: string }> }) {
  try {
    await connectDB()

    const { machineId } = await params

    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token") || ""

    if (!token) {
      return NextResponse.json({ error: "Invalid link" }, { status: 404 })
    }

    const match = await Machine.findById(machineId).select("customerShareToken").lean()
    if (!match || !match.customerShareToken || !safeEqual(match.customerShareToken, token)) {
      return NextResponse.json({ error: "Invalid link" }, { status: 404 })
    }

    const machine = await Machine.findById(machineId).select(CARD_FIELDS).lean()

    const records = await ServiceHistory.find({ machineId })
      .populate("engineerId", "name email")
      .sort({ callDate: -1, createdAt: -1 })

    return NextResponse.json({ machine, records })
  } catch (error: any) {
    console.error("Get customer card error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
