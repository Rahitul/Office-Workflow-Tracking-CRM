"use client"

import { useEffect, useState, useMemo } from "react"
import axios from "axios"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Target, CheckCircle, AlertCircle, ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react"

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

export default function BudgetVsActualSettingPage() {
  const [loading, setLoading] = useState(false)
  const [existingBudgets, setExistingBudgets] = useState<BudgetActual[]>([])
  const [entries, setEntries] = useState<BudgetActualEntry[]>([])
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  
  const [field, setField] = useState("")
  const [budgetAmount, setBudgetAmount] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState("")

  const currentYear = new Date().getFullYear()
  const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(y => ({ value: y.toString(), label: y.toString() }))

  const [month, setMonth] = useState(String(new Date().getMonth() + 1))
  const [year, setYear] = useState(String(currentYear))

  useEffect(() => {
    fetchExistingBudgets()
    fetchEntries()
  }, [])

  const fetchExistingBudgets = async () => {
    try {
      const response = await axios.get("/api/budget-actual", { withCredentials: true })
      setExistingBudgets(response.data.budgets || [])
    } catch (error) {
      console.error("Failed to fetch budget actual:", error)
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

    if (!field || !month || !year || !budgetAmount) {
      setErrorMessage("All fields are required")
      return
    }

    setLoading(true)

    try {
      await axios.post("/api/budget-actual", {
        field,
        month: parseInt(month),
        year: parseInt(year),
        budgetAmount: parseFloat(budgetAmount),
      }, { withCredentials: true })

      setSuccessMessage(`Budget set successfully for ${field} - ${MONTHS.find(m => parseInt(m.value) === parseInt(month))?.label} ${year}`)
      setBudgetAmount("")
      fetchExistingBudgets()
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } }
      setErrorMessage(err.response?.data?.error || "Failed to set budget")
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

  const handleEdit = (budget: BudgetActual) => {
    setEditingId(budget._id)
    setEditAmount(budget.budgetAmount.toString())
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this budget?")) return
    try {
      await axios.delete(`/api/budget-actual/${id}`, { withCredentials: true })
      fetchExistingBudgets()
    } catch (error) {
      console.error("Failed to delete budget:", error)
    }
  }

  const handleSaveEdit = async (id: string) => {
    try {
      await axios.put(`/api/budget-actual/${id}`, { budgetAmount: parseFloat(editAmount) }, { withCredentials: true })
      setEditingId(null)
      fetchExistingBudgets()
    } catch (error) {
      console.error("Failed to update budget:", error)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditAmount("")
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
    const monthNum = month ? parseInt(month) : new Date().getMonth() + 1
    const yearNum = year ? parseInt(year) : currentYear

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
  }, [entries, month, year, currentYear])

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Budget VS Actual Setting</h1>
        <p className="text-slate-500">Set monthly budget for each field</p>
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
            <Target className="w-5 h-5 text-amber-600" />
            New Budget Setting
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
                <Label className="text-sm font-semibold text-slate-700">Budget Amount (BDT)</Label>
                <Input
                  type="number"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  placeholder="Enter budget amount"
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10"
                />
              </div>

              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={loading || !field || !month || !year || !budgetAmount}
                  className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {loading ? "Setting Budget..." : "Set Budget"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {existingBudgets.length > 0 && (
        <Card className="border-slate-200 shadow-lg bg-white">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-600" />
              Existing Budget Settings ({existingBudgets.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Field</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Period</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Budget (BDT)</th>
                    <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {existingBudgets.map((budget) => (
                    <tr key={budget._id} className="border-b border-slate-50">
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{budget.field}</td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{formatMonthYear(budget.month, budget.year)}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-slate-900 text-right">
                        {editingId === budget._id ? (
                          <Input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-32 h-8 text-right"
                          />
                        ) : (
                          formatAmount(budget.budgetAmount)
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {editingId === budget._id ? (
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              onClick={() => handleSaveEdit(budget._id)}
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
                              onClick={() => handleEdit(budget)}
                              className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(budget._id)}
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