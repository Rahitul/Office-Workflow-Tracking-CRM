"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Check, Calendar, MapPin, Clock, ChevronDown, ChevronUp, X, CheckCircle, XCircle, Filter } from "lucide-react"

interface Appointment {
  _id: string
  customerName: string
  companyName: string
  designation: string
  location: string
  date: string
  time: string
  endTime: string
  visitPurpose: string
  isCompleted: boolean
  createdAt: string
  isRequested?: boolean
  status?: "pending" | "approved" | "rejected"
  requestedBy?: any
  formData?: any
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [requestedAppointments, setRequestedAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"todo" | "requested">("todo")
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  
  // Filter states
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    requestedBy: "",
  })

  const [allUsers, setAllUsers] = useState<any[]>([])
  const [formData, setFormData] = useState({
    customerName: "",
    companyName: "",
    designation: "",
    location: "",
    date: "",
    time: "",
    endTime: "",
    visitPurpose: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    fetchAppointments()
    fetchRequestedAppointments()
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/api/users", { withCredentials: true })
      setAllUsers(res.data.users || [])
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }

  const applyFilters = (appointments: Appointment[]) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date)
      
      if (filters.startDate && new Date(filters.startDate) > aptDate) return false
      if (filters.endDate && new Date(filters.endDate) < aptDate) return false
      
      if (filters.startTime && apt.time < filters.startTime) return false
      if (filters.endTime && apt.time > filters.endTime) return false
      
      if (filters.requestedBy && apt.requestedBy?._id !== filters.requestedBy) return false
      
      return true
    })
  }

  const clearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
      requestedBy: "",
    })
  }

  const fetchAppointments = async () => {
    try {
      const response = await axios.get("/api/appointments", { withCredentials: true })
      setAppointments(response.data.appointments || [])
    } catch (error) {
      console.error("Failed to fetch appointments:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRequestedAppointments = async () => {
    try {
      const response = await axios.get("/api/appointments?type=requested", { withCredentials: true })
      setRequestedAppointments(response.data.appointments || [])
    } catch (error) {
      console.error("Failed to fetch requested appointments:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSuccessMessage("")

    try {
      await axios.post("/api/appointments", formData, { withCredentials: true })
      setSuccessMessage("Appointment created successfully!")
      setFormData({
        customerName: "",
        companyName: "",
        designation: "",
        location: "",
        date: "",
        time: "",
        endTime: "",
        visitPurpose: "",
      })
      fetchAppointments()
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (error) {
      console.error("Failed to create appointment:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const toggleComplete = async (id: string, currentStatus: boolean) => {
    try {
      await axios.patch(`/api/appointments/${id}`, { isCompleted: !currentStatus }, { withCredentials: true })
      fetchAppointments()
    } catch (error) {
      console.error("Failed to update appointment:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this appointment?")) return
    try {
      await axios.delete(`/api/appointments/${id}`, { withCredentials: true })
      setAppointments(appointments.filter((a) => a._id !== id))
    } catch (error) {
      console.error("Failed to delete appointment:", error)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await axios.patch(`/api/appointments/${id}`, { status: "approved" }, { withCredentials: true })
      fetchRequestedAppointments()
      fetchAppointments()
    } catch (error) {
      console.error("Failed to approve appointment:", error)
    }
  }

  const handleReject = async (id: string) => {
    try {
      await axios.patch(`/api/appointments/${id}`, { status: "rejected" }, { withCredentials: true })
      fetchRequestedAppointments()
    } catch (error) {
      console.error("Failed to reject appointment:", error)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedCard(expandedCard === id ? null : id)
  }

  const pendingAppointments = appointments.filter((a) => !a.isCompleted)
  const completedAppointments = appointments.filter((a) => a.isCompleted)

  const filteredAppointments = applyFilters(appointments)
  const filteredRequestedAppointments = applyFilters(requestedAppointments)

  const renderFormData = (formData: any) => {
    if (!formData) return null
    
    return (
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div><span className="font-medium">Customer Name:</span> {formData.customerName}</div>
          <div><span className="font-medium">Industry:</span> {formData.industry} {formData.industryOther && `(${formData.industryOther})`}</div>
          <div><span className="font-medium">Customer Size:</span> {formData.customerSize}</div>
          <div><span className="font-medium">Head Office:</span> {formData.customerHeadOffice}</div>
          <div><span className="font-medium">IOM Account Owner:</span> {formData.iomAccountOwner}</div>
          <div><span className="font-medium">Designation:</span> {formData.accountOwnerDesignation}</div>
          <div><span className="font-medium">Relationship Start:</span> {formData.relationshipStartYear}</div>
        </div>
        
        <div className="border-t pt-3">
          <h4 className="font-medium mb-2">Customer Top Management</h4>
          <div className="grid grid-cols-2 gap-2">
            <div><span className="font-medium">Proposed Attendees:</span> {formData.proposedAttendees}</div>
            <div><span className="font-medium">Decision Maker:</span> {formData.decisionMaker}</div>
            <div><span className="font-medium">Influencers:</span> {formData.influencers}</div>
            <div><span className="font-medium">Prior Relationship:</span> {formData.priorRelationship} {formData.priorRelationshipOther && `(${formData.priorRelationshipOther})`}</div>
          </div>
        </div>

        <div className="border-t pt-3">
          <h4 className="font-medium mb-2">Current Business with IOM</h4>
          <div className="grid grid-cols-2 gap-2">
            <div><span className="font-medium">Total Revenue:</span> {formData.totalRevenue}</div>
            <div><span className="font-medium">Products Supplied:</span> {formData.productsSupplied?.join(", ")} {formData.productsSuppliedOther && `(${formData.productsSuppliedOther})`}</div>
            <div><span className="font-medium">Contract Type:</span> {formData.contractType?.join(", ")}</div>
            <div><span className="font-medium">Business Value (3 Years):</span> {formData.totalBusinessValue}</div>
            <div><span className="font-medium">Current Year Business:</span> {formData.currentYearBusiness}</div>
          </div>
        </div>

        <div className="border-t pt-3">
          <h4 className="font-medium mb-2">Financial & Credit Status</h4>
          <div className="grid grid-cols-2 gap-2">
            <div><span className="font-medium">Current Outstanding:</span> {formData.currentOutstanding}</div>
            <div><span className="font-medium">Overdue Amount:</span> {formData.overdueAmount}</div>
            <div><span className="font-medium">Payment Cycle:</span> {formData.paymentCycle}</div>
            <div><span className="font-medium">Credit Risk:</span> {formData.creditRisk} {formData.creditRiskOther && `(${formData.creditRiskOther})`}</div>
          </div>
        </div>

        <div className="border-t pt-3">
          <h4 className="font-medium mb-2">Service & Support Status</h4>
          <div className="grid grid-cols-2 gap-2">
            <div><span className="font-medium">Installed Base:</span> {formData.installedBase}</div>
            <div><span className="font-medium">Service Status:</span> {formData.serviceStatus}</div>
            <div><span className="font-medium">Open Service Issues:</span> {formData.openServiceIssues}</div>
            <div><span className="font-medium">Escalations:</span> {formData.escalations} {formData.escalationsOther && `(${formData.escalationsOther})`}</div>
          </div>
        </div>

        <div className="border-t pt-3">
          <h4 className="font-medium mb-2">Strategic Opportunities</h4>
          <div className="grid grid-cols-1 gap-2">
            <div><span className="font-medium">Meeting Purpose:</span> {formData.meetingPurpose?.join(", ")}</div>
            <div><span className="font-medium">Expected Opportunity Value:</span> {formData.expectedOpportunityValue}</div>
            <div><span className="font-medium">Key New Solutions:</span> {formData.keyNewSolutions}</div>
          </div>
        </div>

        <div className="border-t pt-3">
          <h4 className="font-medium mb-2">Competition & Risks</h4>
          <div className="grid grid-cols-2 gap-2">
            <div><span className="font-medium">Competing Vendors:</span> {formData.competingVendors}</div>
            <div><span className="font-medium">Threat Level:</span> {formData.threatLevel}</div>
            <div className="col-span-2"><span className="font-medium">Risk Factors:</span> {formData.riskFactors}</div>
          </div>
        </div>

        <div className="border-t pt-3">
          <h4 className="font-medium mb-2">CEO Pre-Read & Expectation</h4>
          <div className="space-y-2">
            <div><span className="font-medium">Key Talking Points:</span> {formData.keyTalkingPoints}</div>
            <div><span className="font-medium">Support Required:</span> {formData.supportRequired}</div>
            <div><span className="font-medium">Expected Outcome:</span> {formData.expectedOutcome}</div>
          </div>
        </div>

        <div className="border-t pt-3">
          <h4 className="font-medium mb-2">Internal Confirmation</h4>
          <div className="grid grid-cols-2 gap-2">
            <div><span className="font-medium">Information Verified:</span> {formData.informationVerified}</div>
            <div><span className="font-medium">Declaration:</span> {formData.declaration ? "Confirmed" : "Not Confirmed"}</div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
        <p className="text-slate-500">Schedule and manage customer appointments</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("todo")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === "todo"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          To-Do List
        </button>
        <button
          onClick={() => setActiveTab("requested")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === "requested"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Requested Appointments ({requestedAppointments.filter(a => a.status === "pending").length})
        </button>
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? "bg-slate-100" : ""}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
        {(filters.startDate || filters.endDate || filters.startTime || filters.endTime || filters.requestedBy) && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-600">
            Clear Filters
          </Button>
        )}
      </div>

      {showFilters && (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="h-9"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">End Date</label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="h-9"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Start Time</label>
                <Input
                  type="time"
                  value={filters.startTime}
                  onChange={(e) => setFilters({ ...filters, startTime: e.target.value })}
                  className="h-9"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">End Time</label>
                <Input
                  type="time"
                  value={filters.endTime}
                  onChange={(e) => setFilters({ ...filters, endTime: e.target.value })}
                  className="h-9"
                />
              </div>
              {activeTab === "requested" && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Requested By</label>
                  <select
                    value={filters.requestedBy}
                    onChange={(e) => setFilters({ ...filters, requestedBy: e.target.value })}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="">All Users</option>
                    {allUsers.map(user => (
                      <option key={user._id} value={user._id}>{user.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "todo" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Schedule New Appointment</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Customer Name
                  </label>
                  <Input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Enter customer name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Company Name
                  </label>
                  <Input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Enter company name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Designation
                  </label>
                  <Input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="Enter designation"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                  <Input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Enter location"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                    <Input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Time (Optional)</label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Visit Purpose</label>
                  <Textarea
                    value={formData.visitPurpose}
                    onChange={(e) => setFormData({ ...formData, visitPurpose: e.target.value })}
                    placeholder="Enter visit purpose"
                    required
                  />
                </div>

                {successMessage && (
                  <p className="text-green-600 text-sm">{successMessage}</p>
                )}

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Appointment"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">To-Do List</h2>
              {filteredAppointments.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-slate-500">No appointments scheduled</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {pendingAppointments.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-500 mb-2">Pending ({pendingAppointments.length})</h3>
                      <div className="space-y-2">
                        {pendingAppointments.map((appointment) => (
                          <div
                            key={appointment._id}
                            className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg"
                          >
                            <button
                              onClick={() => toggleComplete(appointment._id, appointment.isCompleted)}
                              className="mt-1 w-5 h-5 border-2 border-amber-400 rounded flex items-center justify-center hover:bg-amber-100 transition-colors"
                            >
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900">{appointment.customerName} - {appointment.designation}</p>
                              <p className="text-sm text-slate-600">{appointment.companyName}</p>
                              <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                <MapPin size={14} />
                                <span>{appointment.location}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                <Calendar size={14} />
                                <span>{new Date(appointment.date).toLocaleDateString()}</span>
                                <Clock size={14} className="ml-2" />
                                <span>{appointment.time}{appointment.endTime ? ` - ${appointment.endTime}` : ""}</span>
                              </div>
                              <p className="text-sm text-slate-600 mt-1 line-clamp-2">{appointment.visitPurpose}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(appointment._id)}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {completedAppointments.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-500 mb-2">Completed ({completedAppointments.length})</h3>
                      <div className="space-y-2">
                        {completedAppointments.map((appointment) => (
                          <div
                            key={appointment._id}
                            className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg"
                          >
                            <button
                              onClick={() => toggleComplete(appointment._id, appointment.isCompleted)}
                              className="mt-1 w-5 h-5 bg-emerald-500 rounded flex items-center justify-center hover:bg-emerald-600 transition-colors"
                            >
                              <Check size={14} className="text-white" />
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 line-through">{appointment.customerName} - {appointment.designation}</p>
                              <p className="text-sm text-slate-600">{appointment.companyName}</p>
                              <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                <MapPin size={14} />
                                <span>{appointment.location}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                <Calendar size={14} />
                                <span>{new Date(appointment.date).toLocaleDateString()}</span>
                                <Clock size={14} className="ml-2" />
                                <span>{appointment.time}{appointment.endTime ? ` - ${appointment.endTime}` : ""}</span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(appointment._id)}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "requested" && (
        <div className="space-y-4">
          {filteredRequestedAppointments.length === 0 ? (
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="py-12 text-center">
                <p className="text-slate-500">No appointment requests</p>
              </CardContent>
            </Card>
          ) : (
            filteredRequestedAppointments.map((appointment) => (
              <Card key={appointment._id} className="border-slate-200 shadow-sm overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors"
                  onClick={() => toggleExpand(appointment._id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-slate-900">{appointment.customerName}</p>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        appointment.status === "pending" ? "bg-amber-100 text-amber-700" :
                        appointment.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {appointment.status?.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{appointment.companyName}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(appointment.date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {appointment.time}{appointment.endTime ? ` - ${appointment.endTime}` : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {appointment.location}
                      </span>
                    </div>
                    {appointment.requestedBy && (
                      <p className="text-xs text-slate-500 mt-1">Requested by: {appointment.requestedBy.name || appointment.requestedBy.email}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {expandedCard === appointment._id ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {expandedCard === appointment._id && (
                  <CardContent className="p-6 border-t border-slate-200">
                    {appointment.status === "pending" && (
                      <div className="flex gap-3 mb-4">
                        <Button
                          onClick={() => handleApprove(appointment._id)}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleReject(appointment._id)}
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}
                    {renderFormData(appointment.formData)}
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}