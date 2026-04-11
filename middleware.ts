import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"

interface TokenPayload {
  userId: string
  email: string
  role: "admin" | "user"
}

function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
    return decoded
  } catch {
    return null
  }
}

export const runtime = 'nodejs'

export async function middleware(request: NextRequest) {
  // Get the access token from cookies
  const accessToken = request.cookies.get("accessToken")?.value
  
  // Define paths that require authentication
  const adminPaths = ["/admin"]
  const userPaths = ["/user/dashboard", "/user/forms", "/user/activity", "/user/kpi", "/user/profile", "/user/next-day-plan"]
  const apiAdminPaths = ["/api/forms", "/api/users", "/api/responses"]
  
  // Check if the current path requires authentication
  const { pathname } = request.nextUrl
  
  const isAdminPath = adminPaths.some(path => pathname.startsWith(path))
  const isUserPath = userPaths.some(path => pathname.startsWith(path))
  const isApiAdminPath = apiAdminPaths.some(path => pathname.startsWith(path))
  const requiresAuth = isAdminPath || isUserPath || isApiAdminPath
  
  // If path doesn't require auth, allow request to proceed
  if (!requiresAuth) {
    return NextResponse.next()
  }
  
  // If path requires auth but no token, redirect to login
  if (!accessToken) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }
  
  // Verify the access token
  const payload = verifyAccessToken(accessToken)
  
  // If token is invalid, redirect to login
  if (!payload) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }
  
  // Check role-based access
  if (isAdminPath && payload.role !== "admin") {
    // User trying to access admin pages - redirect to user dashboard
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/user/dashboard"
    return NextResponse.redirect(url)
  }
  
  if (isUserPath && payload.role !== "user") {
    // Admin trying to access user-only pages
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/admin/dashboard"
    return NextResponse.redirect(url)
  }
  
  // If token is valid and role is correct, allow request to proceed
  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (login, register, etc.)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
}