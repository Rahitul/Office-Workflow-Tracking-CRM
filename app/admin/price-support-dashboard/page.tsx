"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import axios from "axios"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Calendar } from "lucide-react"

interface DailyEntry {
  _id: string
  projectClientName: string
  month: number
  year: number
  entryDate: string
  amountBDT: number
  gpMargin: number
  executiveName: string
  notes: string
}

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

export default function PriceSupportDashboardPage() {
  const [entries, setEntries] = useState<DailyEntry[]>([])

  const [month, setMonth] = useState("")
  const [year, setYear] = useState("")
  const [projectClientName, setProjectClientName] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const currentYear = new Date().getFullYear()
  const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(y => ({ value: y.toString(), label: y.toString() }))

  const fetchEntries = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (month) params.append("month", month)
      if (year) params.append("year", year)
      if (projectClientName) params.append("projectClientName", projectClientName)
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)

      const response = await axios.get(`/api/daily-price-supports?${params.toString()}`, { withCredentials: true })
      setEntries(response.data.entries || [])
    } catch (error) {
      console.error("Failed to fetch entries:", error)
    }
  }, [month, year, projectClientName, startDate, endDate])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

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

  const filteredEntriesForTable = useMemo(() => {
    const monthNum = month ? parseInt(month) : undefined
    const yearNum = year ? parseInt(year) : undefined

    return entries.filter(e => {
      if (monthNum && e.month !== monthNum) return false
      if (yearNum && e.year !== yearNum) return false
      if (projectClientName && e.projectClientName !== projectClientName) return false
      if (startDate && e.entryDate < startDate) return false
      if (endDate && e.entryDate > endDate) return false
      return true
    })
  }, [entries, month, year, projectClientName, startDate, endDate])

  const projectOptions = useMemo(() => {
    const uniqueProjects = [...new Set(entries.map(e => e.projectClientName))]
    return uniqueProjects.map(p => ({ value: p, label: p }))
  }, [entries])

  return (
    <div className="space-y-6 pb-12">
      <Card className="border-slate-200 shadow-lg bg-white">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
              <Label className="text-sm font-semibold text-slate-700">Project/Client Name</Label>
              <Select
                value={projectClientName}
                onChange={(e) => setProjectClientName(e.target.value)}
                options={[
                  { value: "", label: "All Projects" },
                  ...projectOptions
                ]}
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

      {filteredEntriesForTable.length > 0 ? (
        <Card className="border-slate-200 shadow-lg bg-white">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              Price Support Entries ({filteredEntriesForTable.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Month/Year</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Project/Client</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Executive</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Amount (BDT)</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">GP Margin</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntriesForTable.map((entry) => (
                    <tr key={entry._id} className="border-b border-slate-50">
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{entry.entryDate}</td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{formatMonthYear(entry.month, entry.year)}</td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{entry.projectClientName}</td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{entry.executiveName}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-emerald-600 text-right">
                        {formatAmount(entry.amountBDT)}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-slate-900 text-right">
                        {entry.gpMargin}%
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500 max-w-xs truncate">{entry.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200 shadow-lg bg-white">
          <CardContent className="p-12 text-center text-slate-500">
            No entries found
          </CardContent>
        </Card>
      )}
    </div>
  )
}