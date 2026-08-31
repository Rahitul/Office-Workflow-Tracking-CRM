import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { connectDB } from "@/lib/db"
import { EngineerInfo } from "@/models/EngineerInfo"
import { User } from "@/models/User"
import { verifyAccessToken, TokenPayload } from "@/lib/auth"

const ALLOWED_ROLES = ["service", "esbd", "admin"]

function isAllowed(payload: TokenPayload | null) {
  return payload && ALLOWED_ROLES.includes(payload.role)
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params
    const engineer = await EngineerInfo.findById(id)
      .populate("engineerId", "name email role")
      .populate("createdBy", "name")

    if (!engineer) {
      return NextResponse.json({ error: "Engineer info not found" }, { status: 404 })
    }

    return NextResponse.json({ engineer })
  } catch (error: any) {
    console.error("Get engineer info error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params
    const body = await request.json()

    const accountUpdate: Record<string, any> = {}
    if (body.name !== undefined && String(body.name).trim()) accountUpdate.name = String(body.name).trim()
    if (body.email !== undefined && String(body.email).trim()) accountUpdate.email = String(body.email).trim()
    if (body.password) {
      if (String(body.password).length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
      }
      accountUpdate.passwordHash = await bcrypt.hash(String(body.password), 12)
    }

    if (Object.keys(accountUpdate).length > 0) {
      const record = await EngineerInfo.findById(id).select("engineerId")
      if (!record) {
        return NextResponse.json({ error: "Engineer info not found" }, { status: 404 })
      }
      if (accountUpdate.email) {
        const duplicate = await User.findOne({ email: accountUpdate.email, _id: { $ne: record.engineerId } })
        if (duplicate) {
          return NextResponse.json({ error: "Another user already uses this email" }, { status: 409 })
        }
      }
      await User.findByIdAndUpdate(record.engineerId, accountUpdate)
    }

    const updateData: Record<string, any> = {}
    if (body.designation !== undefined) updateData.designation = body.designation
    if (body.department !== undefined) updateData.department = body.department
    if (body.nationalId !== undefined) updateData.nationalId = body.nationalId
    if (body.mobileNumber !== undefined) updateData.mobileNumber = body.mobileNumber
    if (body.altMobileNumber !== undefined) updateData.altMobileNumber = body.altMobileNumber
    if (body.presentAddress !== undefined) updateData.presentAddress = body.presentAddress
    if (body.permanentAddress !== undefined) updateData.permanentAddress = body.permanentAddress
    if (body.joiningDate !== undefined) updateData.joiningDate = body.joiningDate ? new Date(body.joiningDate) : null
    if (body.bloodGroup !== undefined) updateData.bloodGroup = body.bloodGroup
    if (body.image !== undefined) updateData.image = body.image

    const engineer = await EngineerInfo.findByIdAndUpdate(id, updateData, { new: true })
      .populate("engineerId", "name email role")
      .populate("createdBy", "name")

    if (!engineer) {
      return NextResponse.json({ error: "Engineer info not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Engineer info updated successfully", engineer })
  } catch (error: any) {
    console.error("Update engineer info error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params
    const engineer = await EngineerInfo.findByIdAndDelete(id)

    if (!engineer) {
      return NextResponse.json({ error: "Engineer info not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Engineer info deleted successfully" })
  } catch (error: any) {
    console.error("Delete engineer info error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
