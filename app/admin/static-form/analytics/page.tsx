"use client"

import { useEffect, useState, useMemo } from "react"
import axios from "axios"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Phone, Calendar, Users, Mail, BarChart3, Search, Filter, Banknote, Target, ListTodo, ChevronDown, ChevronUp, Eye, CheckCircle } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#6366f1", "#ec4899"]

interface User {
  _id: string
  name: string
  email: string
}

interface Visit {
  customerName: string
  primaryPurpose: string
  productsDiscussed: string[]
  outcome: string
  nextActionRequired: string
  nextActionDate: string | null
}

interface Activity {
  _id: string
  activityDate: string
  userId: User
  coldCallsMade: number
  followUpCallsMade: number
  newAppointmentsFixed: number
  customerVisitsCompleted: number
  salesEmailsSent: number
  primaryProductFocus: string
  secondaryProductFocus: string[]
  visits: Visit[]
  quotationsIssuedToday: number
  ordersClosedToday: number
  tomorrowPlan: string
  submittedAt: string
}

export default function AnalyticsPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedUser, setSelectedUser] = useState("all")
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"overview" | "visits">("overview")
  const [visitSearch, setVisitSearch] = useState("")
  const [visitFilterPurpose, setVisitFilterPurpose] = useState("all")
  const [visitFilterOutcome, setVisitFilterOutcome] = useState("all")
  const [visitPage, setVisitPage] = useState(1)
  const VISITS_PER_PAGE = 10

  const PURPOSE_OPTIONS = ["Opportunity Advancement", "Opportunity Creation", "Relationship & Account Management", "Commercial / Control", "N/A"]
  const OUTCOME_OPTIONS = ["Advanced / Positive", "Neutral – Follow up required", "Delayed", "Lost / Negative", "N/A"]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [activitiesRes, usersRes] = await Promise.all([
        axios.get("/api/static-form/activity", { withCredentials: true }),
        axios.get("/api/static-form/users", { withCredentials: true }),
      ])
      setActivities(activitiesRes.data.activities || [])
      setUsers(usersRes.data.users || [])
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilter = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)
      if (selectedUser !== "all") params.append("userId", selectedUser)

      const res = await axios.get(`/api/static-form/activity?${params}`, { withCredentials: true })
      setActivities(res.data.activities || [])
    } catch (error) {
      console.error("Failed to filter:", error)
    } finally {
      setLoading(false)
    }
  }

  const analytics = useMemo(() => {
    if (activities.length === 0) return null

    const totals = {
      coldCalls: 0,
      followUpCalls: 0,
      appointments: 0,
      visits: 0,
      emails: 0,
      quotations: 0,
      orders: 0
    }

    const byUser: Record<string, any> = {}
    const byDate: Record<string, any> = {}
    const productFocusDist: Record<string, number> = {}
    const secondaryProductDist: Record<string, number> = {}
    const visitPurposeDist: Record<string, number> = {}
    const visitOutcomeDist: Record<string, number> = {}
    const productsDiscussedDist: Record<string, number> = {}
    const quotationsByProduct: Record<string, number> = {}
    const ordersByProduct: Record<string, number> = {}

    activities.forEach((a) => {
      // Totals
      totals.coldCalls += a.coldCallsMade || 0
      totals.followUpCalls += a.followUpCallsMade || 0
      totals.appointments += a.newAppointmentsFixed || 0
      totals.visits += a.customerVisitsCompleted || 0
      totals.emails += a.salesEmailsSent || 0
      totals.quotations += a.quotationsIssuedToday || 0
      totals.orders += a.ordersClosedToday || 0

      // Primary Product Focus & Financials by Product
      if (a.primaryProductFocus) {
        productFocusDist[a.primaryProductFocus] = (productFocusDist[a.primaryProductFocus] || 0) + 1
        quotationsByProduct[a.primaryProductFocus] = (quotationsByProduct[a.primaryProductFocus] || 0) + (a.quotationsIssuedToday || 0)
        ordersByProduct[a.primaryProductFocus] = (ordersByProduct[a.primaryProductFocus] || 0) + (a.ordersClosedToday || 0)
      }

      // Secondary Products
      if (a.secondaryProductFocus && Array.isArray(a.secondaryProductFocus)) {
        a.secondaryProductFocus.forEach(p => {
          secondaryProductDist[p] = (secondaryProductDist[p] || 0) + 1
        })
      }

      // Visits Aggregation
      if (a.visits && Array.isArray(a.visits)) {
        a.visits.forEach(v => {
          if (v.primaryPurpose) {
            visitPurposeDist[v.primaryPurpose] = (visitPurposeDist[v.primaryPurpose] || 0) + 1
          }
          if (v.outcome) {
            visitOutcomeDist[v.outcome] = (visitOutcomeDist[v.outcome] || 0) + 1
          }
          if (v.productsDiscussed && Array.isArray(v.productsDiscussed)) {
            v.productsDiscussed.forEach(p => {
              if (p !== "N/A") {
                productsDiscussedDist[p] = (productsDiscussedDist[p] || 0) + 1
              }
            })
          }
        })
      }

      // By User
      const userId = a.userId?._id || "unknown"
      const userName = a.userId?.name || "Unknown"
      if (!byUser[userId]) {
        byUser[userId] = { 
          name: userName, 
          coldCalls: 0, 
          followUpCalls: 0, 
          appointments: 0, 
          visits: 0, 
          emails: 0,
          quotations: 0,
          orders: 0
        }
      }
      byUser[userId].coldCalls += a.coldCallsMade || 0
      byUser[userId].followUpCalls += a.followUpCallsMade || 0
      byUser[userId].appointments += a.newAppointmentsFixed || 0
      byUser[userId].visits += a.customerVisitsCompleted || 0
      byUser[userId].emails += a.salesEmailsSent || 0
      byUser[userId].quotations += a.quotationsIssuedToday || 0
      byUser[userId].orders += a.ordersClosedToday || 0

      // By Date
      const date = new Date(a.activityDate).toLocaleDateString()
      if (!byDate[date]) {
        byDate[date] = { 
          date, 
          coldCalls: 0, 
          followUpCalls: 0, 
          appointments: 0, 
          visits: 0, 
          emails: 0,
          quotations: 0,
          orders: 0
        }
      }
      byDate[date].coldCalls += a.coldCallsMade || 0
      byDate[date].followUpCalls += a.followUpCallsMade || 0
      byDate[date].appointments += a.newAppointmentsFixed || 0
      byDate[date].visits += a.customerVisitsCompleted || 0
      byDate[date].emails += a.salesEmailsSent || 0
      byDate[date].quotations += a.quotationsIssuedToday || 0
      byDate[date].orders += a.ordersClosedToday || 0
    })

    const formatDist = (dist: Record<string, number>) => 
      Object.entries(dist).map(([name, value]) => ({ name, value }))

    const activityTypeDist = [
      { name: "Cold Calls", value: totals.coldCalls },
      { name: "Follow-ups", value: totals.followUpCalls },
      { name: "Appts", value: totals.appointments },
      { name: "Visits", value: totals.visits },
      { name: "Emails", value: totals.emails },
    ].filter(item => item.value > 0)

    return {
      totalResponses: activities.length,
      uniqueUsers: Object.keys(byUser).length,
      totals,
      byUser: Object.values(byUser),
      byDate: Object.values(byDate).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      productFocus: formatDist(productFocusDist),
      visitPurposes: formatDist(visitPurposeDist),
      visitOutcomes: formatDist(visitOutcomeDist),
      secondaryProducts: formatDist(secondaryProductDist),
      productsDiscussed: formatDist(productsDiscussedDist),
      activityDistribution: activityTypeDist,
      quotationsByProduct: formatDist(quotationsByProduct),
      ordersByProduct: formatDist(ordersByProduct),
    }
  }, [activities])

  if (loading && activities.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activity Analytics</h1>
          <p className="text-slate-500">Analyze performance and daily metrics</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        <button
          onClick={() => { setActiveTab("overview"); setStartDate(""); setEndDate(""); setSelectedUser("all"); setVisitSearch(""); setVisitFilterPurpose("all"); setVisitFilterOutcome("all"); setVisitPage(1) }}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "overview"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => { setActiveTab("visits"); setStartDate(""); setEndDate(""); setSelectedUser("all"); setVisitSearch(""); setVisitFilterPurpose("all"); setVisitFilterOutcome("all"); setVisitPage(1) }}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "visits"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Visits
        </button>
      </div>

      {activeTab === "overview" && (
      <>
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-slate-500">Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-slate-500">End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-slate-500">User</Label>
              <Select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                options={[{ value: "all", label: "All Users" }, ...users.map(u => ({ value: u._id, label: u.name }))]}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleFilter} className="w-full bg-blue-600 hover:bg-blue-700">
                <Search className="h-4 w-4 mr-2" /> Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {!analytics || analytics.totalResponses === 0 ? (
        <Card className="py-20 text-center border-dashed">
          <p className="text-slate-500">No activity data found for the selected criteria.</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { label: "Cold Calls", value: analytics.totals.coldCalls, icon: Phone, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Follow-ups", value: analytics.totals.followUpCalls, icon: Phone, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Appts", value: analytics.totals.appointments, icon: Calendar, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Visits", value: analytics.totals.visits, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
              { label: "Emails", value: analytics.totals.emails, icon: Mail, color: "text-rose-600", bg: "bg-rose-50" },
              { label: "Quotes (BDT)", value: analytics.totals.quotations.toLocaleString(), icon: Banknote, color: "text-indigo-600", bg: "bg-indigo-50" },
              { label: "Orders (BDT)", value: analytics.totals.orders.toLocaleString(), icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
            ].map((stat, i) => (
              <Card key={i} className="border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center shrink-0`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-bold text-slate-900 truncate">{stat.value}</p>
                      <p className="text-[10px] uppercase font-semibold text-slate-500 truncate">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Activity Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.byDate}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    <Bar dataKey="coldCalls" name="Cold Calls" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="visits" name="Visits" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="orders" name="Orders (Value)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Total Activity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.activityDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {analytics.activityDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase text-slate-500 tracking-wider">Primary Product Focus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.productFocus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {analytics.productFocus.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase text-slate-500 tracking-wider">Secondary Products Promotion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.secondaryProducts}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {analytics.secondaryProducts.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase text-slate-500 tracking-wider">Visit Purposes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.visitPurposes}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {analytics.visitPurposes.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase text-slate-500 tracking-wider">Visit Outcomes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.visitOutcomes}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {analytics.visitOutcomes.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Products Discussed (Visits)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.productsDiscussed}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {analytics.productsDiscussed.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-indigo-600" />
              Submission Details
            </h2>
            <div className="space-y-4">
              {activities.map((a) => (
                <Card key={a._id} className="border-slate-200 shadow-sm overflow-hidden">
                  <div 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandedActivity(expandedActivity === a._id ? null : a._id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600">
                        {a.userId?.name?.[0] || "?"}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{a.userId?.name || "Unknown User"}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(a.activityDate).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="hidden md:flex flex-col items-end">
                        <p className="text-sm font-bold text-slate-900">৳{(a.ordersClosedToday || 0).toLocaleString()}</p>
                        <p className="text-[10px] uppercase font-semibold text-slate-400">Orders</p>
                      </div>
                      <div className="hidden md:flex flex-col items-end">
                        <p className="text-sm font-bold text-slate-900">{a.visits?.length || 0}</p>
                        <p className="text-[10px] uppercase font-semibold text-slate-400">Visits</p>
                      </div>
                      <Button variant="ghost" size="icon">
                        {expandedActivity === a._id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </Button>
                    </div>
                  </div>

                  {expandedActivity === a._id && (
                    <CardContent className="border-t border-slate-100 bg-slate-50/50 p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-xs font-bold uppercase text-slate-400 mb-3 tracking-wider flex items-center gap-2">
                              <Target className="h-3 w-3" /> Product Focus
                            </h4>
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs text-slate-500 mb-1">Primary:</p>
                                <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">{a.primaryProductFocus || "None"}</Badge>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 mb-1">Secondary:</p>
                                <div className="flex flex-wrap gap-2">
                                  {a.secondaryProductFocus?.length > 0 ? a.secondaryProductFocus.map((p, i) => (
                                    <Badge key={i} variant="outline" className="border-slate-200 bg-white text-slate-600">{p}</Badge>
                                  )) : <span className="text-sm text-slate-400 italic">None</span>}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-xs font-bold uppercase text-slate-400 mb-3 tracking-wider flex items-center gap-2">
                              <ListTodo className="h-3 w-3" /> Tomorrow's Plan
                            </h4>
                            <div className="bg-white p-4 rounded-lg border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                              {a.tomorrowPlan || "No plan provided."}
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold uppercase text-slate-400 mb-3 tracking-wider flex items-center gap-2">
                            <Users className="h-3 w-3" /> Visits ({a.visits?.length || 0})
                          </h4>
                          <div className="space-y-3">
                            {a.visits?.length > 0 ? a.visits.map((v, i) => (
                              <div key={i} className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-bold text-slate-900">{v.customerName}</p>
                                    <p className="text-xs text-slate-500">{v.primaryPurpose}</p>
                                  </div>
                                  <Badge className={
                                    v.outcome?.includes("Positive") ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                    v.outcome?.includes("Negative") ? "bg-red-100 text-red-700 border-red-200" :
                                    "bg-slate-100 text-slate-700 border-slate-200"
                                  }>
                                    {v.outcome}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                  <div>
                                    <p className="text-slate-400 mb-1 uppercase tracking-tighter font-bold">Products</p>
                                    <p className="text-slate-700">{v.productsDiscussed?.join(", ") || "None"}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-400 mb-1 uppercase tracking-tighter font-bold">Next Action ({v.nextActionDate ? new Date(v.nextActionDate).toLocaleDateString() : "No date"})</p>
                                    <p className="text-slate-700 font-medium italic">"{v.nextActionRequired}"</p>
                                  </div>
                                </div>
                              </div>
                            )) : (
                              <div className="bg-white p-8 rounded-lg border border-dashed border-slate-200 text-center">
                                <p className="text-slate-400 text-sm">No specific visit details recorded.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
      </>
      )}

      {activeTab === "visits" && (
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase text-slate-500">Start Date</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase text-slate-500">End Date</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase text-slate-500">User</Label>
                  <Select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    options={[{ value: "all", label: "All Users" }, ...users.map(u => ({ value: u._id, label: u.name }))]}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase text-slate-500">Purpose</Label>
                  <Select
                    value={visitFilterPurpose}
                    onChange={(e) => { setVisitFilterPurpose(e.target.value); setVisitPage(1) }}
                    options={[{ value: "all", label: "All Purposes" }, ...PURPOSE_OPTIONS.map(p => ({ value: p, label: p }))]}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase text-slate-500">Outcome</Label>
                  <Select
                    value={visitFilterOutcome}
                    onChange={(e) => { setVisitFilterOutcome(e.target.value); setVisitPage(1) }}
                    options={[{ value: "all", label: "All Outcomes" }, ...OUTCOME_OPTIONS.map(o => ({ value: o, label: o }))]}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleFilter} className="w-full bg-blue-600 hover:bg-blue-700">
                    <Search className="h-4 w-4 mr-2" /> Filter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  All Visits
                </CardTitle>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search customer..."
                    value={visitSearch}
                    onChange={(e) => { setVisitSearch(e.target.value); setVisitPage(1) }}
                    className="pl-9 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const allVisits = activities.flatMap((a) =>
                  (a.visits || []).map((v) => ({
                    date: a.activityDate,
                    userName: a.userId?.name || "Unknown",
                    customerName: v.customerName,
                    primaryPurpose: v.primaryPurpose,
                    productsDiscussed: v.productsDiscussed,
                    outcome: v.outcome,
                    nextActionRequired: v.nextActionRequired,
                    nextActionDate: v.nextActionDate,
                  }))
                )

                const filtered = allVisits.filter((v) => {
                  if (visitSearch && !v.customerName.toLowerCase().includes(visitSearch.toLowerCase())) return false
                  if (visitFilterPurpose !== "all" && v.primaryPurpose !== visitFilterPurpose) return false
                  if (visitFilterOutcome !== "all" && v.outcome !== visitFilterOutcome) return false
                  return true
                })

                const totalPages = Math.ceil(filtered.length / VISITS_PER_PAGE)
                const paginated = filtered.slice((visitPage - 1) * VISITS_PER_PAGE, visitPage * VISITS_PER_PAGE)

                if (filtered.length === 0) {
                  return (
                    <div className="py-20 text-center">
                      <p className="text-slate-500">No visits found.</p>
                    </div>
                  )
                }

                return (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-slate-500">Showing {Math.min((visitPage - 1) * VISITS_PER_PAGE + 1, filtered.length)}–{Math.min(visitPage * VISITS_PER_PAGE, filtered.length)} of {filtered.length} visits</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-3 px-4 font-semibold text-slate-600">Date</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-600">User</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-600">Customer</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-600">Purpose</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-600">Products</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-600">Outcome</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-600">Next Action</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-600">Next Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginated.map((v, i) => (
                            <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-3 px-4 whitespace-nowrap">
                                {new Date(v.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </td>
                              <td className="py-3 px-4 font-medium">{v.userName}</td>
                              <td className="py-3 px-4 font-medium">{v.customerName}</td>
                              <td className="py-3 px-4">{v.primaryPurpose}</td>
                              <td className="py-3 px-4">{v.productsDiscussed?.join(", ") || "—"}</td>
                              <td className="py-3 px-4">
                                <Badge className={
                                  v.outcome?.includes("Positive") ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                  v.outcome?.includes("Negative") ? "bg-red-100 text-red-700 border-red-200" :
                                  "bg-slate-100 text-slate-700 border-slate-200"
                                }>
                                  {v.outcome}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 max-w-[200px] truncate">{v.nextActionRequired}</td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                {v.nextActionDate ? new Date(v.nextActionDate).toLocaleDateString() : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={visitPage === 1}
                          onClick={() => setVisitPage(visitPage - 1)}
                        >
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((p) => p === 1 || p === totalPages || Math.abs(p - visitPage) <= 2)
                            .reduce<(number | string)[]>((acc, p, idx, arr) => {
                              if (idx > 0 && typeof arr[idx - 1] === "number" && p - (arr[idx - 1] as number) > 1) {
                                acc.push("...")
                              }
                              acc.push(p)
                              return acc
                            }, [])
                            .map((p, idx) =>
                              typeof p === "string" ? (
                                <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">...</span>
                              ) : (
                                <Button
                                  key={p}
                                  variant={visitPage === p ? "default" : "outline"}
                                  size="sm"
                                  className={visitPage === p ? "bg-blue-600 hover:bg-blue-700" : ""}
                                  onClick={() => setVisitPage(p)}
                                >
                                  {p}
                                </Button>
                              )
                            )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={visitPage === totalPages}
                          onClick={() => setVisitPage(visitPage + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                )
              })()}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
