import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"

interface TokenPayload {
  userId: string
  email: string
  role: "admin" | "user" | "accounts" | "service" | "esbd" | "marketing" | "consumable" | "logistics"
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
  const userPaths = ["/user/dashboard", "/user/forms", "/user/activity", "/user/kpi", "/user/profile", "/user/next-day-plan", "/user/appointment-request", "/user/trainings", "/user/lead-transfer", "/user/lead-transfer/received", "/user/lead-transfer/sent"]
  const accountsPaths = ["/accounts/target-setting", "/accounts/daily-sales", "/accounts/lead-transfer", "/accounts/lead-transfer/received", "/accounts/lead-transfer/sent"]
  const esbdPaths = ["/esbd/dashboard", "/esbd/brands", "/esbd/products", "/esbd/trainings", "/esbd/assign-training", "/esbd/profile", "/esbd/lead-transfer", "/esbd/lead-transfer/received", "/esbd/lead-transfer/sent"]
  const servicePaths = ["/service/dashboard", "/service/trainings", "/service/profile", "/service/lead-transfer", "/service/lead-transfer/received", "/service/lead-transfer/sent"]
  const marketingPaths = ["/marketing/dashboard", "/marketing/trainings", "/marketing/profile", "/marketing/lead-transfer", "/marketing/lead-transfer/received", "/marketing/lead-transfer/sent"]
  const consumablePaths = ["/consumable/dashboard", "/consumable/lead-transfer", "/consumable/lead-transfer/received", "/consumable/lead-transfer/sent", "/consumable/profile"]
  const logisticsPaths = ["/logistics/dashboard", "/logistics/lead-transfer", "/logistics/lead-transfer/received", "/logistics/lead-transfer/sent", "/logistics/profile"]
  const apiAdminPaths = ["/api/forms", "/api/users", "/api/responses", "/api/appointments"]
  const apiAccountsPaths = ["/api/sales-targets", "/api/daily-sales"]
  const apiEsbdPaths = ["/api/companies", "/api/products", "/api/trainings"]
  const apiAllAuthPaths = ["/api/lead-transfers", "/api/training-assignments"]
  
  // Check if the current path requires authentication
  const { pathname } = request.nextUrl
  
  const isAdminPath = adminPaths.some(path => pathname.startsWith(path))
  const isUserPath = userPaths.some(path => pathname.startsWith(path))
  const isAccountsPath = accountsPaths.some(path => pathname.startsWith(path))
  const isEsbdPath = esbdPaths.some(path => pathname.startsWith(path))
  const isServicePath = servicePaths.some(path => pathname.startsWith(path))
  const isMarketingPath = marketingPaths.some(path => pathname.startsWith(path))
  const isConsumablePath = consumablePaths.some(path => pathname.startsWith(path))
  const isLogisticsPath = logisticsPaths.some(path => pathname.startsWith(path))
  const isApiAdminPath = apiAdminPaths.some(path => pathname.startsWith(path))
  const isApiAccountsPath = apiAccountsPaths.some(path => pathname.startsWith(path))
  const isApiEsbdPath = apiEsbdPaths.some(path => pathname.startsWith(path))
  const isApiAllAuthPath = apiAllAuthPaths.some(path => pathname.startsWith(path))
  const requiresAuth = isAdminPath || isUserPath || isAccountsPath || isEsbdPath || isServicePath || isMarketingPath || isConsumablePath || isLogisticsPath || isApiAdminPath || isApiAccountsPath || isApiEsbdPath || isApiAllAuthPath
  
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
    // Admin or Accounts trying to access user-only pages
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/admin/dashboard"
    return NextResponse.redirect(url)
  }

  if (isAccountsPath && payload.role !== "accounts" && payload.role !== "admin") {
    // User trying to access accounts-only pages
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/user/dashboard"
    return NextResponse.redirect(url)
  }

  if (isApiAccountsPath && payload.role !== "accounts" && payload.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (isEsbdPath && payload.role !== "esbd" && payload.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/user/dashboard"
    return NextResponse.redirect(url)
  }

  if (isServicePath && payload.role !== "service" && payload.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/user/dashboard"
    return NextResponse.redirect(url)
  }

  if (isMarketingPath && payload.role !== "marketing" && payload.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/user/dashboard"
    return NextResponse.redirect(url)
  }

  if (isConsumablePath && payload.role !== "consumable" && payload.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/user/dashboard"
    return NextResponse.redirect(url)
  }

  if (isLogisticsPath && payload.role !== "logistics" && payload.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/user/dashboard"
    return NextResponse.redirect(url)
  }

  if (isApiEsbdPath && payload.role !== "esbd" && payload.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
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