import jwt from "jsonwebtoken"
import * as jose from "jose"
import { User } from "@/models/User"
import { RefreshToken } from "@/models/RefreshToken"
import crypto from "crypto"

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-super-secret-refresh-key-change-in-production"

export interface TokenPayload {
  userId: string
  email: string
  role: "admin" | "user" | "accounts" | "service" | "esbd" | "marketing" | "consumable" | "logistics" | "esbd_juniors" | "accounts_juniors" | "consumable_juniors" | "service_juniors" | "marketing_juniors" | "user_juniors" | "logistics_juniors" | "frontdesk" | "branch_manager" | "branch_manager_juniors" | "branch_service" | "branch_service_juniors" | "branch_sales" | "branch_sales_juniors" | "branch_consumable" | "branch_consumable_juniors" | "branch_accounts" | "branch_accounts_juniors"
}

export interface RefreshPayload {
  userId: string
  tokenId: string
}

export async function generateAccessToken(user: { _id: string; email: string; role: string }): Promise<string> {
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role } as TokenPayload,
    JWT_SECRET,
    { expiresIn: "7d" }
  )
}

export async function generateRefreshToken(userId: string): Promise<{ token: string; hashedToken: string }> {
  const token = crypto.randomBytes(64).toString("hex")
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex")
  
  const refreshTokenDoc = new RefreshToken({
    userId,
    token: hashedToken,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  })
  await refreshTokenDoc.save()
  
  return { token, hashedToken }
}

export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
    return decoded
  } catch {
    return null
  }
}

export async function verifyRefreshToken(token: string): Promise<RefreshPayload | null> {
  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")
    const refreshTokenDoc = await RefreshToken.findOne({ token: hashedToken })
    
    if (!refreshTokenDoc || refreshTokenDoc.expiresAt < new Date()) {
      return null
    }
    
    return { userId: refreshTokenDoc.userId.toString(), tokenId: refreshTokenDoc._id.toString() }
  } catch {
    return null
  }
}

export async function invalidateRefreshToken(token: string): Promise<void> {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex")
  await RefreshToken.deleteOne({ token: hashedToken })
}

export async function invalidateAllUserRefreshTokens(userId: string): Promise<void> {
  await RefreshToken.deleteMany({ userId })
}