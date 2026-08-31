import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { BranchConsumableActivity } from "@/models/BranchConsumableActivity"
import { BranchConsumableTarget } from "@/models/BranchConsumableTarget"
import { BranchConsumablePhoneCall } from "@/models/BranchConsumablePhoneCall"
import { User } from "@/models/User"
import { verifyAccessToken } from "@/lib/auth"

const BRANCH_CONSUMABLE_ROLES = ["branch_consumable", "branch_consumable_juniors", "branch_manager", "branch_manager_juniors"]

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
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const month = searchParams.get("month")
    const year = searchParams.get("year")

    let userIds: string[] = []
    if (branchId && branchId !== "all") {
      const users = await User.find({ branch: branchId, role: { $in: BRANCH_CONSUMABLE_ROLES } }).select("_id").lean()
      userIds = users.map(u => u._id.toString())
    } else {
      const users = await User.find({ role: { $in: BRANCH_CONSUMABLE_ROLES } }).select("_id").lean()
      userIds = users.map(u => u._id.toString())
    }
    if (month && year) {
      const targetFilter: Record<string, unknown> = { month: parseInt(month), year: parseInt(year) }
      if (branchId && branchId !== "all") targetFilter.branchId = branchId
      const targetUserIds = await BranchConsumableTarget.distinct("userId", targetFilter)
      for (const uid of targetUserIds) {
        const uidStr = uid.toString()
        if (!userIds.includes(uidStr)) {
          userIds.push(uidStr)
        }
      }
    }

    const activityFilter: Record<string, unknown> = { userId: { $in: userIds } }
    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {}
      if (startDate) {
        const [y, m, d] = startDate.split("-").map(Number)
        dateFilter.$gte = new Date(Date.UTC(y, m - 1, d))
      }
      if (endDate) {
        const [y, m, d] = endDate.split("-").map(Number)
        dateFilter.$lte = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999))
      }
      activityFilter.activityDate = dateFilter
    }

    const activities = await BranchConsumableActivity.find(activityFilter)
      .populate("userId", "name email")
      .lean()

    const numericFields = [
      "calls", "visits", "quotation", "quotationQty",
      "orderValueBlackAndWhite", "orderValueColor", "orderValueDuplicatorInk",
      "orderValueDuplicatorMaster", "orderValueMps",
      "billValueBlackAndWhite", "billValueColor", "billValueDuplicatorInk",
      "billValueDuplicatorMaster", "billValueMps",
    ] as const

    const aggregated: Record<string, number> = {}
    for (const field of numericFields) {
      aggregated[field] = activities.reduce((sum: number, a: any) => sum + (a[field] || 0), 0)
    }

    const userActivityMap: Record<string, { name: string; data: Record<string, number> }> = {}
    for (const a of activities as any[]) {
      const uid = a.userId?._id?.toString() || a.userId?.toString()
      if (!uid) continue
      if (!userActivityMap[uid]) {
        userActivityMap[uid] = {
          name: a.userId?.name || "Unknown",
          data: {},
        }
      }
      for (const field of numericFields) {
        userActivityMap[uid].data[field] = (userActivityMap[uid].data[field] || 0) + (a[field] || 0)
      }
    }

    const branchUsers = await User.find({ _id: { $in: userIds } }).select("name").lean()
    for (const u of branchUsers) {
      const uid = u._id.toString()
      if (!userActivityMap[uid]) {
        userActivityMap[uid] = { name: u.name, data: {} }
        for (const field of numericFields) {
          userActivityMap[uid].data[field] = 0
        }
      }
    }

    if (userIds.length > 0) {
      const phoneFilter: Record<string, unknown> = { userId: { $in: userIds } }
      if (startDate || endDate) {
        const dateFilter: Record<string, string> = {}
        if (startDate) dateFilter.$gte = startDate
        if (endDate) dateFilter.$lte = endDate
        phoneFilter.date = dateFilter
      }

      const phoneCalls = await BranchConsumablePhoneCall.find(phoneFilter).lean()

      const phoneCallCount = phoneCalls.length
      const userPhoneMap: Record<string, number> = {}

      for (const pc of phoneCalls as any[]) {
        const uid = pc.userId?.toString()
        if (!uid) continue
        userPhoneMap[uid] = (userPhoneMap[uid] || 0) + 1
      }

      aggregated.phoneCalls = phoneCallCount

      for (const [uid, count] of Object.entries(userPhoneMap)) {
        if (!userActivityMap[uid]) {
          userActivityMap[uid] = { name: "Unknown", data: {} }
        }
        userActivityMap[uid].data.phoneCalls = (userActivityMap[uid].data.phoneCalls || 0) + count
      }
    }

    let target: Record<string, number> | null = null
    let userTargetMap: Record<string, Record<string, number>> = {}
    if (month && year) {
      const targetFilter: Record<string, unknown> = { month: parseInt(month), year: parseInt(year) }
      if (branchId && branchId !== "all") targetFilter.branchId = branchId
      const targets = await BranchConsumableTarget.find(targetFilter).populate("userId", "name").lean()

      if (targets.length > 0) {
        const targetFields = [
          "callsTarget", "visitsTarget", "quotationTarget", "orderAmountTarget",
          "orderValueBlackAndWhite", "orderValueColor", "orderValueDuplicatorInk",
          "orderValueDuplicatorMaster", "orderValueMps",
          "billAmountTarget",
          "billValueBlackAndWhite", "billValueColor", "billValueDuplicatorInk",
          "billValueDuplicatorMaster", "billValueMps",
        ] as const

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
    console.error("Branch consumable dashboard error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
