"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import axios from "axios"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  Phone, 
  Calendar, 
  User, 
  Search,
  CheckCircle, 
  Package,
  AlertCircle,
  ChevronDown,
  UserCheck,
  Clock,
  PhoneOutgoing,
  Building2,
  DoorOpen,
  LogOut
} from "lucide-react"
import { useAuthStore } from "@/store/authStore"

interface User {
  _id: string
  name: string
  email: string
  role: string
}

const INQUIRY_TYPE_OPTIONS = [
  { value: "Product", label: "Product" },
  { value: "Consumable", label: "Consumable" },
  { value: "Service", label: "Service" },
]

const PRODUCT_OPTIONS = [
  { value: "MFP / Printer", label: "MFP / Printer" },
  { value: "MDS", label: "MDS" },
  { value: "Barcode", label: "Barcode" },
  { value: "POS", label: "POS" },
  { value: "IT / Infrastructure", label: "IT / Infrastructure" },
  { value: "AMC / Consumables", label: "AMC / Consumables" },
  { value: "Paper Shredder", label: "Paper Shredder" },
  { value: "Duplicator Solutions", label: "Duplicator Solutions" },
  { value: "Others", label: "Others" },
]

const CONSUMABLE_OPTIONS = [
  { value: "Toner", label: "Toner" },
]

const SERVICE_OPTIONS = [
  { value: "Support", label: "Support" },
  { value: "Service", label: "Service" },
]

const PRIORITY_OPTIONS = [
  { value: "Normal", label: "Normal" },
  { value: "Urgent", label: "Urgent" },
]

const PRODUCT_FOR_CALL_OPTIONS = [
  { value: "MFP / Printer", label: "MFP / Printer" },
  { value: "MDS", label: "MDS" },
  { value: "Barcode", label: "Barcode" },
  { value: "POS", label: "POS" },
  { value: "IT / Infrastructure", label: "IT / Infrastructure" },
  { value: "AMC / Consumables", label: "AMC / Consumables" },
  { value: "Paper Shredder", label: "Paper Shredder" },
  { value: "Duplicator Solutions", label: "Duplicator Solutions" },
  { value: "Others", label: "Others" },
]

interface FrontdeskRecord {
  _id: string
  callType: "incoming" | "outgoing" | "visit"
  date: string
  createdAt: string
  // Incoming
  customerName?: string
  contactNumber?: string
  inquiryType?: string
  productType?: string
  consumableType?: string
  serviceType?: string
  issue?: string
  callTransferTo?: { _id: string; name: string }
  priority?: string
  // Outgoing
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
  // Visit
  visitorName?: string
  fromLocation?: string
  toLocation?: string
  purpose?: string
  phoneNumber?: string
  inTime?: string
  outTime?: string
}

const TABS = [
  { id: "incoming", label: "Incoming Calls", icon: Phone },
  { id: "outgoing", label: "Outgoing Calls", icon: PhoneOutgoing },
  { id: "visit", label: "Office Visits", icon: DoorOpen },
] as const

type TabId = typeof TABS[number]["id"]

