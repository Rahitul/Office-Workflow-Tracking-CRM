"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { ClipboardList, Flag, Loader2, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { TaskCard, gapPairs, getMinutesGap } from "@/components/service-task-list"
import type { TaskData } from "@/components/service-task-list"

const statusOrder = ["Assigned", "Acknowledge", "Travel Started", "Checked In", "Checklist Submitted", "Completed"]

export default function AdminServiceTasksPage() {
  const [tasks, setTasks] = useState<TaskData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [callTypeFilter, setCallTypeFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [engineerSearch, setEngineerSearch] = useState("")
  const [engineerFilter, setEngineerFilter] = useState("")
  const [engineerDropdownOpen, setEngineerDropdownOpen] = useState(false)
  const engineerRef = useRef<HTMLDivElement>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("")

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (engineerRef.current && !engineerRef.current.contains(e.target as Node)) setEngineerDropdownOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const uniqueEngineers = useMemo(() => {
    const map = new Map<string, { _id: string; name: string }>()
    tasks.forEach((t) => {
      if (t.assignedEngineer?._id) map.set(t.assignedEngineer._id, { _id: t.assignedEngineer._id, name: t.assignedEngineer.name })
    })
    return Array.from(map.values())
  }, [tasks])

  const filteredEngineers = uniqueEngineers.filter((e) =>
    e.name.toLowerCase().includes(engineerSearch.toLowerCase())
  )

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/service-tasks", { credentials: "include" })
      const data = await res.json()
      if (data.success) setTasks(data.data)
    } catch (error) {
      console.error("Error fetching tasks:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchSearch = !search || task.customerName.toLowerCase().includes(search.toLowerCase()) || task.taskId.toLowerCase().includes(search.toLowerCase()) || task.deviceModel.toLowerCase().includes(search.toLowerCase()) || (task.productCategory || "").toLowerCase().includes(search.toLowerCase()) || (task.productType || "").toLowerCase().includes(search.toLowerCase())
      const matchStatus = !statusFilter || task.status === statusFilter
      const matchCallType = !callTypeFilter || task.callType === callTypeFilter
      const matchCategory = !categoryFilter || task.customerCategory === categoryFilter
      const taskDate = new Date(task.createdAt)
      const matchStart = !startDate || taskDate >= new Date(startDate)
      const matchEnd = !endDate || taskDate <= new Date(endDate + "T23:59:59")
      const matchEngineer = !engineerFilter || task.assignedEngineer?.name === engineerFilter
      return matchSearch && matchStatus && matchCallType && matchCategory && matchStart && matchEnd && matchEngineer
    })
  }, [tasks, search, statusFilter, callTypeFilter, categoryFilter, startDate, endDate, engineerFilter])

  const combinedHealth = useMemo(() => {
    let totalScore = 0
    let count = 0
    let onTime = 0
    let slightlyOver = 0
    let overTime = 0
    let noData = 0
    const onTimeIds: string[] = []
    const slightlyOverIds: string[] = []
    const overTimeIds: string[] = []
    const noDataIds: string[] = []
    for (const task of filteredTasks) {
      let taskScore = 0
      let taskCount = 0
      for (const pair of gapPairs) {
        function taskTs(f: string): string | undefined {
          if (f === "createdAt") return task.createdAt
          if (f === "acknowledgedAt") return task.acknowledgedAt
          if (f === "travelStartedAt") return task.travelStartedAt
          if (f === "checkedInAt") return task.checkedInAt
          if (f === "checklistSubmittedAt") return task.checklistSubmittedAt
          if (f === "completedAt") return task.completedAt
          return undefined
        }
        function taskGap(f: string): string {
          if (f === "gapAssignedToAcknowledge") return task.gapAssignedToAcknowledge
          if (f === "gapAcknowledgeToTravelStarted") return task.gapAcknowledgeToTravelStarted
          if (f === "gapTravelStartedToCheckedIn") return task.gapTravelStartedToCheckedIn
          if (f === "gapCheckedInToChecklistSubmitted") return task.gapCheckedInToChecklistSubmitted
          if (f === "gapChecklistSubmittedToCompleted") return task.gapChecklistSubmittedToCompleted
          return ""
        }
        const fromTs = pair.fromTs === "createdAt" ? task.createdAt : taskTs(pair.fromTs)
        const toTs = taskTs(pair.toTs)
        if (!fromTs || !toTs) continue
        const actualMin = (new Date(toTs).getTime() - new Date(fromTs).getTime()) / 60000
        const estimatedMin = getMinutesGap(taskGap(pair.field))
        if (estimatedMin === 0) continue
        const gapScore = actualMin <= estimatedMin ? 0 : actualMin <= estimatedMin + 30 ? 0.5 : 1
        taskScore += gapScore
        taskCount++
      }
      if (taskCount === 0) { noData++; noDataIds.push(task._id); continue }
      const avg = taskScore / taskCount
      if (avg === 0) { onTime++; onTimeIds.push(task._id) }
      else if (avg <= 0.5) { slightlyOver++; slightlyOverIds.push(task._id) }
      else { overTime++; overTimeIds.push(task._id) }
      totalScore += avg
      count++
    }
    const hue = count === 0 ? 220 : 120 - (totalScore / count) * 120
    return {
      color: count === 0 ? "rgb(148,163,184)" : `hsl(${hue}, 90%, 40%)`,
      onTime, slightlyOver, overTime, noData, total: filteredTasks.length,
      onTimeIds, slightlyOverIds, overTimeIds, noDataIds,
    }
  }, [filteredTasks])

  const categoryTaskIds = useMemo(() => {
    if (!selectedCategory) return null
    const map: Record<string, string[]> = {
      "On-time": combinedHealth.onTimeIds,
      "Slightly over": combinedHealth.slightlyOverIds,
      "Over time": combinedHealth.overTimeIds,
      "No data": combinedHealth.noDataIds,
    }
    return map[selectedCategory]
  }, [selectedCategory, combinedHealth])

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Service Calls/Cases</h1>
        <p className="text-slate-500">View all service calls/cases across all engineers</p>
      </div>

      <Card>
        <CardContent className="py-4 flex items-center gap-3">
          <Flag style={{ color: combinedHealth.color }} fill="currentColor" className="w-8 h-8 shrink-0" />
          <p className="text-sm font-semibold text-slate-700">Combined Status</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "On-time", count: combinedHealth.onTime, color: "rgb(34,197,94)" },
          { label: "Slightly over", count: combinedHealth.slightlyOver, color: "rgb(234,179,8)" },
          { label: "Over time", count: combinedHealth.overTime, color: "rgb(239,68,68)" },
          { label: "No data", count: combinedHealth.noData, color: "rgb(148,163,184)" },
        ].map((stat) => (
          <Card key={stat.label} className={cn("cursor-pointer transition-shadow", selectedCategory === stat.label ? "ring-2 ring-blue-500 shadow-md" : "hover:shadow-sm")} onClick={() => setSelectedCategory(selectedCategory === stat.label ? "" : stat.label)}>
            <CardContent className="py-3 flex items-center gap-2">
              <Flag style={{ color: stat.color }} fill="currentColor" className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-lg font-bold text-slate-800">{stat.count}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by customer, call/case ID, or model..." className="pl-9" />
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={[
              { value: "", label: "All Statuses" },
              ...statusOrder.map((s) => ({ value: s, label: s })),
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div ref={engineerRef} className="relative w-full sm:w-48">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={engineerSearch}
              onChange={(e) => { setEngineerSearch(e.target.value); setEngineerDropdownOpen(true); if (engineerFilter) setEngineerFilter("") }}
              onFocus={() => setEngineerDropdownOpen(true)}
              placeholder={engineerFilter || "All Engineers"}
              className="pl-9 pr-9"
            />
            {engineerFilter && (
              <button type="button" onClick={() => { setEngineerFilter(""); setEngineerSearch("") }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {engineerDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              <button type="button" onClick={() => { setEngineerFilter(""); setEngineerSearch(""); setEngineerDropdownOpen(false) }} className={cn("w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors", !engineerFilter ? "bg-blue-50 text-blue-700" : "text-gray-900")}>All Engineers</button>
              {filteredEngineers.map((eng) => (
                <button key={eng._id} type="button" onClick={() => { setEngineerFilter(eng.name); setEngineerSearch(eng.name); setEngineerDropdownOpen(false) }} className={cn("w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors", engineerFilter === eng.name ? "bg-blue-50 text-blue-700" : "text-gray-900")}>{eng.name}</button>
              ))}
            </div>
          )}
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={[
              { value: "", label: "All Call Types" },
              { value: "Regular Service", label: "Regular Service" },
              { value: "Standby Support", label: "Standby Support" },
              { value: "Estimated Work", label: "Estimated Work" },
              { value: "Installation", label: "Installation" },
              { value: "Recheck", label: "Recheck" },
              { value: "Post Estimated Support", label: "Post Estimated Support" },
              { value: "Monthly", label: "Monthly" },
              { value: "Demo", label: "Demo" },
              { value: "Repeat", label: "Repeat" },
              { value: "Meeting", label: "Meeting" },
              { value: "Follow up call", label: "Follow up call" },
              { value: "Document Submission", label: "Document Submission" },
              { value: "Toner Delivery", label: "Toner Delivery" },
              { value: "Tour", label: "Tour" },
              { value: "Others", label: "Others" },
            ]}
            value={callTypeFilter}
            onChange={(e) => setCallTypeFilter(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={[
              { value: "", label: "All Categories" },
              { value: "Warranty", label: "Warranty" },
              { value: "AMC", label: "AMC" },
              { value: "Call Basis", label: "Call Basis" },
              { value: "Key Customer/Regular", label: "Key Customer/Regular" },
              { value: "Irregular", label: "Irregular" },
              { value: "New Comer", label: "New Comer" },
              { value: "Others", label: "Others" },
            ]}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-44">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="Start date" />
        </div>
        <div className="w-full sm:w-44">
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="End date" />
        </div>
      </div>

      {(() => {
        const displayedTasks = categoryTaskIds ? filteredTasks.filter((t) => categoryTaskIds.includes(t._id)) : filteredTasks
        if (displayedTasks.length === 0) {
          return <Card><CardContent className="py-16"><div className="text-center"><ClipboardList className="w-12 h-12 mx-auto text-slate-300 mb-3" /><p className="text-slate-500">No calls/cases match your filters</p></div></CardContent></Card>
        }
        return <div className="space-y-4">
          {displayedTasks.map((task) => (
            <TaskCard key={task._id} task={task} userId="" onStatusChange={fetchTasks} />
          ))}
        </div>
      })()}
    </div>
  )
}
