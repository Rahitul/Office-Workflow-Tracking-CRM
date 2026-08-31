"use client"

import { useEffect, useState, useCallback } from "react"
import axios from "axios"
import { Card, CardContent } from "@/components/ui/card"
import { GraduationCap, CheckCircle, ListChecks, Users } from "lucide-react"
import Link from "next/link"

export default function ServiceDashboardPage() {
  const [stats, setStats] = useState({
    assigned: 0,
    completed: 0,
  })

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get("/api/training-assignments", { withCredentials: true })
      const assignments = response.data.assignments || []
      setStats({
        assigned: assignments.length,
        completed: assignments.filter((a: { status: string }) => a.status === "completed").length,
      })
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Service Dashboard</h1>
        <p className="text-slate-500">View and complete assigned trainings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-slate-200 shadow-lg bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Assigned Trainings</p>
                <p className="text-3xl font-bold text-slate-900">{stats.assigned}</p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-lg bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Completed</p>
                <p className="text-3xl font-bold text-slate-900">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/service/manage-dropdowns"
          className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-medium text-slate-700 hover:border-teal-300 hover:text-teal-700 transition-colors"
        >
          <ListChecks className="w-5 h-5 text-teal-600" />
          Manage Dropdowns
        </Link>
        <Link
          href="/service/engineer-info"
          className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-medium text-slate-700 hover:border-teal-300 hover:text-teal-700 transition-colors"
        >
          <Users className="w-5 h-5 text-teal-600" />
          Engineer&apos;s Info
        </Link>
      </div>
    </div>
  )
}