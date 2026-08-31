import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { Activity } from "@/models/Activity"
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
    
    const body = await request.json()
    console.log("Activity Request Body:", JSON.stringify(body, null, 2))
    const { 
      activityDate, 
      userId, 
      coldCallsMade, 
      followUpCallsMade, 
      newAppointmentsFixed, 
      customerVisitsCompleted, 
      salesEmailsSent,
      primaryProductFocus,
      secondaryProductFocus,
      visits,
      quotationsIssuedToday,
      ordersClosedToday,
      orderValueMfp,
      orderValueMps,
      orderValueBarcodePrinters,
      orderValuePaperShredder,
      orderValueDuplicator,
      orderValueBarcodeScanner,
      orderValueSolutions,
      orderValueTender,
      billsClosedToday,
      billValueMfp,
      billValueMps,
      billValueBarcodePrinters,
      billValuePaperShredder,
      billValueDuplicator,
      billValueBarcodeScanner,
      billValueSolutions,
      billValueTender,
      tomorrowPlan
    } = body
    
    if (!activityDate || !userId) {
      return NextResponse.json({ error: "Activity date and user are required" }, { status: 400 })
    }
    
    const query = {
      activityDate: new Date(activityDate),
      userId,
    }

    const update = {
      coldCallsMade: coldCallsMade ?? 0,
      followUpCallsMade: followUpCallsMade ?? 0,
      newAppointmentsFixed: newAppointmentsFixed ?? 0,
      customerVisitsCompleted: customerVisitsCompleted ?? 0,
      salesEmailsSent: salesEmailsSent ?? 0,
      primaryProductFocus: primaryProductFocus ?? "",
      secondaryProductFocus: secondaryProductFocus ?? [],
      visits: visits ?? [],
      quotationsIssuedToday: quotationsIssuedToday ?? 0,
      ordersClosedToday: ordersClosedToday ?? 0,
      orderValueMfp: orderValueMfp ?? 0,
      orderValueMps: orderValueMps ?? 0,
      orderValueBarcodePrinters: orderValueBarcodePrinters ?? 0,
      orderValuePaperShredder: orderValuePaperShredder ?? 0,
      orderValueDuplicator: orderValueDuplicator ?? 0,
      orderValueBarcodeScanner: orderValueBarcodeScanner ?? 0,
      orderValueSolutions: orderValueSolutions ?? 0,
      orderValueTender: orderValueTender ?? 0,
      billsClosedToday: billsClosedToday ?? 0,
      billValueMfp: billValueMfp ?? 0,
      billValueMps: billValueMps ?? 0,
      billValueBarcodePrinters: billValueBarcodePrinters ?? 0,
      billValuePaperShredder: billValuePaperShredder ?? 0,
      billValueDuplicator: billValueDuplicator ?? 0,
      billValueBarcodeScanner: billValueBarcodeScanner ?? 0,
      billValueSolutions: billValueSolutions ?? 0,
      billValueTender: billValueTender ?? 0,
      tomorrowPlan: tomorrowPlan ?? "",
      submittedAt: new Date(),
    }

    const activity = await Activity.findOneAndUpdate(query, update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    })
    
    return NextResponse.json(
      { message: "Activity saved successfully", activity },
      { status: activity.isNew ? 201 : 200 }
    )
  } catch (error: any) {
    console.error("Submit activity error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
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
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const userId = searchParams.get("userId")
    
    const query: Record<string, unknown> = {}
    
    if (startDate && endDate) {
      query.activityDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    }
    
    if (payload.role === "user" || payload.role === "user_juniors") {
      query.userId = payload.userId
    } else if (userId) {
      query.userId = userId
    }
    
    const activities = await Activity.find(query)
      .populate("userId", "name email")
      .sort({ activityDate: -1 })
    
    return NextResponse.json({ activities })
  } catch (error: any) {
    console.error("Get activities error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
