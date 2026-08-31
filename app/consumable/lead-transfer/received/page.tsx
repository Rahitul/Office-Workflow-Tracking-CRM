"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, ArrowDownLeft } from "lucide-react"

type LeadStatus = "Pending" | "Accepted" | "Working" | "Rejected" | "Lost" | "Successfully Closed"

interface LeadData {
  _id: string
  date: string
  employeeName: string
  productDetails: string
  description: string
  fromConcern: string
  toConcern: string
  toSalesPersonName: string
  companyName: string
  companyPhone: string
  companyAddress: string
  previouslyQuoted: string
  notes?: string
  remarks?: string
  status: LeadStatus
  fromUser: {
    name: string
    email: string
  }
  createdAt: string
}

export default function ReceivedLeadsPage() {
  const { user } = useAuthStore()
  const [leads, setLeads] = useState<LeadData[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [remarksStatus, setRemarksStatus] = useState<{ [leadId: string]: LeadStatus }>({})
  const [remarksText, setRemarksText] = useState<{ [leadId: string]: string }>({})

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await fetch(`/api/lead-transfers?type=received&userId=${user?._id}`, {
          credentials: "include",
        })
        const data = await res.json()
        if (data.success) {
          setLeads(data.data)
        }
      } catch (error) {
        console.error("Error fetching leads:", error)
      } finally {
        setLoading(false)
      }
    }
    if (user?._id) {
      fetchLeads()
    }
  }, [user?._id])

  const handleStatusUpdate = async (leadId: string, newStatus: string, remarks?: string) => {
    setUpdating(leadId)
    try {
      const res = await fetch(`/api/lead-transfers/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, ...(remarks !== undefined ? { remarks } : {}) }),
        credentials: "include",
      })
      const data = await res.json()
      if (data.success) {
        setLeads((prev) =>
          prev.map((lead) =>
            lead._id === leadId
              ? { ...lead, status: newStatus as LeadStatus, ...(remarks !== undefined ? { remarks } : {}) }
              : lead
          )
        )
        setRemarksStatus((prev) => {
          const next = { ...prev }
          delete next[leadId]
          return next
        })
        alert("Status updated successfully!")
      } else {
        alert(data.error || "Failed to update status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
      alert("Failed to update status")
    } finally {
      setUpdating(null)
    }
  }

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Accepted":
        return "bg-blue-100 text-blue-800"
      case "Working":
        return "bg-purple-100 text-purple-800"
      case "Rejected":
        return "bg-red-100 text-red-800"
      case "Lost":
        return "bg-orange-100 text-orange-800"
      case "Successfully Closed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Received Leads</h1>
        <p className="text-slate-500">Leads transferred to you by other sales persons</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : leads.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-slate-500">No received leads yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => (
            <Card key={lead._id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ArrowDownLeft className="w-5 h-5" />
                      {lead.companyName}
                    </CardTitle>
                    <CardDescription>
                      From: {lead.fromUser?.name || lead.employeeName} | Date: {new Date(lead.date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(lead.status)}`}
                  >
                    {lead.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Product Details</p>
                    <p className="text-slate-900">{lead.productDetails}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Description</p>
                    <p className="text-slate-900">{lead.description}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">From Concern</p>
                    <p className="text-slate-900">{lead.fromConcern}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">To Concern</p>
                    <p className="text-slate-900">{lead.toConcern}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Company Phone</p>
                    <p className="text-slate-900">{lead.companyPhone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Company Address</p>
                    <p className="text-slate-900">{lead.companyAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Previously Quoted</p>
                    <p className="text-slate-900">{lead.previouslyQuoted}</p>
                  </div>
                  {lead.notes && (
                    <div>
                      <p className="text-sm font-medium text-slate-500">Notes</p>
                      <p className="text-slate-900">{lead.notes}</p>
                    </div>
                  )}
                  {lead.remarks && (
                    <div>
                      <p className="text-sm font-medium text-slate-500">Remarks</p>
                      <p className="text-slate-900">{lead.remarks}</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium text-slate-500 mb-2">Update Status</p>
                  {remarksStatus[lead._id] ? (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-600">
                        {remarksStatus[lead._id]} — please provide a reason:
                      </p>
                      <Textarea
                        value={remarksText[lead._id] || ""}
                        onChange={(e) =>
                          setRemarksText((prev) => ({ ...prev, [lead._id]: e.target.value }))
                        }
                        placeholder="Enter remarks (required)"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleStatusUpdate(lead._id, remarksStatus[lead._id], (remarksText[lead._id] || "").trim())}
                          disabled={updating === lead._id || !(remarksText[lead._id] || "").trim()}
                        >
                          {updating === lead._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Submit"
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() =>
                            setRemarksStatus((prev) => {
                              const next = { ...prev }
                              delete next[lead._id]
                              return next
                            })
                          }
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Select
                        options={[
                          { value: "Pending", label: "Pending" },
                          { value: "Accepted", label: "Accepted" },
                          { value: "Working", label: "Working" },
                          { value: "Rejected", label: "Rejected" },
                          { value: "Lost", label: "Lost" },
                          { value: "Successfully Closed", label: "Successfully Closed" },
                        ]}
                        value={lead.status}
                        onChange={(e) => {
                          const value = e.target.value as LeadStatus
                          if (value === "Rejected" || value === "Lost") {
                            setRemarksStatus((prev) => ({ ...prev, [lead._id]: value }))
                          } else {
                            handleStatusUpdate(lead._id, value)
                          }
                        }}
                      />
                      <Button
                        onClick={() => handleStatusUpdate(lead._id, lead.status)}
                        disabled={updating === lead._id}
                      >
                        {updating === lead._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Update"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}