import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { verifyAccessToken } from "@/lib/auth"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get("refreshToken")?.value
    
    if (refreshToken) {
      const { invalidateRefreshToken } = await import("@/lib/auth")
      await invalidateRefreshToken(refreshToken)
    }
    
    const response = NextResponse.json({ message: "Logged out successfully" })
    
    response.cookies.set("refreshToken", "", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })
    
    response.cookies.set("accessToken", "", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })
    
    return response
  } catch (error: any) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}