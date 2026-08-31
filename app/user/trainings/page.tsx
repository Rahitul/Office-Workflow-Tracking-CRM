"use client"

import { useEffect, useState, useCallback } from "react"
import axios from "axios"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { GraduationCap, CheckCircle, ArrowRight, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface TrainingAssignment {
  _id: string
  trainingId: {
    _id: string
    title: string
    description: string
    content: string
    productId: { name: string; companyId: { name: string } }
  }
  priority: string
  status: "pending" | "in_progress" | "completed"
  createdAt: string
  month: string
  brandName?: string
  productName?: string
  assignedAt?: string
  startedAt?: string
  completedAt?: string
}

export default function UserTrainingsPage() {
  const [assignments, setAssignments] = useState<TrainingAssignment[]>([])
  const [selectedTraining, setSelectedTraining] = useState<TrainingAssignment | null>(null)
  const [filterPriority, setFilterPriority] = useState("")
  const [filterMonth, setFilterMonth] = useState("")
  const [filterTraining, setFilterTraining] = useState("")

  const fetchAssignments = useCallback(async () => {
    try {
      const response = await axios.get("/api/training-assignments", { withCredentials: true })
      setAssignments(response.data.assignments || [])
    } catch (error) {
      console.error("Failed to fetch assignments:", error)
    }
  }, [])

  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-100 text-emerald-700">Completed</Badge>
      case "in_progress":
        return <Badge className="bg-amber-100 text-amber-700">In Progress</Badge>
      default:
        return <Badge className="bg-slate-100 text-slate-700">Pending</Badge>
    }
  }

  const updateStatus = async (id: string, newStatus: "pending" | "in_progress" | "completed") => {
    try {
      await axios.put(`/api/training-assignments/${id}`, { status: newStatus }, { withCredentials: true })
      setAssignments(assignments.map(a => a._id === id ? { ...a, status: newStatus } : a))
      if (selectedTraining?._id === id) {
        setSelectedTraining({ ...selectedTraining, status: newStatus })
      }
    } catch (error) {
      console.error("Failed to update status:", error)
      alert("Failed to update status")
    }
  }

  const filteredAssignments = assignments.filter(a => {
    const matchesPriority = !filterPriority || (a.priority || "medium") === filterPriority
    const matchesMonth = !filterMonth || a.month === filterMonth
    const matchesTraining = !filterTraining || a.trainingId?.title?.toLowerCase().includes(filterTraining.toLowerCase())
    return matchesPriority && matchesMonth && matchesTraining
  })

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Trainings</h1>
        <p className="text-slate-500">View and complete assigned trainings</p>
      </div>

      {assignments.length === 0 ? (
        <Card className="border-slate-200 shadow-lg bg-white">
          <CardContent className="p-12 text-center">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">No trainings assigned yet</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-slate-200 shadow-lg bg-white">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Filter by Month</label>
                  <input
                    type="month"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Filter by Training</label>
                  <input
                    type="text"
                    placeholder="Search training..."
                    value={filterTraining}
                    onChange={(e) => setFilterTraining(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
              </div>
              {(filterPriority || filterMonth || filterTraining) && (
                <button
                  onClick={() => { setFilterPriority(""); setFilterMonth(""); setFilterTraining("") }}
                  className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 mt-2"
                >
                  <X className="w-3 h-3" />
                  Clear Filters
                </button>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-slate-200 shadow-lg bg-white">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-emerald-600" />
                  Assigned Trainings ({filteredAssignments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 max-h-96 overflow-y-auto">
                {filteredAssignments.map((assignment) => (
                  <div
                    key={assignment._id}
                    onClick={() => setSelectedTraining(assignment)}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      selectedTraining?._id === assignment._id
                        ? "bg-emerald-50 border border-emerald-200"
                        : "bg-slate-50 border border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-slate-900">
                          {assignment.trainingId?.title || "Untitled"}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {assignment.brandName || "Unknown"} - {assignment.productName || "Unknown"}
                        </p>
                        {assignment.month && (
                          <p className="text-xs text-slate-500 mt-1">Month: {assignment.month}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${
                          (assignment.priority || "medium") === "high" ? "bg-red-100 text-red-700" :
                          (assignment.priority || "medium") === "medium" ? "bg-yellow-100 text-yellow-700" :
                          "bg-green-100 text-green-700"
                        }`}>
                          {assignment.priority || "medium"}
                        </Badge>
                        {getStatusBadge(assignment.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-lg bg-white">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-emerald-600" />
                  Training Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {selectedTraining ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        {selectedTraining.trainingId?.title}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        {selectedTraining.brandName || "Unknown"} - {selectedTraining.productName || "Unknown"}
                      </p>
                      {selectedTraining.month && (
                        <p className="text-sm text-slate-500 mt-1">Month: {selectedTraining.month}</p>
                      )}
                      <div className="text-xs text-slate-500 mt-2 space-y-1">
                        <p>Assigned: {selectedTraining.assignedAt ? new Date(selectedTraining.assignedAt).toLocaleString() : "-"}</p>
                        {selectedTraining.startedAt && (
                          <p>Started: {new Date(selectedTraining.startedAt).toLocaleString()}</p>
                        )}
                        {selectedTraining.completedAt && (
                          <p>Completed: {new Date(selectedTraining.completedAt).toLocaleString()}</p>
                        )}
                      </div>
                    </div>

                    {selectedTraining.trainingId?.description && (
                      <p className="text-slate-600">{selectedTraining.trainingId.description}</p>
                    )}

                    <div className="p-4 bg-slate-50 rounded-lg">
                      <h4 className="font-semibold text-slate-700 mb-2">Training Content</h4>
                      <p className="text-slate-600 whitespace-pre-wrap">
                        {selectedTraining.trainingId?.content}
                      </p>
                    </div>

                    {selectedTraining.status === "pending" && (
                      <Button onClick={() => updateStatus(selectedTraining._id, "in_progress")} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Start Training
                      </Button>
                    )}

                    {selectedTraining.status === "in_progress" && (
                      <Button onClick={() => updateStatus(selectedTraining._id, "completed")} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Completed
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <ArrowRight className="w-8 h-8 mx-auto mb-4 text-slate-300" />
                    <p>Select a training to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}