"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import axios from "axios"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Clock, CheckCircle, ClipboardList, LogOut } from "lucide-react"
import { useAuthStore } from "@/store/authStore"

interface Form {
  _id: string
  title: string
  description: string
  status: "draft" | "published"
  createdAt: string
  deadline: string | null
}

interface UserResponse {
  _id: string
  formId: Form
  submittedAt: string
}

export default function UserDashboardPage() {
  const router = useRouter()
  const { user, checkAuth, logout } = useAuthStore()
  const [forms, setForms] = useState<Form[]>([])
  const [responses, setResponses] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchData()
  }, [])
  
  const fetchData = async () => {
    try {
      const [formsRes, responsesRes] = await Promise.all([
        axios.get("/api/forms", { withCredentials: true }),
        axios.get("/api/responses", { withCredentials: true }),
      ])
      setForms(formsRes.data.forms || [])
      setResponses(responsesRes.data.responses || [])
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }
  
  const submittedFormIds = new Set(responses.map(r => r.formId?._id))
  const pendingForms = forms.filter(f => !submittedFormIds.has(f._id))
  const completedForms = forms.filter(f => submittedFormIds.has(f._id))
  
  const isOverdue = (deadline: string | null) => {
    if (!deadline) return false
    return new Date(deadline) < new Date()
  }

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Forms</h1>
          <p className="text-slate-500">Welcome back, {user?.name}</p>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Forms</CardTitle>
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <ClipboardList className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{forms.length}</div>
            <p className="text-xs text-slate-400 mt-1">Assigned to you</p>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Pending</CardTitle>
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{pendingForms.length}</div>
            <p className="text-xs text-slate-400 mt-1">To complete</p>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Completed</CardTitle>
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{completedForms.length}</div>
            <p className="text-xs text-slate-400 mt-1">Submitted</p>
          </CardContent>
        </Card>
      </div>
      
      {pendingForms.length > 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-amber-50/50">
            <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              Pending Forms
              <Badge className="ml-2 bg-amber-100 text-amber-700 border-amber-200">
                {pendingForms.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {pendingForms.map((form) => (
                <div
                  key={form._id}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-900 truncate">{form.title}</h3>
                    <p className="text-sm text-slate-500 truncate">{form.description || "No description"}</p>
                    <div className="flex items-center gap-3 mt-2">
                      {form.deadline && isOverdue(form.deadline) && (
                        <Badge className="bg-red-100 text-red-700 border-red-200">Overdue</Badge>
                      )}
                      {form.deadline && !isOverdue(form.deadline) && (
                        <span className="text-xs text-slate-400">
                          Due: {new Date(form.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link href={`/user/forms/${form._id}/fill`}>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 ml-4">
                      Fill Form
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {completedForms.length > 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-emerald-50/50">
            <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              Completed Forms
              <Badge className="ml-2 bg-emerald-100 text-emerald-700 border-emerald-200">
                {completedForms.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {completedForms.map((form) => (
                <div
                  key={form._id}
                  className="flex items-center justify-between p-4 bg-emerald-50/30"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-900 truncate">{form.title}</h3>
                    <p className="text-sm text-emerald-600">Submitted</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {!loading && forms.length === 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-slate-500">No forms assigned to you yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}