export default function FrontdeskCallPage() {
  const { user } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [activeTab, setActiveTab] = useState<TabId>("incoming")
  const [viewMode, setViewMode] = useState<"form" | "list">("form")
  const [records, setRecords] = useState<FrontdeskRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  // Incoming call state
  const [callDate, setCallDate] = useState(new Date().toISOString().split("T")[0])
  const [customerName, setCustomerName] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [inquiryType, setInquiryType] = useState("Product")
  const [productType, setProductType] = useState("MFP / Printer")
  const [consumableType, setConsumableType] = useState("Toner")
  const [serviceType, setServiceType] = useState("Support")
  const [issue, setIssue] = useState("")
  const [callTransferTo, setCallTransferTo] = useState("")
  const [priority, setPriority] = useState("Normal")

  // Outgoing call state
  const [outgoingDate, setOutgoingDate] = useState(new Date().toISOString().split("T")[0])
  const [companyName, setCompanyName] = useState("")
  const [contactPersonName, setContactPersonName] = useState("")
  const [contactPersonPhone, setContactPersonPhone] = useState("")
  const [productForCall, setProductForCall] = useState("MFP / Printer")
  const [causeForCall, setCauseForCall] = useState("")
  const [outcomeFromCall, setOutcomeFromCall] = useState("")
  const [isLeadSearch, setIsLeadSearch] = useState(false)
  const [leadFound, setLeadFound] = useState("")
  const [outgoingCallType, setOutgoingCallType] = useState("Sales")
  const [feedbackType, setFeedbackType] = useState("Good")

  // Office visit state
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split("T")[0])
  const [visitorName, setVisitorName] = useState("")
  const [fromLocation, setFromLocation] = useState("")
  const [toLocation, setToLocation] = useState("")
  const [purpose, setPurpose] = useState("Meeting")
  const [visitPhoneNumber, setVisitPhoneNumber] = useState("")

  // User search state (incoming)
  const [searchQuery, setSearchQuery] = useState("")
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [listExpanded, setListExpanded] = useState<string | null>(null)
  const [leavingId, setLeavingId] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
    fetchRecords()
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/api/static-form/users", { withCredentials: true })
      setUsers(res.data.users || [])
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }

  const fetchRecords = async () => {
    try {
      const res = await axios.get("/api/frontdesk-calls", { withCredentials: true })
      setRecords(res.data.calls || [])
    } catch (error) {
      console.error("Failed to fetch records:", error)
    }
  }

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users
    const s = searchQuery.toLowerCase()
    return users.filter(u => 
      u.name.toLowerCase().includes(s) || 
      u.email.toLowerCase().includes(s)
    )
  }, [users, searchQuery])

  const handleIncomingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      await axios.post("/api/frontdesk-calls", {
        callType: "incoming",
        date: callDate,
        customerName,
        contactNumber,
        inquiryType,
        productType: inquiryType === "Product" ? productType : undefined,
        consumableType: inquiryType === "Consumable" ? consumableType : undefined,
        serviceType: inquiryType === "Service" ? serviceType : undefined,
        issue,
        callTransferTo: callTransferTo || undefined,
        priority,
      }, { withCredentials: true })

      setSuccess(true)
      setCallDate(new Date().toISOString().split("T")[0])
      setCustomerName("")
      setContactNumber("")
      setInquiryType("Product")
      setProductType("MFP / Printer")
      setConsumableType("Toner")
      setServiceType("Support")
      setIssue("")
      setCallTransferTo("")
      setPriority("Normal")
      setSelectedUser(null)
      setSearchQuery("")
      fetchRecords()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error: any) {
      setError(error.response?.data?.error || "Failed to submit call")
    } finally {
      setLoading(false)
    }
  }

  const handleOutgoingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      await axios.post("/api/frontdesk-calls", {
        callType: "outgoing",
        date: outgoingDate,
        companyName,
        contactPersonName,
        contactPersonPhone,
        product: productForCall,
        causeForCall: isLeadSearch ? undefined : causeForCall,
        outcomeFromCall,
        isLeadSearch,
        leadFound: isLeadSearch ? leadFound : undefined,
        outgoingCallType: outgoingCallType || undefined,
        feedbackType: feedbackType || undefined,
      }, { withCredentials: true })

      setSuccess(true)
      setOutgoingDate(new Date().toISOString().split("T")[0])
      setCompanyName("")
      setContactPersonName("")
      setContactPersonPhone("")
      setProductForCall("MFP / Printer")
      setCauseForCall("")
      setOutcomeFromCall("")
      setIsLeadSearch(false)
      setLeadFound("")
      setOutgoingCallType("Sales")
      setFeedbackType("Good")
      fetchRecords()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error: any) {
      setError(error.response?.data?.error || "Failed to submit call")
    } finally {
      setLoading(false)
    }
  }

  const handleVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      await axios.post("/api/frontdesk-calls", {
        callType: "visit",
        date: visitDate,
        visitorName,
        fromLocation,
        toLocation,
        purpose,
        phoneNumber: visitPhoneNumber,
      }, { withCredentials: true })

      setSuccess(true)
      setVisitDate(new Date().toISOString().split("T")[0])
      setVisitorName("")
      setFromLocation("")
      setToLocation("")
      setPurpose("Meeting")
      setVisitPhoneNumber("")
      fetchRecords()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error: any) {
      setError(error.response?.data?.error || "Failed to submit record")
    } finally {
      setLoading(false)
    }
  }

  const handleLeave = async (id: string) => {
    setLeavingId(id)
    try {
      await axios.patch("/api/frontdesk-calls", {
        id,
        outTime: new Date().toISOString(),
      }, { withCredentials: true })
      fetchRecords()
    } catch (error: any) {
      setError(error.response?.data?.error || "Failed to record leave time")
    } finally {
      setLeavingId(null)
    }
  }

  const resetIncomingForm = () => {
    setCallDate(new Date().toISOString().split("T")[0])
    setCustomerName("")
    setContactNumber("")
    setInquiryType("Product")
    setProductType("MFP / Printer")
    setConsumableType("Toner")
    setServiceType("Support")
    setIssue("")
    setCallTransferTo("")
    setPriority("Normal")
    setSelectedUser(null)
    setSearchQuery("")
  }

  const resetOutgoingForm = () => {
    setOutgoingDate(new Date().toISOString().split("T")[0])
    setCompanyName("")
    setContactPersonName("")
    setContactPersonPhone("")
    setProductForCall("MFP / Printer")
    setCauseForCall("")
    setOutcomeFromCall("")
    setIsLeadSearch(false)
    setLeadFound("")
    setOutgoingCallType("Sales")
    setFeedbackType("Good")
  }

  const resetVisitForm = () => {
    setVisitDate(new Date().toISOString().split("T")[0])
    setVisitorName("")
    setFromLocation("")
    setToLocation("")
    setPurpose("Meeting")
    setVisitPhoneNumber("")
  }

  const getTabRecords = (tabId: TabId) => {
    return records.filter(r => r.callType === tabId)
  }

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Phone className="h-8 w-8 text-blue-600" />
            Front Desk Calls / Visits
          </h1>
          <p className="text-slate-500 mt-1">Manage incoming calls, outgoing calls, and office visits.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "form" ? "default" : "outline"}
            onClick={() => setViewMode("form")}
            className={viewMode === "form" ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            New Record
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            onClick={() => setViewMode("list")}
            className={viewMode === "list" ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            View Records ({records.length})
          </Button>
        </div>
      </div>

      {success && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <Card className="border-emerald-200 bg-emerald-50 shadow-sm border-l-4 border-l-emerald-500">
            <CardContent className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-emerald-800">
                <div className="bg-emerald-100 p-2 rounded-full">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold">Submission Successful</p>
                  <p className="text-sm text-emerald-700 opacity-90">Record has been saved in the system.</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSuccess(false)}
                className="text-emerald-700 hover:bg-emerald-100"
              >
                Dismiss
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <Card className="border-red-200 bg-red-50 shadow-sm border-l-4 border-l-red-500">
            <CardContent className="py-4 flex items-center gap-3 text-red-800">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-semibold">Action Required</p>
                <p className="text-sm text-red-700 opacity-90">{error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1">
          {TABS.map((tab) => {
            const count = getTabRecords(tab.id).length
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all ${
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

      {viewMode === "form" && activeTab === "incoming" && (
        <form onSubmit={handleIncomingSubmit} className="space-y-8">
          <Card className="border-slate-200 shadow-sm overflow-hidden border-t-2 border-t-blue-500">
            <CardHeader className="bg-slate-50">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Customer Information
              </CardTitle>
              <CardDescription>Enter the customer details from the call</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="callDate" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    Date
                  </Label>
                  <div className="relative group transition-all">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      id="callDate"
                      type="date"
                      value={callDate}
                      onChange={(e) => setCallDate(e.target.value)}
                      className="pl-10 h-11 border-slate-200 focus:border-blue-500 transition-all shadow-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    Priority
                  </Label>
                  <Select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    options={PRIORITY_OPTIONS}
                    className="h-11 border-slate-200 focus:border-blue-500 transition-all shadow-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerName" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    Customer Name
                  </Label>
                  <div className="relative group transition-all">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter customer name"
                      className="pl-10 h-11 border-slate-200 focus:border-blue-500 transition-all shadow-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactNumber" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    Contact Number
                  </Label>
                  <div className="relative group transition-all">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      id="contactNumber"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="Enter contact number"
                      className="pl-10 h-11 border-slate-200 focus:border-blue-500 transition-all shadow-none"
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm overflow-hidden border-t-2 border-t-indigo-500">
            <CardHeader className="bg-slate-50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-indigo-600" />
                Inquiry Details
              </CardTitle>
              <CardDescription>Select the type of inquiry and relevant details</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="inquiryType" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    Inquiry Type
                  </Label>
                  <Select
                    id="inquiryType"
                    value={inquiryType}
                    onChange={(e) => {
                      setInquiryType(e.target.value)
                      setProductType("MFP / Printer")
                      setConsumableType("Toner")
                      setServiceType("Support")
                    }}
                    options={INQUIRY_TYPE_OPTIONS}
                    className="h-11 border-slate-200 focus:border-indigo-500 transition-all shadow-none"
                    required
                  />
                </div>

                {inquiryType === "Product" && (
                  <div className="space-y-2">
                    <Label htmlFor="productType" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                      Product
                    </Label>
                    <Select
                      id="productType"
                      value={productType}
                      onChange={(e) => setProductType(e.target.value)}
                      options={PRODUCT_OPTIONS}
                      className="h-11 border-slate-200 focus:border-indigo-500 transition-all shadow-none"
                      required
                    />
                  </div>
                )}

                {inquiryType === "Consumable" && (
                  <div className="space-y-2">
                    <Label htmlFor="consumableType" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                      Consumable
                    </Label>
                    <Select
                      id="consumableType"
                      value={consumableType}
                      onChange={(e) => setConsumableType(e.target.value)}
                      options={CONSUMABLE_OPTIONS}
                      className="h-11 border-slate-200 focus:border-indigo-500 transition-all shadow-none"
                      required
                    />
                  </div>
                )}

                {inquiryType === "Service" && (
                  <div className="space-y-2">
                    <Label htmlFor="serviceType" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                      Service
                    </Label>
                    <Select
                      id="serviceType"
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value)}
                      options={SERVICE_OPTIONS}
                      className="h-11 border-slate-200 focus:border-indigo-500 transition-all shadow-none"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="issue" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                  Issue / Inquiry Description
                </Label>
                <Textarea
                  id="issue"
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  placeholder="Describe the customer's inquiry or issue..."
                  className="min-h-[120px] border-slate-200 focus:border-indigo-500 transition-all shadow-none"
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm border-t-2 border-t-amber-500">
            <CardHeader className="bg-slate-50">
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-amber-600" />
                Call Transfer
              </CardTitle>
              <CardDescription>Transfer this call to a specific user if needed</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2">
                <Label htmlFor="callTransferTo" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                  Call Transfer To (Optional)
                </Label>
                <div className="relative" ref={wrapperRef}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      id="callTransferTo"
                      placeholder={selectedUser ? `${selectedUser.name} (${selectedUser.email})` : "Search and select user..."}
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setShowUserDropdown(true)
                      }}
                      onFocus={() => setShowUserDropdown(true)}
                      className="w-full h-11 pl-10 pr-12 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {selectedUser && !searchQuery && (
                      <button 
                        type="button" 
                        className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        onClick={() => {
                          setCallTransferTo("")
                          setSelectedUser(null)
                          setSearchQuery("")
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                  
                  {showUserDropdown && (
                    <div 
                      className="absolute z-[9999] mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-auto"
                      style={{ width: 'auto', minWidth: '100%' }}
                    >
                      {filteredUsers.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-slate-500">
                          {users.length === 0 ? "Loading users..." : "No users found"}
                        </div>
                      ) : (
                        filteredUsers.map((u) => (
                          <button
                            key={u._id}
                            type="button"
                            className="w-full px-4 py-3 text-left hover:bg-slate-50 flex flex-col border-b border-slate-100 last:border-b-0"
                            onClick={() => {
                              setCallTransferTo(u._id)
                              setSelectedUser(u)
                              setSearchQuery("")
                              setShowUserDropdown(false)
                            }}
                          >
                            <span className="font-medium text-slate-900">{u.name}</span>
                            <span className="text-sm text-slate-500">{u.email} ({u.role})</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="pt-6 flex flex-col md:flex-row items-center gap-4 justify-between border-t border-slate-200">
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-slate-400" />
              Please review all entries before final submission.
            </p>
            <Button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto min-w-[200px] bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg font-bold h-auto shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                "Submit Call"
              )}
            </Button>
          </div>
        </form>
      )}

      {viewMode === "form" && activeTab === "outgoing" && (
        <form onSubmit={handleOutgoingSubmit} className="space-y-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden border-t-2 border-t-blue-500">
            <CardHeader className="bg-slate-50">
              <CardTitle className="text-lg flex items-center gap-2">
                <PhoneOutgoing className="h-5 w-5 text-blue-600" />
                Outgoing Call Details
              </CardTitle>
              <CardDescription>Record details of outgoing calls made</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="outgoingDate" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    Date
                  </Label>
                  <div className="relative group transition-all">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      id="outgoingDate"
                      type="date"
                      value={outgoingDate}
                      onChange={(e) => setOutgoingDate(e.target.value)}
                      className="pl-10 h-11 border-slate-200 focus:border-blue-500 transition-all shadow-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    Company Name
                  </Label>
                  <div className="relative group transition-all">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Enter company name"
                      className="pl-10 h-11 border-slate-200 focus:border-blue-500 transition-all shadow-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPersonName" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    Contact Person Name
                  </Label>
                  <div className="relative group transition-all">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      id="contactPersonName"
                      value={contactPersonName}
                      onChange={(e) => setContactPersonName(e.target.value)}
                      placeholder="Enter contact person name"
                      className="pl-10 h-11 border-slate-200 focus:border-blue-500 transition-all shadow-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPersonPhone" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    Contact Person Phone
                  </Label>
                  <div className="relative group transition-all">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      id="contactPersonPhone"
                      value={contactPersonPhone}
                      onChange={(e) => setContactPersonPhone(e.target.value)}
                      placeholder="Enter contact phone"
                      className="pl-10 h-11 border-slate-200 focus:border-blue-500 transition-all shadow-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="productForCall" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                  Call For Which Product
                </Label>
                <Select
                  id="productForCall"
                  value={productForCall}
                  onChange={(e) => setProductForCall(e.target.value)}
                  options={PRODUCT_FOR_CALL_OPTIONS}
                  className="h-11 border-slate-200 focus:border-blue-500 transition-all shadow-none"
                  required
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isLeadSearch"
                    checked={isLeadSearch}
                    onChange={(e) => {
                      setIsLeadSearch(e.target.checked)
                      if (e.target.checked) {
                        setCauseForCall("")
                      }
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="isLeadSearch" className="text-sm font-semibold text-slate-700 uppercase tracking-wider cursor-pointer">
                    Lead Search
                  </Label>
                </div>

                <Textarea
                  id="causeForCall"
                  value={causeForCall}
                  onChange={(e) => setCauseForCall(e.target.value)}
                  placeholder="Describe the reason for the call..."
                  className="min-h-[100px] border-slate-200 focus:border-blue-500 transition-all shadow-none"
                  required={!isLeadSearch}
                  disabled={isLeadSearch}
                />

                {isLeadSearch && (
                  <div className="space-y-4 pl-6 border-l-2 border-blue-200 mt-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                        Lead Found
                      </Label>
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="leadFound"
                            value="yes"
                            checked={leadFound === "yes"}
                            onChange={(e) => setLeadFound(e.target.value)}
                            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-sm font-medium text-slate-700">Yes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="leadFound"
                            value="no"
                            checked={leadFound === "no"}
                            onChange={(e) => setLeadFound(e.target.value)}
                            className="h-4 w-4 text-red-600 focus:ring-red-500"
                          />
                          <span className="text-sm font-medium text-slate-700">No</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="outcomeFromCall" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                  Outcome from Call
                </Label>
                <Textarea
                  id="outcomeFromCall"
                  value={outcomeFromCall}
                  onChange={(e) => setOutcomeFromCall(e.target.value)}
                  placeholder="Describe the outcome of the call..."
                  className="min-h-[100px] border-slate-200 focus:border-blue-500 transition-all shadow-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="outgoingCallType" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    Call Type
                  </Label>
                  <Select
                    id="outgoingCallType"
                    value={outgoingCallType}
                    onChange={(e) => setOutgoingCallType(e.target.value)}
                    options={[
                      { value: "Sales", label: "Sales" },
                      { value: "Support", label: "Support" },
                    ]}
                    className="h-11 border-slate-200 focus:border-blue-500 transition-all shadow-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedbackType" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    Feedback Type
                  </Label>
                  <Select
                    id="feedbackType"
                    value={feedbackType}
                    onChange={(e) => setFeedbackType(e.target.value)}
                    options={[
                      { value: "Good", label: "Good" },
                      { value: "Average", label: "Average" },
                      { value: "Poor", label: "Poor" },
                    ]}
                    className="h-11 border-slate-200 focus:border-blue-500 transition-all shadow-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="pt-6 flex flex-col md:flex-row items-center gap-4 justify-between border-t border-slate-200">
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-slate-400" />
              Please review all entries before final submission.
            </p>
            <Button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto min-w-[200px] bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg font-bold h-auto shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                "Submit Outgoing Call"
              )}
            </Button>
          </div>
        </form>
      )}

      {viewMode === "form" && activeTab === "visit" && (
        <form onSubmit={handleVisitSubmit} className="space-y-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden border-t-2 border-t-blue-500">
            <CardHeader className="bg-slate-50">
              <CardTitle className="text-lg flex items-center gap-2">
                <DoorOpen className="h-5 w-5 text-blue-600" />
                Office Visit Details
              </CardTitle>
              <CardDescription>Record visitor information for office visits</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="visitDate" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    Date
                  </Label>
                  <div className="relative group transition-all">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      id="visitDate"
                      type="date"
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      className="pl-10 h-11 border-slate-200 focus:border-blue-500 transition-all shadow-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visitorName" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    Visitor's Name
                  </Label>
                  <div className="relative group transition-all">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      id="visitorName"
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      placeholder="Enter visitor name"
                      className="pl-10 h-11 border-slate-200 focus:border-blue-500 transition-all shadow-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fromLocation" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    From
                  </Label>
                  <Input
                    id="fromLocation"
                    value={fromLocation}
                    onChange={(e) => setFromLocation(e.target.value)}
                    placeholder="Company / Organization"
                    className="h-11 border-slate-200 focus:border-blue-500 transition-all shadow-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="toLocation" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    To
                  </Label>
                  <Input
                    id="toLocation"
                    value={toLocation}
                    onChange={(e) => setToLocation(e.target.value)}
                    placeholder="Department / Person meeting"
                    className="h-11 border-slate-200 focus:border-blue-500 transition-all shadow-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    Purpose
                  </Label>
                  <Select
                    id="purpose"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    options={[
                      { value: "Meeting", label: "Meeting" },
                      { value: "Bill", label: "Bill" },
                      { value: "Interview", label: "Interview" },
                      { value: "Service", label: "Service" },
                      { value: "Others", label: "Others" },
                    ]}
                    className="h-11 border-slate-200 focus:border-blue-500 transition-all shadow-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visitPhoneNumber" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    Phone Number
                  </Label>
                  <div className="relative group transition-all">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      id="visitPhoneNumber"
                      value={visitPhoneNumber}
                      onChange={(e) => setVisitPhoneNumber(e.target.value)}
                      placeholder="Enter phone number"
                      className="pl-10 h-11 border-slate-200 focus:border-blue-500 transition-all shadow-none"
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="pt-6 flex flex-col md:flex-row items-center gap-4 justify-between border-t border-slate-200">
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-slate-400" />
              In time will be recorded automatically upon submission.
            </p>
            <Button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto min-w-[200px] bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg font-bold h-auto shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                "Record Visit (In Time)"
              )}
            </Button>
          </div>
        </form>
      )}

      {viewMode === "list" && (
        <div className="space-y-6">
          {getTabRecords(activeTab).length === 0 ? (
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="py-12 text-center">
                <Phone className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No records found.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setViewMode("form")}
                >
                  Create New Record
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {getTabRecords(activeTab).slice().reverse().map((record) => (
                <Card 
                  key={record._id} 
                  className="border-slate-200 shadow-sm overflow-hidden"
                >
                  <div 
                    className="p-4 cursor-pointer flex items-center justify-between"
                    onClick={() => setListExpanded(listExpanded === record._id ? null : record._id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
                        {record.callType === "incoming" && <Phone className="h-5 w-5" />}
                        {record.callType === "outgoing" && <PhoneOutgoing className="h-5 w-5" />}
                        {record.callType === "visit" && <DoorOpen className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {record.callType === "incoming" && record.customerName}
                          {record.callType === "outgoing" && record.companyName}
                          {record.callType === "visit" && record.visitorName}
                        </p>
                        <p className="text-sm text-slate-500">
                          {record.callType === "incoming" && record.contactNumber}
                          {record.callType === "outgoing" && record.contactPersonPhone}
                          {record.callType === "visit" && record.phoneNumber}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {record.callType === "visit" && !record.outTime && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleLeave(record._id)
                          }}
                          disabled={leavingId === record._id}
                        >
                          {leavingId === record._id ? (
                            <div className="h-4 w-4 border-2 border-emerald-300 border-t-emerald-700 rounded-full animate-spin" />
                          ) : (
                            <>
                              <LogOut className="h-4 w-4 mr-1" />
                              Leave
                            </>
                          )}
                        </Button>
                      )}
                      <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${listExpanded === record._id ? "rotate-180" : ""}`} />
                    </div>
                  </div>
                  
                  {listExpanded === record._id && (
                    <CardContent className="border-t border-slate-100 pt-4 space-y-4">
                      {record.callType === "incoming" && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500">Date</p>
                            <p className="font-medium">{record.date}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Inquiry Type</p>
                            <p className="font-medium">{record.inquiryType}</p>
                          </div>
                          {record.productType && (
                            <div>
                              <p className="text-slate-500">Product</p>
                              <p className="font-medium">{record.productType}</p>
                            </div>
                          )}
                          {record.consumableType && (
                            <div>
                              <p className="text-slate-500">Consumable</p>
                              <p className="font-medium">{record.consumableType}</p>
                            </div>
                          )}
                          {record.serviceType && (
                            <div>
                              <p className="text-slate-500">Service</p>
                              <p className="font-medium">{record.serviceType}</p>
                            </div>
                          )}
                          {record.priority && (
                            <div>
                              <p className="text-slate-500">Priority</p>
                              <p className="font-medium">{record.priority}</p>
                            </div>
                          )}
                          {record.callTransferTo && (
                            <div>
                              <p className="text-slate-500">Transferred To</p>
                              <p className="font-medium">{record.callTransferTo.name}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-slate-500">Recorded At</p>
                            <p className="font-medium flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(record.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}

                      {record.callType === "visit" && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500">Date</p>
                            <p className="font-medium">{record.date}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Visitor Name</p>
                            <p className="font-medium">{record.visitorName}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">From</p>
                            <p className="font-medium">{record.fromLocation || "-"}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">To</p>
                            <p className="font-medium">{record.toLocation || "-"}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Purpose</p>
                            <p className="font-medium">{record.purpose || "-"}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Phone</p>
                            <p className="font-medium">{record.phoneNumber}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">In Time</p>
                            <p className="font-medium">{formatTime(record.inTime)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Out Time</p>
                            <p className="font-medium">{record.outTime ? formatTime(record.outTime) : "Not left yet"}</p>
                          </div>
                        </div>
                      )}

                      {record.callType === "outgoing" && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500">Date</p>
                            <p className="font-medium">{record.date}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Company Name</p>
                            <p className="font-medium">{record.companyName}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Contact Person</p>
                            <p className="font-medium">{record.contactPersonName}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Contact Phone</p>
                            <p className="font-medium">{record.contactPersonPhone}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Product</p>
                            <p className="font-medium">{record.product || "-"}</p>
                          </div>
                          {record.outgoingCallType && (
                            <div>
                              <p className="text-slate-500">Call Type</p>
                              <p className="font-medium">{record.outgoingCallType}</p>
                            </div>
                          )}
                          {record.feedbackType && (
                            <div>
                              <p className="text-slate-500">Feedback</p>
                              <p className="font-medium">{record.feedbackType}</p>
                            </div>
                          )}
                          {record.isLeadSearch && record.leadFound && (
                            <div>
                              <p className="text-slate-500">Lead Found</p>
                              <p className="font-medium">
                                {record.leadFound === "yes" ? "Yes" : record.leadFound === "no" ? "No" : "-"}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-slate-500">Recorded At</p>
                            <p className="font-medium flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(record.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}

                      {record.callType === "incoming" && record.issue && (
                        <div>
                          <p className="text-slate-500 mb-1">Issue</p>
                          <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">{record.issue}</p>
                        </div>
                      )}

                      {record.callType === "outgoing" && (
                        <>
                          {record.isLeadSearch ? (
                            <div>
                              <p className="text-slate-500 mb-1">Lead Search</p>
                              <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                                {"Lead Search"} — Lead Found: {record.leadFound === "yes" ? "Yes" : record.leadFound === "no" ? "No" : "-"}
                              </p>
                            </div>
                          ) : record.causeForCall && (
                            <div>
                              <p className="text-slate-500 mb-1">Cause for Call</p>
                              <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">{record.causeForCall}</p>
                            </div>
                          )}
                          {record.outcomeFromCall && (
                            <div>
                              <p className="text-slate-500 mb-1">Outcome from Call</p>
                              <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">{record.outcomeFromCall}</p>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}