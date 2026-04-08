"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, FileText, Users, LogOut, Menu, X, ClipboardList, User, Activity, BarChart3, Target } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, checkAuth, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    checkAuth()
  }, [])
  
  useEffect(() => {
    if (mounted && !useAuthStore.getState().isLoading && !user) {
      router.push("/login")
    } else if (mounted && user && user.role !== "admin") {
      router.push("/user/dashboard")
    }
  }, [mounted, user])
  
  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }
  
  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/forms", label: "Forms", icon: ClipboardList },
    { href: "/admin/static-form/responses", label: "Activity Responses", icon: Activity },
    { href: "/admin/static-form/analytics", label: "Activity Analytics", icon: BarChart3 },
    { href: "/admin/kpi", label: "KPI Settings", icon: Target },
    { href: "/admin/kpi/dashboard", label: "KPI Dashboard", icon: Target },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/profile", label: "Profile", icon: User },
  ]
  
  if (!mounted || (useAuthStore.getState().isLoading && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-slate-50">
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md border border-slate-200"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={20} className="text-slate-600" /> : <Menu size={20} className="text-slate-600" />}
      </button>
      
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl transform transition-transform duration-200 lg:translate-x-0 border-r border-slate-200",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Admin</h1>
                <p className="text-xs text-slate-500">Form Builder</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150",
                    isActive 
                      ? "bg-blue-50 text-blue-700 border border-blue-100" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          
          <div className="p-4 border-t border-slate-100">
            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-100"
              onClick={handleLogout}
            >
              <LogOut size={18} className="mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </div>
      
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div className="lg:pl-64">
        <main className="p-6 pt-16 lg:pt-6 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}