"use client"

import { useEffect, useState, useRef } from "react"
import axios from "axios"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog } from "@/components/ui/dialog"
import {
  Phone,
  PhoneOutgoing,
  Calendar,
  Users,
  Search,
  Filter,
  Clock,
  Eye,
} from "lucide-react"

interface FrontdeskRecord {
  _id: string
  callType: "incoming" | "outgoing" | "visit"
  date: string
  createdAt: string
  customerName?: string
  contactNumber?: string
  inquiryType?: string
  productType?: string
  consumableType?: string
  serviceType?: string
  issue?: string
  callTransferTo?: { _id: string; name: string }
  priority?: string
  companyName?: string
  contactPersonName?: string
  contactPersonPhone?: string
  product?: string
  causeForCall?: string
  outcomeFromCall?: string
  isLeadSearch?: boolean
  leadFound?: string
  outgoingCallType?: string
  feedbackType?: string
  visitorName?: string
  fromLocation?: string
  toLocation?: string
  purpose?: string
  phoneNumber?: string
  inTime?: string
  outTime?: string
  createdBy?: { _id: string; name: string; email: string }
}

interface User {
  _id: string
  name: string
  email: string
  role: string
}

interface IncomingFilter {
  startDate: string
  endDate: string
  selectedUser: string
  selectedPriority: string
  incomingCustomerName: string
  incomingInquiryType: string
  incomingTransferredTo: string
  incomingTransferredToRole: string
}

interface OutgoingFilter {
  startDate: string
  endDate: string
  selectedUser: string
  outgoingCompanyName: string
  outgoingProduct: string
  outgoingLeadSearch: string
  outgoingLeadFound: string
  outgoingCallType: string
  outgoingFeedbackType: string
}

const incomingDefaultFilter: IncomingFilter = {
  startDate: "",
  endDate: "",
  selectedUser: "all",
  selectedPriority: "all",
  incomingCustomerName: "",
  incomingInquiryType: "",
  incomingTransferredTo: "",
  incomingTransferredToRole: "",
}

const outgoingDefaultFilter: OutgoingFilter = {
  startDate: "",
  endDate: "",
  selectedUser: "all",
  outgoingCompanyName: "",
  outgoingProduct: "",
  outgoingLeadSearch: "",
  outgoingLeadFound: "",
  outgoingCallType: "",
  outgoingFeedbackType: "",
}

