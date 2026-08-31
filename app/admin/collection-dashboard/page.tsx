"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import axios from "axios"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Calendar, Filter } from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"

interface SalesUser {
  _id: string
  name: string
  email: string
}

interface CollectionTarget {
  _id: string
  targetType: string
  targetId: string
  targetName: string
  month: number
  year: number
  amountBDT: number
}

interface DailyEntry {
  _id: string
  collectionTargetId: string
  targetType: string
  targetId: string
  targetName: string
  month: number
  year: number
  entryDate: string
  amountBDT: number
  notes: string
}

const DEPARTMENT_OPTIONS = [
  { value: "workshop-dept", label: "Workshop Department-ESBD" },
  { value: "eid", label: "EID" },
  { value: "consumable-dept", label: "Consumable Department" },
  { value: "raisd", label: "RAISD" },
]

const BRANCH_OPTIONS = [
  { value: "bogura", label: "Bogura" },
  { value: "khulna", label: "Khulna" },
  { value: "chittagong", label: "Chittagong" },
  { value: "sylhet", label: "Sylhet" },
]

const TARGET_TYPE_OPTIONS = [
  { value: "department", label: "Department" },
  { value: "branch", label: "Branch" },
  { value: "salesman", label: "Salesman" },
  { value: "company", label: "Company" },
]

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
]

export default function CollectionDashboardPage() {
  const [targets, setTargets] = useState<CollectionTarget[]>([])
  const [entries, setEntries] = useState<DailyEntry[]>([])
  
  const [month, setMonth] = useState("")
  const [year, setYear] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const currentYear = new Date().getFullYear()
  const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(y => ({ value: y.toString(), label: y.toString() }))

  const fetchTargets = useCallback(async () => {
    try {
      const response = await axios.get("/api/collection-targets", { withCredentials: true })
      setTargets(response.data.targets || [])
    } catch (error) {
      console.error("Failed to fetch targets:", error)
    }
  }, [])

  const fetchEntries = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (month) params.append("month", month)
      if (year) params.append("year", year)
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)
      
      const response = await axios.get(`/api/daily-collections?${params.toString()}`, { withCredentials: true })
      setEntries(response.data.entries || [])
    } catch (error) {
      console.error("Failed to fetch entries:", error)
    }
  }, [month, year, startDate, endDate])

  useEffect(() => {
    fetchTargets()
    fetchEntries()
  }, [fetchTargets, fetchEntries])

  useEffect(() => {
    if (!month) {
      setMonth((new Date().getMonth() + 1).toString())
    }
    if (!year) {
      setYear(currentYear.toString())
    }
  }, [])

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT" }).format(amount)
  }

  const formatMonthYear = (month: number, year: number) => {
    return `${MONTHS.find(m => parseInt(m.value) === month)?.label} ${year}`
  }

  const filteredTargets = useMemo(() => {
    const monthNum = month ? parseInt(month) : undefined
    const yearNum = year ? parseInt(year) : undefined
    
    return targets.filter(t => {
      if (monthNum && t.month !== monthNum) return false
      if (yearNum && t.year !== yearNum) return false
      return true
    })
  }, [targets, month, year])

  const targetProgress = useMemo(() => {
    const monthNum = month ? parseInt(month) : undefined
    const yearNum = year ? parseInt(year) : undefined

    return filteredTargets.map(target => {
      const filteredEntries = entries.filter(e => {
        if (monthNum && e.month !== monthNum) return false
        if (yearNum && e.year !== yearNum) return false
        if (startDate && e.entryDate < startDate) return false
        if (endDate && e.entryDate > endDate) return false
        return e.targetId === target.targetId
      })
      
      const totalAchieved = filteredEntries.reduce((sum, e) => sum + e.amountBDT, 0)
      const percentage = target.amountBDT > 0 ? Math.round((totalAchieved / target.amountBDT) * 100) : 0

      return {
        ...target,
        achieved: totalAchieved,
        percentage,
      }
    })
  }, [filteredTargets, entries, month, year, startDate, endDate])

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 100) return "text-emerald-600"
    if (percentage >= 70) return "text-amber-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Collection Dashboard</h1>
        <p className="text-slate-500">View collection progress and entries with filters</p>
      </div>

      <Card className="border-slate-200 shadow-lg bg-white">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-amber-600" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Month</Label>
              <Select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                options={MONTHS}
                className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Year</Label>
              <Select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                options={YEARS}
                className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {targetProgress.length > 0 && (
        <Card className="border-slate-200 shadow-lg bg-white">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              Progress Dashboard - {month && year ? formatMonthYear(parseInt(month), parseInt(year)) : "All Time"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {targetProgress.map((item, idx) => {
                const pieData = [
                  { name: "Achieved", value: item.achieved },
                  { name: "Remaining", value: Math.max(0, item.amountBDT - item.achieved) },
                ]

                return (
                  <Card key={idx} className="border-slate-200 shadow-xl overflow-hidden group hover:ring-2 hover:ring-amber-500/20 transition-all bg-white rounded-2xl">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 capitalize text-xs">
                            {item.targetType}
                          </Badge>
                        </div>
                        <div className="flex flex-col items-end">
                          <TrendingUp className={`h-4 w-4 ${item.percentage >= 100 ? 'text-emerald-500' : item.percentage >= 70 ? 'text-amber-500' : 'text-red-500'}`} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <span className="font-bold text-slate-800 text-lg">{item.targetName}</span>
                      </div>

                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={35}
                              outerRadius={60}
                              paddingAngle={5}
                              dataKey="value"
                              stroke="none"
                            >
                              <Cell fill="#10b981" />
                              <Cell fill="#f59e0b" />
                            </Pie>
                            <Tooltip 
                              formatter={(value) => formatAmount(Number(value))}
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="mt-2 space-y-2 text-center">
                        <div className="space-y-1 pt-3 border-t border-slate-50">
                          <p className={`text-3xl font-black ${getPercentageColor(item.percentage)}`}>
                            {item.percentage}%
                          </p>
                          <p className="text-xs font-medium text-slate-400">Achievement</p>
                        </div>
                        <div className="flex justify-between text-xs font-bold pt-2 border-t border-slate-50">
                          <span className="text-slate-400">Achieved:</span>
                          <span className="text-emerald-600">{formatAmount(item.achieved)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-400">Target:</span>
                          <span className="text-slate-900">{formatAmount(item.amountBDT)}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {entries.length > 0 && (
        <Card className="border-slate-200 shadow-lg bg-white">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              Entries ({entries.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Type</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Target</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Month/Year</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Amount (BDT)</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry._id} className="border-b border-slate-50">
                      <td className="py-3 px-4">
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 capitalize text-xs">
                          {entry.targetType}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{entry.targetName}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{formatMonthYear(entry.month, entry.year)}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{entry.entryDate}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-emerald-600 text-right">
                        {formatAmount(entry.amountBDT)}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500 max-w-xs truncate">{entry.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}