"use client"

import { useEffect, useState, useMemo, ElementType } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Phone, Calendar, Users, Mail, Banknote, Target, TrendingUp, TrendingDown, Minus, LogOut, X } from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"

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

interface Activity {
  activityDate: string
  userId: User
  coldCallsMade: number
  followUpCallsMade: number
  newAppointmentsFixed: number
  customerVisitsCompleted: number
  salesEmailsSent: number
  ordersClosedToday: number
}

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6366f1"]

interface KpiMetric {
  name: string
  icon: ElementType
  color: string
  bg?: string
  target: number
  achieved: number
  percentage: number
}

export default function KpiDashboardPage() {
  const router = useRouter()
  const { logout } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [targets, setTargets] = useState<KpiTarget[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState("all")
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: ""
  })

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

  const fetchData = async () => {
    try {
      const [targetsRes, activitiesRes, usersRes] = await Promise.all([
        axios.get("/api/kpi-targets", { withCredentials: true }),
        axios.get("/api/static-form/activity", { withCredentials: true }),
        axios.get("/api/static-form/users", { withCredentials: true }),
      ])
      
      setTargets(targetsRes.data.targets || [])
      setActivities(activitiesRes.data.activities || [])
      setUsers(usersRes.data.users || [])
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const handleDateRangeChange = (field: "start" | "end", value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }))
  }

  const clearDateRange = () => {
    setDateRange({ start: "", end: "" })
  }

  const hasDateRange = dateRange.start && dateRange.end

  const combinedMetrics = useMemo(() => {
    const month = parseInt(selectedMonth)
    const year = parseInt(selectedYear)

    const relevantTargets = targets.filter(t => t.month === month && t.year === year)

    let relevantActivities = activities.filter(a => {
      const activityDate = new Date(a.activityDate)
      return activityDate.getMonth() + 1 === month && activityDate.getFullYear() === year
    })

    if (hasDateRange) {
      const startDate = new Date(dateRange.start)
      const endDate = new Date(dateRange.end)
      endDate.setHours(23, 59, 59, 999)
      
      relevantActivities = relevantActivities.filter(a => {
        const activityDate = new Date(a.activityDate)
        return activityDate >= startDate && activityDate <= endDate
      })
    }

    const totalAchieved = {
      coldCalls: relevantActivities.reduce((sum, a) => sum + (a.coldCallsMade || 0), 0),
      followUpCalls: relevantActivities.reduce((sum, a) => sum + (a.followUpCallsMade || 0), 0),
      appointments: relevantActivities.reduce((sum, a) => sum + (a.newAppointmentsFixed || 0), 0),
      visits: relevantActivities.reduce((sum, a) => sum + (a.customerVisitsCompleted || 0), 0),
      emails: relevantActivities.reduce((sum, a) => sum + (a.salesEmailsSent || 0), 0),
      orders: relevantActivities.reduce((sum, a) => sum + (a.ordersClosedToday || 0), 0),
    }

    const totalTargets = relevantTargets.reduce<{ coldCalls: number; followUpCalls: number; appointments: number; visits: number; emails: number; orders: number }>((acc, t) => ({
      coldCalls: acc.coldCalls + t.coldCallsMade,
      followUpCalls: acc.followUpCalls + t.followUpCallsMade,
      appointments: acc.appointments + t.newAppointmentsFixed,
      visits: acc.visits + t.customerVisitsCompleted,
      emails: acc.emails + t.salesEmailsSent,
      orders: acc.orders + t.ordersClosedTodayValue,
    }), { coldCalls: 0, followUpCalls: 0, appointments: 0, visits: 0, emails: 0, orders: 0 })

    const calculatePercentage = (achieved: number, targetVal: number) => {
      if (targetVal === 0) return achieved > 0 ? 100 : 0
      return Math.round((achieved / targetVal) * 100)
    }

    return [
      {
        name: "Cold Calls",
        icon: Phone,
        color: "text-blue-500",
        bg: "bg-blue-50",
        target: totalTargets.coldCalls,
        achieved: totalAchieved.coldCalls,
        percentage: calculatePercentage(totalAchieved.coldCalls, totalTargets.coldCalls),
      },
      {
        name: "Follow-up Calls",
        icon: Phone,
        color: "text-amber-500",
        bg: "bg-amber-50",
        target: totalTargets.followUpCalls,
        achieved: totalAchieved.followUpCalls,
        percentage: calculatePercentage(totalAchieved.followUpCalls, totalTargets.followUpCalls),
      },
      {
        name: "Appointments",
        icon: Calendar,
        color: "text-emerald-500",
        bg: "bg-emerald-50",
        target: totalTargets.appointments,
        achieved: totalAchieved.appointments,
        percentage: calculatePercentage(totalAchieved.appointments, totalTargets.appointments),
      },
      {
        name: "Visits",
        icon: Users,
        color: "text-purple-500",
        bg: "bg-purple-50",
        target: totalTargets.visits,
        achieved: totalAchieved.visits,
        percentage: calculatePercentage(totalAchieved.visits, totalTargets.visits),
      },
      {
        name: "Emails",
        icon: Mail,
        color: "text-rose-500",
        bg: "bg-rose-50",
        target: totalTargets.emails,
        achieved: totalAchieved.emails,
        percentage: calculatePercentage(totalAchieved.emails, totalTargets.emails),
      },
      {
        name: "Orders",
        icon: Banknote,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        target: totalTargets.orders,
        achieved: totalAchieved.orders,
        percentage: calculatePercentage(totalAchieved.orders, totalTargets.orders),
      },
    ]
  }, [targets, activities, selectedMonth, selectedYear, dateRange, hasDateRange])

  const kpiData = useMemo(() => {
    const month = parseInt(selectedMonth)
    const year = parseInt(selectedYear)

    const relevantTargets = selectedUser === "all" 
      ? targets.filter(t => t.month === month && t.year === year)
      : targets.filter(t => t.userId._id === selectedUser && t.month === month && t.year === year)

    let relevantActivities = activities.filter(a => {
      const activityDate = new Date(a.activityDate)
      return activityDate.getMonth() + 1 === month && activityDate.getFullYear() === year
    })

    if (hasDateRange) {
      const startDate = new Date(dateRange.start)
      const endDate = new Date(dateRange.end)
      endDate.setHours(23, 59, 59, 999)
      
      relevantActivities = relevantActivities.filter(a => {
        const activityDate = new Date(a.activityDate)
        return activityDate >= startDate && activityDate <= endDate
      })
    }

    const userMetrics: Record<string, KpiMetric[]> = {}

    relevantTargets.forEach(target => {
      const userId = target.userId._id

      const userActivities = relevantActivities.filter(a => a.userId?._id === userId)

      const totalAchieved = {
        coldCalls: userActivities.reduce((sum, a) => sum + (a.coldCallsMade || 0), 0),
        followUpCalls: userActivities.reduce((sum, a) => sum + (a.followUpCallsMade || 0), 0),
        appointments: userActivities.reduce((sum, a) => sum + (a.newAppointmentsFixed || 0), 0),
        visits: userActivities.reduce((sum, a) => sum + (a.customerVisitsCompleted || 0), 0),
        emails: userActivities.reduce((sum, a) => sum + (a.salesEmailsSent || 0), 0),
        orders: userActivities.reduce((sum, a) => sum + (a.ordersClosedToday || 0), 0),
      }

      const calculatePercentage = (achieved: number, targetVal: number) => {
        if (targetVal === 0) return achieved > 0 ? 100 : 0
        return Math.round((achieved / targetVal) * 100)
      }

      userMetrics[userId] = [
        {
          name: "Cold Calls",
          icon: Phone,
          color: "text-blue-500",
          bg: "bg-blue-50",
          target: target.coldCallsMade,
          achieved: totalAchieved.coldCalls,
          percentage: calculatePercentage(totalAchieved.coldCalls, target.coldCallsMade),
        },
        {
          name: "Follow-up Calls",
          icon: Phone,
          color: "text-amber-500",
          bg: "bg-amber-50",
          target: target.followUpCallsMade,
          achieved: totalAchieved.followUpCalls,
          percentage: calculatePercentage(totalAchieved.followUpCalls, target.followUpCallsMade),
        },
        {
          name: "Appointments",
          icon: Calendar,
          color: "text-emerald-500",
          bg: "bg-emerald-50",
          target: target.newAppointmentsFixed,
          achieved: totalAchieved.appointments,
          percentage: calculatePercentage(totalAchieved.appointments, target.newAppointmentsFixed),
        },
        {
          name: "Visits",
          icon: Users,
          color: "text-purple-500",
          bg: "bg-purple-50",
          target: target.customerVisitsCompleted,
          achieved: totalAchieved.visits,
          percentage: calculatePercentage(totalAchieved.visits, target.customerVisitsCompleted),
        },
        {
          name: "Emails",
          icon: Mail,
          color: "text-rose-500",
          bg: "bg-rose-50",
          target: target.salesEmailsSent,
          achieved: totalAchieved.emails,
          percentage: calculatePercentage(totalAchieved.emails, target.salesEmailsSent),
        },
        {
          name: "Orders",
          icon: Banknote,
          color: "text-emerald-600",
          bg: "bg-emerald-50",
          target: target.ordersClosedTodayValue,
          achieved: totalAchieved.orders,
          percentage: calculatePercentage(totalAchieved.orders, target.ordersClosedTodayValue),
        },
      ]
    })

    return {
      userMetrics,
      users: relevantTargets.map(t => ({
        id: t.userId._id,
        name: t.userId.name,
        metrics: userMetrics[t.userId._id],
      })),
      combinedMetrics: selectedUser === "all" ? combinedMetrics : null,
    }
  }, [targets, activities, selectedUser, selectedMonth, selectedYear, dateRange, hasDateRange, combinedMetrics])

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 100) return "text-emerald-600"
    if (percentage >= 70) return "text-amber-600"
    return "text-red-600"
  }

  const getTrendIcon = (percentage: number) => {
    if (percentage >= 100) return <TrendingUp className="h-4 w-4 text-emerald-500" />
    if (percentage >= 70) return <Minus className="h-4 w-4 text-amber-500" />
    return <TrendingDown className="h-4 w-4 text-red-500" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">KPI Performance Dashboard</h1>
          <p className="text-slate-500 mt-1 text-lg">Real-time tracking of team productivity against monthly benchmarks</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 px-4 py-1.5 font-semibold text-sm">
            <TrendingUp className="w-4 h-4 mr-2" />
            Live Analysis
          </Badge>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="border-slate-200 shadow-lg bg-white overflow-hidden ring-1 ring-slate-200/50">
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Users className="w-3.5 h-3.5" />
            Dashboard Filters
          </h3>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Team Member</Label>
              <Select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                options={[{ value: "all", label: "Entire Team" }, ...users.map(u => ({ value: u._id, label: u.name }))]}
                className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Month</Label>
              <Select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                options={MONTHS}
                className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Year</Label>
              <Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                options={YEARS}
                className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Start Date</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => handleDateRangeChange("start", e.target.value)}
                className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">End Date</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => handleDateRangeChange("end", e.target.value)}
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10 flex-1"
                />
                {hasDateRange && (
                  <Button variant="ghost" size="icon" onClick={clearDateRange} className="h-10 w-10 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all rounded-lg">
                    <X size={18} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {kpiData.users.length === 0 ? (
        <Card className="py-24 text-center border-dashed border-2 border-slate-200 bg-slate-50/50 rounded-2xl">
          <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
            <Target className="h-12 w-12 text-slate-300" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">No KPI targets found</h2>
          <p className="text-slate-500 max-w-sm mx-auto mb-8">No performance data matches your current filter selection. Start by setting targets for your team.</p>
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-12 rounded-xl shadow-lg shadow-indigo-100 font-bold transition-all" 
            onClick={() => window.location.href = "/admin/kpi"}
          >
            Configure KPI Targets
          </Button>
        </Card>
      ) : (
        <div className="space-y-12">
          {/* Summary View (All Users) */}
          {selectedUser === "all" && kpiData.combinedMetrics && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Team Overview</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {kpiData.combinedMetrics.map((metric, idx) => {
                  const pieData = [
                    { name: "Achieved", value: metric.achieved },
                    { name: "Target", value: Math.max(0, metric.target - metric.achieved) },
                  ]

                  return (
                    <Card key={idx} className="border-slate-200 shadow-xl overflow-hidden group hover:ring-2 hover:ring-indigo-500/20 transition-all bg-white rounded-2xl">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl bg-slate-50 group-hover:bg-indigo-50 transition-colors`}>
                              <metric.icon className={`h-6 w-6 ${metric.color}`} />
                            </div>
                            <span className="font-bold text-slate-800 text-lg">{metric.name}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            {getTrendIcon(metric.percentage)}
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Trend</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 items-center gap-4">
                          <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                                <Pie
                                  data={pieData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={35}
                                  outerRadius={50}
                                  paddingAngle={5}
                                  dataKey="value"
                                  stroke="none"
                                >
                                  <Cell fill="#10b981" />
                                  <Cell fill="#f59e0b" />
                                </Pie>
                                <Tooltip 
                                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-slate-500">Achievement</p>
                              <p className={`text-4xl font-black ${getPercentageColor(metric.percentage)} tracking-tight`}>
                                {metric.percentage}%
                              </p>
                            </div>
                            <div className="space-y-1.5 pt-2 border-t border-slate-50">
                              <div className="flex justify-between text-xs font-bold">
                                <span className="text-slate-400">Total:</span>
                                <span className="text-slate-900">{metric.achieved.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-xs font-bold">
                                <span className="text-slate-400">Target:</span>
                                <span className="text-slate-900">{metric.target.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Individual User Cards */}
          <div className="space-y-8 pt-8 border-t border-slate-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
                <Target className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {selectedUser === "all" ? "Detailed Team Performance" : "Individual Performance"}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-12">
              {kpiData.users.map(user => (
                <Card key={user.id} className="border-slate-200 shadow-2xl overflow-hidden bg-white rounded-3xl border-l-[6px] border-l-indigo-600">
                  <div className="bg-slate-900 px-8 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-xl border border-indigo-500/30">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white tracking-tight">{user.name}</h3>
                        <p className="text-indigo-300/60 text-xs font-bold uppercase tracking-widest mt-0.5">Performance Report</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-indigo-500/30 text-indigo-300 bg-indigo-500/5 px-4 py-1.5 rounded-full font-bold">
                      {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
                    </Badge>
                  </div>
                  
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-8">
                      {user.metrics?.map((metric, idx) => {
                        const pieData = [
                          { name: "Achieved", value: metric.achieved },
                          { name: "Target", value: Math.max(0, metric.target - metric.achieved) },
                        ]

                        return (
                          <div key={idx} className="flex flex-col items-center group">
                            <div className="w-full flex items-center justify-between mb-4">
                              <div className={`p-2 rounded-lg ${metric.bg || 'bg-slate-50'} group-hover:scale-110 transition-transform`}>
                                <metric.icon className={`h-4 w-4 ${metric.color}`} />
                              </div>
                              {getTrendIcon(metric.percentage)}
                            </div>

                            <div className="h-[220px] w-full relative">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                                  <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={35}
                                    outerRadius={50}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                  >
                                    <Cell fill="#10b981" />
                                    <Cell fill="#f59e0b" />
                                  </Pie>
                                  <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                  />
                                  <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                </PieChart>
                              </ResponsiveContainer>
                              <div className="absolute inset-x-0 top-[35%] flex flex-col items-center justify-center pointer-events-none">
                                <span className={`text-lg font-black ${getPercentageColor(metric.percentage)} tracking-tighter`}>
                                  {metric.percentage}%
                                </span>
                              </div>
                            </div>
                            <div className="mt-4 text-center space-y-1">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{metric.name}</p>
                              <p className="text-sm font-black text-slate-800">
                                {metric.achieved.toLocaleString()} <span className="text-slate-300 mx-1">/</span> {metric.target.toLocaleString()}
                              </p>
                            </div>
                            
                            {/* Daily Insight */}
                            <div className="mt-4 w-full pt-3 border-t border-slate-50">
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Daily Goal</span>
                                <Badge variant="secondary" className="bg-slate-50 text-slate-600 font-bold text-[10px] border-none px-2">
                                  {Math.round(metric.target / 22)} Units
                                </Badge>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}