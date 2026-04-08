import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectDB } from "@/lib/db"
import { User } from "@/models/User"
import { registerSchema } from "@/lib/validations/auth"

export async function POST(request: Request) {
  try {
    await connectDB()
    
    const body = await request.json()
    const validatedData = registerSchema.parse(body)
    
    const existingUser = await User.findOne({ email: validatedData.email })
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }
    
    const passwordHash = await bcrypt.hash(validatedData.password, 12)
    
    const user = new User({
      name: validatedData.name,
      email: validatedData.email,
      passwordHash,
      role: "user",
    })
    
    await user.save()
    
    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error("Register error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}