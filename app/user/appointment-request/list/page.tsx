"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, Check, ChevronDown, ChevronUp, Plus } from "lucide-react"
import { useAuthStore } from "@/store/authStore"

interface AppointmentRequest {
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
  isRequested: boolean
  requestedBy: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
  formData?: any
}

export default function AppointmentListPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [myAppointments, setMyAppointments] = useState<AppointmentRequest[]>([])
  const [adminAppointments, setAdminAppointments] = useState<AppointmentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
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
  }, [])

  const fetchAppointments = async () => {
    try {
      const [myRes, adminRes] = await Promise.all([
        axios.get("/api/appointments/user", { withCredentials: true }),
        axios.get("/api/appointments?admin=true", { withCredentials: true })
      ])
      setMyAppointments(myRes.data.appointments || [])
      setAdminAppointments(adminRes.data.appointments || [])
    } catch (error) {
      console.error("Failed to fetch appointments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSuccessMessage("")

    try {
      await axios.post("/api/appointments/request", {
        ...formData,
        isRequested: true,
      }, { withCredentials: true })
      setSuccessMessage("Appointment request submitted successfully!")
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
      setShowForm(false)
      fetchAppointments()
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (error) {
      console.error("Failed to create appointment:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedCard(expandedCard === id ? null : id)
  }

  const pendingRequests = myAppointments.filter(a => a.isRequested && a.status === "pending")
  const approvedRequests = myAppointments.filter(a => a.isRequested && a.status === "approved")
  const rejectedRequests = myAppointments.filter(a => a.isRequested && a.status === "rejected")
  const myOwnAppointments = myAppointments.filter(a => !a.isRequested)

  const renderAppointmentCard = (appointment: AppointmentRequest, type: "admin" | "own" | "pending" | "approved" | "rejected") => {
    const colors = {
      admin: "border-blue-200 bg-blue-50",
      own: "border-amber-200 bg-amber-50",
      pending: "border-amber-200 bg-amber-50",
      approved: "border-emerald-200 bg-emerald-50",
      rejected: "border-red-200 bg-red-50"
    }
    const statusColors = {
      admin: "bg-blue-100 text-blue-700",
      own: "bg-amber-100 text-amber-700",
      pending: "bg-amber-100 text-amber-700",
      approved: "bg-emerald-100 text-emerald-700",
      rejected: "bg-red-100 text-red-700"
    }

    return (
      <div key={appointment._id} className={`border rounded-lg overflow-hidden ${colors[type]}`}>
        <div
          className="flex items-center justify-between p-3 cursor-pointer"
          onClick={() => toggleExpand(appointment._id)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-slate-900">{appointment.customerName}</p>
              <span className={`px-2 py-1 text-xs rounded-full ${statusColors[type]}`}>
                {type === "admin" ? "Admin" : type === "own" ? (appointment.isCompleted ? "Completed" : "Pending") : type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            </div>
            <p className="text-sm text-slate-600">{appointment.companyName}</p>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <Calendar size={12} />
              <span>{new Date(appointment.date).toLocaleDateString()}</span>
              <Clock size={12} />
              <span>{appointment.time}{appointment.endTime ? ` - ${appointment.endTime}` : ""}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {expandedCard === appointment._id ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>
        {expandedCard === appointment._id && (
          <div className="px-3 pb-3 border-t border-slate-200">
            <div className="pt-3 space-y-2 text-sm">
              <p><span className="font-medium">Designation:</span> {appointment.designation}</p>
              <p><span className="font-medium">Location:</span> {appointment.location}</p>
              <p><span className="font-medium">Purpose:</span> {appointment.visitPurpose}</p>
            </div>
          </div>
        )}
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            My Appointments
          </h1>
          <p className="text-slate-500">Manage your appointment requests</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Request Appointment
        </Button>
      </div>

      {successMessage && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="py-4 text-emerald-700 flex items-center gap-2">
            <Check className="w-5 h-5" />
            {successMessage}
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Request New Appointment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
                  <Input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                  <Input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Enter company name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Designation</label>
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Time (Optional)</label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
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
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                  {submitting ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Managing Director Appointments ({adminAppointments.length})
            </h2>
            <p className="text-xs text-slate-500 mb-4">Available time slots from Managing Director</p>
            {adminAppointments.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No appointments scheduled</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {adminAppointments.map((appointment) => renderAppointmentCard(appointment, "admin"))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              My Appointments ({myOwnAppointments.length})
            </h2>
            {myOwnAppointments.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No appointments</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {myOwnAppointments.map((appointment) => renderAppointmentCard(appointment, "own"))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Pending Requests ({pendingRequests.length})</h2>
            {pendingRequests.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No pending requests</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {pendingRequests.map((appointment) => renderAppointmentCard(appointment, "pending"))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Approved Requests ({approvedRequests.length})</h2>
            {approvedRequests.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No approved requests</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {approvedRequests.map((appointment) => renderAppointmentCard(appointment, "approved"))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}