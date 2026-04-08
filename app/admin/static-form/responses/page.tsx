"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { Phone, Calendar, Users, Mail, Search, Filter } from "lucide-react"
import { useAuthStore } from "@/store/authStore"

interface User {
  _id: string
  name: string
  email: string
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
  submittedAt: string
}

export default function ResponsesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedUser, setSelectedUser] = useState("all")

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

  const filteredActivities = activities.filter((a) => {
    if (selectedUser !== "all" && a.userId && (a.userId as any)._id !== selectedUser) return false
    return true
  })

  if (loading && activities.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Activity Responses</h1>
        <p className="text-slate-500">View all submitted activity forms</p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Responses
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-slate-700">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-slate-700">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userFilter" className="text-slate-700">User</Label>
              <Select
                id="userFilter"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                options={[{ value: "all", label: "All Users" }, ...users.map((u) => ({ value: u._id, label: u.name }))]}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleFilter}
                className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Filter
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50">
          <CardTitle className="text-lg text-slate-900">
            Total Responses: {filteredActivities.length}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Date</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">User</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-slate-600">
                    <Phone className="h-4 w-4 inline mr-1 text-blue-500" />
                    Cold Calls
                  </th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-slate-600">
                    <Phone className="h-4 w-4 inline mr-1 text-amber-500" />
                    Follow-up
                  </th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-slate-600">
                    <Calendar className="h-4 w-4 inline mr-1 text-emerald-500" />
                    Appointments
                  </th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-slate-600">
                    <Users className="h-4 w-4 inline mr-1 text-purple-500" />
                    Visits
                  </th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-slate-600">
                    <Mail className="h-4 w-4 inline mr-1 text-rose-500" />
                    Emails
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredActivities.map((activity) => (
                  <tr key={activity._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {new Date(activity.activityDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                        {activity.userId?.name || "Unknown"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-slate-900">{activity.coldCallsMade}</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-900">{activity.followUpCallsMade}</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-900">{activity.newAppointmentsFixed}</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-900">{activity.customerVisitsCompleted}</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-900">{activity.salesEmailsSent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredActivities.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              No activity responses found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
