import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { Machine } from "@/models/Machine"
import { verifyAccessToken } from "@/lib/auth"
import crypto from "crypto"

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

    const machine = await Machine.findById(id)
    if (!machine) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const regenerate = searchParams.get("action") === "regenerate"

    if (regenerate || !machine.customerShareToken) {
      machine.customerShareToken = crypto.randomBytes(32).toString("hex")
      await machine.save()
    }

    const origin = new URL(request.url).origin
    const url = `${origin}/card/${machine._id}?token=${machine.customerShareToken}`

    return NextResponse.json({ url })
  } catch (error: any) {
    console.error("Generate share link error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
