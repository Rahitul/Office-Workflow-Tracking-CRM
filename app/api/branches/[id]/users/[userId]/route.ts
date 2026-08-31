import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { Branch } from "@/models/Branch"
import { User } from "@/models/User"
import { verifyAccessToken } from "@/lib/auth"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    await connectDB()
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const payload = await verifyAccessToken(accessToken)
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { id, userId } = await params
    await User.findByIdAndUpdate(userId, { $unset: { branch: "" } })
    await Branch.findByIdAndUpdate(id, { $pull: { users: userId } })
    return NextResponse.json({ message: "User removed from branch" })
  } catch (error: any) {
    console.error("Remove user from branch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
