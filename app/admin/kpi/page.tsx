"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Phone, Calendar, Users, Mail, Banknote, Target, Trash2, Save, CheckCircle, LogOut, ClipboardList, Copy, X } from "lucide-react"
import { useAuthStore } from "@/store/authStore"

interface User {
  _id: string
  name: string
  email: string
  role?: string
}

interface KpiTarget {
  _id: string
  userId: User
  month: number
  year: number
  coldCallsMade: number
  followUpCallsMade: number
  newAppointmentsFixed: number
  customerVisitsCompleted: number
  salesEmailsSent: number
  ordersClosedTodayValue: number
  quotationsIssuedTodayValue: number
  orderValueMfp: number
  orderValueMps: number
  orderValueBarcodePrinters: number
  orderValuePaperShredder: number
  orderValueDuplicator: number
  orderValueBarcodeScanner: number
  orderValueSolutions: number
  orderValueTender: number
  billsClosedTodayValue: number
  billValueMfp: number
  billValueMps: number
  billValueBarcodePrinters: number
  billValuePaperShredder: number
  billValueDuplicator: number
  billValueBarcodeScanner: number
  billValueSolutions: number
  billValueTender: number
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

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(y => ({ value: y.toString(), label: y.toString() }))

export default function KpiSettingsPage() {
  const router = useRouter()
  const { logout } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [targets, setTargets] = useState<KpiTarget[]>([])
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)

