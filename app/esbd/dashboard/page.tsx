"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Building2, Package, GraduationCap, Users } from "lucide-react"

interface Stats {
  companies: number
  products: number
  trainings: number
  assignments: number
}

interface RecentTraining {
  _id: string
  title: string
  createdAt: string
}

export default function EsbdDashboardPage() {
  const [stats, setStats] = useState<Stats>({ companies: 0, products: 0, trainings: 0, assignments: 0 })
  const [recentTrainings, setRecentTrainings] = useState<RecentTraining[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [companiesRes, productsRes, trainingsRes, assignmentsRes] = await Promise.all([
        fetch("/api/companies", { credentials: "include" }),
        fetch("/api/products", { credentials: "include" }),
        fetch("/api/trainings", { credentials: "include" }),
        fetch("/api/training-assignments", { credentials: "include" }),
      ])

      if (companiesRes.ok) {
        const data = await companiesRes.json()
        setStats(prev => ({ ...prev, companies: data.companies?.length || 0 }))
      }
      if (productsRes.ok) {
        const data = await productsRes.json()
        setStats(prev => ({ ...prev, products: data.products?.length || 0 }))
      }
      if (trainingsRes.ok) {
        const data = await trainingsRes.json()
        setStats(prev => ({ ...prev, trainings: data.trainings?.length || 0 }))
        setRecentTrainings(data.trainings?.slice(0, 5) || [])
      }
      if (assignmentsRes.ok) {
        const data = await assignmentsRes.json()
        setStats(prev => ({ ...prev, assignments: data.assignments?.length || 0 }))
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">ESBD Dashboard</h1>
        <p className="text-slate-500">Manage training content and assignments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Brands</CardTitle>
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <Building2 className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.companies}</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Products</CardTitle>
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Package className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.products}</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Trainings</CardTitle>
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.trainings}</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Assignments</CardTitle>
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.assignments}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg text-slate-900">Recent Trainings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentTrainings.length === 0 ? (
            <div className="py-12 text-center">
              <GraduationCap className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No trainings yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentTrainings.map((training) => (
                <div key={training._id} className="p-4">
                  <p className="font-medium text-slate-900">{training.title}</p>
                  <p className="text-sm text-slate-500">{new Date(training.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}