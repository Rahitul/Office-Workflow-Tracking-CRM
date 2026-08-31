"use client"

import { useState, useEffect, Suspense } from "react"
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
  contactPerson: string
  contactPersonDesignation: string
  contactPersonPhone: string
  status: LeadStatus
  remarks?: string
  fromEmployeeId: string
  toEmployeeId: string
  createdAt: string
}

function LeadTransferContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<TabType>(
    (searchParams.get("tab") as TabType) || "transfer"
  )

  useEffect(() => {
    const tab = searchParams.get("tab") as TabType
    if (tab && ["transfer", "received", "sent"].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users", { credentials: "include" })
        const data = await res.json()
        setUsers(data.users || [])
      } catch (err) {
        console.error("Failed to fetch users:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const switchTab = (tab: TabType) => {
    setActiveTab(tab)
    router.push(`?tab=${tab}`, { scroll: false })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ArrowRightLeft className="w-6 h-6" />
          Lead Transfer
        </h1>
        <p className="text-slate-500">Transfer and manage leads</p>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => switchTab("transfer")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "transfer"
              ? "bg-purple-50 text-purple-700 border border-purple-100"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          Transfer Lead
        </button>
        <button
          onClick={() => switchTab("received")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "received"
              ? "bg-purple-50 text-purple-700 border border-purple-100"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          Received
        </button>
        <button
          onClick={() => switchTab("sent")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "sent"
              ? "bg-purple-50 text-purple-700 border border-purple-100"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          Sent
        </button>
      </div>

      {activeTab === "transfer" && (
        <TransferForm users={users} user={user} />
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

function TransferForm({ users, user }: { users: UserData[]; user: any }) {
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    toEmployeeId: "",
    companyName: "",
    companyPhone: "",
    companyAddress: "",
    contactPerson: "",
    contactPersonDesignation: "",
    contactPersonPhone: "",
    productDetails: "",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.toEmployeeId || !form.companyName) {
      setError("Please fill in all required fields")
      return
    }
    setSaving(true)
    setError("")
    try {
      const toUser = users.find((u) => u._id === form.toEmployeeId)
      const res = await fetch("/api/lead-transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          date: new Date().toISOString().split("T")[0],
          employeeName: user?.name,
          fromConcern: user?.role,
          toConcern: toUser?.role || "",
          toSalesPerson: form.toEmployeeId,
          toSalesPersonName: toUser?.name || "",
          fromEmployeeId: user?._id,
          status: "Pending",
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to transfer lead")
      }
      setSuccess(true)
      setForm({
        toEmployeeId: "", companyName: "", companyPhone: "", companyAddress: "",
        contactPerson: "", contactPersonDesignation: "", contactPersonPhone: "",
        productDetails: "", description: "",
      })
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const otherUsers = users.filter((u) => u._id !== user?._id)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Transfer Lead</CardTitle>
      </CardHeader>
      <CardContent>
        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
            Lead transferred successfully!
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Transfer To *</Label>
            <Select
              options={[
                { value: "", label: "Select employee..." },
                ...otherUsers.map((u) => ({ value: u._id, label: `${u.name} (${u.role})` })),
              ]}
              value={form.toEmployeeId}
              onChange={(e) => setForm({ ...form, toEmployeeId: e.target.value })}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Company Phone</Label>
              <Input value={form.companyPhone} onChange={(e) => setForm({ ...form, companyPhone: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Company Address</Label>
              <Input value={form.companyAddress} onChange={(e) => setForm({ ...form, companyAddress: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Contact Person</Label>
              <Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Contact Person Designation</Label>
              <Input value={form.contactPersonDesignation} onChange={(e) => setForm({ ...form, contactPersonDesignation: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Contact Person Phone</Label>
              <Input value={form.contactPersonPhone} onChange={(e) => setForm({ ...form, contactPersonPhone: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Product Details *</Label>
            <Textarea value={form.productDetails} onChange={(e) => setForm({ ...form, productDetails: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <Button type="submit" disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Transferring...</> : "Transfer Lead"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function ReceivedLeads({ userId }: { userId: string }) {
  const [leads, setLeads] = useState<LeadData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await fetch(`/api/lead-transfers?toEmployeeId=${userId}`, { credentials: "include" })
        const data = await res.json()
        setLeads(data.leads || [])
      } catch (err) {
        console.error("Failed to fetch received leads:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchLeads()
  }, [userId])

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>

  return (
    <div className="space-y-3">
      {leads.length === 0 ? (
        <p className="text-slate-500 text-center py-8">No received leads</p>
      ) : (
        leads.map((lead) => (
          <LeadCard key={lead._id} lead={lead} type="received" userId={userId} />
        ))
      )}
    </div>
  )
}

function SentLeads({ userId }: { userId: string }) {
  const [leads, setLeads] = useState<LeadData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await fetch(`/api/lead-transfers?fromEmployeeId=${userId}`, { credentials: "include" })
        const data = await res.json()
        setLeads(data.leads || [])
      } catch (err) {
        console.error("Failed to fetch sent leads:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchLeads()
  }, [userId])

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>

  return (
    <div className="space-y-3">
      {leads.length === 0 ? (
        <p className="text-slate-500 text-center py-8">No sent leads</p>
      ) : (
        leads.map((lead) => (
          <LeadCard key={lead._id} lead={lead} type="sent" userId={userId} />
        ))
      )}
    </div>
  )
}

function LeadCard({ lead, type, userId }: { lead: LeadData; type: "received" | "sent"; userId: string }) {
  const [updating, setUpdating] = useState(false)
  const [showRemarks, setShowRemarks] = useState(false)
  const [remarksText, setRemarksText] = useState("")
  const [pendingStatus, setPendingStatus] = useState<LeadStatus | null>(null)

  const statusColors: Record<string, string> = {
    Pending: "bg-yellow-100 text-yellow-700",
    Accepted: "bg-blue-100 text-blue-700",
    Working: "bg-indigo-100 text-indigo-700",
    Rejected: "bg-red-100 text-red-700",
    Lost: "bg-orange-100 text-orange-700",
    "Successfully Closed": "bg-emerald-100 text-emerald-700",
  }

  const updateStatus = async (status: LeadStatus, remarks?: string) => {
    setUpdating(true)
    try {
      await fetch(`/api/lead-transfers/${lead._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, ...(remarks !== undefined ? { remarks } : {}) }),
      })
      window.location.reload()
    } catch (err) {
      console.error("Failed to update status:", err)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="font-semibold text-slate-900">{lead.companyName}</h4>
            <p className="text-sm text-slate-500">
              {type === "received" ? `From: ${lead.employeeName}` : `To: ${lead.toSalesPersonName}`}
            </p>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[lead.status] || "bg-slate-100 text-slate-600"}`}>
            {lead.status}
          </span>
        </div>
        <div className="text-sm text-slate-600 space-y-1">
          <p>Product: {lead.productDetails}</p>
          {lead.contactPerson && <p>Contact: {lead.contactPerson} ({lead.contactPersonPhone})</p>}
          {lead.description && <p className="text-slate-500">{lead.description}</p>}
          {lead.remarks && <p className="text-slate-500">Remarks: {lead.remarks}</p>}
        </div>
        {type === "received" && lead.status === "Pending" && (
          showRemarks ? (
            <div className="space-y-2 mt-3">
              <p className="text-sm text-slate-600">
                {pendingStatus} — please provide a reason:
              </p>
              <Textarea
                value={remarksText}
                onChange={(e) => setRemarksText(e.target.value)}
                placeholder="Enter remarks (required)"
                rows={2}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => pendingStatus && updateStatus(pendingStatus, remarksText.trim())}
                  disabled={updating || !remarksText.trim()}
                >
                  {updating ? "Saving..." : "Submit"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowRemarks(false)
                    setPendingStatus(null)
                    setRemarksText("")
                  }}
                  disabled={updating}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 mt-3">
              {["Accepted", "Rejected", "Lost"].map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (s === "Rejected" || s === "Lost") {
                      setPendingStatus(s as LeadStatus)
                      setShowRemarks(true)
                    } else {
                      updateStatus(s as LeadStatus)
                    }
                  }}
                  disabled={updating}
                >
                  {s}
                </Button>
              ))}
            </div>
          )
        )}
      </CardContent>
    </Card>
  )
}

export default function BranchLeadTransferPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    }>
      <LeadTransferContent />
    </Suspense>
  )
}
