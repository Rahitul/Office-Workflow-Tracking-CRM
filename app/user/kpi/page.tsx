"use client"

import { useEffect, useState, useMemo } from "react"
import axios from "axios"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Phone, Calendar, Users, Mail, Banknote, Target, X } from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"

interface KpiTarget {
  _id: string
  userId: { _id: string; name: string }
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
  coldCallsMade: number
  followUpCallsMade: number
  newAppointmentsFixed: number
  customerVisitsCompleted: number
  salesEmailsSent: number
  ordersClosedToday: number
}

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6366f1"]

export default function UserKpiPage() {
  const [target, setTarget] = useState<KpiTarget | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchData()
  }, [selectedMonth, selectedYear, dateRange])

  const fetchData = async () => {
    try {
      const month = parseInt(selectedMonth)
      const year = parseInt(selectedYear)
      
      const [targetsRes, activitiesRes] = await Promise.all([
        axios.get(`/api/kpi-targets?month=${month}&year=${year}`, { withCredentials: true }),
        axios.get("/api/static-form/activity", { withCredentials: true }),
      ])
      
      const targets = targetsRes.data.targets || []
      if (targets.length > 0) {
        setTarget(targets[0])
      }
      
      setActivities(activitiesRes.data.activities || [])
    } catch (error: any) {
      console.error("Failed to fetch data:", error.response?.data || error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDateRangeChange = (field: "start" | "end", value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }))
  }

  const clearDateRange = () => {
    setDateRange({ start: "", end: "" })
  }

  const hasDateRange = dateRange.start && dateRange.end

  const metrics = useMemo(() => {
    if (!target) return []

    const month = parseInt(selectedMonth)
    const year = parseInt(selectedYear)

    let userActivities = activities.filter(a => {
      const activityDate = new Date(a.activityDate)
      return activityDate.getMonth() + 1 === month && activityDate.getFullYear() === year
    })

    if (hasDateRange) {
      const startDate = new Date(dateRange.start)
      const endDate = new Date(dateRange.end)
      endDate.setHours(23, 59, 59, 999)
      
      userActivities = userActivities.filter(a => {
        const activityDate = new Date(a.activityDate)
        return activityDate >= startDate && activityDate <= endDate
      })
    }

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

    return [
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
  }, [target, activities, selectedMonth, selectedYear, dateRange, hasDateRange])

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 100) return "text-emerald-600"
    if (percentage >= 70) return "text-amber-600"
    return "text-red-600"
  }

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 100) return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Achieved</Badge>
    if (percentage >= 70) return <Badge className="bg-amber-100 text-amber-700 border-amber-200">On Track</Badge>
    return <Badge className="bg-red-100 text-red-700 border-red-200">Below Target</Badge>
  }

  const getMonthName = (month: number) => {
    const months = ["January", "February", "March", "April", "May", "June", " July", "August", "September", "October", "November", "December"]
    return months[month - 1]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!target) {
    return (
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My KPI Progress</h1>
          <p className="text-slate-500">View your monthly performance targets</p>
        </div>

        {/* Filters Section */}
        <Card className="border-slate-200 shadow-lg bg-white overflow-hidden ring-1 ring-slate-200/50">
          <div className="bg-slate-50 border-b border-slate-100 px-6 py-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Target className="w-3.5 h-3.5" />
              Filter by Period
            </h3>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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

        <Card className="py-16 text-center border-dashed">
          <Target className="h-16 w-16 mx-auto mb-4 text-slate-300" />
          <h2 className="text-lg font-semibold text-slate-700 mb-2">No KPI Target Set</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            Your administrator has not set a KPI target for {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}. 
            Please contact your admin to set your monthly targets.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My KPI Progress</h1>
          <p className="text-slate-500 mt-1 text-lg">Performance benchmarks for <span className="text-indigo-600 font-semibold">{MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 px-4 py-1.5 font-semibold text-sm rounded-full">
            <Target className="w-4 h-4 mr-2" />
            Active Target Period
          </Badge>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="border-slate-200 shadow-lg bg-white overflow-hidden ring-1 ring-slate-200/50">
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Target className="w-3.5 h-3.5" />
            Filter by Period
          </h3>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {metrics.map((metric, idx) => {
          const pieData = [
            { name: "Achieved", value: metric.achieved },
            { name: "Target", value: Math.max(0, metric.target - metric.achieved) },
          ]

          return (
            <Card key={idx} className="border-slate-200 shadow-xl overflow-hidden bg-white rounded-2xl group hover:ring-2 hover:ring-indigo-500/20 transition-all">
              <CardHeader className="pb-4 border-b border-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${metric.bg} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                      <metric.icon className={`h-6 w-6 ${metric.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900">{metric.name}</CardTitle>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Benchmark</p>
                    </div>
                  </div>
                  {getStatusBadge(metric.percentage)}
                </div>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="h-[200px] w-1/2 relative">
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
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-x-0 top-[30%] flex items-center justify-center pointer-events-none">
                      <span className={`text-xl font-black ${getPercentageColor(metric.percentage)} tracking-tight`}>
                        {metric.percentage}%
                      </span>
                    </div>
                  </div>

                  <div className="w-1/2 space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</p>
                      <p className={`text-3xl font-black ${getPercentageColor(metric.percentage)}`}>
                        {metric.percentage}%
                      </p>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-slate-50">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-400">Done:</span>
                        <span className="text-slate-900">{metric.achieved.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-400">Target:</span>
                        <span className="text-slate-900">{metric.target.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-slate-200 shadow-2xl overflow-hidden bg-slate-900 rounded-3xl">
        <div className="px-8 py-6 border-b border-white/5">
          <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
            <Target className="h-5 w-5 text-indigo-400" />
            Performance Insight Summary
          </CardTitle>
        </div>
        <CardContent className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="relative group text-center p-8 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
              <div className="text-5xl font-black text-emerald-400 mb-2">
                {metrics.filter(m => m.percentage >= 100).length}
              </div>
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-[0.2em]">Targets Met</div>
              <div className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <Target className="h-4 w-4 text-emerald-400" />
              </div>
            </div>

            <div className="relative group text-center p-8 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
              <div className="text-5xl font-black text-rose-400 mb-2">
                {metrics.filter(m => m.percentage < 70).length}
              </div>
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-[0.2em]">Needs Focus</div>
              <div className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                <Target className="h-4 w-4 text-rose-400" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}