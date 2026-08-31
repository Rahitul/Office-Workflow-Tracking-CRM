import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { verifyAccessToken } from "@/lib/auth"
import mongoose from "mongoose"
import path from "path"
import fs from "fs"

const BACKUP_DIR = "C:\\mongo_db_backup\\iomdaily"

export async function POST(request: Request) {
  try {
    await connectDB()
    
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const payload = await verifyAccessToken(accessToken)
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const allowedRoles = ["admin", "esbd"]
    if (!allowedRoles.includes(payload.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    if (action === "backup") {
      if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true })
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.json`)

      const db = mongoose.connection.db
      if (!db) {
        return NextResponse.json({ error: "Database not connected" }, { status: 500 })
      }
      const collections = await db.listCollections().toArray()

      const backupData: Record<string, unknown[]> = {}

      for (const collection of collections) {
        const collectionName = collection.name
        const documents = await db.collection(collectionName).find({}).toArray()
        backupData[collectionName] = documents.map((doc: any) => {
          const newDoc: any = { ...doc }
          if (newDoc._id) {
            newDoc._id = newDoc._id.toString()
          }
          return newDoc
        })
      }

      fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2))

      return NextResponse.json({ 
        success: true, 
        message: `Database backed up to ${backupFile}` 
      })
    }

    if (action === "import") {
      const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith("backup-") && f.endsWith(".json"))
        .sort()
        .reverse()

      if (files.length === 0) {
        return NextResponse.json({ 
          error: "No backup files found" 
        }, { status: 400 })
      }

      const latestBackup = path.join(BACKUP_DIR, files[0])
      const backupData = JSON.parse(fs.readFileSync(latestBackup, "utf-8"))

      const db = mongoose.connection.db
      if (!db) {
        return NextResponse.json({ error: "Database not connected" }, { status: 500 })
      }

      for (const [collectionName, documents] of Object.entries(backupData)) {
        try {
          await db.collection(collectionName).deleteMany({})
          
          if (Array.isArray(documents) && documents.length > 0) {
            for (const doc of documents) {
              if (doc._id) {
                delete doc._id
              }
              await db.collection(collectionName).insertOne(doc)
            }
          }
        } catch (err) {
          console.error(`Error importing collection ${collectionName}:`, err)
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: `Database imported from ${latestBackup}` 
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })

  } catch (error: any) {
    console.error("Backup/Import error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}