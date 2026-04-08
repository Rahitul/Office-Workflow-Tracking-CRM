import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectDB } from "@/lib/db"
import { User } from "@/models/User"
import { loginSchema } from "@/lib/validations/auth"
import { generateAccessToken, generateRefreshToken } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    await connectDB()
    
    const body = await request.json()
    const validatedData = loginSchema.parse(body)
    
    const user = await User.findOne({ email: validatedData.email })
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }
    
    const isValidPassword = await bcrypt.compare(validatedData.password, user.passwordHash)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }
    
    const accessToken = await generateAccessToken({
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
    })
    
    const { token: refreshToken } = await generateRefreshToken(user._id.toString())
    
    const response = NextResponse.json({
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
    
    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    })
    
    response.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    })
    
    return response
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}