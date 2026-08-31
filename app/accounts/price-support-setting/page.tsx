"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Target, CheckCircle, AlertCircle, Pencil, Trash2 } from "lucide-react"

interface PriceSupportTarget {
  _id: string
  projectClientName: string
  month: number
  year: number
  amountBDT: number
  gpMargin: number
  executiveName: string
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

export default function PriceSupportSettingPage() {
  const [loading, setLoading] = useState(false)
  const [existingTargets, setExistingTargets] = useState<PriceSupportTarget[]>([])
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  
  const [projectClientName, setProjectClientName] = useState("")
  const [month, setMonth] = useState("")
  const [year, setYear] = useState("")
  const [amountBDT, setAmountBDT] = useState("")
  const [gpMargin, setGpMargin] = useState("")
  const [executiveName, setExecutiveName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState("")
  const [editGpMargin, setEditGpMargin] = useState("")

  const currentYear = new Date().getFullYear()
  const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(y => ({ value: y.toString(), label: y.toString() }))

  useEffect(() => {
    fetchExistingTargets()
  }, [])

  const fetchExistingTargets = async () => {
    try {
      const response = await axios.get("/api/price-support-targets", { withCredentials: true })
      setExistingTargets(response.data.targets || [])
    } catch (error) {
      console.error("Failed to fetch price support targets:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    if (!projectClientName || !month || !year || !amountBDT || !gpMargin || !executiveName) {
      setErrorMessage("All fields are required")
      return
    }

    setLoading(true)

    try {
      await axios.post("/api/price-support-targets", {
        projectClientName,
        month: parseInt(month),
        year: parseInt(year),
        amountBDT: parseFloat(amountBDT),
        gpMargin: parseFloat(gpMargin),
        executiveName,
      }, { withCredentials: true })

      setSuccessMessage(`Price support target set successfully for ${projectClientName} - ${MONTHS.find(m => parseInt(m.value) === parseInt(month))?.label} ${year}`)
      setProjectClientName("")
      setAmountBDT("")
      setGpMargin("")
      setExecutiveName("")
      fetchExistingTargets()
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } }
      setErrorMessage(err.response?.data?.error || "Failed to set price support target")
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

  const handleEdit = (target: PriceSupportTarget) => {
    setEditingId(target._id)
    setEditAmount(target.amountBDT.toString())
    setEditGpMargin(target.gpMargin.toString())
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this target?")) return
    try {
      await axios.delete(`/api/price-support-targets/${id}`, { withCredentials: true })
      fetchExistingTargets()
    } catch (error) {
      console.error("Failed to delete target:", error)
    }
  }

  const handleSaveEdit = async (id: string) => {
    try {
      await axios.put(`/api/price-support-targets/${id}`, { amountBDT: parseFloat(editAmount), gpMargin: parseFloat(editGpMargin) }, { withCredentials: true })
      setEditingId(null)
      fetchExistingTargets()
    } catch (error) {
      console.error("Failed to update target:", error)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditAmount("")
    setEditGpMargin("")
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Price Support Setting</h1>
        <p className="text-slate-500">Set price support target amount</p>
      </div>

      <Card className="border-slate-200 shadow-lg bg-white">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-600" />
            New Price Support Target
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
                <Label className="text-sm font-semibold text-slate-700">Project/Client Name</Label>
                <Input
                  type="text"
                  value={projectClientName}
                  onChange={(e) => setProjectClientName(e.target.value)}
                  placeholder="Enter project/client name"
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
                <Label className="text-sm font-semibold text-slate-700">Amount (BDT)</Label>
                <Input
                  type="number"
                  value={amountBDT}
                  onChange={(e) => setAmountBDT(e.target.value)}
                  placeholder="Enter amount"
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">GP Margin (%)</Label>
                <Input
                  type="number"
                  value={gpMargin}
                  onChange={(e) => setGpMargin(e.target.value)}
                  placeholder="Enter GP margin"
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Executive Name</Label>
                <Input
                  type="text"
                  value={executiveName}
                  onChange={(e) => setExecutiveName(e.target.value)}
                  placeholder="Enter executive name"
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10"
                />
              </div>

              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={loading || !projectClientName || !month || !year || !amountBDT || !gpMargin || !executiveName}
                  className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {loading ? "Setting Target..." : "Set Target"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {existingTargets.length > 0 && (
        <Card className="border-slate-200 shadow-lg bg-white">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-600" />
              Existing Price Support Targets ({existingTargets.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Project/Client</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Period</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Executive</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Amount (BDT)</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">GP Margin</th>
                    <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {existingTargets.map((target) => (
                    <tr key={target._id} className="border-b border-slate-50">
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{target.projectClientName}</td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{formatMonthYear(target.month, target.year)}</td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{target.executiveName}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-slate-900 text-right">
                        {editingId === target._id ? (
                          <Input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-24 h-8 text-right"
                          />
                        ) : (
                          formatAmount(target.amountBDT)
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-slate-900 text-right">
                        {editingId === target._id ? (
                          <Input
                            type="number"
                            value={editGpMargin}
                            onChange={(e) => setEditGpMargin(e.target.value)}
                            className="w-16 h-8 text-right"
                          />
                        ) : (
                          `${target.gpMargin}%`
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {editingId === target._id ? (
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              onClick={() => handleSaveEdit(target._id)}
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
                              onClick={() => handleEdit(target)}
                              className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(target._id)}
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