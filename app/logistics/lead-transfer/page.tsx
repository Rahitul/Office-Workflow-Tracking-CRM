"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArrowRightLeft, Loader2, ArrowDownLeft, ArrowUpRight } from "lucide-react"

type TabType = "transfer" | "received" | "sent"
type LeadStatus = "Pending" | "Accepted" | "Working" | "Rejected" | "Lost" | "Successfully Closed"

interface UserData {
  _id: string
  name: string
  email: string
  role: string
}

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
  fromUser?: {
    name: string
    email: string
  }
  createdAt: string
}

function TransferForm({
  users,
  user,
  router,
}: {
  users: UserData[]
  user: { _id: string; name: string } | null
  router: any
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    employeeName: "",
    productDetails: "",
    description: "",
    fromConcern: "IOM",
    toConcern: "IOM",
    toSalesPerson: "",
    companyName: "",
    companyPhone: "",
    companyAddress: "",
    previouslyQuoted: "NO",
    notes: "",
  })

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({ ...prev, employeeName: user.name }))
    }
  }, [user])

  useEffect(() => {
    if (users.length > 0 && !formData.toSalesPerson) {
      setFormData((prev) => ({ ...prev, toSalesPerson: users[0]._id }))
    }
  }, [users])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const selectedUser = users.find((u) => u._id === formData.toSalesPerson)
      const payload = {
        ...formData,
        toSalesPerson: formData.toSalesPerson,
        toSalesPersonName: selectedUser?.name || "",
        fromUser: user?._id,
        status: "Pending",
      }

      const res = await fetch("/api/lead-transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      })

      const data = await res.json()
      if (data.success) {
        alert("Lead transferred successfully!")
        window.location.href = window.location.pathname + "?tab=sent"
      } else {
        alert(data.error || "Failed to transfer lead")
      }
    } catch (error) {
      console.error("Error transferring lead:", error)
      alert("Failed to transfer lead")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5" />
          Lead Transfer Form
        </CardTitle>
        <CardDescription>
          Fill in the details to transfer a lead to another sales person
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="employeeName">Employee Name</Label>
              <Input
                id="employeeName"
                value={formData.employeeName}
                readOnly
                className="bg-slate-50"
              />
            </div>

            <div>
              <Label htmlFor="fromConcern">Which Concern&apos;s Lead</Label>
              <Select
                id="fromConcern"
                options={[
                  { value: "IOM", label: "IOM" },
                  { value: "PPS", label: "PPS" },
                ]}
                value={formData.fromConcern}
                onChange={(e) => handleChange("fromConcern", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="toConcern">Which Concern to Move</Label>
              <Select
                id="toConcern"
                options={[
                  { value: "IOM", label: "IOM" },
                  { value: "PPS", label: "PPS" },
                ]}
                value={formData.toConcern}
                onChange={(e) => handleChange("toConcern", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="toSalesPerson">Select SalesPerson</Label>
              <Select
                id="toSalesPerson"
                options={users.map((u) => ({ value: u._id, label: u.name }))}
                value={formData.toSalesPerson}
                onChange={(e) => handleChange("toSalesPerson", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => handleChange("companyName", e.target.value)}
                placeholder="Enter company name"
                required
              />
            </div>

            <div>
              <Label htmlFor="companyPhone">Company Phone</Label>
              <Input
                id="companyPhone"
                type="tel"
                value={formData.companyPhone}
                onChange={(e) => handleChange("companyPhone", e.target.value)}
                placeholder="Enter phone number"
                required
              />
            </div>

            <div>
              <Label htmlFor="companyAddress">Company Address</Label>
              <Input
                id="companyAddress"
                value={formData.companyAddress}
                onChange={(e) => handleChange("companyAddress", e.target.value)}
                placeholder="Enter address"
                required
              />
            </div>

            <div>
              <Label htmlFor="productDetails">Product Details</Label>
              <Input
                id="productDetails"
                value={formData.productDetails}
                onChange={(e) => handleChange("productDetails", e.target.value)}
                placeholder="Enter product details"
                required
              />
            </div>

            <div>
              <Label htmlFor="previouslyQuoted">Previously Quoted</Label>
              <Select
                id="previouslyQuoted"
                options={[
                  { value: "YES", label: "YES" },
                  { value: "NO", label: "NO" },
                ]}
                value={formData.previouslyQuoted}
                onChange={(e) => handleChange("previouslyQuoted", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Enter description"
              required
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Enter any additional notes"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Transfer Lead
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function ReceivedLeads({ userId }: { userId: string }) {
  const [leads, setLeads] = useState<LeadData[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [remarksStatus, setRemarksStatus] = useState<{ [leadId: string]: LeadStatus }>({})
  const [remarksText, setRemarksText] = useState<{ [leadId: string]: string }>({})

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await fetch(`/api/lead-transfers?type=received&userId=${userId}`, {
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
    fetchLeads()
  }, [userId])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (leads.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-slate-500">No received leads yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
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
  )
}

function SentLeads({ userId }: { userId: string }) {
  const [leads, setLeads] = useState<LeadData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await fetch(`/api/lead-transfers?type=sent&userId=${userId}`, {
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
    fetchLeads()
  }, [userId])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (leads.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-slate-500">No sent leads yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {leads.map((lead) => (
        <Card key={lead._id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ArrowUpRight className="w-5 h-5" />
                  {lead.companyName}
                </CardTitle>
                <CardDescription>
                  To: {lead.toSalesPersonName} | Date: {new Date(lead.date).toLocaleDateString()}
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
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function LeadTransferPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuthStore()
  const [users, setUsers] = useState<UserData[]>([])
  const [activeTab, setActiveTab] = useState<TabType>(
    (searchParams.get("tab") as TabType) || "transfer"
  )

  useEffect(() => {
    const tab = searchParams.get("tab") as TabType
    if (tab && ["transfer", "received", "sent"].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users", {
          credentials: "include",
        })
        const data = await res.json()
        if (data.users) {
          const filteredUsers = data.users.filter((u: UserData) => u.role === "user" || u.role === "user_juniors")
          setUsers(filteredUsers)
        }
      } catch (error) {
        console.error("Error fetching users:", error)
      }
    }
    fetchUsers()
  }, [])

  const tabs = [
    { id: "transfer" as TabType, label: "Transfer", icon: ArrowRightLeft },
    { id: "received" as TabType, label: "Received", icon: ArrowDownLeft },
    { id: "sent" as TabType, label: "Sent", icon: ArrowUpRight },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Lead Transfer</h1>
        <p className="text-slate-500">Manage your lead transfers</p>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                const url = new URL(window.location.href)
                url.searchParams.set("tab", tab.id)
                window.history.pushState({}, "", url.toString())
              }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "transfer" && (
        <TransferForm users={users} user={user} router={router} />
      )}
      {activeTab === "received" && user && (
        <ReceivedLeads userId={user._id} />
      )}
      {activeTab === "sent" && user && (
        <SentLeads userId={user._id} />
      )}
    </div>
  )
}