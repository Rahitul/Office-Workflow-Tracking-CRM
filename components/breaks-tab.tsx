"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Loader2, Search, Coffee } from "lucide-react"

interface UserData {
  _id: string
  name: string
  email: string
  role: string
}

interface BreakRecordData {
  _id: string
  userId: { _id: string; name: string; email: string; role: string }
  completedTaskId: { _id: string; customerName: string; problem: string; taskId: string }
  breakNumber: number
  startedAt: string
  endedAt?: string
  durationSeconds?: number
  date: string
}

function formatDuration(seconds?: number): string {
  if (!seconds && seconds !== 0) return "—"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
}

export default function BreaksTab({ users }: { users: UserData[] }) {
  const [breaks, setBreaks] = useState<BreakRecordData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1))
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()))
  const [filterUserId, setFilterUserId] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    const fetchBreaks = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ month: selectedMonth, year: selectedYear })
        if (filterUserId) params.set("userId", filterUserId)
        const res = await fetch(`/api/breaks?${params}`, { credentials: "include" })
        const data = await res.json()
        if (data.success) setBreaks(data.data)
      } catch (error) {
        console.error("Error fetching breaks:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchBreaks()
  }, [selectedMonth, selectedYear, filterUserId])

  const filteredBreaks = useMemo(() => {
    let result = breaks
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((b) => {
        const userName = (b.userId?.name || "").toLowerCase()
        const taskName = (b.completedTaskId?.customerName || "").toLowerCase()
        const taskId = (b.completedTaskId?.taskId || "").toLowerCase()
        return userName.includes(q) || taskName.includes(q) || taskId.includes(q)
      })
    }
    if (startDate) result = result.filter((b) => b.date >= startDate)
    if (endDate) result = result.filter((b) => b.date <= endDate)
    return result
  }, [breaks, search, startDate, endDate])

  const userSummary = useMemo(() => {
    const map: Record<string, { name: string; count: number; totalSeconds: number }> = {}
    for (const b of filteredBreaks) {
      const uid = b.userId?._id || "unknown"
      const name = b.userId?.name || "Unknown"
      if (!map[uid]) map[uid] = { name, count: 0, totalSeconds: 0 }
      map[uid].count++
      map[uid].totalSeconds += b.durationSeconds || 0
    }
    return Object.values(map).sort((a, b) => b.totalSeconds - a.totalSeconds)
  }, [filteredBreaks])

  const totalBreaks = filteredBreaks.length
  const totalSeconds = filteredBreaks.reduce((sum, b) => sum + (b.durationSeconds || 0), 0)

  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i))
  const months = [
    { value: "1", label: "January" }, { value: "2", label: "February" }, { value: "3", label: "March" },
    { value: "4", label: "April" }, { value: "5", label: "May" }, { value: "6", label: "June" },
    { value: "7", label: "July" }, { value: "8", label: "August" }, { value: "9", label: "September" },
    { value: "10", label: "October" }, { value: "11", label: "November" }, { value: "12", label: "December" },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-40" options={months.map((m) => ({ value: m.value, label: m.label }))} />
        <Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-24" options={years.map((y) => ({ value: y, label: y }))} />
        <Select value={filterUserId} onChange={(e) => setFilterUserId(e.target.value)} className="w-48" options={[{ value: "", label: "All Engineers" }, ...users.map((u) => ({ value: u._id, label: u.name }))]} />
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-44" placeholder="Start date" />
        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-44" placeholder="End date" />
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search breaks..." className="pl-9" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
      ) : filteredBreaks.length === 0 ? (
        <Card><CardContent className="py-16"><div className="text-center"><Coffee className="w-12 h-12 mx-auto text-slate-300 mb-3" /><p className="text-slate-500">No breaks found</p></div></CardContent></Card>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 font-medium text-slate-600">#</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-600">Engineer</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-600">Task</th>
                  <th className="text-center py-2 px-3 font-medium text-slate-600">Break #</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-600">Date</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-600">Started</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-600">Ended</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-600">Duration</th>
                </tr>
              </thead>
              <tbody>
                {filteredBreaks.map((b, idx) => (
                  <tr key={b._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                    <td className="py-2 px-3">
                      <div className="font-medium text-slate-900">{b.userId?.name || "—"}</div>
                      <div className="text-xs text-slate-500">{b.userId?.email || ""}</div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="text-slate-900">{b.completedTaskId?.customerName || "—"}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[200px]">{b.completedTaskId?.problem || ""}</div>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">{b.breakNumber}</span>
                    </td>
                    <td className="py-2 px-3 text-slate-700">{b.date}</td>
                    <td className="py-2 px-3 text-slate-700">{formatTime(b.startedAt)}</td>
                    <td className="py-2 px-3 text-slate-700">{b.endedAt ? formatTime(b.endedAt) : <span className="text-amber-600 font-medium">Active</span>}</td>
                    <td className="py-2 px-3 text-right font-medium text-slate-900">{formatDuration(b.durationSeconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-900">Summary</h4>
                <div className="flex gap-6 text-sm">
                  <span className="text-slate-600">Total Breaks: <span className="font-bold text-slate-900">{totalBreaks}</span></span>
                  <span className="text-slate-600">Total Duration: <span className="font-bold text-slate-900">{formatDuration(totalSeconds)}</span></span>
                </div>
              </div>
              {userSummary.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {userSummary.map((u) => (
                    <div key={u.name} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm">
                      <span className="font-medium text-slate-900">{u.name}</span>
                      <span className="text-slate-500">—</span>
                      <span className="text-amber-700 font-semibold">{u.count} break{u.count !== 1 ? "s" : ""}</span>
                      <span className="text-slate-500">—</span>
                      <span className="font-semibold text-slate-900">{formatDuration(u.totalSeconds)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
