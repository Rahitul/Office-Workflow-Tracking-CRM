"use client"

import { useEffect, useState, useCallback } from "react"
import axios from "axios"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Filter, X } from "lucide-react"

interface UserData {
  _id: string
  name: string
  email: string
  role: string
}

interface TrainingAssignment {
  _id: string
  trainingId: { _id: string; title: string; productId: { _id: string; name: string; companyId: { _id: string; name: string } } }
  assignedTo: { _id: string; name: string; email: string; role: string }
  priority: string
  status: string
  assignedAt: string
  month: string
  brandName?: string
  productName?: string
}

export default function AdminAssignedTrainingPage() {
  const [assignments, setAssignments] = useState<TrainingAssignment[]>([])
  const [users, setUsers] = useState<UserData[]>([])
  const [filterUser, setFilterUser] = useState("")
  const [filterPriority, setFilterPriority] = useState("")
  const [filterTraining, setFilterTraining] = useState("")
  const [filterMonth, setFilterMonth] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get("/api/users", { withCredentials: true })
      setUsers(response.data.users || [])
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }, [])

  const fetchAssignments = useCallback(async () => {
    try {
      const response = await axios.get("/api/training-assignments", { withCredentials: true })
      setAssignments(response.data.assignments || [])
    } catch (error) {
      console.error("Failed to fetch assignments:", error)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    fetchAssignments()
  }, [fetchUsers, fetchAssignments])

  const assignableUsers = users.filter(u => u.role === "user" || u.role === "service" || u.role === "marketing")

  const filteredAssignments = assignments.filter(a => {
    const matchesUser = !filterUser || a.assignedTo?._id === filterUser || a.assignedTo?.name?.toLowerCase().includes(filterUser.toLowerCase())
    const matchesPriority = !filterPriority || (a.priority || "medium") === filterPriority
    const matchesTraining = !filterTraining || a.trainingId?.title?.toLowerCase().includes(filterTraining.toLowerCase())
    const matchesMonth = !filterMonth || a.month === filterMonth
    const matchesStatus = !filterStatus || a.status === filterStatus
    return matchesUser && matchesPriority && matchesTraining && matchesMonth && matchesStatus
  })

  const statusGroups = {
    pending: filteredAssignments.filter(a => a.status === "pending"),
    in_progress: filteredAssignments.filter(a => a.status === "in_progress"),
    completed: filteredAssignments.filter(a => a.status === "completed"),
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Assigned Training</h1>
        <p className="text-slate-500">View all training assignments from ESBD</p>
      </div>

      <Card className="border-slate-200 shadow-lg bg-white">
        <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            Assigned Trainings List
          </CardTitle>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </CardHeader>
        <CardContent className="p-6">
          {showFilters && (
            <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Filter by User</label>
                  <select
                    value={filterUser}
                    onChange={(e) => setFilterUser(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">All Users</option>
                    {assignableUsers.map((user) => (
                      <option key={user._id} value={user._id}>{user.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Filter by Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Filter by Priority</label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">All Priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Filter by Training</label>
                  <input
                    type="text"
                    placeholder="Search training name..."
                    value={filterTraining}
                    onChange={(e) => setFilterTraining(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Filter by Month</label>
                  <input
                    type="month"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
              </div>
              {(filterUser || filterPriority || filterTraining || filterMonth || filterStatus) && (
                <button
                  onClick={() => { setFilterUser(""); setFilterPriority(""); setFilterTraining(""); setFilterMonth(""); setFilterStatus("") }}
                  className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                >
                  <X className="w-3 h-3" />
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {filteredAssignments.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No trainings assigned yet</p>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-orange-700">Pending</h3>
                    <Badge className="bg-orange-100 text-orange-700">{statusGroups.pending.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {statusGroups.pending.slice(0, 3).map((assignment) => (
                      <div key={assignment._id} className="p-3 bg-white rounded-lg border border-orange-100">
                        <p className="font-medium text-slate-900 text-sm">{assignment.trainingId?.title}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {assignment.assignedTo?.name} ({assignment.assignedTo?.role}) • {assignment.month || formatDate(assignment.assignedAt)}
                        </p>
                      </div>
                    ))}
                    {statusGroups.pending.length > 3 && (
                      <p className="text-xs text-orange-600">+ {statusGroups.pending.length - 3} more</p>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-blue-700">In Progress</h3>
                    <Badge className="bg-blue-100 text-blue-700">{statusGroups.in_progress.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {statusGroups.in_progress.slice(0, 3).map((assignment) => (
                      <div key={assignment._id} className="p-3 bg-white rounded-lg border border-blue-100">
                        <p className="font-medium text-slate-900 text-sm">{assignment.trainingId?.title}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {assignment.assignedTo?.name} ({assignment.assignedTo?.role}) • {assignment.month || formatDate(assignment.assignedAt)}
                        </p>
                      </div>
                    ))}
                    {statusGroups.in_progress.length > 3 && (
                      <p className="text-xs text-blue-600">+ {statusGroups.in_progress.length - 3} more</p>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-green-700">Completed</h3>
                    <Badge className="bg-green-100 text-green-700">{statusGroups.completed.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {statusGroups.completed.slice(0, 3).map((assignment) => (
                      <div key={assignment._id} className="p-3 bg-white rounded-lg border border-green-100">
                        <p className="font-medium text-slate-900 text-sm">{assignment.trainingId?.title}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {assignment.assignedTo?.name} ({assignment.assignedTo?.role}) • {assignment.month || formatDate(assignment.assignedAt)}
                        </p>
                      </div>
                    ))}
                    {statusGroups.completed.length > 3 && (
                      <p className="text-xs text-green-600">+ {statusGroups.completed.length - 3} more</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h3 className="font-semibold text-slate-700 mb-4">All Assignments ({filteredAssignments.length})</h3>
                <div className="space-y-3">
                  {filteredAssignments.map((assignment) => {
                    const brandName = assignment.brandName || ""
                    const productName = assignment.productName || ""
                    return (
                      <div key={assignment._id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-900">{assignment.trainingId?.title}</p>
                            <p className="text-sm text-slate-500">{brandName} • {productName}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              Assigned to: {assignment.assignedTo?.name} ({assignment.assignedTo?.role})
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {assignment.month && <span>Month: {assignment.month}</span>}
                              {!assignment.month && assignment.assignedAt && <span>Date: {formatDate(assignment.assignedAt)}</span>}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${
                              (assignment.priority || "medium") === "high" ? "bg-red-100 text-red-700" :
                              (assignment.priority || "medium") === "medium" ? "bg-yellow-100 text-yellow-700" :
                              "bg-green-100 text-green-700"
                            }`}>
                              {assignment.priority || "medium"}
                            </Badge>
                            <Badge className={`text-xs ${
                              assignment.status === "completed" ? "bg-green-100 text-green-700" :
                              assignment.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                              "bg-orange-100 text-orange-700"
                            }`}>
                              {assignment.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}