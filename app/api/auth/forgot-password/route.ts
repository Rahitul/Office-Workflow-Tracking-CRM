import { NextResponse } from "next/server"
import crypto from "crypto"
import { connectDB } from "@/lib/db"
import { User } from "@/models/User"
import { forgotPasswordSchema } from "@/lib/validations/auth"

export async function POST(request: Request) {
  try {
    await connectDB()

    const body = await request.json()
    const validatedData = forgotPasswordSchema.parse(body)

    const user = await User.findOne({ email: validatedData.email })
    if (!user) {
      return NextResponse.json(
        { error: "User with this email does not exist" },
        { status: 404 }
      )
    }

    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetExpires = new Date(Date.now() + 3600000)

    user.resetPasswordToken = resetToken
    user.resetPasswordExpires = resetExpires
    await user.save()

    return NextResponse.json(
      { message: "Password reset token generated", token: resetToken },
      { status: 200 }
    )
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}