"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, CheckCircle, AlertCircle, Plus, Filter, X, Pencil, Trash2, Search } from "lucide-react"

interface Training {
  _id: string
  title: string
  productId: { _id: string; name: string; companyId: { _id: string; name: string } } | string
}

interface UserData {
  _id: string
  name: string
  email: string
  role: string
}

interface Company {
  _id: string
  name: string
}

interface Product {
  _id: string
  name: string
  companyId: { _id: string; name: string } | string
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
  startedAt?: string
  completedAt?: string
}

export default function AssignTrainingPage() {
  const [trainings, setTrainings] = useState<Training[]>([])
  const [users, setUsers] = useState<UserData[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [assignments, setAssignments] = useState<TrainingAssignment[]>([])
  const [selectedTraining, setSelectedTraining] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedPriority, setSelectedPriority] = useState("medium")
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [filterUser, setFilterUser] = useState("")
  const [filterPriority, setFilterPriority] = useState("")
  const [filterTraining, setFilterTraining] = useState("")
  const [filterMonth, setFilterMonth] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPriority, setEditPriority] = useState("")
  const [trainingSearch, setTrainingSearch] = useState("")
  const [showTrainingSuggestions, setShowTrainingSuggestions] = useState(false)
  const [userRoleFilter, setUserRoleFilter] = useState("")

  useEffect(() => {
    fetchTrainings()
    fetchCompanies()
    fetchProducts()
    fetchUsers()
    fetchAssignments()
  }, [])

  const fetchTrainings = async () => {
    try {
      const response = await axios.get("/api/trainings", { withCredentials: true })
      setTrainings(response.data.trainings || [])
    } catch (error) {
      console.error("Failed to fetch trainings:", error)
    }
  }

  const fetchCompanies = async () => {
    try {
      const response = await axios.get("/api/companies", { withCredentials: true })
      setCompanies(response.data.companies || [])
    } catch (error) {
      console.error("Failed to fetch companies:", error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await axios.get("/api/products", { withCredentials: true })
      setProducts(response.data.products || [])
    } catch (error) {
      console.error("Failed to fetch products:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/api/users", { withCredentials: true })
      setUsers(response.data.users || [])
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }

  const fetchAssignments = async () => {
    try {
      const response = await axios.get("/api/training-assignments", { withCredentials: true })
      setAssignments(response.data.assignments || [])
    } catch (error) {
      console.error("Failed to fetch assignments:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return
    try {
      await axios.delete(`/api/training-assignments/${id}`, { withCredentials: true })
      setAssignments(assignments.filter(a => a._id !== id))
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } }
      alert(err.response?.data?.error || "Failed to delete assignment")
    }
  }

  const startEdit = (assignment: TrainingAssignment) => {
    setEditingId(assignment._id)
    setEditPriority(assignment.priority || "medium")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditPriority("")
  }

  const saveEdit = async (id: string) => {
    try {
      await axios.put(`/api/training-assignments/${id}`, { priority: editPriority }, { withCredentials: true })
      setAssignments(assignments.map(a => a._id === id ? { ...a, priority: editPriority } : a))
      setEditingId(null)
      setEditPriority("")
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } }
      alert(err.response?.data?.error || "Failed to update assignment")
    }
  }

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    if (!selectedTraining || selectedUsers.length === 0) {
      setErrorMessage("Please select a training and at least one user")
      return
    }

    setLoading(true)

    try {
      await axios.post("/api/training-assignments", {
        trainingId: selectedTraining,
        assignedTo: selectedUsers,
        priority: selectedPriority,
        month: selectedMonth,
      }, { withCredentials: true })
      setSuccessMessage("Training assigned successfully")
      setSelectedTraining("")
      setSelectedUsers([])
      setSelectedPriority("medium")
      fetchAssignments()
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } }
      setErrorMessage(err.response?.data?.error || "Failed to assign training")
    } finally {
      setLoading(false)
    }
  }

  const trainingOptions = trainings.map(t => {
    const productId = t.productId
    let brandName = ""
    let productName = ""

    if (typeof productId === "object" && productId !== null) {
      productName = productId?.name || ""
      const companyId = productId?.companyId
      if (companyId) {
        if (typeof companyId === "object" && companyId !== null) {
          brandName = companyId.name || ""
        } else if (typeof companyId === "string") {
          brandName = companies.find(c => c._id === companyId)?.name || ""
        }
      }
    } else if (typeof productId === "string") {
      const product = products.find(p => p._id === productId)
      if (product) {
        productName = product.name || ""
        const companyId = product.companyId
        if (typeof companyId === "object" && companyId !== null) {
          brandName = companyId.name || ""
        } else if (typeof companyId === "string") {
          brandName = companies.find(c => c._id === companyId)?.name || ""
        }
      }
    }

    return {
      value: t._id,
      label: `${t.title} - (${brandName} • ${productName})`
    }
  })

  const filteredTrainingOptions = trainingSearch
    ? trainingOptions.filter(opt => 
        opt.label.toLowerCase().includes(trainingSearch.toLowerCase()) ||
        opt.label.toLowerCase().includes(trainingSearch.toLowerCase())
      )
    : trainingOptions

  const assignableUsers = users.filter(u => 
    u.role === "user" || u.role === "service" || u.role === "marketing" ||
    u.role === "user_juniors" || u.role === "service_juniors" || u.role === "marketing_juniors" || u.role === "esbd_juniors"
  )

  const filteredUsers = userRoleFilter 
    ? assignableUsers.filter(u => u.role === userRoleFilter)
    : assignableUsers

  const filteredAssignments = assignments.filter(a => {
    const matchesUser = !filterUser || a.assignedTo?._id === filterUser || a.assignedTo?.name?.toLowerCase().includes(filterUser.toLowerCase())
    const matchesPriority = !filterPriority || (a.priority || "medium") === filterPriority
    const matchesTraining = !filterTraining || a.trainingId?.title?.toLowerCase().includes(filterTraining.toLowerCase())
    const matchesMonth = !filterMonth || a.month === filterMonth
    const matchesStatus = !filterStatus || a.status === filterStatus
    return matchesUser && matchesPriority && matchesTraining && matchesMonth && matchesStatus
  })

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Assign Training</h1>
        <p className="text-slate-500">Assign trainings to salesmen, service, and marketing teams</p>
      </div>

      <Card className="border-slate-200 shadow-lg bg-white">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" />
            Assign Training to Users
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Select Training</label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={trainingSearch}
                    onChange={(e) => {
                      setTrainingSearch(e.target.value)
                      setSelectedTraining("")
                      setShowTrainingSuggestions(true)
                    }}
                    onFocus={() => setShowTrainingSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowTrainingSuggestions(false), 200)}
                    placeholder="Search training..."
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50"
                  />
                </div>
                {showTrainingSuggestions && filteredTrainingOptions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredTrainingOptions.map((opt) => (
                      <div
                        key={opt.value}
                        className="px-3 py-2 hover:bg-teal-50 cursor-pointer text-sm"
                        onClick={() => {
                          setSelectedTraining(opt.value)
                          setTrainingSearch(opt.label)
                          setShowTrainingSuggestions(false)
                        }}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Priority</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Select Users ({selectedUsers.length} selected)
              </label>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm mb-2"
              >
                <option value="">All Roles</option>
                <option value="user">User</option>
                <option value="user_juniors">User Juniors</option>
                <option value="service">Service</option>
                <option value="service_juniors">Service Juniors</option>
                <option value="marketing">Marketing</option>
                <option value="marketing_juniors">Marketing Juniors</option>
                <option value="esbd_juniors">ESBD Juniors</option>
              </select>
              {filteredUsers.length === 0 ? (
                <p className="text-slate-500 py-4">No users available for assignment</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                  {filteredUsers.map((user) => (
                    <label
                      key={user._id}
                      className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all ${
                        selectedUsers.includes(user._id)
                          ? "bg-teal-100 border border-teal-200"
                          : "bg-white border border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => handleUserToggle(user._id)}
                        className="w-4 h-4 text-teal-600 rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                      <Badge className={`text-xs capitalize ${
                        user.role === "user" || user.role === "user_juniors" ? "bg-blue-100 text-blue-700" :
                        user.role === "service" || user.role === "service_juniors" ? "bg-teal-100 text-teal-700" :
                        user.role === "marketing" || user.role === "marketing_juniors" ? "bg-pink-100 text-pink-700" :
                        "bg-purple-100 text-purple-700"
                      }`}>
                        {user.role}
                      </Badge>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !selectedTraining || selectedUsers.length === 0}
              className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              {loading ? "Assigning..." : "Assign Training"}
            </button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-lg bg-white">
        <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" />
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Filter by Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
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
                        {assignment.month && (
                          <p className="text-xs text-slate-500 mt-1">Month: {assignment.month}</p>
                        )}
                        <div className="text-xs text-slate-400 mt-1 space-y-1">
                          <p>Assigned: {assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleString() : "-"}</p>
                          {assignment.startedAt && (
                            <p>Started: {new Date(assignment.startedAt).toLocaleString()}</p>
                          )}
                          {assignment.completedAt && (
                            <p>Completed: {new Date(assignment.completedAt).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {editingId === assignment._id ? (
                          <>
                            <select
                              value={editPriority}
                              onChange={(e) => setEditPriority(e.target.value)}
                              className="h-7 text-xs rounded border border-slate-200 bg-white px-2"
                            >
                              <option value="high">High</option>
                              <option value="medium">Medium</option>
                              <option value="low">Low</option>
                            </select>
                            <button onClick={() => saveEdit(assignment._id)} className="text-green-600 hover:text-green-700">
                              <CheckCircle size={16} />
                            </button>
                            <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-600">
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <Badge className={`text-xs ${
                              (assignment.priority || "medium") === "high" ? "bg-red-100 text-red-700" :
                              (assignment.priority || "medium") === "medium" ? "bg-yellow-100 text-yellow-700" :
                              "bg-green-100 text-green-700"
                            }`}>
                              {assignment.priority || "medium"}
                            </Badge>
                            <Badge className={`text-xs ${
                              assignment.status === "completed" ? "bg-green-100 text-green-700" :
                              "bg-orange-100 text-orange-700"
                            }`}>
                              {assignment.status}
                            </Badge>
                            <button onClick={() => startEdit(assignment)} className="text-slate-400 hover:text-teal-600">
                              <Pencil size={16} />
                            </button>
                            <button onClick={() => handleDelete(assignment._id)} className="text-slate-400 hover:text-red-600">
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}