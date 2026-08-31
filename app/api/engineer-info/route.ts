import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { connectDB } from "@/lib/db"
import { EngineerInfo } from "@/models/EngineerInfo"
import { User } from "@/models/User"
import { verifyAccessToken, TokenPayload } from "@/lib/auth"

const ALLOWED_ROLES = ["service", "esbd", "admin"]
const ENGINEER_ROLES = ["service", "service_juniors", "esbd", "esbd_juniors", "branch_service", "branch_service_juniors"]

function isAllowed(payload: TokenPayload | null) {
  return payload && ALLOWED_ROLES.includes(payload.role)
}

export async function GET(_request: Request) {
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

    const engineers = await EngineerInfo.find()
      .populate("engineerId", "name email role")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })

    return NextResponse.json({ engineers })
  } catch (error: any) {
    console.error("Get engineer info error:", error)
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
    if (!isAllowed(payload) || !payload) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, password, role, designation, department, nationalId, mobileNumber, altMobileNumber, presentAddress, permanentAddress, joiningDate, bloodGroup, image, existingUserId } = body

    if (!designation || !mobileNumber) {
      return NextResponse.json({ error: "Designation and mobile number are required" }, { status: 400 })
    }

    let userId: string

    if (existingUserId) {
      const existingUser = await User.findById(existingUserId).select("_id")
      if (!existingUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }
      const alreadyHasInfo = await EngineerInfo.findOne({ engineerId: existingUserId })
      if (alreadyHasInfo) {
        return NextResponse.json({ error: "This user already has engineer details" }, { status: 409 })
      }
      userId = existingUser._id.toString()
    } else {
      if (!name || !email || !password || !role) {
        return NextResponse.json({ error: "Name, email, password, and role are required" }, { status: 400 })
      }

      if (password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
      }

      if (!ENGINEER_ROLES.includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 })
      }

      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 })
      }

      const passwordHash = await bcrypt.hash(password, 12)
      const user = await User.create({ name, email, passwordHash, role })
      userId = user._id.toString()
    }

    const engineer = await EngineerInfo.create({
      engineerId: userId,
      designation,
      department: department || "",
      nationalId: nationalId || "",
      mobileNumber,
      altMobileNumber: altMobileNumber || "",
      presentAddress: presentAddress || "",
      permanentAddress: permanentAddress || "",
      joiningDate: joiningDate ? new Date(joiningDate) : undefined,
      bloodGroup: bloodGroup || "",
      image: image || "",
      createdBy: payload.userId,
    })

    return NextResponse.json({ message: "Engineer account created successfully", engineer }, { status: 201 })
  } catch (error: any) {
    console.error("Create engineer info error:", error)

    if (error?.code === 11000) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
