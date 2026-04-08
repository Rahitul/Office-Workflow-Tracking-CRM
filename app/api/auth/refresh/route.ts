import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { User } from "@/models/User"
import { verifyRefreshToken, generateAccessToken, invalidateRefreshToken } from "@/lib/auth"

export async function POST() {
  try {
    await connectDB()
    
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get("refreshToken")?.value
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token not found" },
        { status: 401 }
      )
    }
    
    const payload = await verifyRefreshToken(refreshToken)
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 }
      )
    }
    
    const user = await User.findById(payload.userId)
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      )
    }
    
    await invalidateRefreshToken(refreshToken)
    
    const newAccessToken = await generateAccessToken({
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
    })
    
    const response = NextResponse.json({
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
    
    response.cookies.set("accessToken", newAccessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    })
    
    return response
  } catch (error: any) {
    console.error("Refresh error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}