function AutocompleteInput({
  value,
  onChange,
  placeholder,
  field,
  label,
}: {
  value: string
  onChange: (val: string) => void
  placeholder: string
  field: string
  label: string
}) {
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchSuggestions = async (q: string) => {
    try {
      const res = await axios.get(`/api/frontdesk-calls/suggestions?field=${field}&q=${encodeURIComponent(q)}`, { withCredentials: true })
      setSuggestions(res.data.suggestions || [])
    } catch {
      setSuggestions([])
    }
  }

  const handleInputChange = (val: string) => {
    onChange(val)
    if (val.length >= 1) {
      fetchSuggestions(val)
      setOpen(true)
    } else {
      setSuggestions([])
      setOpen(false)
    }
  }

  const handleSelect = (val: string) => {
    onChange(val)
    setOpen(false)
    setSuggestions([])
  }

  return (
    <div className="space-y-2" ref={wrapperRef}>
      <Label className="text-slate-700">{label}</Label>
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => { if (value.length >= 1) { fetchSuggestions(value); setOpen(true) } }}
          placeholder={placeholder}
          autoComplete="off"
        />
        {open && suggestions.length > 0 && (
          <div className="absolute z-[9999] mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-auto">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                onClick={() => handleSelect(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

type TabId = "incoming" | "outgoing"

const TABS = [
  { id: "incoming" as TabId, label: "Incoming Calls", icon: Phone },
  { id: "outgoing" as TabId, label: "Outgoing Calls", icon: PhoneOutgoing },
]

export default function ConsumableFrontDeskCallsPage() {
  const [records, setRecords] = useState<FrontdeskRecord[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>("outgoing")
  const [incomingFilters, setIncomingFilters] = useState<IncomingFilter>({ ...incomingDefaultFilter })
  const [outgoingFilters, setOutgoingFilters] = useState<OutgoingFilter>({ ...outgoingDefaultFilter })
  const [dialogRecord, setDialogRecord] = useState<FrontdeskRecord | null>(null)
  const [incomingTransferredToSearch, setIncomingTransferredToSearch] = useState("")
  const [showTransferredToDropdown, setShowTransferredToDropdown] = useState(false)
  const [incomingTransferredToId, setIncomingTransferredToId] = useState("")
  const transferredToRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (transferredToRef.current && !transferredToRef.current.contains(e.target as Node)) {
        setShowTransferredToDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [recordsRes, usersRes] = await Promise.all([
        axios.get("/api/frontdesk-calls", { withCredentials: true }),
        axios.get("/api/static-form/users", { withCredentials: true }),
      ])
      setRecords(recordsRes.data.calls || [])
      setUsers(usersRes.data.users || [])
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleDisplay = (role: string) => {
    const map: Record<string, string> = {
      admin: "Admin", user: "Sales", accounts: "Accounts", esbd: "ESBD",
      service: "Service", marketing: "Marketing", consumable: "Consumable",
      logistics: "Logistics", frontdesk: "Front Desk",
      user_juniors: "Sales (Junior)", accounts_juniors: "Accounts (Junior)",
      esbd_juniors: "ESBD (Junior)", service_juniors: "Service (Junior)",
      marketing_juniors: "Marketing (Junior)", consumable_juniors: "Consumable (Junior)",
      logistics_juniors: "Logistics (Junior)",
    }
    return map[role] || role
  }

  const handleFilter = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeTab === "outgoing") {
        params.append("callType", "outgoing")
        if (outgoingFilters.startDate) params.append("startDate", outgoingFilters.startDate)
        if (outgoingFilters.endDate) params.append("endDate", outgoingFilters.endDate)
        if (outgoingFilters.selectedUser !== "all") params.append("userId", outgoingFilters.selectedUser)
        if (outgoingFilters.outgoingCompanyName) params.append("outgoingCompanyName", outgoingFilters.outgoingCompanyName)
        if (outgoingFilters.outgoingProduct) params.append("outgoingProduct", outgoingFilters.outgoingProduct)
        if (outgoingFilters.outgoingLeadSearch) params.append("outgoingIsLeadSearch", outgoingFilters.outgoingLeadSearch)
        if (outgoingFilters.outgoingLeadFound) params.append("outgoingLeadFound", outgoingFilters.outgoingLeadFound)
        if (outgoingFilters.outgoingCallType) params.append("outgoingCallType", outgoingFilters.outgoingCallType)
        if (outgoingFilters.outgoingFeedbackType) params.append("outgoingFeedbackType", outgoingFilters.outgoingFeedbackType)
      } else {
        params.append("callType", "incoming")
        if (incomingFilters.startDate) params.append("startDate", incomingFilters.startDate)
        if (incomingFilters.endDate) params.append("endDate", incomingFilters.endDate)
        if (incomingFilters.selectedUser !== "all") params.append("userId", incomingFilters.selectedUser)
        if (incomingFilters.selectedPriority !== "all") params.append("priority", incomingFilters.selectedPriority)
        if (incomingFilters.incomingCustomerName) params.append("incomingCustomerName", incomingFilters.incomingCustomerName)
        if (incomingFilters.incomingInquiryType) params.append("incomingInquiryType", incomingFilters.incomingInquiryType)
        if (incomingTransferredToId) params.append("incomingTransferredToId", incomingTransferredToId)
        else if (incomingFilters.incomingTransferredTo) params.append("incomingTransferredTo", incomingFilters.incomingTransferredTo)
        if (incomingFilters.incomingTransferredToRole) params.append("incomingTransferredToRole", incomingFilters.incomingTransferredToRole)
      }

      const res = await axios.get(`/api/frontdesk-calls?${params}`, { withCredentials: true })
      setRecords(res.data.calls || [])
    } catch (error) {
      console.error("Failed to filter:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleResetFilters = () => {
    if (activeTab === "outgoing") {
      setOutgoingFilters({ ...outgoingDefaultFilter })
    } else {
      setIncomingFilters({ ...incomingDefaultFilter })
      setIncomingTransferredToSearch("")
      setIncomingTransferredToId("")
    }
    fetchData()
  }

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId)
    setDialogRecord(null)
  }

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const outgoingRecords = records.filter(r => r.callType === "outgoing")
  const incomingRecords = records.filter(r => r.callType === "incoming")
  const totalRecords = records.length
  const outgoingCount = outgoingRecords.length
  const incomingCount = incomingRecords.length

  const uniqueRoles = [...new Set(users.map(u => u.role))].sort()
  const roleOptions = [
    { value: "", label: "All Departments" },
    ...uniqueRoles.map(r => ({ value: r, label: getRoleDisplay(r) })),
  ]
  const roleFilter = incomingFilters.incomingTransferredToRole
  const filteredTransferredToUsers = users
    .filter(u => u.name.toLowerCase().includes(incomingTransferredToSearch.toLowerCase()))
    .filter(u => !roleFilter || u.role === roleFilter)
    .slice(0, 10)

  const showPriority = activeTab === "incoming"

  if (loading && records.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Front Desk Calls / Visits</h1>
        <p className="text-slate-500">View and manage all front desk records</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalRecords}</p>
                <p className="text-sm text-slate-500">Total Records</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-50 text-purple-600">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{incomingCount}</p>
                <p className="text-sm text-slate-500">Incoming Calls</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600">
                <PhoneOutgoing className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{outgoingCount}</p>
                <p className="text-sm text-slate-500">Outgoing Calls</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="border-b border-slate-200">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const count = activeTab === tab.id
              ? (tab.id === "incoming" ? incomingRecords.length : outgoingRecords.length)
              : 0
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? "border-blue-600 text-blue-700 bg-blue-50/50"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                <tab.icon className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                {tab.label}
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                  isActive ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {activeTab === "incoming" ? "Filter Incoming Calls" : "Filter Outgoing Calls"}
          </CardTitle>
          <CardDescription>Set filters for {activeTab === "incoming" ? "incoming" : "outgoing"} call records</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-slate-700">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={activeTab === "incoming" ? incomingFilters.startDate : outgoingFilters.startDate}
                onChange={(e) => {
                  if (activeTab === "incoming") {
                    setIncomingFilters(prev => ({ ...prev, startDate: e.target.value }))
                  } else {
                    setOutgoingFilters(prev => ({ ...prev, startDate: e.target.value }))
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-slate-700">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={activeTab === "incoming" ? incomingFilters.endDate : outgoingFilters.endDate}
                onChange={(e) => {
                  if (activeTab === "incoming") {
                    setIncomingFilters(prev => ({ ...prev, endDate: e.target.value }))
                  } else {
                    setOutgoingFilters(prev => ({ ...prev, endDate: e.target.value }))
                  }
                }}
              />
            </div>
            {activeTab === "incoming" && (
              <>
                <AutocompleteInput
                  value={incomingFilters.incomingCustomerName}
                  onChange={(val) => setIncomingFilters(prev => ({ ...prev, incomingCustomerName: val }))}
                  placeholder="Search by customer name"
                  field="customerName"
                  label="Customer Name"
                />
                <div className="space-y-2">
                  <Label className="text-slate-700">Inquiry Type</Label>
                  <Select
                    value={incomingFilters.incomingInquiryType}
                    onChange={(e) => setIncomingFilters(prev => ({ ...prev, incomingInquiryType: e.target.value }))}
                    options={[
                      { value: "", label: "All Types" },
                      { value: "Product", label: "Product" },
                      { value: "Consumable", label: "Consumable" },
                      { value: "Service", label: "Service" },
                    ]}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Department</Label>
                  <Select
                    value={incomingFilters.incomingTransferredToRole}
                    onChange={(e) => {
                      setIncomingFilters(prev => ({ ...prev, incomingTransferredToRole: e.target.value, incomingTransferredTo: "" }))
                      setIncomingTransferredToSearch("")
                      setIncomingTransferredToId("")
                    }}
                    options={roleOptions}
                  />
                </div>
                <div className="space-y-2 relative" ref={transferredToRef}>
                  <Label className="text-slate-700">Transferred To</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder={incomingFilters.incomingTransferredTo || "Search user..."}
                      value={incomingTransferredToSearch}
                      onChange={(e) => {
                        setIncomingTransferredToSearch(e.target.value)
                        setShowTransferredToDropdown(true)
                      }}
                      onFocus={() => setShowTransferredToDropdown(true)}
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 pl-10 text-sm"
                    />
                    {incomingFilters.incomingTransferredTo && (
                      <button
                        type="button"
                        onClick={() => {
                          setIncomingFilters(prev => ({ ...prev, incomingTransferredTo: "" }))
                          setIncomingTransferredToSearch("")
                          setIncomingTransferredToId("")
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  {showTransferredToDropdown && filteredTransferredToUsers.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-auto" style={{ top: '100%' }}>
                      {filteredTransferredToUsers.map((u) => (
                        <button
                          key={u._id}
                          type="button"
                          className="w-full px-3 py-2 text-left hover:bg-slate-50 text-sm border-b border-slate-100 last:border-b-0"
                          onClick={() => {
                            setIncomingFilters(prev => ({ ...prev, incomingTransferredTo: u.name }))
                            setIncomingTransferredToSearch("")
                            setIncomingTransferredToId(u._id)
                            setShowTransferredToDropdown(false)
                          }}
                        >
                          <span className="font-medium">{u.name}</span>
                          <span className="text-slate-500 text-xs ml-2">{getRoleDisplay(u.role)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
            {activeTab === "incoming" && (
              <div className="space-y-2">
                <Label htmlFor="priorityFilter" className="text-slate-700">Priority</Label>
                <Select
                  id="priorityFilter"
                  value={incomingFilters.selectedPriority}
                  onChange={(e) => setIncomingFilters(prev => ({ ...prev, selectedPriority: e.target.value }))}
                  options={[
                    { value: "all", label: "All Priorities" },
                    { value: "Normal", label: "Normal" },
                    { value: "Urgent", label: "Urgent" },
                  ]}
                />
              </div>
            )}
            {activeTab === "outgoing" && (
              <>
                <AutocompleteInput
                  value={outgoingFilters.outgoingCompanyName}
                  onChange={(val) => setOutgoingFilters(prev => ({ ...prev, outgoingCompanyName: val }))}
                  placeholder="Search by company name"
                  field="companyName"
                  label="Company Name"
                />
                <div className="space-y-2">
                  <Label className="text-slate-700">Product Name</Label>
                  <Input
                    value={outgoingFilters.outgoingProduct}
                    onChange={(e) => setOutgoingFilters(prev => ({ ...prev, outgoingProduct: e.target.value }))}
                    placeholder="Search by product name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Lead Search</Label>
                  <Select
                    value={outgoingFilters.outgoingLeadSearch}
                    onChange={(e) => {
                      const val = e.target.value
                      setOutgoingFilters(prev => ({ ...prev, outgoingLeadSearch: val, outgoingLeadFound: val !== "true" ? "" : prev.outgoingLeadFound }))
                    }}
                    options={[
                      { value: "", label: "All" },
                      { value: "true", label: "Yes" },
                      { value: "false", label: "No" },
                    ]}
                  />
                </div>
                {outgoingFilters.outgoingLeadSearch === "true" && (
                  <div className="space-y-2">
                    <Label className="text-slate-700">Lead Found</Label>
                    <Select
                      value={outgoingFilters.outgoingLeadFound}
                      onChange={(e) => setOutgoingFilters(prev => ({ ...prev, outgoingLeadFound: e.target.value }))}
                      options={[
                        { value: "", label: "All" },
                        { value: "yes", label: "Yes" },
                        { value: "no", label: "No" },
                      ]}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-slate-700">Call Type</Label>
                  <Select
                    value={outgoingFilters.outgoingCallType}
                    onChange={(e) => setOutgoingFilters(prev => ({ ...prev, outgoingCallType: e.target.value }))}
                    options={[
                      { value: "", label: "All" },
                      { value: "Sales", label: "Sales" },
                      { value: "Support", label: "Support" },
                    ]}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Feedback Type</Label>
                  <Select
                    value={outgoingFilters.outgoingFeedbackType}
                    onChange={(e) => setOutgoingFilters(prev => ({ ...prev, outgoingFeedbackType: e.target.value }))}
                    options={[
                      { value: "", label: "All" },
                      { value: "Good", label: "Good" },
                      { value: "Average", label: "Average" },
                      { value: "Poor", label: "Poor" },
                    ]}
                  />
                </div>
              </>
            )}
          </div>
          <div className="mt-4 flex justify-end gap-3">
            {activeTab === "outgoing" && (
              <button
                onClick={handleResetFilters}
                className="h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium flex items-center gap-2"
              >
                Reset
              </button>
            )}
            <button
              onClick={handleFilter}
              className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Filter
            </button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50">
          <CardTitle className="text-lg text-slate-900">
            {activeTab === "incoming" ? "Incoming Calls" : "Outgoing Calls"}{" "}
            Records: {activeTab === "incoming" ? incomingRecords.length : outgoingRecords.length}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Type</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Date</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Name / Company</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Contact</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Details</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">User</th>
                  {activeTab === "outgoing" && (
                    <th className="text-center px-4 py-3 text-sm font-medium text-slate-600">Call Type</th>
                  )}
                  {activeTab === "outgoing" && (
                    <th className="text-center px-4 py-3 text-sm font-medium text-slate-600">Feedback</th>
                  )}
                  {showPriority && (
                    <th className="text-center px-4 py-3 text-sm font-medium text-slate-600">Priority</th>
                  )}
                  <th className="text-center px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeTab === "incoming" ? (
                  incomingRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                        No records found
                      </td>
                    </tr>
                  ) : (
                    incomingRecords.map((record) => (
                      <tr key={record._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                            Incoming
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            {record.date}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                          {record.customerName}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {record.contactNumber}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {record.productType || record.consumableType || record.serviceType || record.inquiryType}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {record.createdBy?.name || "Unknown"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {record.priority ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              record.priority === "Urgent"
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-700"
                            }`}>
                              {record.priority}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setDialogRecord(record)}
                            className="p-2 hover:bg-slate-100 rounded-lg"
                          >
                            <Eye className="h-4 w-4 text-slate-400" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )
                ) : (
                  outgoingRecords.length === 0 ? (
                    <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                      No outgoing call records found
                      </td>
                    </tr>
                  ) : (
                    outgoingRecords.map((record) => (
                      <tr key={record._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                            Outgoing
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            {record.date}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                          {record.companyName || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {record.contactPersonPhone || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {record.product || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {record.createdBy?.name || "Unknown"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm">{record.outgoingCallType || "-"}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {record.feedbackType ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              record.feedbackType === "Good" ? "bg-emerald-100 text-emerald-700" :
                              record.feedbackType === "Average" ? "bg-amber-100 text-amber-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {record.feedbackType}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setDialogRecord(record)}
                            className="p-2 hover:bg-slate-100 rounded-lg"
                          >
                            <Eye className="h-4 w-4 text-slate-400" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={dialogRecord !== null}
        onClose={() => setDialogRecord(null)}
        title={
          dialogRecord?.callType === "incoming" ? "Incoming Call Details" : "Outgoing Call Details"
        }
      >
        {dialogRecord && dialogRecord.callType === "incoming" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Customer Name</p>
                <p className="font-medium">{dialogRecord.customerName}</p>
              </div>
              <div>
                <p className="text-slate-500">Contact</p>
                <p className="font-medium">{dialogRecord.contactNumber}</p>
              </div>
              <div>
                <p className="text-slate-500">Inquiry Type</p>
                <p className="font-medium">{dialogRecord.inquiryType}</p>
              </div>
              {dialogRecord.productType && (
                <div>
                  <p className="text-slate-500">Product</p>
                  <p className="font-medium">{dialogRecord.productType}</p>
                </div>
              )}
              {dialogRecord.consumableType && (
                <div>
                  <p className="text-slate-500">Consumable</p>
                  <p className="font-medium">{dialogRecord.consumableType}</p>
                </div>
              )}
              {dialogRecord.serviceType && (
                <div>
                  <p className="text-slate-500">Service</p>
                  <p className="font-medium">{dialogRecord.serviceType}</p>
                </div>
              )}
              <div>
                <p className="text-slate-500">Priority</p>
                <p className="font-medium">{dialogRecord.priority}</p>
              </div>
              {dialogRecord.callTransferTo && (
                <div>
                  <p className="text-slate-500">Transferred To</p>
                  <p className="font-medium">{dialogRecord.callTransferTo.name}</p>
                </div>
              )}
              <div>
                <p className="text-slate-500">Date</p>
                <p className="font-medium">{dialogRecord.date}</p>
              </div>
              <div>
                <p className="text-slate-500">Recorded By</p>
                <p className="font-medium">{dialogRecord.createdBy?.name}</p>
              </div>
              <div>
                <p className="text-slate-500">Recorded At</p>
                <p className="font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(dialogRecord.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            {dialogRecord.issue && (
              <div>
                <p className="text-slate-500 text-sm mb-1">Issue</p>
                <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">{dialogRecord.issue}</p>
              </div>
            )}
          </div>
        )}

        {dialogRecord && dialogRecord.callType === "outgoing" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Company Name</p>
                <p className="font-medium">{dialogRecord.companyName}</p>
              </div>
              <div>
                <p className="text-slate-500">Contact Person</p>
                <p className="font-medium">{dialogRecord.contactPersonName || "-"}</p>
              </div>
              <div>
                <p className="text-slate-500">Phone</p>
                <p className="font-medium">{dialogRecord.contactPersonPhone || "-"}</p>
              </div>
              <div>
                <p className="text-slate-500">Product</p>
                <p className="font-medium">{dialogRecord.product || "-"}</p>
              </div>
              {dialogRecord.isLeadSearch && dialogRecord.leadFound && (
                <div>
                  <p className="text-slate-500">Lead Found</p>
                  <p className="font-medium">
                    {dialogRecord.leadFound === "yes" ? "Yes" : dialogRecord.leadFound === "no" ? "No" : "-"}
                  </p>
                </div>
              )}
              {dialogRecord.outgoingCallType && (
                <div>
                  <p className="text-slate-500">Call Type</p>
                  <p className="font-medium">{dialogRecord.outgoingCallType}</p>
                </div>
              )}
              {dialogRecord.feedbackType && (
                <div>
                  <p className="text-slate-500">Feedback Type</p>
                  <p className="font-medium">{dialogRecord.feedbackType}</p>
                </div>
              )}
              <div>
                <p className="text-slate-500">Date</p>
                <p className="font-medium">{dialogRecord.date}</p>
              </div>
              <div>
                <p className="text-slate-500">Recorded By</p>
                <p className="font-medium">{dialogRecord.createdBy?.name || "Unknown"}</p>
              </div>
              <div>
                <p className="text-slate-500">Recorded At</p>
                <p className="font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(dialogRecord.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            {dialogRecord.isLeadSearch ? (
              <div>
                <p className="text-slate-500 text-sm mb-1">Lead Search</p>
                <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                  {"Lead Search"} — Lead Found: {dialogRecord.leadFound === "yes" ? "Yes" : dialogRecord.leadFound === "no" ? "No" : "-"}
                </p>
              </div>
            ) : dialogRecord.causeForCall && (
              <div>
                <p className="text-slate-500 text-sm mb-1">Cause for Call</p>
                <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">{dialogRecord.causeForCall}</p>
              </div>
            )}
            {dialogRecord.outcomeFromCall && (
              <div>
                <p className="text-slate-500 text-sm mb-1">Outcome from Call</p>
                <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">{dialogRecord.outcomeFromCall}</p>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  )
}