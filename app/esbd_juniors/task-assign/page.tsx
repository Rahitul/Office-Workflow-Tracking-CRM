"use client"

import { useState } from "react"
import { useAuthStore } from "@/store/authStore"
import { RefreshCw, List, TableProperties } from "lucide-react"
import ServiceTaskList from "@/components/service-task-list"
import { cn } from "@/lib/utils"

type TabType = "list" | "status"

export default function EsbdJuniorsTaskListPage() {
  const { user } = useAuthStore()
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState<TabType>("list")

  const tabs = [
    { id: "list" as TabType, label: "Call/Case List", icon: List },
    { id: "status" as TabType, label: "Status", icon: TableProperties },
  ]

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
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn("flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors relative", activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300")}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      {user && activeTab === "list" && <ServiceTaskList refreshKey={refreshKey} userId={user._id} allowDragReorder={false} showActionButtons={false} />}
      {user && activeTab === "status" && <ServiceTaskList refreshKey={refreshKey} userId={user._id} statusView allowDragReorder={false} showActionButtons={false} />}
    </div>
  )
}