  const [selectedUser, setSelectedUser] = useState("")
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString())
  const [selectedYear, setSelectedYear] = useState(currentYear.toString())

  const [filterUser, setFilterUser] = useState("all")
  const [filterMonth, setFilterMonth] = useState("all")
  const [filterYear, setFilterYear] = useState("all")

  const [coldCallsMade, setColdCallsMade] = useState(0)
  const [followUpCallsMade, setFollowUpCallsMade] = useState(0)
  const [newAppointmentsFixed, setNewAppointmentsFixed] = useState(0)
  const [customerVisitsCompleted, setCustomerVisitsCompleted] = useState(0)
  const [salesEmailsSent, setSalesEmailsSent] = useState(0)
  const [ordersClosedTodayValue, setOrdersClosedTodayValue] = useState(0)
  const [quotationsIssuedTodayValue, setQuotationsIssuedTodayValue] = useState(0)
  const [orderValueMfp, setOrderValueMfp] = useState(0)
  const [orderValueMps, setOrderValueMps] = useState(0)
  const [orderValueBarcodePrinters, setOrderValueBarcodePrinters] = useState(0)
  const [orderValuePaperShredder, setOrderValuePaperShredder] = useState(0)
  const [orderValueDuplicator, setOrderValueDuplicator] = useState(0)
  const [orderValueBarcodeScanner, setOrderValueBarcodeScanner] = useState(0)
  const [orderValueSolutions, setOrderValueSolutions] = useState(0)
  const [orderValueTender, setOrderValueTender] = useState(0)
  const [billsClosedTodayValue, setBillsClosedTodayValue] = useState(0)
  const [billValueMfp, setBillValueMfp] = useState(0)
  const [billValueMps, setBillValueMps] = useState(0)
  const [billValueBarcodePrinters, setBillValueBarcodePrinters] = useState(0)
  const [billValuePaperShredder, setBillValuePaperShredder] = useState(0)
  const [billValueDuplicator, setBillValueDuplicator] = useState(0)
  const [billValueBarcodeScanner, setBillValueBarcodeScanner] = useState(0)
  const [billValueSolutions, setBillValueSolutions] = useState(0)
  const [billValueTender, setBillValueTender] = useState(0)

  const [showBulkModal, setShowBulkModal] = useState(false)
  const [previousMonthTargets, setPreviousMonthTargets] = useState<KpiTarget[]>([])
  const [previousMonthInfo, setPreviousMonthInfo] = useState<{ month: number; year: number } | null>(null)
  const [editableTargets, setEditableTargets] = useState<any[]>([])
  const [bulkSaving, setBulkSaving] = useState(false)

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/api/static-form/users", { withCredentials: true })
      setUsers((res.data.users || []).filter((u: User) => u.role === "user" || u.role === "user_juniors"))
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }

  const fetchTargets = async () => {
    try {
      const res = await axios.get("/api/kpi-targets", { withCredentials: true })
      setTargets(res.data.targets || [])
    } catch (error) {
      console.error("Failed to fetch targets:", error)
    }
  }

  useEffect(() => {
    Promise.all([fetchUsers(), fetchTargets()]).finally(() => setLoading(false))
  }, [])

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const loadTargetForUser = (userId: string, month: string, year: string) => {
    const existingTarget = targets.find(
      t => t.userId._id === userId && t.month === parseInt(month) && t.year === parseInt(year)
    )
    if (existingTarget) {
      setColdCallsMade(existingTarget.coldCallsMade)
      setFollowUpCallsMade(existingTarget.followUpCallsMade)
      setNewAppointmentsFixed(existingTarget.newAppointmentsFixed)
      setCustomerVisitsCompleted(existingTarget.customerVisitsCompleted)
      setSalesEmailsSent(existingTarget.salesEmailsSent)
      setOrdersClosedTodayValue(existingTarget.ordersClosedTodayValue)
      setQuotationsIssuedTodayValue(existingTarget.quotationsIssuedTodayValue)
      setOrderValueMfp(existingTarget.orderValueMfp ?? 0)
      setOrderValueMps(existingTarget.orderValueMps ?? 0)
      setOrderValueBarcodePrinters(existingTarget.orderValueBarcodePrinters ?? 0)
      setOrderValuePaperShredder(existingTarget.orderValuePaperShredder ?? 0)
      setOrderValueDuplicator(existingTarget.orderValueDuplicator ?? 0)
      setOrderValueBarcodeScanner(existingTarget.orderValueBarcodeScanner ?? 0)
      setOrderValueSolutions(existingTarget.orderValueSolutions ?? 0)
      setOrderValueTender(existingTarget.orderValueTender ?? 0)
      setBillsClosedTodayValue(existingTarget.billsClosedTodayValue ?? 0)
      setBillValueMfp(existingTarget.billValueMfp ?? 0)
      setBillValueMps(existingTarget.billValueMps ?? 0)
      setBillValueBarcodePrinters(existingTarget.billValueBarcodePrinters ?? 0)
      setBillValuePaperShredder(existingTarget.billValuePaperShredder ?? 0)
      setBillValueDuplicator(existingTarget.billValueDuplicator ?? 0)
      setBillValueBarcodeScanner(existingTarget.billValueBarcodeScanner ?? 0)
      setBillValueSolutions(existingTarget.billValueSolutions ?? 0)
      setBillValueTender(existingTarget.billValueTender ?? 0)
    } else {
      setColdCallsMade(0)
      setFollowUpCallsMade(0)
      setNewAppointmentsFixed(0)
      setCustomerVisitsCompleted(0)
      setSalesEmailsSent(0)
      setOrdersClosedTodayValue(0)
      setQuotationsIssuedTodayValue(0)
      setOrderValueMfp(0)
      setOrderValueMps(0)
      setOrderValueBarcodePrinters(0)
      setOrderValuePaperShredder(0)
      setOrderValueDuplicator(0)
      setOrderValueBarcodeScanner(0)
      setOrderValueSolutions(0)
      setOrderValueTender(0)
      setBillsClosedTodayValue(0)
      setBillValueMfp(0)
      setBillValueMps(0)
      setBillValueBarcodePrinters(0)
      setBillValuePaperShredder(0)
      setBillValueDuplicator(0)
      setBillValueBarcodeScanner(0)
      setBillValueSolutions(0)
      setBillValueTender(0)
    }
  }

  const handleUserChange = (userId: string) => {
    setSelectedUser(userId)
    loadTargetForUser(userId, selectedMonth, selectedYear)
  }

  const handleMonthYearChange = (month: string, year: string) => {
    setSelectedMonth(month)
    setSelectedYear(year)
    if (selectedUser) {
      loadTargetForUser(selectedUser, month, year)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    
    setSaving(true)
    setSuccess(false)

    try {
      await axios.post("/api/kpi-targets", {
        userId: selectedUser,
        month: parseInt(selectedMonth),
        year: parseInt(selectedYear),
        coldCallsMade,
        followUpCallsMade,
        newAppointmentsFixed,
        customerVisitsCompleted,
        salesEmailsSent,
        ordersClosedTodayValue,
        quotationsIssuedTodayValue,
        orderValueMfp,
        orderValueMps,
        orderValueBarcodePrinters,
        orderValuePaperShredder,
        orderValueDuplicator,
        orderValueBarcodeScanner,
        orderValueSolutions,
        orderValueTender,
        billsClosedTodayValue,
        billValueMfp,
        billValueMps,
        billValueBarcodePrinters,
        billValuePaperShredder,
        billValueDuplicator,
        billValueBarcodeScanner,
        billValueSolutions,
        billValueTender,
      }, { withCredentials: true })

      setSuccess(true)
      fetchTargets()
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error("Failed to save target:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this target?")) return
    
    try {
      await axios.delete(`/api/kpi-targets?id=${id}`, { withCredentials: true })
      fetchTargets()
    } catch (error) {
      console.error("Failed to delete target:", error)
    }
  }

  const handleBulkCopy = async () => {
    try {
      const res = await axios.get("/api/kpi-targets/previous", { withCredentials: true })
      const { targets, month, year } = res.data
      if (!targets || targets.length === 0) {
        alert("No previous month targets found to copy from.")
        return
      }
      setPreviousMonthInfo({ month, year })
      setPreviousMonthTargets(targets)
      setEditableTargets(targets.map((t: any) => ({
        userId: t.userId._id,
        userName: t.userId.name || "Unknown",
        coldCallsMade: t.coldCallsMade,
        followUpCallsMade: t.followUpCallsMade,
        newAppointmentsFixed: t.newAppointmentsFixed,
        customerVisitsCompleted: t.customerVisitsCompleted,
        salesEmailsSent: t.salesEmailsSent,
        ordersClosedTodayValue: t.ordersClosedTodayValue,
        quotationsIssuedTodayValue: t.quotationsIssuedTodayValue,
        orderValueMfp: t.orderValueMfp ?? 0,
        orderValueMps: t.orderValueMps ?? 0,
        orderValueBarcodePrinters: t.orderValueBarcodePrinters ?? 0,
        orderValuePaperShredder: t.orderValuePaperShredder ?? 0,
        orderValueDuplicator: t.orderValueDuplicator ?? 0,
        orderValueBarcodeScanner: t.orderValueBarcodeScanner ?? 0,
        orderValueSolutions: t.orderValueSolutions ?? 0,
        orderValueTender: t.orderValueTender ?? 0,
        billsClosedTodayValue: t.billsClosedTodayValue ?? 0,
        billValueMfp: t.billValueMfp ?? 0,
        billValueMps: t.billValueMps ?? 0,
        billValueBarcodePrinters: t.billValueBarcodePrinters ?? 0,
        billValuePaperShredder: t.billValuePaperShredder ?? 0,
        billValueDuplicator: t.billValueDuplicator ?? 0,
        billValueBarcodeScanner: t.billValueBarcodeScanner ?? 0,
        billValueSolutions: t.billValueSolutions ?? 0,
        billValueTender: t.billValueTender ?? 0,
      })))
      setShowBulkModal(true)
    } catch (error) {
      console.error("Failed to fetch previous targets:", error)
      alert("Failed to load previous targets.")
    }
  }

  const handleBulkTargetChange = (index: number, field: string, value: number) => {
    setEditableTargets(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      if (["orderValueMfp", "orderValueMps", "orderValueBarcodePrinters", "orderValuePaperShredder", "orderValueDuplicator", "orderValueBarcodeScanner", "orderValueSolutions", "orderValueTender"].includes(field)) {
        const sum = (field === "orderValueMfp" ? value : updated[index].orderValueMfp) +
          (field === "orderValueMps" ? value : updated[index].orderValueMps) +
          (field === "orderValueBarcodePrinters" ? value : updated[index].orderValueBarcodePrinters) +
          (field === "orderValuePaperShredder" ? value : updated[index].orderValuePaperShredder) +
          (field === "orderValueDuplicator" ? value : updated[index].orderValueDuplicator) +
          (field === "orderValueBarcodeScanner" ? value : updated[index].orderValueBarcodeScanner) +
          (field === "orderValueSolutions" ? value : updated[index].orderValueSolutions) +
          (field === "orderValueTender" ? value : updated[index].orderValueTender)
        updated[index].ordersClosedTodayValue = sum
      }
      if (["billValueMfp", "billValueMps", "billValueBarcodePrinters", "billValuePaperShredder", "billValueDuplicator", "billValueBarcodeScanner", "billValueSolutions", "billValueTender"].includes(field)) {
        const sum = (field === "billValueMfp" ? value : updated[index].billValueMfp) +
          (field === "billValueMps" ? value : updated[index].billValueMps) +
          (field === "billValueBarcodePrinters" ? value : updated[index].billValueBarcodePrinters) +
          (field === "billValuePaperShredder" ? value : updated[index].billValuePaperShredder) +
          (field === "billValueDuplicator" ? value : updated[index].billValueDuplicator) +
          (field === "billValueBarcodeScanner" ? value : updated[index].billValueBarcodeScanner) +
          (field === "billValueSolutions" ? value : updated[index].billValueSolutions) +
          (field === "billValueTender" ? value : updated[index].billValueTender)
        updated[index].billsClosedTodayValue = sum
      }
      return updated
    })
  }

  const handleBulkSave = async () => {
    setBulkSaving(true)
    try {
      await axios.post("/api/kpi-targets/bulk", {
        month: parseInt(selectedMonth),
        year: parseInt(selectedYear),
        targets: editableTargets,
      }, { withCredentials: true })
      setShowBulkModal(false)
      fetchTargets()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error("Failed to bulk save targets:", error)
      alert("Failed to save targets. Please try again.")
    } finally {
      setBulkSaving(false)
    }
  }

  const getUserName = (userId: { _id: string; name?: string }) => userId?.name || "Unknown"

  const getMonthName = (month: number) => MONTHS.find(m => m.value === month.toString())?.label || ""

  const filteredTargets = targets.filter(target => {
    const userMatch = filterUser === "all" || target.userId._id === filterUser
    const monthMatch = filterMonth === "all" || target.month === parseInt(filterMonth)
    const yearMatch = filterYear === "all" || target.year === parseInt(filterYear)
    return userMatch && monthMatch && yearMatch
  })

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">KPI Target Settings</h1>
          <p className="text-slate-500 mt-1">Configure monthly performance benchmarks for your team members</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1 bg-white border-slate-200 text-slate-600 font-medium">
            <Target className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
            Admin Control
          </Badge>
        </div>
      </div>

      {success && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <Card className="border-emerald-200 bg-emerald-50 shadow-lg border-l-4 border-l-emerald-500 min-w-[300px]">
            <CardContent className="py-4 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-emerald-900">Success!</p>
                <p className="text-sm text-emerald-700">KPI target saved successfully.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-col gap-8">
        {/* Form - Top Section */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-xl overflow-hidden bg-white ring-1 ring-slate-200/50">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Target className="h-5 w-5 text-indigo-600" />
                Configure Target
              </h2>
              <Button
                type="button"
                variant="outline"
                onClick={handleBulkCopy}
                className="h-9 text-xs font-semibold border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-all"
              >
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Set target as like previous
              </Button>
            </div>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Assignment Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" />
                    Assignment & Period
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">Select User</Label>
                      <Select
                        value={selectedUser}
                        onChange={(e) => handleUserChange(e.target.value)}
                        options={[{ value: "", label: "Choose a team member..." }, ...users.map(u => ({ value: u._id, label: u.name }))]}
                        required
                        className="bg-slate-50 border-slate-200 focus:bg-white transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">Month</Label>
                      <Select
                        value={selectedMonth}
                        onChange={(e) => handleMonthYearChange(e.target.value, selectedYear)}
                        options={MONTHS}
                        className="bg-slate-50 border-slate-200 focus:bg-white transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">Year</Label>
                      <Select
                        value={selectedYear}
                        onChange={(e) => handleMonthYearChange(selectedMonth, e.target.value)}
                        options={YEARS}
                        className="bg-slate-50 border-slate-200 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Metrics Section */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Target className="w-3.5 h-3.5" />
                    Performance Benchmarks
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
                    <div className="space-y-2 group">
                      <Label htmlFor="coldCalls" className="text-sm font-semibold text-slate-700 flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                        <div className="p-1 rounded bg-blue-50">
                          <Phone className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        Cold Calls
                      </Label>
                      <Input
                        id="coldCalls"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={coldCallsMade}
                        onChange={(e) => setColdCallsMade(parseInt(e.target.value) || 0)}
                        className="bg-slate-50 border-slate-200 focus:bg-white transition-all focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>

                    <div className="space-y-2 group">
                      <Label htmlFor="followUpCalls" className="text-sm font-semibold text-slate-700 flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                        <div className="p-1 rounded bg-amber-50">
                          <Phone className="h-3.5 w-3.5 text-amber-600" />
                        </div>
                        Follow-ups
                      </Label>
                      <Input
                        id="followUpCalls"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={followUpCallsMade}
                        onChange={(e) => setFollowUpCallsMade(parseInt(e.target.value) || 0)}
                        className="bg-slate-50 border-slate-200 focus:bg-white transition-all focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>

                    <div className="space-y-2 group">
                      <Label htmlFor="appointments" className="text-sm font-semibold text-slate-700 flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                        <div className="p-1 rounded bg-emerald-50">
                          <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                        </div>
                        Appointments
                      </Label>
                      <Input
                        id="appointments"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={newAppointmentsFixed}
                        onChange={(e) => setNewAppointmentsFixed(parseInt(e.target.value) || 0)}
                        className="bg-slate-50 border-slate-200 focus:bg-white transition-all focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>

                    <div className="space-y-2 group">
                      <Label htmlFor="visits" className="text-sm font-semibold text-slate-700 flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                        <div className="p-1 rounded bg-purple-50">
                          <Users className="h-3.5 w-3.5 text-purple-600" />
                        </div>
                        Site Visits
                      </Label>
                      <Input
                        id="visits"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={customerVisitsCompleted}
                        onChange={(e) => setCustomerVisitsCompleted(parseInt(e.target.value) || 0)}
                        className="bg-slate-50 border-slate-200 focus:bg-white transition-all focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>

                    <div className="space-y-2 group">
                      <Label htmlFor="emails" className="text-sm font-semibold text-slate-700 flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                        <div className="p-1 rounded bg-rose-50">
                          <Mail className="h-3.5 w-3.5 text-rose-600" />
                        </div>
                        Sales Emails
                      </Label>
                      <Input
                        id="emails"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={salesEmailsSent}
                        onChange={(e) => setSalesEmailsSent(parseInt(e.target.value) || 0)}
                        className="bg-slate-50 border-slate-200 focus:bg-white transition-all focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>

                    <div className="space-y-2 group">
                      <Label htmlFor="orders" className="text-sm font-semibold text-slate-700 flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                        <div className="p-1 rounded bg-emerald-50">
                          <Banknote className="h-3.5 w-3.5 text-emerald-600" />
                        </div>
                        Order Value
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">৳</span>
                        <Input
                          id="orders"
                          type="number"
                          min="0"
                          placeholder="0"
                          value={ordersClosedTodayValue}
                          readOnly
                          className="pl-7 bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 group">
                      <Label htmlFor="quotations" className="text-sm font-semibold text-slate-700 flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                        <div className="p-1 rounded bg-cyan-50">
                          <Banknote className="h-3.5 w-3.5 text-cyan-600" />
                        </div>
                        Quotation Value
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">৳</span>
                        <Input
                          id="quotations"
                          type="number"
                          min="0"
                          placeholder="0"
                          value={quotationsIssuedTodayValue}
                          onChange={(e) => setQuotationsIssuedTodayValue(parseInt(e.target.value) || 0)}
                          className="pl-7 bg-slate-50 border-slate-200 focus:bg-white transition-all focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 group">
                      <Label htmlFor="bills" className="text-sm font-semibold text-slate-700 flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                        <div className="p-1 rounded bg-amber-50">
                          <Banknote className="h-3.5 w-3.5 text-amber-600" />
                        </div>
                        Bill Value
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">৳</span>
                        <Input
                          id="bills"
                          type="number"
                          min="0"
                          placeholder="0"
                          value={billsClosedTodayValue}
                          readOnly
                          className="pl-7 bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product-wise Order Value Targets */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Banknote className="w-3.5 h-3.5" />
                    Product-wise Order Value Targets
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
                    {[
                      { key: "orderValueMfp", label: "MFP", setter: setOrderValueMfp, value: orderValueMfp },
                      { key: "orderValueMps", label: "MPS", setter: setOrderValueMps, value: orderValueMps },
                      { key: "orderValueBarcodePrinters", label: "Barcode Printers", setter: setOrderValueBarcodePrinters, value: orderValueBarcodePrinters },
                      { key: "orderValuePaperShredder", label: "Paper Shredder", setter: setOrderValuePaperShredder, value: orderValuePaperShredder },
                      { key: "orderValueDuplicator", label: "Duplicator", setter: setOrderValueDuplicator, value: orderValueDuplicator },
                      { key: "orderValueBarcodeScanner", label: "Barcode Scanner / Mobile Computer / POS", setter: setOrderValueBarcodeScanner, value: orderValueBarcodeScanner },
                      { key: "orderValueSolutions", label: "Solutions", setter: setOrderValueSolutions, value: orderValueSolutions },
                      { key: "orderValueTender", label: "Tender/Project", setter: setOrderValueTender, value: orderValueTender },
                    ].map((item) => (
                      <div key={item.key} className="space-y-2 group">
                        <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                          <div className="p-1 rounded bg-emerald-50">
                            <Banknote className="h-3.5 w-3.5 text-emerald-600" />
                          </div>
                          {item.label}
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">৳</span>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={item.value}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0
                              item.setter(val)
                              const sum = (item.key === "orderValueMfp" ? val : orderValueMfp) +
                                (item.key === "orderValueMps" ? val : orderValueMps) +
                                (item.key === "orderValueBarcodePrinters" ? val : orderValueBarcodePrinters) +
                                (item.key === "orderValuePaperShredder" ? val : orderValuePaperShredder) +
                                (item.key === "orderValueDuplicator" ? val : orderValueDuplicator) +
                                (item.key === "orderValueBarcodeScanner" ? val : orderValueBarcodeScanner) +
                                (item.key === "orderValueSolutions" ? val : orderValueSolutions) +
                                (item.key === "orderValueTender" ? val : orderValueTender)
                              setOrdersClosedTodayValue(sum)
                            }}
                            className="pl-7 bg-slate-50 border-slate-200 focus:bg-white transition-all focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 pt-2 px-1">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Banknote className="h-4 w-4 text-emerald-600" />
                      <span>Combined Order Value Target:</span>
                    </div>
                    <span className="text-lg font-bold text-emerald-700">৳{ordersClosedTodayValue.toLocaleString()}</span>
                  </div>
                </div>

                {/* Product-wise Bill Value Targets */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Banknote className="w-3.5 h-3.5" />
                    Product-wise Bill Value Targets
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
                    {[
                      { key: "billValueMfp", label: "MFP", setter: setBillValueMfp, value: billValueMfp },
                      { key: "billValueMps", label: "MPS", setter: setBillValueMps, value: billValueMps },
                      { key: "billValueBarcodePrinters", label: "Barcode Printers", setter: setBillValueBarcodePrinters, value: billValueBarcodePrinters },
                      { key: "billValuePaperShredder", label: "Paper Shredder", setter: setBillValuePaperShredder, value: billValuePaperShredder },
                      { key: "billValueDuplicator", label: "Duplicator", setter: setBillValueDuplicator, value: billValueDuplicator },
                      { key: "billValueBarcodeScanner", label: "Barcode Scanner / Mobile Computer / POS", setter: setBillValueBarcodeScanner, value: billValueBarcodeScanner },
                      { key: "billValueSolutions", label: "Solutions", setter: setBillValueSolutions, value: billValueSolutions },
                      { key: "billValueTender", label: "Tender/Project", setter: setBillValueTender, value: billValueTender },
                    ].map((item) => (
                      <div key={item.key} className="space-y-2 group">
                        <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                          <div className="p-1 rounded bg-amber-50">
                            <Banknote className="h-3.5 w-3.5 text-amber-600" />
                          </div>
                          {item.label}
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">৳</span>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={item.value}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0
                              item.setter(val)
                              const sum = (item.key === "billValueMfp" ? val : billValueMfp) +
                                (item.key === "billValueMps" ? val : billValueMps) +
                                (item.key === "billValueBarcodePrinters" ? val : billValueBarcodePrinters) +
                                (item.key === "billValuePaperShredder" ? val : billValuePaperShredder) +
                                (item.key === "billValueDuplicator" ? val : billValueDuplicator) +
                                (item.key === "billValueBarcodeScanner" ? val : billValueBarcodeScanner) +
                                (item.key === "billValueSolutions" ? val : billValueSolutions) +
                                (item.key === "billValueTender" ? val : billValueTender)
                              setBillsClosedTodayValue(sum)
                            }}
                            className="pl-7 bg-slate-50 border-slate-200 focus:bg-white transition-all focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 pt-2 px-1">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Banknote className="h-4 w-4 text-amber-600" />
                      <span>Combined Bill Value Target:</span>
                    </div>
                    <span className="text-lg font-bold text-amber-700">৳{billsClosedTodayValue.toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={saving || !selectedUser}
                    className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all font-semibold rounded-lg"
                  >
                    {saving ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        <span>Save Monthly Target</span>
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Existing Targets - Bottom Section */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden bg-white flex flex-col">
            <div className="bg-white border-b border-slate-100 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">Existing Targets</h2>
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 ml-2">
                  {filteredTargets.length} Records
                </Badge>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-[150px]">
                  <Select
                    value={filterUser}
                    onChange={(e) => setFilterUser(e.target.value)}
                    options={[{ value: "all", label: "All Members" }, ...users.map(u => ({ value: u._id, label: u.name }))]}
                    className="h-9 text-xs bg-slate-50"
                  />
                </div>
                <div className="min-w-[120px]">
                  <Select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    options={[{ value: "all", label: "All Months" }, ...MONTHS]}
                    className="h-9 text-xs bg-slate-50"
                  />
                </div>
                <div className="min-w-[100px]">
                  <Select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    options={[{ value: "all", label: "All Years" }, ...YEARS]}
                    className="h-9 text-xs bg-slate-50"
                  />
                </div>
              </div>
            </div>
            
            <CardContent className="p-0 flex-1 overflow-hidden">
              {filteredTargets.length === 0 ? (
                <div className="h-[400px] flex flex-col items-center justify-center text-slate-400 p-8">
                  <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                    <Target className="h-10 w-10 opacity-20" />
                  </div>
                  <p className="font-medium text-slate-500">No targets found matching filters</p>
                  <p className="text-sm text-slate-400 mt-1 max-w-[200px] text-center">Adjust your filters or create a new target above.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Team Member</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Period</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Benchmarks</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredTargets.map((target) => (
                        <tr key={target._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                {getUserName(target.userId).charAt(0)}
                              </div>
                              <span className="font-semibold text-slate-900">{getUserName(target.userId)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className="bg-slate-100 hover:bg-slate-200 text-slate-700 border-none px-2 py-0.5 font-medium">
                              {getMonthName(target.month)} {target.year}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400">Calls:</span>
                                <span className="font-bold text-slate-700">{target.coldCallsMade}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400">Follow:</span>
                                <span className="font-bold text-slate-700">{target.followUpCallsMade}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400">Appt:</span>
                                <span className="font-bold text-slate-700">{target.newAppointmentsFixed}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400">Visit:</span>
                                <span className="font-bold text-slate-700">{target.customerVisitsCompleted}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400">Email:</span>
                                <span className="font-bold text-slate-700">{target.salesEmailsSent}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400">Value:</span>
                                <span className="font-bold text-emerald-600">৳{target.ordersClosedTodayValue.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400">QTZ:</span>
                                <span className="font-bold text-cyan-600">৳{target.quotationsIssuedTodayValue.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400">Bill:</span>
                                <span className="font-bold text-amber-600">৳{(target.billsClosedTodayValue || 0).toLocaleString()}</span>
                              </div>
                              <div className="col-span-3 pt-1 mt-1 border-t border-slate-100">
                                <details className="group">
                                  <summary className="text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-600 transition-colors list-none flex items-center gap-1">
                                    <span>Product-wise Orders</span>
                                    <span className="text-[9px] opacity-50 group-open:opacity-100 transition-opacity">▼</span>
                                  </summary>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-1">
                                    <span className="text-[10px] text-slate-400">MFP:</span>
                                    <span className="text-[10px] font-semibold text-emerald-600">৳{(target.orderValueMfp || 0).toLocaleString()}</span>
                                    <span className="text-[10px] text-slate-400">MPS:</span>
                                    <span className="text-[10px] font-semibold text-emerald-600">৳{(target.orderValueMps || 0).toLocaleString()}</span>
                                    <span className="text-[10px] text-slate-400">Barcode Printers:</span>
                                    <span className="text-[10px] font-semibold text-emerald-600">৳{(target.orderValueBarcodePrinters || 0).toLocaleString()}</span>
                                    <span className="text-[10px] text-slate-400">Paper Shredder:</span>
                                    <span className="text-[10px] font-semibold text-emerald-600">৳{(target.orderValuePaperShredder || 0).toLocaleString()}</span>
                                    <span className="text-[10px] text-slate-400">Duplicator:</span>
                                    <span className="text-[10px] font-semibold text-emerald-600">৳{(target.orderValueDuplicator || 0).toLocaleString()}</span>
                                    <span className="text-[10px] text-slate-400">Barcode Scanner/POS:</span>
                                    <span className="text-[10px] font-semibold text-emerald-600">৳{(target.orderValueBarcodeScanner || 0).toLocaleString()}</span>
                                    <span className="text-[10px] text-slate-400">Solutions:</span>
                                    <span className="text-[10px] font-semibold text-emerald-600">৳{(target.orderValueSolutions || 0).toLocaleString()}</span>
                                    <span className="text-[10px] text-slate-400">Tender/Project:</span>
                                    <span className="text-[10px] font-semibold text-emerald-600">৳{(target.orderValueTender || 0).toLocaleString()}</span>
                                  </div>
                                </details>
                                <details className="group mt-2">
                                  <summary className="text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-600 transition-colors list-none flex items-center gap-1">
                                    <span>Product-wise Bills</span>
                                    <span className="text-[9px] opacity-50 group-open:opacity-100 transition-opacity">▼</span>
                                  </summary>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-1">
                                    <span className="text-[10px] text-slate-400">MFP:</span>
                                    <span className="text-[10px] font-semibold text-amber-600">৳{(target.billValueMfp || 0).toLocaleString()}</span>
                                    <span className="text-[10px] text-slate-400">MPS:</span>
                                    <span className="text-[10px] font-semibold text-amber-600">৳{(target.billValueMps || 0).toLocaleString()}</span>
                                    <span className="text-[10px] text-slate-400">Barcode Printers:</span>
                                    <span className="text-[10px] font-semibold text-amber-600">৳{(target.billValueBarcodePrinters || 0).toLocaleString()}</span>
                                    <span className="text-[10px] text-slate-400">Paper Shredder:</span>
                                    <span className="text-[10px] font-semibold text-amber-600">৳{(target.billValuePaperShredder || 0).toLocaleString()}</span>
                                    <span className="text-[10px] text-slate-400">Duplicator:</span>
                                    <span className="text-[10px] font-semibold text-amber-600">৳{(target.billValueDuplicator || 0).toLocaleString()}</span>
                                    <span className="text-[10px] text-slate-400">Barcode Scanner/POS:</span>
                                    <span className="text-[10px] font-semibold text-amber-600">৳{(target.billValueBarcodeScanner || 0).toLocaleString()}</span>
                                    <span className="text-[10px] text-slate-400">Solutions:</span>
                                    <span className="text-[10px] font-semibold text-amber-600">৳{(target.billValueSolutions || 0).toLocaleString()}</span>
                                    <span className="text-[10px] text-slate-400">Tender/Project:</span>
                                    <span className="text-[10px] font-semibold text-amber-600">৳{(target.billValueTender || 0).toLocaleString()}</span>
                                  </div>
                                </details>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                              onClick={() => handleDelete(target._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {showBulkModal && previousMonthInfo && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowBulkModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-[95vw] max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Copy className="h-5 w-5 text-indigo-600" />
                  Copy targets from {MONTHS.find(m => m.value === previousMonthInfo.month.toString())?.label} {previousMonthInfo.year}
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  To: {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
                  <span className="ml-2 text-slate-400">·</span>
                  <span className="ml-2">{editableTargets.length} team member{(editableTargets.length !== 1 ? "s" : "")}</span>
                </p>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50 border-b-2 border-slate-200">
                      <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 z-10 min-w-[140px]">Team Member</th>
                      <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center min-w-[90px]">Cold Calls</th>
                      <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center min-w-[90px]">Follow-ups</th>
                      <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center min-w-[100px]">Appointments</th>
                      <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center min-w-[80px]">Visits</th>
                      <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center min-w-[90px]">Emails</th>
                      <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center min-w-[100px]">Order Value</th>
                      <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center min-w-[100px]">Quotation</th>
                      <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center min-w-[100px]">Bill Value</th>
                      <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center min-w-[100px]">Order MFP</th>
                      <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center min-w-[90px]">Order MPS</th>
                      <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center min-w-[110px]">Order Barcode</th>
                      <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center min-w-[110px]">Order Shredder</th>
                      <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center min-w-[90px]">Order Dup.</th>
                      <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center min-w-[130px]">Order Scanner</th>
                      <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center min-w-[90px]">Order Sol.</th>
                      <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center min-w-[100px]">Order Tender</th>
                      <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center min-w-[90px]">Bill MFP</th>
                      <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center min-w-[90px]">Bill MPS</th>
                      <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center min-w-[110px]">Bill Barcode</th>
                      <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center min-w-[110px]">Bill Shredder</th>
                      <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center min-w-[90px]">Bill Dup.</th>
                      <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center min-w-[130px]">Bill Scanner</th>
                      <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center min-w-[90px]">Bill Sol.</th>
                      <th className="px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center min-w-[100px]">Bill Tender</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {editableTargets.map((target, index) => (
                      <tr key={target.userId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-3 py-2.5 font-semibold text-slate-900 text-sm sticky left-0 bg-white z-10 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-[10px] shrink-0">
                              {target.userName.charAt(0)}
                            </div>
                            <span className="truncate max-w-[110px]">{target.userName}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <input type="number" min="0" value={target.coldCallsMade} onChange={(e) => handleBulkTargetChange(index, "coldCallsMade", parseInt(e.target.value) || 0)} className="w-full max-w-[80px] mx-auto h-8 text-center text-xs rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all outline-none" />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <input type="number" min="0" value={target.followUpCallsMade} onChange={(e) => handleBulkTargetChange(index, "followUpCallsMade", parseInt(e.target.value) || 0)} className="w-full max-w-[80px] mx-auto h-8 text-center text-xs rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all outline-none" />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <input type="number" min="0" value={target.newAppointmentsFixed} onChange={(e) => handleBulkTargetChange(index, "newAppointmentsFixed", parseInt(e.target.value) || 0)} className="w-full max-w-[80px] mx-auto h-8 text-center text-xs rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all outline-none" />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <input type="number" min="0" value={target.customerVisitsCompleted} onChange={(e) => handleBulkTargetChange(index, "customerVisitsCompleted", parseInt(e.target.value) || 0)} className="w-full max-w-[80px] mx-auto h-8 text-center text-xs rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all outline-none" />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <input type="number" min="0" value={target.salesEmailsSent} onChange={(e) => handleBulkTargetChange(index, "salesEmailsSent", parseInt(e.target.value) || 0)} className="w-full max-w-[80px] mx-auto h-8 text-center text-xs rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all outline-none" />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <input type="number" min="0" value={target.ordersClosedTodayValue} readOnly className="w-full max-w-[100px] mx-auto h-8 text-center text-xs rounded-md border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed" />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <input type="number" min="0" value={target.quotationsIssuedTodayValue} onChange={(e) => handleBulkTargetChange(index, "quotationsIssuedTodayValue", parseInt(e.target.value) || 0)} className="w-full max-w-[100px] mx-auto h-8 text-center text-xs rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all outline-none" />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <input type="number" min="0" value={target.billsClosedTodayValue} readOnly className="w-full max-w-[100px] mx-auto h-8 text-center text-xs rounded-md border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed" />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <input type="number" min="0" value={target.orderValueMfp} onChange={(e) => handleBulkTargetChange(index, "orderValueMfp", parseInt(e.target.value) || 0)} className="w-full max-w-[100px] mx-auto h-8 text-center text-xs rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all outline-none" />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <input type="number" min="0" value={target.orderValueMps} onChange={(e) => handleBulkTargetChange(index, "orderValueMps", parseInt(e.target.value) || 0)} className="w-full max-w-[100px] mx-auto h-8 text-center text-xs rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all outline-none" />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <input type="number" min="0" value={target.orderValueBarcodePrinters} onChange={(e) => handleBulkTargetChange(index, "orderValueBarcodePrinters", parseInt(e.target.value) || 0)} className="w-full max-w-[100px] mx-auto h-8 text-center text-xs rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all outline-none" />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <input type="number" min="0" value={target.orderValuePaperShredder} onChange={(e) => handleBulkTargetChange(index, "orderValuePaperShredder", parseInt(e.target.value) || 0)} className="w-full max-w-[100px] mx-auto h-8 text-center text-xs rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all outline-none" />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <input type="number" min="0" value={target.orderValueDuplicator} onChange={(e) => handleBulkTargetChange(index, "orderValueDuplicator", parseInt(e.target.value) || 0)} className="w-full max-w-[100px] mx-auto h-8 text-center text-xs rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all outline-none" />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <input type="number" min="0" value={target.orderValueBarcodeScanner} onChange={(e) => handleBulkTargetChange(index, "orderValueBarcodeScanner", parseInt(e.target.value) || 0)} className="w-full max-w-[100px] mx-auto h-8 text-center text-xs rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all outline-none" />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <input type="number" min="0" value={target.orderValueSolutions} onChange={(e) => handleBulkTargetChange(index, "orderValueSolutions", parseInt(e.target.value) || 0)} className="w-full max-w-[100px] mx-auto h-8 text-center text-xs rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all outline-none" />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <input type="number" min="0" value={target.orderValueTender} onChange={(e) => handleBulkTargetChange(index, "orderValueTender", parseInt(e.target.value) || 0)} className="w-full max-w-[100px] mx-auto h-8 text-center text-xs rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all outline-none" />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <input type="number" min="0" value={target.billValueMfp} onChange={(e) => handleBulkTargetChange(index, "billValueMfp", parseInt(e.target.value) || 0)} className="w-full max-w-[100px] mx-auto h-8 text-center text-xs rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all outline-none" />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <input type="number" min="0" value={target.billValueMps} onChange={(e) => handleBulkTargetChange(index, "billValueMps", parseInt(e.target.value) || 0)} className="w-full max-w-[100px] mx-auto h-8 text-center text-xs rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all outline-none" />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <input type="number" min="0" value={target.billValueBarcodePrinters} onChange={(e) => handleBulkTargetChange(index, "billValueBarcodePrinters", parseInt(e.target.value) || 0)} className="w-full max-w-[100px] mx-auto h-8 text-center text-xs rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all outline-none" />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <input type="number" min="0" value={target.billValuePaperShredder} onChange={(e) => handleBulkTargetChange(index, "billValuePaperShredder", parseInt(e.target.value) || 0)} className="w-full max-w-[100px] mx-auto h-8 text-center text-xs rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all outline-none" />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <input type="number" min="0" value={target.billValueDuplicator} onChange={(e) => handleBulkTargetChange(index, "billValueDuplicator", parseInt(e.target.value) || 0)} className="w-full max-w-[100px] mx-auto h-8 text-center text-xs rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all outline-none" />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <input type="number" min="0" value={target.billValueBarcodeScanner} onChange={(e) => handleBulkTargetChange(index, "billValueBarcodeScanner", parseInt(e.target.value) || 0)} className="w-full max-w-[100px] mx-auto h-8 text-center text-xs rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all outline-none" />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <input type="number" min="0" value={target.billValueSolutions} onChange={(e) => handleBulkTargetChange(index, "billValueSolutions", parseInt(e.target.value) || 0)} className="w-full max-w-[100px] mx-auto h-8 text-center text-xs rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all outline-none" />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <input type="number" min="0" value={target.billValueTender} onChange={(e) => handleBulkTargetChange(index, "billValueTender", parseInt(e.target.value) || 0)} className="w-full max-w-[100px] mx-auto h-8 text-center text-xs rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all outline-none" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
              <p className="text-xs text-slate-400">
                Editing targets for <span className="font-semibold text-slate-600">{editableTargets.length} member{(editableTargets.length !== 1 ? "s" : "")}</span>.
                Changes will be saved for <span className="font-semibold text-slate-600">{MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}</span>.
              </p>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBulkModal(false)}
                  className="h-10 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={bulkSaving}
                  onClick={handleBulkSave}
                  className="h-10 text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all font-semibold"
                >
                  {bulkSaving ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      <span>Set for {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
