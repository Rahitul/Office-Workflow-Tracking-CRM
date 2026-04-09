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
import { Phone, Calendar, Users, Mail, Banknote, Target, Trash2, Save, CheckCircle, LogOut, ClipboardList } from "lucide-react"
import { useAuthStore } from "@/store/authStore"

interface User {
  _id: string
  name: string
  email: string
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

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/api/static-form/users", { withCredentials: true })
      setUsers(res.data.users || [])
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
    } else {
      setColdCallsMade(0)
      setFollowUpCallsMade(0)
      setNewAppointmentsFixed(0)
      setCustomerVisitsCompleted(0)
      setSalesEmailsSent(0)
      setOrdersClosedTodayValue(0)
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
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Target className="h-5 w-5 text-indigo-600" />
                Configure Target
              </h2>
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
                          onChange={(e) => setOrdersClosedTodayValue(parseInt(e.target.value) || 0)}
                          className="pl-7 bg-slate-50 border-slate-200 focus:bg-white transition-all focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    </div>
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
    </div>
  )
}
