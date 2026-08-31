import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"

interface TokenPayload {
  userId: string
  email: string
  role: "admin" | "user" | "accounts" | "service" | "esbd" | "marketing" | "consumable" | "logistics" | "esbd_juniors" | "accounts_juniors" | "consumable_juniors" | "service_juniors" | "marketing_juniors" | "user_juniors" | "logistics_juniors" | "frontdesk" | "branch_manager" | "branch_manager_juniors" | "branch_service" | "branch_service_juniors" | "branch_sales" | "branch_sales_juniors" | "branch_consumable" | "branch_consumable_juniors" | "branch_accounts" | "branch_accounts_juniors"
}

function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
    return decoded
  } catch {
    return null
  }
}

export async function proxy(request: NextRequest) {
  // Get the access token from cookies
  const accessToken = request.cookies.get("accessToken")?.value
  
  // Define paths that require authentication
  const adminPaths = ["/admin", "/admin/project-tender"]
  const userPaths = ["/user/dashboard", "/user/forms", "/user/activity", "/user/kpi", "/user/profile", "/user/next-day-plan", "/user/appointment-request", "/user/trainings", "/user/lead-transfer", "/user/lead-transfer/received", "/user/lead-transfer/sent", "/user/project-tender"]
  const accountsPaths = ["/accounts/target-setting", "/accounts/daily-sales", "/accounts/collection-target-setting", "/accounts/daily-collection", "/accounts/budget-vs-actual-setting", "/accounts/budget-vs-actual-submission", "/accounts/lead-transfer", "/accounts/lead-transfer/received", "/accounts/lead-transfer/sent", "/accounts/price-support-setting", "/accounts/daily-price-support"]
  const esbdPaths = ["/esbd/dashboard", "/esbd/brands", "/esbd/products", "/esbd/trainings", "/esbd/assign-training", "/esbd/profile", "/esbd/lead-transfer", "/esbd/lead-transfer/received", "/esbd/lead-transfer/sent", "/esbd/manage-quotation", "/esbd/manage-dropdowns", "/esbd/engineer-info", "/esbd/task-assign", "/esbd/company-list", "/esbd/travel-time", "/esbd/machine-list", "/esbd/project-tender"]
  const servicePaths = ["/service/dashboard", "/service/brands", "/service/products", "/service/trainings", "/service/training-content", "/service/assign-training", "/service/profile", "/service/lead-transfer", "/service/lead-transfer/received", "/service/lead-transfer/sent", "/service/task-assign", "/service/company-list", "/service/manage-quotation", "/service/travel-time", "/service/machine-list", "/service/project-tender", "/service/manage-dropdowns", "/service/engineer-info"]
  const marketingPaths = ["/marketing/dashboard", "/marketing/trainings", "/marketing/profile", "/marketing/lead-transfer", "/marketing/lead-transfer/received", "/marketing/lead-transfer/sent"]
  const consumablePaths = ["/consumable/dashboard", "/consumable/daily-activity", "/consumable/kpi", "/consumable/teams-dashboard", "/consumable/lead-transfer", "/consumable/lead-transfer/received", "/consumable/lead-transfer/sent", "/consumable/profile", "/consumable/project-tender"]
  const logisticsPaths = ["/logistics/dashboard", "/logistics/lead-transfer", "/logistics/lead-transfer/received", "/logistics/lead-transfer/sent", "/logistics/profile"]
  const esbdJuniorsPaths = ["/esbd_juniors/dashboard", "/esbd_juniors/lead-transfer", "/esbd_juniors/lead-transfer/received", "/esbd_juniors/lead-transfer/sent", "/esbd_juniors/profile", "/esbd_juniors/task-assign", "/esbd_juniors/machine-list", "/esbd_juniors/manage-quotation"]
  const accountsJuniorsPaths = ["/accounts_juniors/dashboard", "/accounts_juniors/lead-transfer", "/accounts_juniors/lead-transfer/received", "/accounts_juniors/lead-transfer/sent", "/accounts_juniors/profile"]
  const consumableJuniorsPaths = ["/consumable_juniors/dashboard", "/consumable_juniors/daily-activity", "/consumable_juniors/kpi", "/consumable_juniors/lead-transfer", "/consumable_juniors/lead-transfer/received", "/consumable_juniors/lead-transfer/sent", "/consumable_juniors/profile", "/consumable_juniors/project-tender"]
  const serviceJuniorsPaths = ["/service_juniors/dashboard", "/service_juniors/lead-transfer", "/service_juniors/lead-transfer/received", "/service_juniors/lead-transfer/sent", "/service_juniors/profile", "/service_juniors/task-assign", "/service_juniors/machine-list", "/service_juniors/manage-quotation", "/service_juniors/project-tender"]
  const marketingJuniorsPaths = ["/marketing_juniors/dashboard", "/marketing_juniors/lead-transfer", "/marketing_juniors/lead-transfer/received", "/marketing_juniors/lead-transfer/sent", "/marketing_juniors/profile"]
  const userJuniorsPaths = ["/user_juniors/dashboard", "/user_juniors/activity", "/user_juniors/kpi", "/user_juniors/lead-transfer", "/user_juniors/lead-transfer/received", "/user_juniors/lead-transfer/sent", "/user_juniors/profile", "/user_juniors/project-tender"]
  const logisticsJuniorsPaths = ["/logistics_juniors/dashboard", "/logistics_juniors/lead-transfer", "/logistics_juniors/lead-transfer/received", "/logistics_juniors/lead-transfer/sent", "/logistics_juniors/profile"]
  const frontdeskPaths = ["/frontdesk/front-desk-call", "/frontdesk/profile"]
  const branchManagerPaths = ["/branch_manager/tracking", "/branch_manager/lead-transfer", "/branch_manager/lead-transfer/received", "/branch_manager/lead-transfer/sent", "/branch_manager/profile", "/branch_manager/task-assign", "/branch_manager/manage-quotation", "/branch_manager/company-list", "/branch_manager/travel-time"]
  const branchManagerJuniorsPaths = ["/branch_manager_juniors/tracking", "/branch_manager_juniors/lead-transfer", "/branch_manager_juniors/lead-transfer/received", "/branch_manager_juniors/lead-transfer/sent", "/branch_manager_juniors/profile", "/branch_manager_juniors/task-assign", "/branch_manager_juniors/manage-quotation", "/branch_manager_juniors/company-list", "/branch_manager_juniors/travel-time"]
  const branchServicePaths = ["/branch_service/tracking", "/branch_service/lead-transfer", "/branch_service/lead-transfer/received", "/branch_service/lead-transfer/sent", "/branch_service/profile"]
  const branchServiceJuniorsPaths = ["/branch_service_juniors/tracking", "/branch_service_juniors/lead-transfer", "/branch_service_juniors/lead-transfer/received", "/branch_service_juniors/lead-transfer/sent", "/branch_service_juniors/profile"]
  const branchSalesPaths = ["/branch_sales/tracking", "/branch_sales/lead-transfer", "/branch_sales/lead-transfer/received", "/branch_sales/lead-transfer/sent", "/branch_sales/profile"]
  const branchSalesJuniorsPaths = ["/branch_sales_juniors/tracking", "/branch_sales_juniors/lead-transfer", "/branch_sales_juniors/lead-transfer/received", "/branch_sales_juniors/lead-transfer/sent", "/branch_sales_juniors/profile"]
  const branchConsumablePaths = ["/branch_consumable/tracking", "/branch_consumable/lead-transfer", "/branch_consumable/lead-transfer/received", "/branch_consumable/lead-transfer/sent", "/branch_consumable/profile"]
  const branchConsumableJuniorsPaths = ["/branch_consumable_juniors/tracking", "/branch_consumable_juniors/lead-transfer", "/branch_consumable_juniors/lead-transfer/received", "/branch_consumable_juniors/lead-transfer/sent", "/branch_consumable_juniors/profile"]
  const branchAccountsPaths = ["/branch_accounts/tracking", "/branch_accounts/lead-transfer", "/branch_accounts/lead-transfer/received", "/branch_accounts/lead-transfer/sent", "/branch_accounts/profile"]
  const branchAccountsJuniorsPaths = ["/branch_accounts_juniors/tracking", "/branch_accounts_juniors/lead-transfer", "/branch_accounts_juniors/lead-transfer/received", "/branch_accounts_juniors/lead-transfer/sent", "/branch_accounts_juniors/profile"]
  const apiAdminPaths = ["/api/forms", "/api/users", "/api/responses", "/api/appointments"]
  const apiAccountsPaths = ["/api/sales-targets", "/api/daily-sales", "/api/collection-targets", "/api/daily-collections", "/api/price-support-targets", "/api/daily-price-supports"]
  const apiEsbdPaths = ["/api/companies", "/api/products", "/api/trainings"]
  const apiAllAuthPaths = ["/api/lead-transfers", "/api/training-assignments", "/api/users", "/api/frontdesk-calls", "/api/service-tasks", "/api/checklists", "/api/companiesforservice", "/api/travel-times", "/api/quotations", "/api/machines", "/api/dropdowns", "/api/consumable-activity", "/api/consumable-kpi-targets", "/api/branch-service-phone-calls", "/api/branch-sales-phone-calls", "/api/branch-consumable-phone-calls", "/api/branch-consumable-activity", "/api/project-tender", "/api/warranty-check", "/api/engineer-info"]
  const apiBranchPaths = ["/api/branches", "/api/branch-sales-targets", "/api/branch-service-targets", "/api/branch-consumable-targets", "/api/branch-dashboard"]
  
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
  const isEsbdJuniorsPath = esbdJuniorsPaths.some(path => pathname.startsWith(path))
  const isAccountsJuniorsPath = accountsJuniorsPaths.some(path => pathname.startsWith(path))
  const isConsumableJuniorsPath = consumableJuniorsPaths.some(path => pathname.startsWith(path))
  const isServiceJuniorsPath = serviceJuniorsPaths.some(path => pathname.startsWith(path))
  const isMarketingJuniorsPath = marketingJuniorsPaths.some(path => pathname.startsWith(path))
  const isUserJuniorsPath = userJuniorsPaths.some(path => pathname.startsWith(path))
  const isLogisticsJuniorsPath = logisticsJuniorsPaths.some(path => pathname.startsWith(path))
  const isFrontdeskPath = frontdeskPaths.some(path => pathname.startsWith(path))
  const isBranchManagerPath = branchManagerPaths.some(path => pathname.startsWith(path))
  const isBranchManagerJuniorsPath = branchManagerJuniorsPaths.some(path => pathname.startsWith(path))
  const isBranchServicePath = branchServicePaths.some(path => pathname.startsWith(path))
  const isBranchServiceJuniorsPath = branchServiceJuniorsPaths.some(path => pathname.startsWith(path))
  const isBranchSalesPath = branchSalesPaths.some(path => pathname.startsWith(path))
  const isBranchSalesJuniorsPath = branchSalesJuniorsPaths.some(path => pathname.startsWith(path))
  const isBranchConsumablePath = branchConsumablePaths.some(path => pathname.startsWith(path))
  const isBranchConsumableJuniorsPath = branchConsumableJuniorsPaths.some(path => pathname.startsWith(path))
  const isBranchAccountsPath = branchAccountsPaths.some(path => pathname.startsWith(path))
  const isBranchAccountsJuniorsPath = branchAccountsJuniorsPaths.some(path => pathname.startsWith(path))
  const isApiAdminPath = apiAdminPaths.some(path => pathname.startsWith(path))
  const isApiAccountsPath = apiAccountsPaths.some(path => pathname.startsWith(path))
  const isApiEsbdPath = apiEsbdPaths.some(path => pathname.startsWith(path))
  const isApiAllAuthPath = apiAllAuthPaths.some(path => pathname.startsWith(path))
  const isApiBranchPath = apiBranchPaths.some(path => pathname.startsWith(path))
  const requiresAuth = isAdminPath || isUserPath || isAccountsPath || isEsbdPath || isServicePath || isMarketingPath || isConsumablePath || isLogisticsPath || isEsbdJuniorsPath || isAccountsJuniorsPath || isConsumableJuniorsPath || isServiceJuniorsPath || isMarketingJuniorsPath || isUserJuniorsPath || isLogisticsJuniorsPath || isFrontdeskPath || isBranchManagerPath || isBranchManagerJuniorsPath || isBranchServicePath || isBranchServiceJuniorsPath || isBranchSalesPath || isBranchSalesJuniorsPath || isBranchConsumablePath || isBranchConsumableJuniorsPath || isBranchAccountsPath || isBranchAccountsJuniorsPath || isApiAdminPath || isApiAccountsPath || isApiEsbdPath || isApiAllAuthPath || isApiBranchPath
  
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

  if (isEsbdJuniorsPath && payload.role !== "esbd_juniors" && payload.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/user/dashboard"
    return NextResponse.redirect(url)
  }

  if (isAccountsJuniorsPath && payload.role !== "accounts_juniors" && payload.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/user/dashboard"
    return NextResponse.redirect(url)
  }

  if (isConsumableJuniorsPath && payload.role !== "consumable_juniors" && payload.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/user/dashboard"
    return NextResponse.redirect(url)
  }

  if (isServiceJuniorsPath && payload.role !== "service_juniors" && payload.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/user/dashboard"
    return NextResponse.redirect(url)
  }

  if (isMarketingJuniorsPath && payload.role !== "marketing_juniors" && payload.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/user/dashboard"
    return NextResponse.redirect(url)
  }

  if (isUserJuniorsPath && payload.role !== "user_juniors" && payload.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/user/dashboard"
    return NextResponse.redirect(url)
  }

  if (isLogisticsJuniorsPath && payload.role !== "logistics_juniors" && payload.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/user/dashboard"
    return NextResponse.redirect(url)
  }

  if (isFrontdeskPath && payload.role !== "frontdesk" && payload.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/user/dashboard"
    return NextResponse.redirect(url)
  }

  if (isBranchManagerPath && payload.role !== "branch_manager" && payload.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/user/dashboard"
    return NextResponse.redirect(url)
  }

  if (isBranchManagerJuniorsPath && payload.role !== "branch_manager_juniors" && payload.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/user/dashboard"
    return NextResponse.redirect(url)
  }

  if (isBranchServicePath && payload.role !== "branch_service" && payload.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/user/dashboard"
    return NextResponse.redirect(url)
  }

  if (isBranchServiceJuniorsPath && payload.role !== "branch_service_juniors" && payload.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/user/dashboard"
    return NextResponse.redirect(url)
  }

  if (isBranchSalesPath && payload.role !== "branch_sales" && payload.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/user/dashboard"
    return NextResponse.redirect(url)
  }

  if (isBranchSalesJuniorsPath && payload.role !== "branch_sales_juniors" && payload.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/user/dashboard"
    return NextResponse.redirect(url)
  }

  if (isBranchConsumablePath && payload.role !== "branch_consumable" && payload.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/user/dashboard"
    return NextResponse.redirect(url)
  }

  if (isBranchConsumableJuniorsPath && payload.role !== "branch_consumable_juniors" && payload.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/user/dashboard"
    return NextResponse.redirect(url)
  }

  if (isBranchAccountsPath && payload.role !== "branch_accounts" && payload.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/user/dashboard"
    return NextResponse.redirect(url)
  }

  if (isBranchAccountsJuniorsPath && payload.role !== "branch_accounts_juniors" && payload.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/user/dashboard"
    return NextResponse.redirect(url)
  }

  if (isApiBranchPath && payload.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (isApiEsbdPath && !pathname.startsWith("/api/companiesforservice") && !["esbd", "service", "admin"].includes(payload.role)) {
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