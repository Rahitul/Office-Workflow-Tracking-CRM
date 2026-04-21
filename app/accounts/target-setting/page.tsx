"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Target, CheckCircle, AlertCircle } from "lucide-react"

interface SalesUser {
  _id: string
  name: string
  email: string
}

interface SalesTarget {
  _id: string
  targetType: string
  targetId: string
  targetName: string
  month: number
  year: number
  amountBDT: number
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

export default function TargetSettingPage() {
  const [loading, setLoading] = useState(false)
  const [salesmen, setSalesmen] = useState<SalesUser[]>([])
  const [existingTargets, setExistingTargets] = useState<SalesTarget[]>([])
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  
  const [targetType, setTargetType] = useState("")
  const [selectedTarget, setSelectedTarget] = useState("")
  const [month, setMonth] = useState("")
  const [year, setYear] = useState("")
  const [amountBDT, setAmountBDT] = useState("")

  const currentYear = new Date().getFullYear()
  const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(y => ({ value: y.toString(), label: y.toString() }))

  useEffect(() => {
    fetchSalesmen()
    fetchExistingTargets()
  }, [])

  const fetchSalesmen = async () => {
    try {
      const response = await axios.get("/api/users?role=user", { withCredentials: true })
      setSalesmen(response.data.users || [])
    } catch (error) {
      console.error("Failed to fetch salesmen:", error)
    }
  }

  const fetchExistingTargets = async () => {
    try {
      const response = await axios.get("/api/sales-targets", { withCredentials: true })
      setExistingTargets(response.data.targets || [])
    } catch (error) {
      console.error("Failed to fetch targets:", error)
    }
  }

  const handleTargetTypeChange = (value: string) => {
    setTargetType(value)
    setSelectedTarget("")
  }

  const getTargetOptions = () => {
    if (targetType === "department") return DEPARTMENT_OPTIONS
    if (targetType === "branch") return BRANCH_OPTIONS
    if (targetType === "salesman") return salesmen.map(s => ({ value: s._id, label: s.name }))
    return []
  }

  const getTargetLabel = () => {
    if (targetType === "department") return "Select Department"
    if (targetType === "branch") return "Select Branch"
    if (targetType === "salesman") return "Select Salesman"
    return "Select Target"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    if (!targetType || !selectedTarget || !month || !year || !amountBDT) {
      setErrorMessage("All fields are required")
      return
    }

    setLoading(true)

    try {
      let targetName = ""
      if (targetType === "department") {
        targetName = DEPARTMENT_OPTIONS.find(o => o.value === selectedTarget)?.label || ""
      } else if (targetType === "branch") {
        targetName = BRANCH_OPTIONS.find(o => o.value === selectedTarget)?.label || ""
      } else if (targetType === "salesman") {
        const salesman = salesmen.find(s => s._id === selectedTarget)
        targetName = salesman?.name || ""
      }

      await axios.post("/api/sales-targets", {
        targetType,
        targetId: selectedTarget,
        targetName,
        month: parseInt(month),
        year: parseInt(year),
        amountBDT: parseFloat(amountBDT),
      }, { withCredentials: true })

      setSuccessMessage(`Target set successfully for ${targetName}`)
      setSelectedTarget("")
      setAmountBDT("")
      fetchExistingTargets()
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } }
      setErrorMessage(err.response?.data?.error || "Failed to set target")
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

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Target Setting</h1>
        <p className="text-slate-500">Set monthly sales targets by Department, Branch, or Salesman</p>
      </div>

      <Card className="border-slate-200 shadow-lg bg-white">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-600" />
            New Sales Target
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
                <Label className="text-sm font-semibold text-slate-700">Target Type</Label>
                <Select
                  value={targetType}
                  onChange={(e) => handleTargetTypeChange(e.target.value)}
                  options={TARGET_TYPE_OPTIONS}
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">{getTargetLabel()}</Label>
                <Select
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  options={getTargetOptions()}
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10"
                  disabled={!targetType}
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
                <Label className="text-sm font-semibold text-slate-700">Target Amount (BDT)</Label>
                <Input
                  type="number"
                  value={amountBDT}
                  onChange={(e) => setAmountBDT(e.target.value)}
                  placeholder="Enter target amount"
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10"
                />
              </div>

              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={loading || !targetType || !selectedTarget || !month || !year || !amountBDT}
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
              Existing Targets ({existingTargets.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Type</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Target</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Period</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Amount (BDT)</th>
                  </tr>
                </thead>
                <tbody>
                  {existingTargets.map((target) => (
                    <tr key={target._id} className="border-b border-slate-50">
                      <td className="py-3 px-4">
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 capitalize">
                          {target.targetType}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{target.targetName}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{formatMonthYear(target.month, target.year)}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-slate-900 text-right">
                        {formatAmount(target.amountBDT)}
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