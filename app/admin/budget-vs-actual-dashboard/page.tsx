"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import axios from "axios"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Calendar, Filter, ArrowDown, ArrowUp } from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"

interface BudgetActual {
  _id: string
  field: string
  month: number
  year: number
  budgetAmount: number
}

interface BudgetActualEntry {
  _id: string
  field: string
  month: number
  year: number
  entryDate: string
  actualAmount: number
  notes: string
}

const FIELDS = [
  { value: "Sales", label: "Sales" },
  { value: "Collection/Fund Inflow", label: "Collection/Fund Inflow" },
  { value: "Import Product Budget LC/Duties/Documents", label: "Import Product Budget LC/Duties/Documents" },
  { value: "Local Purchase", label: "Local Purchase" },
  { value: "Salary & Allowances", label: "Salary & Allowances" },
  { value: "Financial Expenses", label: "Financial Expenses" },
  { value: "Supplier Payment", label: "Supplier Payment" },
  { value: "Admin Expenses", label: "Admin Expenses" },
  { value: "Inter Company Transaction", label: "Inter Company Transaction" },
  { value: "Regulatory Payment", label: "Regulatory Payment" },
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

export default function BudgetVsActualDashboardPage() {
  const [budgets, setBudgets] = useState<BudgetActual[]>([])
  const [entries, setEntries] = useState<BudgetActualEntry[]>([])
  
  const currentYear = new Date().getFullYear()
  const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(y => ({ value: y.toString(), label: y.toString() }))

  const [month, setMonth] = useState(String(new Date().getMonth() + 1))
  const [year, setYear] = useState(String(currentYear))
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedField, setSelectedField] = useState("")

  const fetchBudgets = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (month) params.append("month", month)
      if (year) params.append("year", year)
      if (selectedField) params.append("field", selectedField)
      
      const response = await axios.get(`/api/budget-actual?${params.toString()}`, { withCredentials: true })
      setBudgets(response.data.budgets || [])
    } catch (error) {
      console.error("Failed to fetch budgets:", error)
    }
  }, [month, year, selectedField])

  const fetchEntries = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (month) params.append("month", month)
      if (year) params.append("year", year)
      if (selectedField) params.append("field", selectedField)
      
      const response = await axios.get(`/api/budget-actual-entries?${params.toString()}`, { withCredentials: true })
      setEntries(response.data.entries || [])
    } catch (error) {
      console.error("Failed to fetch entries:", error)
    }
  }, [month, year, selectedField])

  useEffect(() => {
    fetchBudgets()
    fetchEntries()
  }, [fetchBudgets, fetchEntries])

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT" }).format(amount)
  }

  const formatMonthYear = (month: number, year: number) => {
    return `${MONTHS.find(m => parseInt(m.value) === month)?.label} ${year}`
  }

  const filteredBudgets = useMemo(() => {
    const monthNum = month ? parseInt(month) : undefined
    const yearNum = year ? parseInt(year) : undefined
    
    return budgets.filter(b => {
      if (monthNum && b.month !== monthNum) return false
      if (yearNum && b.year !== yearNum) return false
      return true
    })
  }, [budgets, month, year])

  const budgetProgress = useMemo(() => {
    const monthNum = month ? parseInt(month) : undefined
    const yearNum = year ? parseInt(year) : undefined

    return filteredBudgets.map(budget => {
      const filteredEntries = entries.filter(e => {
        if (monthNum && e.month !== monthNum) return false
        if (yearNum && e.year !== yearNum) return false
        if (startDate && e.entryDate < startDate) return false
        if (endDate && e.entryDate > endDate) return false
        return e.field === budget.field
      })
      
      const totalActual = filteredEntries.reduce((sum, e) => sum + e.actualAmount, 0)
      const percentage = budget.budgetAmount > 0 ? Math.round((totalActual / budget.budgetAmount) * 100) : 0

      return {
        ...budget,
        actual: totalActual,
        percentage,
      }
    })
  }, [filteredBudgets, entries, month, year, startDate, endDate])

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 100) return "text-emerald-600"
    if (percentage >= 70) return "text-amber-600"
    return "text-red-600"
  }

  const OUTFLOW_FIELDS = [
    "Import Product Budget LC/Duties/Documents",
    "Local Purchase",
    "Salary & Allowances",
    "Financial Expenses",
    "Supplier Payment",
    "Admin Expenses",
    "Inter Company Transaction",
    "Regulatory Payment",
  ]

  const { totalInflow, totalOutflow, surplus } = useMemo(() => {
    const monthNum = parseInt(month)
    const yearNum = parseInt(year)

    const monthYearEntries = entries.filter(e => e.month === monthNum && e.year === yearNum)

    const inflow = monthYearEntries
      .filter(e => e.field === "Collection/Fund Inflow")
      .reduce((sum, e) => sum + e.actualAmount, 0)

    const outflow = monthYearEntries
      .filter(e => OUTFLOW_FIELDS.includes(e.field))
      .reduce((sum, e) => sum + e.actualAmount, 0)

    return {
      totalInflow: inflow,
      totalOutflow: outflow,
      surplus: inflow - outflow,
    }
  }, [entries, month, year])

  const filteredEntries = useMemo(() => {
    const monthNum = month ? parseInt(month) : undefined
    const yearNum = year ? parseInt(year) : undefined
    
    return entries.filter(e => {
      if (monthNum && e.month !== monthNum) return false
      if (yearNum && e.year !== yearNum) return false
      if (startDate && e.entryDate < startDate) return false
      if (endDate && e.entryDate > endDate) return false
      return true
    })
  }, [entries, month, year, startDate, endDate])

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Budget VS Actual Dashboard</h1>
        <p className="text-slate-500">View budget vs actual progress with filters</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-200 shadow-lg bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Inflow</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{formatAmount(totalInflow)}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <ArrowDown className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">Collection/Fund Inflow</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-lg bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Outflow</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{formatAmount(totalOutflow)}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <ArrowUp className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">All Expenses</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-lg bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Surplus/(Shortfall)</p>
                <p className={`text-2xl font-bold mt-1 ${surplus >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {formatAmount(Math.abs(surplus))}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${surplus >= 0 ? "bg-emerald-100" : "bg-red-100"}`}>
                {surplus >= 0 ? (
                  <ArrowUp className="w-6 h-6 text-emerald-600" />
                ) : (
                  <ArrowDown className="w-6 h-6 text-red-600" />
                )}
              </div>
            </div>
            <p className={`text-xs mt-2 ${surplus >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {surplus >= 0 ? "Surplus" : "Shortfall"}
            </p>
          </CardContent>
        </Card>
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
              <Label className="text-sm font-semibold text-slate-700">Field</Label>
              <Select
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
                options={[{ value: "", label: "All Fields" }, ...FIELDS]}
                className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10"
              />
            </div>

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

      {budgetProgress.length > 0 && (
        <Card className="border-slate-200 shadow-lg bg-white">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              Progress Dashboard - {month && year ? formatMonthYear(parseInt(month), parseInt(year)) : "All Time"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {budgetProgress.map((item, idx) => {
                const pieData = [
                  { name: "Actual", value: item.actual },
                  { name: "Remaining", value: Math.max(0, item.budgetAmount - item.actual) },
                ]

                return (
                  <Card key={idx} className="border-slate-200 shadow-xl overflow-hidden group hover:ring-2 hover:ring-amber-500/20 transition-all bg-white rounded-2xl">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-800 text-lg">{item.field}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <TrendingUp className={`h-4 w-4 ${item.percentage >= 100 ? 'text-emerald-500' : item.percentage >= 70 ? 'text-amber-500' : 'text-red-500'}`} />
                        </div>
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
                          <span className="text-slate-400">Actual:</span>
                          <span className="text-emerald-600">{formatAmount(item.actual)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-400">Budget:</span>
                          <span className="text-slate-900">{formatAmount(item.budgetAmount)}</span>
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

      {filteredEntries.length > 0 && (
        <Card className="border-slate-200 shadow-lg bg-white">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              Entries ({filteredEntries.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Field</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Month/Year</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Amount (BDT)</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr key={entry._id} className="border-b border-slate-50">
                      <td className="py-3 px-4">
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                          {entry.field}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{formatMonthYear(entry.month, entry.year)}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{entry.entryDate}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-emerald-600 text-right">
                        {formatAmount(entry.actualAmount)}
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