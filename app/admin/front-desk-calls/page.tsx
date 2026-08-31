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
  Calendar, 
  Users,
  Search, 
  Filter,
  Clock,
  ChevronDown,
  PhoneOutgoing,
  DoorOpen,
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

interface TabFilter {
  startDate: string
  endDate: string
  selectedUser: string
  selectedPriority: string
  visitorName: string
  companyName: string
  purpose: string
  outgoingCompanyName: string
  outgoingProduct: string
  outgoingLeadSearch: string
  outgoingLeadFound: string
  outgoingCallType: string
  outgoingFeedbackType: string
  incomingCustomerName: string
  incomingInquiryType: string
  incomingTransferredTo: string
  incomingTransferredToRole: string
}

const TABS = [
  { id: "all", label: "All Records", icon: Users },
  { id: "incoming", label: "Incoming Calls", icon: Phone },
  { id: "outgoing", label: "Outgoing Calls", icon: PhoneOutgoing },
  { id: "visit", label: "Office Visits", icon: DoorOpen },
] as const

type TabId = typeof TABS[number]["id"]

const defaultFilter: TabFilter = {
  startDate: "",
  endDate: "",
  selectedUser: "all",
  selectedPriority: "all",
  visitorName: "",
  companyName: "",
  purpose: "",
  outgoingCompanyName: "",
  outgoingProduct: "",
  outgoingLeadSearch: "",
  outgoingLeadFound: "",
  outgoingCallType: "",
  outgoingFeedbackType: "",
  incomingCustomerName: "",
  incomingTransferredTo: "",
  incomingTransferredToRole: "",
  incomingInquiryType: "",
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

export default function FrontDeskCallsPage() {
  const [records, setRecords] = useState<FrontdeskRecord[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>("all")
  const [tabFilters, setTabFilters] = useState<Record<TabId, TabFilter>>({
    all: { ...defaultFilter },
    incoming: { ...defaultFilter },
    outgoing: { ...defaultFilter },
    visit: { ...defaultFilter },
  })
  const [dialogRecord, setDialogRecord] = useState<FrontdeskRecord | null>(null)
  const [incomingTransferredToSearch, setIncomingTransferredToSearch] = useState("")
  const [showTransferredToDropdown, setShowTransferredToDropdown] = useState(false)
  const [incomingTransferredToId, setIncomingTransferredToId] = useState("")
  const transferredToRef = useRef<HTMLDivElement>(null)

  const currentFilter = tabFilters[activeTab]

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

  const handleFilter = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeTab !== "all") {
        params.append("callType", activeTab)
      }
      if (currentFilter.startDate) params.append("startDate", currentFilter.startDate)
      if (currentFilter.endDate) params.append("endDate", currentFilter.endDate)
      if (currentFilter.selectedUser !== "all") params.append("userId", currentFilter.selectedUser)
      if (currentFilter.selectedPriority !== "all") params.append("priority", currentFilter.selectedPriority)
      if (currentFilter.visitorName) params.append("visitorName", currentFilter.visitorName)
      if (currentFilter.companyName) params.append("companyName", currentFilter.companyName)
      if (currentFilter.purpose) params.append("purpose", currentFilter.purpose)
      if (currentFilter.incomingCustomerName) params.append("incomingCustomerName", currentFilter.incomingCustomerName)
      if (currentFilter.incomingInquiryType) params.append("incomingInquiryType", currentFilter.incomingInquiryType)
      if (incomingTransferredToId) params.append("incomingTransferredToId", incomingTransferredToId)
      else if (currentFilter.incomingTransferredTo) params.append("incomingTransferredTo", currentFilter.incomingTransferredTo)
      if (currentFilter.incomingTransferredToRole) params.append("incomingTransferredToRole", currentFilter.incomingTransferredToRole)
      if (currentFilter.outgoingCompanyName) params.append("outgoingCompanyName", currentFilter.outgoingCompanyName)
      if (currentFilter.outgoingProduct) params.append("outgoingProduct", currentFilter.outgoingProduct)
      if (currentFilter.outgoingLeadSearch) params.append("outgoingIsLeadSearch", currentFilter.outgoingLeadSearch)
      if (currentFilter.outgoingLeadFound) params.append("outgoingLeadFound", currentFilter.outgoingLeadFound)
      if (currentFilter.outgoingCallType) params.append("outgoingCallType", currentFilter.outgoingCallType)
      if (currentFilter.outgoingFeedbackType) params.append("outgoingFeedbackType", currentFilter.outgoingFeedbackType)

      const res = await axios.get(`/api/frontdesk-calls?${params}`, { withCredentials: true })
      setRecords(res.data.calls || [])
    } catch (error) {
      console.error("Failed to filter:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId)
    setDialogRecord(null)
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

  const roleFilter = currentFilter.incomingTransferredToRole
  const filteredTransferredToUsers = users
    .filter(u => u.name.toLowerCase().includes(incomingTransferredToSearch.toLowerCase()))
    .filter(u => !roleFilter || u.role === roleFilter)
    .slice(0, 10)

  const uniqueRoles = [...new Set(users.map(u => u.role))].sort()

  const roleOptions = [
    { value: "", label: "All Departments" },
    ...uniqueRoles.map(r => ({ value: r, label: getRoleDisplay(r) })),
  ]

  const getTabRecords = (tabId: TabId) => {
    if (tabId === "all") return records
    return records.filter(r => r.callType === tabId)
  }

  const filteredRecords = getTabRecords(activeTab)

  const totalRecords = records.length
  const incomingCount = records.filter(r => r.callType === "incoming").length
  const outgoingCount = records.filter(r => r.callType === "outgoing").length
  const visitCount = records.filter(r => r.callType === "visit").length

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const stats = [
    { label: "Total Records", count: totalRecords, icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "Incoming Calls", count: incomingCount, icon: Phone, color: "bg-purple-50 text-purple-600" },
    { label: "Outgoing Calls", count: outgoingCount, icon: PhoneOutgoing, color: "bg-amber-50 text-amber-600" },
    { label: "Office Visits", count: visitCount, icon: DoorOpen, color: "bg-emerald-50 text-emerald-600" },
  ]

  const showPriorityFilter = activeTab === "incoming"
  const showVisitFields = activeTab === "visit"
  const showOutgoingFields = activeTab === "outgoing"

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
        {stats.map((stat) => (
          <Card key={stat.label} className="border-slate-200 shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stat.count}</p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="border-b border-slate-200">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const count = getTabRecords(tab.id).length
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

      {activeTab !== "all" && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {activeTab === "incoming" ? "Filter Incoming Calls" :
               activeTab === "outgoing" ? "Filter Outgoing Calls" :
               "Filter Office Visits"}
            </CardTitle>
            <CardDescription>Set filters for the current tab</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-slate-700">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={currentFilter.startDate}
                  onChange={(e) => setTabFilters(prev => ({ ...prev, [activeTab]: { ...prev[activeTab], startDate: e.target.value } }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-slate-700">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={currentFilter.endDate}
                  onChange={(e) => setTabFilters(prev => ({ ...prev, [activeTab]: { ...prev[activeTab], endDate: e.target.value } }))}
                />
              </div>

              {activeTab === "incoming" && (
                <>
                  <AutocompleteInput
                    value={currentFilter.incomingCustomerName}
                    onChange={(val) => setTabFilters(prev => ({ ...prev, [activeTab]: { ...prev[activeTab], incomingCustomerName: val } }))}
                    placeholder="Search by customer name"
                    field="customerName"
                    label="Customer Name"
                  />
                  <div className="space-y-2">
                    <Label className="text-slate-700">Inquiry Type</Label>
                    <Select
                      value={currentFilter.incomingInquiryType}
                      onChange={(e) => setTabFilters(prev => ({ ...prev, [activeTab]: { ...prev[activeTab], incomingInquiryType: e.target.value } }))}
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
                      value={currentFilter.incomingTransferredToRole}
                      onChange={(e) => {
                        setTabFilters(prev => ({ ...prev, [activeTab]: { ...prev[activeTab], incomingTransferredToRole: e.target.value, incomingTransferredTo: "" } }))
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
                        placeholder={currentFilter.incomingTransferredTo || "Search user..."}
                        value={incomingTransferredToSearch}
                        onChange={(e) => {
                          setIncomingTransferredToSearch(e.target.value)
                          setShowTransferredToDropdown(true)
                        }}
                        onFocus={() => setShowTransferredToDropdown(true)}
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 pl-10 text-sm"
                      />
                      {currentFilter.incomingTransferredTo && (
                        <button
                          type="button"
                          onClick={() => {
                            setTabFilters(prev => ({ ...prev, [activeTab]: { ...prev[activeTab], incomingTransferredTo: "" } }))
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
                              setTabFilters(prev => ({ ...prev, [activeTab]: { ...prev[activeTab], incomingTransferredTo: u.name } }))
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
              {activeTab === "outgoing" && (
                <>
                  <AutocompleteInput
                    value={currentFilter.outgoingCompanyName}
                    onChange={(val) => setTabFilters(prev => ({ ...prev, [activeTab]: { ...prev[activeTab], outgoingCompanyName: val } }))}
                    placeholder="Search by company name"
                    field="companyName"
                    label="Company Name"
                  />
                  <div className="space-y-2">
                    <Label className="text-slate-700">Product Name</Label>
                    <Input
                      value={currentFilter.outgoingProduct}
                      onChange={(e) => setTabFilters(prev => ({ ...prev, [activeTab]: { ...prev[activeTab], outgoingProduct: e.target.value } }))}
                      placeholder="Search by product name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Lead Search</Label>
                    <Select
                      value={currentFilter.outgoingLeadSearch}
                      onChange={(e) => {
                        const val = e.target.value
                        setTabFilters(prev => ({ ...prev, [activeTab]: { ...prev[activeTab], outgoingLeadSearch: val, outgoingLeadFound: val !== "true" ? "" : prev[activeTab].outgoingLeadFound } }))
                      }}
                      options={[
                        { value: "", label: "All" },
                        { value: "true", label: "Yes" },
                        { value: "false", label: "No" },
                      ]}
                    />
                  </div>
                  {currentFilter.outgoingLeadSearch === "true" && (
                    <div className="space-y-2">
                      <Label className="text-slate-700">Lead Found</Label>
                      <Select
                        value={currentFilter.outgoingLeadFound}
                        onChange={(e) => setTabFilters(prev => ({ ...prev, [activeTab]: { ...prev[activeTab], outgoingLeadFound: e.target.value } }))}
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
                      value={currentFilter.outgoingCallType}
                      onChange={(e) => setTabFilters(prev => ({ ...prev, [activeTab]: { ...prev[activeTab], outgoingCallType: e.target.value } }))}
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
                      value={currentFilter.outgoingFeedbackType}
                      onChange={(e) => setTabFilters(prev => ({ ...prev, [activeTab]: { ...prev[activeTab], outgoingFeedbackType: e.target.value } }))}
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
              {showPriorityFilter && (
                <div className="space-y-2">
                  <Label htmlFor="priorityFilter" className="text-slate-700">Priority</Label>
                  <Select
                    id="priorityFilter"
                    value={currentFilter.selectedPriority}
                    onChange={(e) => setTabFilters(prev => ({ ...prev, [activeTab]: { ...prev[activeTab], selectedPriority: e.target.value } }))}
                    options={[
                      { value: "all", label: "All Priorities" },
                      { value: "Normal", label: "Normal" },
                      { value: "Urgent", label: "Urgent" },
                    ]}
                  />
                </div>
              )}

              {showVisitFields && (
                <>
                  <AutocompleteInput
                    value={currentFilter.visitorName}
                    onChange={(val) => setTabFilters(prev => ({ ...prev, [activeTab]: { ...prev[activeTab], visitorName: val } }))}
                    placeholder="Search by visitor name"
                    field="visitorName"
                    label="Visitor Name"
                  />
                  <AutocompleteInput
                    value={currentFilter.companyName}
                    onChange={(val) => setTabFilters(prev => ({ ...prev, [activeTab]: { ...prev[activeTab], companyName: val } }))}
                    placeholder="Search by company name"
                    field="fromLocation"
                    label="Company Name"
                  />
                  <div className="space-y-2">
                    <Label className="text-slate-700">Purpose</Label>
                    <Select
                      value={currentFilter.purpose}
                      onChange={(e) => setTabFilters(prev => ({ ...prev, [activeTab]: { ...prev[activeTab], purpose: e.target.value } }))}
                      options={[
                        { value: "", label: "All Purposes" },
                        { value: "Meeting", label: "Meeting" },
                        { value: "Bill", label: "Bill" },
                        { value: "Interview", label: "Interview" },
                        { value: "Service", label: "Service" },
                        { value: "Others", label: "Others" },
                      ]}
                    />
                  </div>
                </>
              )}
            </div>
            <div className="mt-4 flex justify-end">
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
      )}

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50">
          <CardTitle className="text-lg text-slate-900">
            {activeTab === "all" ? "All" :
             activeTab === "incoming" ? "Incoming Calls" :
             activeTab === "outgoing" ? "Outgoing Calls" :
             "Office Visits"}{" "}
            Records: {filteredRecords.length}
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
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Product Type</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">User</th>
                  {showOutgoingFields && (
                    <th className="text-center px-4 py-3 text-sm font-medium text-slate-600">Call Type</th>
                  )}
                  {showOutgoingFields && (
                    <th className="text-center px-4 py-3 text-sm font-medium text-slate-600">Feedback</th>
                  )}
                  {showPriorityFilter && (
                    <th className="text-center px-4 py-3 text-sm font-medium text-slate-600">Priority</th>
                  )}
                  <th className="text-center px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={showPriorityFilter ? 8 : showOutgoingFields ? 9 : 7} className="px-4 py-8 text-center text-slate-500">
                      No records found
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => {
                    const isVisit = record.callType === "visit"
                    const isOutgoing = record.callType === "outgoing"
                    const isIncoming = record.callType === "incoming"
                    return (
                      <tr key={record._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <Badge className={
                            isIncoming ? "bg-purple-100 text-purple-700 border-purple-200" :
                            isOutgoing ? "bg-amber-100 text-amber-700 border-amber-200" :
                            "bg-emerald-100 text-emerald-700 border-emerald-200"
                          }>
                            {isIncoming ? "Incoming" : isOutgoing ? "Outgoing" : "Visit"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            {record.date}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                          {record.customerName || record.companyName || record.visitorName}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {record.contactNumber || record.contactPersonPhone || record.phoneNumber}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {isIncoming && (record.productType || record.consumableType || record.serviceType || record.inquiryType)}
                          {isOutgoing && record.product}
                          {isVisit && (record.purpose || record.fromLocation)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {record.createdBy?.name || "Unknown"}
                        </td>
                        {showOutgoingFields && (
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm">{record.outgoingCallType || "-"}</span>
                          </td>
                        )}
                        {showOutgoingFields && (
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
                        )}
                        {showPriorityFilter && (
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
                        )}
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setDialogRecord(record)}
                            className="p-2 hover:bg-slate-100 rounded-lg"
                          >
                            <Eye className="h-4 w-4 text-slate-400" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
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
          dialogRecord?.callType === "incoming" ? "Incoming Call Details" :
          dialogRecord?.callType === "outgoing" ? "Outgoing Call Details" :
          "Visit Details"
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
                <p className="font-medium">{dialogRecord.contactPersonName}</p>
              </div>
              <div>
                <p className="text-slate-500">Phone</p>
                <p className="font-medium">{dialogRecord.contactPersonPhone}</p>
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

        {dialogRecord && dialogRecord.callType === "visit" && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Visitor Name</p>
              <p className="font-medium">{dialogRecord.visitorName}</p>
            </div>
            <div>
              <p className="text-slate-500">Phone</p>
              <p className="font-medium">{dialogRecord.phoneNumber}</p>
            </div>
            <div>
              <p className="text-slate-500">From</p>
              <p className="font-medium">{dialogRecord.fromLocation || "-"}</p>
            </div>
            <div>
              <p className="text-slate-500">To</p>
              <p className="font-medium">{dialogRecord.toLocation || "-"}</p>
            </div>
            <div>
              <p className="text-slate-500">Purpose</p>
              <p className="font-medium">{dialogRecord.purpose || "-"}</p>
            </div>
            <div>
              <p className="text-slate-500">Date</p>
              <p className="font-medium">{dialogRecord.date}</p>
            </div>
            <div>
              <p className="text-slate-500">In Time</p>
              <p className="font-medium">{formatTime(dialogRecord.inTime)}</p>
            </div>
            <div>
              <p className="text-slate-500">Out Time</p>
              <p className="font-medium">{dialogRecord.outTime ? formatTime(dialogRecord.outTime) : "Still in office"}</p>
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
        )}
      </Dialog>
    </div>
  )
}