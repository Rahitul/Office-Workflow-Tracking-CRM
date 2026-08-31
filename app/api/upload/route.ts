import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyAccessToken } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import crypto from "crypto"

const PHOTOS_DIR = "D:\\iomdailychecklistedphotos"

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const payload = await verifyAccessToken(accessToken)
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { image } = await request.json()
    if (!image || typeof image !== "string" || !image.startsWith("data:image")) {
      return NextResponse.json({ error: "Invalid image data" }, { status: 400 })
    }

    await mkdir(PHOTOS_DIR, { recursive: true })

    const matches = image.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!matches) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 })
    }

    const ext = matches[1] === "jpeg" ? "jpg" : matches[1]
    const buffer = Buffer.from(matches[2], "base64")
    const filename = `${Date.now()}-${crypto.randomUUID()}.${ext}`
    const filepath = path.join(PHOTOS_DIR, filename)

    await writeFile(filepath, buffer)

    return NextResponse.json({ success: true, url: `/api/images/${filename}` }, { status: 201 })
  } catch (error) {
    console.error("Error uploading image:", error)
    return NextResponse.json({ success: false, error: "Failed to upload image" }, { status: 500 })
  }
}
