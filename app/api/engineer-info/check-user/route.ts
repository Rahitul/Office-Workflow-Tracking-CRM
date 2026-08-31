import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { EngineerInfo } from "@/models/EngineerInfo"
import { User } from "@/models/User"
import { verifyAccessToken, TokenPayload } from "@/lib/auth"

const ALLOWED_ROLES = ["service", "esbd", "admin"]

function isAllowed(payload: TokenPayload | null) {
  return payload && ALLOWED_ROLES.includes(payload.role)
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
    if (!isAllowed(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const user = await User.findOne({ email: email.trim() }).select("_id name email role")

    if (!user) {
      return NextResponse.json({ found: false })
    }

    const engineerInfo = await EngineerInfo.findOne({ engineerId: user._id }).select("_id")

    if (engineerInfo) {
      return NextResponse.json({
        found: true,
        user: { _id: user._id, name: user.name, email: user.email, role: user.role },
        hasEngineerInfo: true,
        engineerInfoId: engineerInfo._id,
      })
    }

    return NextResponse.json({
      found: true,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
      hasEngineerInfo: false,
    })
  } catch (error: any) {
    console.error("Check user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
