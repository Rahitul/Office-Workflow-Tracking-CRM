import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { KpiTarget } from "@/models/KpiTarget"
import { verifyAccessToken } from "@/lib/auth"

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
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (payload.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { month, year, targets } = body

    if (!month || !year || !targets || !Array.isArray(targets)) {
      return NextResponse.json({ error: "Month, year, and targets array are required" }, { status: 400 })
    }

    let savedCount = 0
    for (const t of targets) {
      await KpiTarget.findOneAndUpdate(
        { userId: t.userId, month, year },
        {
          $set: {
            userId: t.userId,
            month,
            year,
            coldCallsMade: t.coldCallsMade ?? 0,
            followUpCallsMade: t.followUpCallsMade ?? 0,
            newAppointmentsFixed: t.newAppointmentsFixed ?? 0,
            customerVisitsCompleted: t.customerVisitsCompleted ?? 0,
            salesEmailsSent: t.salesEmailsSent ?? 0,
            ordersClosedTodayValue: t.ordersClosedTodayValue ?? 0,
            quotationsIssuedTodayValue: t.quotationsIssuedTodayValue ?? 0,
            orderValueMfp: t.orderValueMfp ?? 0,
            orderValueMps: t.orderValueMps ?? 0,
            orderValueBarcodePrinters: t.orderValueBarcodePrinters ?? 0,
            orderValuePaperShredder: t.orderValuePaperShredder ?? 0,
            orderValueDuplicator: t.orderValueDuplicator ?? 0,
            orderValueBarcodeScanner: t.orderValueBarcodeScanner ?? 0,
            orderValueSolutions: t.orderValueSolutions ?? 0,
            orderValueTender: t.orderValueTender ?? 0,
            billsClosedTodayValue: t.billsClosedTodayValue ?? 0,
            billValueMfp: t.billValueMfp ?? 0,
            billValueMps: t.billValueMps ?? 0,
            billValueBarcodePrinters: t.billValueBarcodePrinters ?? 0,
            billValuePaperShredder: t.billValuePaperShredder ?? 0,
            billValueDuplicator: t.billValueDuplicator ?? 0,
            billValueBarcodeScanner: t.billValueBarcodeScanner ?? 0,
            billValueSolutions: t.billValueSolutions ?? 0,
            billValueTender: t.billValueTender ?? 0,
          },
        },
        { upsert: true }
      )
      savedCount++
    }

    return NextResponse.json({ saved: savedCount })
  } catch (error) {
    console.error("Failed to bulk save KPI targets:", error)
    return NextResponse.json({ error: "Failed to bulk save targets" }, { status: 500 })
  }
}
