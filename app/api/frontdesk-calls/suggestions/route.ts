import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { FrontdeskCall } from "@/models/FrontdeskCall"
import { cookies } from "next/headers"
import { verifyAccessToken } from "@/lib/auth"

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
    const field = searchParams.get("field")
    const q = searchParams.get("q") || ""

    const validFields = ["visitorName", "fromLocation", "purpose", "callTransferTo"]
    if (!field || !validFields.includes(field)) {
      return NextResponse.json({ error: "Invalid field" }, { status: 400 })
    }

    if (field === "callTransferTo") {
      const results = await FrontdeskCall.aggregate([
        { $match: { callType: "incoming", callTransferTo: { $ne: null } } },
        { $lookup: { from: "users", localField: "callTransferTo", foreignField: "_id", as: "transferredUser" } },
        { $unwind: "$transferredUser" },
        { $match: { "transferredUser.name": { $regex: q, $options: "i" } } },
        { $group: { _id: "$transferredUser.name" } },
        { $sort: { _id: 1 } },
        { $limit: 20 },
      ])
      const suggestions = results.map((r) => r._id).filter((v) => typeof v === "string" && v.trim() !== "")
      return NextResponse.json({ suggestions })
    }

    const match: Record<string, unknown> = { callType: "visit" }
    if (q) {
      match[field] = { $regex: q, $options: "i" }
    } else {
      match[field] = { $nin: [null, ""] }
    }

    const suggestions = await FrontdeskCall.distinct(field, match)

    const filtered = suggestions
      .filter((v): v is string => typeof v === "string" && v.trim() !== "")
      .sort()
      .slice(0, 20)

    return NextResponse.json({ suggestions: filtered })
  } catch (error: any) {
    console.error("Suggestions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
