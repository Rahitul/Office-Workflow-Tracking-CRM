import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"

const PHOTOS_DIR = "D:\\iomdailychecklistedphotos"

export async function GET(request: Request, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params

    const safeName = path.basename(name)
    const filepath = path.join(PHOTOS_DIR, safeName)

    const buffer = await readFile(filepath)

    const ext = path.extname(safeName).toLowerCase()
    const contentType =
      ext === ".png" ? "image/png" :
      ext === ".gif" ? "image/gif" :
      ext === ".webp" ? "image/webp" :
      "image/jpeg"

    return new NextResponse(buffer, {
      headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000, immutable" },
    })
  } catch {
    return NextResponse.json({ error: "Image not found" }, { status: 404 })
  }
}
