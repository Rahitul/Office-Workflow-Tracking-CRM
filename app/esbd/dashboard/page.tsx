"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Package, GraduationCap, Users, Database, Upload, Loader2, Clock, PlayCircle, CheckCircle2, ListChecks, UserCog } from "lucide-react"
import Link from "next/link"

interface Stats {
  companies: number
  products: number
  trainings: number
  assignments: number
}

interface StatusCounts {
  pending: number
  in_progress: number
  completed: number
}

interface RecentTraining {
  _id: string
  title: string
  createdAt: string
}

export default function EsbdDashboardPage() {
  const [stats, setStats] = useState<Stats>({ companies: 0, products: 0, trainings: 0, assignments: 0 })
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({ pending: 0, in_progress: 0, completed: 0 })
  const [recentTrainings, setRecentTrainings] = useState<RecentTraining[]>([])
  const [loading, setLoading] = useState(true)
  const [backupLoading, setBackupLoading] = useState(false)
  const [importLoading, setImportLoading] = useState(false)

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
        const assignments = data.assignments || []
        setStats(prev => ({ ...prev, assignments: assignments.length }))
        const counts = { pending: 0, in_progress: 0, completed: 0 }
        assignments.forEach((a: any) => {
          if (a.status === "pending") counts.pending++
          else if (a.status === "in_progress") counts.in_progress++
          else if (a.status === "completed") counts.completed++
        })
        setStatusCounts(counts)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleBackup = async () => {
    if (!confirm("Are you sure you want to backup the entire database? This may take a while.")) {
      return
    }
    setBackupLoading(true)
    try {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "backup" }),
        credentials: "include",
      })
      const data = await res.json()
      if (data.success) {
        alert("Database backed up successfully!")
      } else {
        alert(data.error || "Failed to backup database")
      }
    } catch (error) {
      console.error("Backup error:", error)
      alert("Failed to backup database")
    } finally {
      setBackupLoading(false)
    }
  }

  const handleImport = async () => {
    if (!confirm("Are you sure you want to import data? This will replace all existing data!")) {
      return
    }
    setImportLoading(true)
    try {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import" }),
        credentials: "include",
      })
      const data = await res.json()
      if (data.success) {
        alert("Database imported successfully!")
        fetchData()
      } else {
        alert(data.error || "Failed to import database")
      }
    } catch (error) {
      console.error("Import error:", error)
      alert("Failed to import database")
    } finally {
      setImportLoading(false)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ESBD Dashboard</h1>
          <p className="text-slate-500">Manage training content and assignments</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/esbd/manage-dropdowns"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium"
          >
            <ListChecks className="w-4 h-4 text-purple-600" />
            Manage Dropdowns
          </Link>
          <Link
            href="/esbd/engineer-info"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium"
          >
            <UserCog className="w-4 h-4 text-purple-600" />
            Engineer&apos;s Info
          </Link>
          <Button
            variant="outline"
            onClick={handleBackup}
            disabled={backupLoading}
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            {backupLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Database className="w-4 h-4 mr-2" />
            )}
            Backup
          </Button>
          <Button
            variant="outline"
            onClick={handleImport}
            disabled={importLoading}
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            {importLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Import Data
          </Button>
        </div>
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

      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Assignment Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Pending</CardTitle>
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{statusCounts.pending}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">In Progress</CardTitle>
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <PlayCircle className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{statusCounts.in_progress}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Completed</CardTitle>
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{statusCounts.completed}</div>
            </CardContent>
          </Card>
        </div>
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