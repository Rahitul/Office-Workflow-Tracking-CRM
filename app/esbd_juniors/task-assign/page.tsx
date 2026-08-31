"use client"

import { useState } from "react"
import { useAuthStore } from "@/store/authStore"
import { RefreshCw, List } from "lucide-react"
import ServiceTaskList from "@/components/service-task-list"

export default function EsbdJuniorsTaskListPage() {
  const { user } = useAuthStore()
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <List className="w-6 h-6" />
            Call/Case List
          </h1>
          <p className="text-slate-500">View your assigned service calls/cases</p>
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors border border-slate-200 rounded-lg hover:bg-slate-50"
          title="Refresh list"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>
      {user && <ServiceTaskList refreshKey={refreshKey} userId={user._id} />}
    </div>
  )
}
