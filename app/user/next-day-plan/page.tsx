"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ListTodo, Calendar, User, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react"
import { useAuthStore } from "@/store/authStore"

interface Activity {
  _id: string
  activityDate: string
  userId: { _id: string; name: string }
  tomorrowPlan: string
  coldCallsMade: number
  followUpCallsMade: number
  newAppointmentsFixed: number
  customerVisitsCompleted: number
  salesEmailsSent: number
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

export default function NextDayPlanPage() {
  const { user } = useAuthStore()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())

  useEffect(() => {
    fetchActivities()
  }, [selectedMonth, selectedYear])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const res = await axios.get("/api/static-form/activity", { withCredentials: true })
      setActivities(res.data.activities || [])
    } catch (error) {
      console.error("Failed to fetch activities:", error)
    } finally {
      setLoading(false)
    }
  }

  const userActivities = activities.filter(a => {
    if (user && a.userId?._id !== user._id) return false
    const activityDate = new Date(a.activityDate)
    return activityDate.getMonth() + 1 === parseInt(selectedMonth) && activityDate.getFullYear() === parseInt(selectedYear)
  }).sort((a, b) => new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime())

  const getMonthName = (month: number) => MONTHS.find(m => m.value === month.toString())?.label || ""

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <ListTodo className="h-8 w-8 text-orange-600" />
            My Next Day Plans
          </h1>
          <p className="text-slate-500 mt-1">View your submitted action plans for upcoming business days.</p>
        </div>
      </div>

      <Card className="border-slate-200 shadow-lg bg-white overflow-hidden ring-1 ring-slate-200/50">
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            Filter by Period
          </h3>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Month</label>
              <Select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                options={MONTHS}
                className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Year</label>
              <Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                options={YEARS}
                className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Records</label>
              <div className="h-10 flex items-center">
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 px-3 py-1">
                  {userActivities.length} Plans
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {userActivities.length === 0 ? (
        <Card className="py-16 text-center border-dashed border-2 border-slate-200 bg-slate-50/50 rounded-2xl">
          <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <ListTodo className="h-10 w-10 text-slate-300" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">No Plans Found</h2>
          <p className="text-slate-500 max-w-sm mx-auto">
            You haven&apos;t submitted any daily activity reports for {getMonthName(parseInt(selectedMonth))} {selectedYear}.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {userActivities.map((activity, index) => (
            <Card key={activity._id} className="border-slate-200 shadow-md overflow-hidden hover:shadow-lg transition-all">
              <div className="bg-orange-50 border-b border-orange-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{formatDate(activity.activityDate)}</h3>
                    <p className="text-xs text-orange-600 font-medium uppercase tracking-wider">Action Plan</p>
                  </div>
                </div>
                <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                  <Calendar className="w-3 h-3 mr-1" />
                  Planned
                </Badge>
              </div>
              <CardContent className="p-6">
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {activity.tomorrowPlan || "No plan submitted for this day."}
                  </p>
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Day Metrics</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-2 bg-slate-50 rounded-lg">
                      <p className="text-lg font-bold text-blue-600">{activity.coldCallsMade}</p>
                      <p className="text-[10px] text-slate-500 uppercase">Cold Calls</p>
                    </div>
                    <div className="text-center p-2 bg-slate-50 rounded-lg">
                      <p className="text-lg font-bold text-amber-600">{activity.followUpCallsMade}</p>
                      <p className="text-[10px] text-slate-500 uppercase">Follow-ups</p>
                    </div>
                    <div className="text-center p-2 bg-slate-50 rounded-lg">
                      <p className="text-lg font-bold text-emerald-600">{activity.newAppointmentsFixed}</p>
                      <p className="text-[10px] text-slate-500 uppercase">Appointments</p>
                    </div>
                    <div className="text-center p-2 bg-slate-50 rounded-lg">
                      <p className="text-lg font-bold text-purple-600">{activity.customerVisitsCompleted}</p>
                      <p className="text-[10px] text-slate-500 uppercase">Visits</p>
                    </div>
                    <div className="text-center p-2 bg-slate-50 rounded-lg">
                      <p className="text-lg font-bold text-rose-600">{activity.salesEmailsSent}</p>
                      <p className="text-[10px] text-slate-500 uppercase">Emails</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}