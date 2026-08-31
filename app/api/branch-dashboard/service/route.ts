import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { BranchServicePhoneCall } from "@/models/BranchServicePhoneCall"
import { Quotation } from "@/models/Quotation"
import { BranchServiceTarget } from "@/models/BranchServiceTarget"
import { User } from "@/models/User"
import { verifyAccessToken } from "@/lib/auth"

const BRANCH_SERVICE_ROLES = ["branch_service", "branch_service_juniors", "branch_manager", "branch_manager_juniors"]

export async function GET(request: Request) {
  try {
    await connectDB()
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const payload = await verifyAccessToken(accessToken)
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get("branchId")
    let startDate = searchParams.get("startDate")
    let endDate = searchParams.get("endDate")
    const month = searchParams.get("month")
    const year = searchParams.get("year")

    if (!startDate && !endDate && month && year) {
      const m = parseInt(month)
      const y = parseInt(year)
      startDate = `${y}-${String(m).padStart(2, "0")}-01`
      const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate()
      endDate = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`
    }

    let userIds: string[] = []
    if (branchId && branchId !== "all") {
      const users = await User.find({ branch: branchId, role: { $in: BRANCH_SERVICE_ROLES } }).select("_id").lean()
      userIds = users.map(u => u._id.toString())
    } else {
      const users = await User.find({ role: { $in: BRANCH_SERVICE_ROLES } }).select("_id").lean()
      userIds = users.map(u => u._id.toString())
    }
    if (month && year) {
      const targetFilter: Record<string, unknown> = { month: parseInt(month), year: parseInt(year) }
      if (branchId && branchId !== "all") targetFilter.branchId = branchId
      const targetUserIds = await BranchServiceTarget.distinct("userId", targetFilter)
      for (const uid of targetUserIds) {
        const uidStr = uid.toString()
        if (!userIds.includes(uidStr)) {
          userIds.push(uidStr)
        }
      }
    }

    const dateFilter: Record<string, Date> = {}
    if (startDate) {
      const [y, m, d] = startDate.split("-").map(Number)
      dateFilter.$gte = new Date(Date.UTC(y, m - 1, d))
    }
    if (endDate) {
      const [y, m, d] = endDate.split("-").map(Number)
      dateFilter.$lte = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999))
    }

    const phoneDateStringFilter: Record<string, string> = {}
    if (startDate) phoneDateStringFilter.$gte = startDate
    if (endDate) phoneDateStringFilter.$lte = endDate

    const phoneCallsFilter: Record<string, unknown> = { userId: { $in: userIds } }
    if (Object.keys(phoneDateStringFilter).length > 0) phoneCallsFilter.date = phoneDateStringFilter

    const dateQ = Object.keys(dateFilter).length > 0 ? { quotationDate: dateFilter } : {}

    const allQuotationsFilter = { engineer: { $in: userIds }, ...dateQ }
    const approvedFilter = { engineer: { $in: userIds }, status: "Approved", ...dateQ }
    const billedFilter = { engineer: { $in: userIds }, billDate: { $exists: true }, ...dateQ }

    const [phoneCallDocs, allQuotationDocs, approvedDocs, billedDocs] = await Promise.all([
      BranchServicePhoneCall.find(phoneCallsFilter).select("userId").populate("userId", "name").lean(),
      Quotation.find(allQuotationsFilter).select("engineer amount").populate("engineer", "name").lean(),
      Quotation.find(approvedFilter).select("engineer amount").populate("engineer", "name").lean(),
      Quotation.find(billedFilter).select("engineer amount").populate("engineer", "name").lean(),
    ])

    const aggregated = {
      phoneCalls: phoneCallDocs.length,
      quotations: allQuotationDocs.reduce((sum: number, q: any) => sum + (q.amount || 0), 0),
      orders: approvedDocs.reduce((sum: number, q: any) => sum + (q.amount || 0), 0),
      bills: billedDocs.reduce((sum: number, q: any) => sum + (q.amount || 0), 0),
    }

    const userActivityMap: Record<string, { name: string; data: Record<string, number> }> = {}
    for (const doc of phoneCallDocs as any[]) {
      const uid = doc.userId?._id?.toString() || doc.userId?.toString()
      if (!uid) continue
      if (!userActivityMap[uid]) userActivityMap[uid] = { name: (doc.userId as any)?.name || "Unknown", data: { phoneCalls: 0, quotations: 0, orders: 0, bills: 0 } }
      userActivityMap[uid].data.phoneCalls = (userActivityMap[uid].data.phoneCalls || 0) + 1
    }
    for (const doc of allQuotationDocs as any[]) {
      const uid = doc.engineer?._id?.toString() || doc.engineer?.toString()
      if (!uid) continue
      if (!userActivityMap[uid]) userActivityMap[uid] = { name: doc.engineer?.name || "Unknown", data: { phoneCalls: 0, quotations: 0, orders: 0, bills: 0 } }
      userActivityMap[uid].data.quotations = (userActivityMap[uid].data.quotations || 0) + (doc.amount || 0)
    }
    for (const doc of approvedDocs as any[]) {
      const uid = doc.engineer?._id?.toString() || doc.engineer?.toString()
      if (!uid) continue
      if (!userActivityMap[uid]) userActivityMap[uid] = { name: doc.engineer?.name || "Unknown", data: { phoneCalls: 0, quotations: 0, orders: 0, bills: 0 } }
      userActivityMap[uid].data.orders = (userActivityMap[uid].data.orders || 0) + (doc.amount || 0)
    }
    for (const doc of billedDocs as any[]) {
      const uid = doc.engineer?._id?.toString() || doc.engineer?.toString()
      if (!uid) continue
      if (!userActivityMap[uid]) userActivityMap[uid] = { name: doc.engineer?.name || "Unknown", data: { phoneCalls: 0, quotations: 0, orders: 0, bills: 0 } }
      userActivityMap[uid].data.bills = (userActivityMap[uid].data.bills || 0) + (doc.amount || 0)
    }

    const branchUsers = await User.find({ _id: { $in: userIds } }).select("name").lean()
    for (const u of branchUsers) {
      const uid = u._id.toString()
      if (!userActivityMap[uid]) {
        userActivityMap[uid] = { name: u.name, data: { phoneCalls: 0, quotations: 0, orders: 0, bills: 0 } }
      }
    }

    let target: Record<string, number> | null = null
    let userTargetMap: Record<string, Record<string, number>> = {}
    if (month && year) {
      const targetFilter: Record<string, unknown> = { month: parseInt(month), year: parseInt(year) }
      if (branchId && branchId !== "all") targetFilter.branchId = branchId
      const targets = await BranchServiceTarget.find(targetFilter).populate("userId", "name").lean()

      if (targets.length > 0) {
        const targetFields = ["phoneCallsTarget", "quotationsTarget", "ordersTarget", "billsTarget"] as const

        target = {}
        for (const field of targetFields) {
          target[field] = targets.reduce((sum: number, t: any) => sum + (t[field] || 0), 0)
        }

        for (const t of targets) {
          const uid = t.userId?._id?.toString() || t.userId?.toString()
          if (uid) {
            userTargetMap[uid] = { _name: (t.userId as any)?.name || "User" } as any
            for (const field of targetFields) {
              userTargetMap[uid][field] = t[field] || 0
            }
          }
        }
      }
    }

    return NextResponse.json({ aggregated, target, userCount: userIds.length, userActivityMap, userTargetMap })
  } catch (error: any) {
    console.error("Branch service dashboard error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
