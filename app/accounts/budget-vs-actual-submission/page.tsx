"use client"

import { useEffect, useState, useMemo } from "react"
import axios from "axios"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { CheckCircle, AlertCircle, TrendingUp, Calendar, Banknote, ArrowDown, ArrowUp, Minus, Pencil, Trash2 } from "lucide-react"
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

export default function BudgetVsActualSubmissionPage() {
  const [loading, setLoading] = useState(false)
  const [budgets, setBudgets] = useState<BudgetActual[]>([])
  const [entries, setEntries] = useState<BudgetActualEntry[]>([])
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  
  const [field, setField] = useState("")
  const [actualAmount, setActualAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState("")
  const [editNotes, setEditNotes] = useState("")

  const currentYear = new Date().getFullYear()
  const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(y => ({ value: y.toString(), label: y.toString() }))

  const [month, setMonth] = useState(String(new Date().getMonth() + 1))
  const [year, setYear] = useState(String(currentYear))
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0])

  useEffect(() => {
    fetchBudgets()
    fetchEntries()
  }, [])

  const fetchBudgets = async () => {
    try {
      const response = await axios.get("/api/budget-actual", { withCredentials: true })
      setBudgets(response.data.budgets || [])
    } catch (error) {
      console.error("Failed to fetch budgets:", error)
    }
  }

  const fetchEntries = async () => {
    try {
      const response = await axios.get("/api/budget-actual-entries", { withCredentials: true })
      setEntries(response.data.entries || [])
    } catch (error) {
      console.error("Failed to fetch entries:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    if (!field || !month || !year || !entryDate || !actualAmount) {
      setErrorMessage("All fields are required")
      return
    }

    setLoading(true)

    try {
      const monthNum = parseInt(month)
      const yearNum = parseInt(year)

      await axios.post("/api/budget-actual-entries", {
        field,
        month: monthNum,
        year: yearNum,
        entryDate,
        actualAmount: parseFloat(actualAmount),
        notes,
      }, { withCredentials: true })

      setSuccessMessage(`Actual amount added successfully for ${field}`)
      setActualAmount("")
      setNotes("")
      setEntryDate(new Date().toISOString().split("T")[0])
      fetchEntries()
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } }
      setErrorMessage(err.response?.data?.error || "Failed to add actual amount")
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT" }).format(amount)
  }

  const formatMonthYear = (month: number, year: number) => {
    return `${MONTHS.find(m => parseInt(m.value) === month)?.label} ${year}`
  }

  const handleEdit = (entry: BudgetActualEntry) => {
    setEditingId(entry._id)
    setEditAmount(entry.actualAmount.toString())
    setEditNotes(entry.notes || "")
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return
    try {
      await axios.delete(`/api/budget-actual-entries/${id}`, { withCredentials: true })
      fetchEntries()
    } catch (error) {
      console.error("Failed to delete entry:", error)
    }
  }

  const handleSaveEdit = async (id: string) => {
    try {
      await axios.put(`/api/budget-actual-entries/${id}`, { actualAmount: parseFloat(editAmount), notes: editNotes }, { withCredentials: true })
      setEditingId(null)
      fetchEntries()
    } catch (error) {
      console.error("Failed to update entry:", error)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditAmount("")
    setEditNotes("")
  }

  const filteredBudgets = useMemo(() => {
    const monthNum = parseInt(month)
    const yearNum = parseInt(year)
    return budgets.filter(b => b.month === monthNum && b.year === yearNum)
  }, [budgets, month, year])

  const budgetProgress = useMemo(() => {
    const monthNum = parseInt(month)
    const yearNum = parseInt(year)

    return filteredBudgets.map(budget => {
      const budgetEntries = entries.filter(e => 
        e.field === budget.field &&
        e.month === monthNum && 
        e.year === yearNum
      )
      
      const totalActual = budgetEntries.reduce((sum, e) => sum + e.actualAmount, 0)
      const percentage = budget.budgetAmount > 0 ? Math.round((totalActual / budget.budgetAmount) * 100) : 0

      return {
        ...budget,
        actual: totalActual,
        percentage,
      }
    })
  }, [filteredBudgets, entries, month, year])

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

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Budget VS Actual Submission</h1>
        <p className="text-slate-500">Submit actual amounts for each field</p>
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
            <Banknote className="w-5 h-5 text-amber-600" />
            Add Actual Amount
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {successMessage && (
              <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700">
                <CheckCircle className="w-5 h-5" />
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-5 h-5" />
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Field</Label>
                <Select
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  options={FIELDS}
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
                <Label className="text-sm font-semibold text-slate-700">Entry Date</Label>
                <Input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Actual Amount (BDT)</Label>
                <Input
                  type="number"
                  value={actualAmount}
                  onChange={(e) => setActualAmount(e.target.value)}
                  placeholder="Enter actual amount"
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Notes (Optional)</Label>
                <Input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes"
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10"
                />
              </div>

              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={loading || !field || !month || !year || !entryDate || !actualAmount}
                  className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {loading ? "Saving..." : "Add Entry"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {budgetProgress.length > 0 && (
        <Card className="border-slate-200 shadow-lg bg-white">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              Progress Dashboard - {formatMonthYear(parseInt(month), parseInt(year))}
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
                        <div className="flex justify-center gap-2 mt-3 pt-3 border-t border-slate-50">
                          <Button
                            onClick={() => {
                              setEditingId(item._id + "-budget")
                              setEditAmount(item.budgetAmount.toString())
                            }}
                            className="h-7 px-2 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                          >
                            <Pencil className="h-3 w-3 mr-1" /> Edit
                          </Button>
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
              Recent Entries ({entries.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Field</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Amount (BDT)</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Notes</th>
                    <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.slice(0, 10).map((entry) => (
                    <tr key={entry._id} className="border-b border-slate-50">
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{entry.field}</td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{entry.entryDate}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-emerald-600 text-right">
                        {editingId === entry._id ? (
                          <Input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-24 h-8 text-right"
                          />
                        ) : (
                          formatAmount(entry.actualAmount)
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500 max-w-xs truncate">
                        {editingId === entry._id ? (
                          <Input
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="h-8"
                          />
                        ) : (
                          entry.notes || "-"
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {editingId === entry._id ? (
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              onClick={() => handleSaveEdit(entry._id)}
                              className="h-8 px-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              Save
                            </Button>
                            <Button
                              onClick={handleCancelEdit}
                              className="h-8 px-2 bg-slate-400 hover:bg-slate-500 text-white"
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              onClick={() => handleEdit(entry)}
                              className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(entry._id)}
                              className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </td>
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