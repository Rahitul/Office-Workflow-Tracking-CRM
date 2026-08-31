"use client"

import { useState, useEffect, useRef } from "react"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, FileText, Search, List, CheckCircle, XCircle, RefreshCw, Clock, AlertTriangle, DollarSign, ChevronDown, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProductModelData {
  modelName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface ProductEntryData {
  productName: string
  models: ProductModelData[]
}

interface QuotationData {
  _id: string
  quotationId: string
  quotationDate: string
  customerName: string
  engineerName: string
  amount: number
  quotationType: string
  contactPerson: string
  contactNumber: string
  department?: string
  billDate?: string
  status: string
  approvedAt?: string
  cancelledAt?: string
  revisedAt?: string
  lostAt?: string
  lostRemarks?: string
  followUpAt?: string[]
  followUpLogs?: Array<{
    date: string
    userId: string
    userName: string
    remarks: string
  }>
  products?: ProductEntryData[]
  createdAt: string
}

type TabType = "list" | "total-bill"

function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const mins = Math.round(totalMinutes % 60)
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`
  if (hours > 0) return `${hours}h`
  return `${mins}m`
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

function getDurationMinutes(fromIso: string, toIso?: string): number {
  const from = new Date(fromIso).getTime()
  const to = toIso ? new Date(toIso).getTime() : Date.now()
  return Math.floor((to - from) / 60000)
}

function statusBadge(status: string) {
  if (status.startsWith("Follow Up")) return <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">{status}</span>
  switch (status) {
    case "Pending": return <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>
    case "Approved": return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Approved</span>
    case "Cancelled": return <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Cancelled</span>
    case "Revised": return <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Revised</span>
    case "Lost": return <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Lost</span>
    default: return <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">{status}</span>
  }
}

function statusIcon(status: string) {
  if (status.startsWith("Follow Up")) return <Clock className="w-4 h-4 text-yellow-500" />
  switch (status) {
    case "Pending": return <Clock className="w-4 h-4 text-yellow-500" />
    case "Approved": return <CheckCircle className="w-4 h-4 text-green-600" />
    case "Cancelled": return <XCircle className="w-4 h-4 text-red-600" />
    case "Revised": return <RefreshCw className="w-4 h-4 text-blue-600" />
    case "Lost": return <AlertTriangle className="w-4 h-4 text-gray-600" />
    default: return <Clock className="w-4 h-4 text-yellow-600" />
  }
}

const statusTransitions: { status: string; field: keyof QuotationData }[] = [
  { status: "Approved", field: "approvedAt" },
  { status: "Cancelled", field: "cancelledAt" },
  { status: "Revised", field: "revisedAt" },
  { status: "Lost", field: "lostAt" },
]

export function QuotationsListTab({ showAll, engineerFilter, category }: { showAll?: boolean; engineerFilter?: string[]; category?: string }) {
  const { user } = useAuthStore()
  const [quotations, setQuotations] = useState<QuotationData[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [statusAction, setStatusAction] = useState<Record<string, { newStatus: string; billDate: string; lostRemarks: string; followUpRemarks: string }>>({})
  const [billDateInputs, setBillDateInputs] = useState<Record<string, string>>({})
  const [editingAmount, setEditingAmount] = useState<Record<string, string>>({})
  const [savingAmount, setSavingAmount] = useState<string | null>(null)
  const [filterCustomer, setFilterCustomer] = useState("")
  const [filterCustomerSearch, setFilterCustomerSearch] = useState("")
  const [filterCustomerOpen, setFilterCustomerOpen] = useState(false)
  const [filterDepartment, setFilterDepartment] = useState("")
  const [filterDepartmentSearch, setFilterDepartmentSearch] = useState("")
  const [filterDepartmentOpen, setFilterDepartmentOpen] = useState(false)
  const [filterEngineer, setFilterEngineer] = useState("")
  const [filterEngineerSearch, setFilterEngineerSearch] = useState("")
  const [filterEngineerOpen, setFilterEngineerOpen] = useState(false)
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterStatusOpen, setFilterStatusOpen] = useState(false)
  const filterCustomerRef = useRef<HTMLDivElement>(null)
  const filterDeptRef = useRef<HTMLDivElement>(null)
  const filterEngineerRef = useRef<HTMLDivElement>(null)
  const filterStatusRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterCustomerRef.current && !filterCustomerRef.current.contains(e.target as Node)) setFilterCustomerOpen(false)
      if (filterDeptRef.current && !filterDeptRef.current.contains(e.target as Node)) setFilterDepartmentOpen(false)
      if (filterEngineerRef.current && !filterEngineerRef.current.contains(e.target as Node)) setFilterEngineerOpen(false)
      if (filterStatusRef.current && !filterStatusRef.current.contains(e.target as Node)) setFilterStatusOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (!user) return
    fetch(`/api/quotations${category ? `?category=${category}` : ""}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.success) setQuotations(data.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const userQuotations = engineerFilter
    ? quotations.filter((q) => engineerFilter.some((n) => q.engineerName.toLowerCase() === n.toLowerCase()))
    : showAll ? quotations : quotations.filter((q) =>
      q.engineerName.toLowerCase() === user?.name?.toLowerCase()
    )

  const uniqueCustomers = [...new Set(userQuotations.map((q) => q.customerName))].filter(Boolean).sort()
  const uniqueDepartments = [...new Set(userQuotations.map((q) => q.department).filter(Boolean))].sort() as string[]
  const uniqueEngineers = [...new Set(userQuotations.map((q) => q.engineerName))].filter(Boolean).sort()
  const uniqueStatuses = [...new Set(userQuotations.map((q) => q.status))].filter(Boolean).sort()

  const filteredCustomers = uniqueCustomers.filter((c) => c.toLowerCase().includes(filterCustomerSearch.toLowerCase()))
  const filteredDepts = uniqueDepartments.filter((d) => d.toLowerCase().includes(filterDepartmentSearch.toLowerCase()))
  const filteredEngs = uniqueEngineers.filter((e) => e.toLowerCase().includes(filterEngineerSearch.toLowerCase()))

  const filteredQuotations = userQuotations.filter((q) => {
    if (filterCustomer && q.customerName !== filterCustomer) return false
    if (filterDepartment && q.department !== filterDepartment) return false
    if (filterEngineer && q.engineerName !== filterEngineer) return false
    if (filterStatus && q.status !== filterStatus) return false
    if (filterDateFrom) {
      const qDate = new Date(q.quotationDate).getTime()
      if (qDate < new Date(filterDateFrom).getTime()) return false
    }
    if (filterDateTo) {
      const qDate = new Date(q.quotationDate).getTime()
      if (qDate > new Date(filterDateTo + "T23:59:59").getTime()) return false
    }
    return true
  })

  const hasActiveFilters = filterCustomer || filterDepartment || filterEngineer || filterStatus || filterDateFrom || filterDateTo
  const clearAllFilters = () => {
    setFilterCustomer(""); setFilterCustomerSearch("")
    setFilterDepartment(""); setFilterDepartmentSearch("")
    setFilterEngineer(""); setFilterEngineerSearch("")
    setFilterDateFrom(""); setFilterDateTo("")
    setFilterStatus("")
  }

  const handleStatusChange = async (quotation: QuotationData) => {
    const action = statusAction[quotation._id]
    if (!action || !action.newStatus) return
    setUpdatingId(quotation._id)
    try {
      const body: Record<string, unknown> = { status: action.newStatus }
      if (action.newStatus === "Lost") body.lostRemarks = action.lostRemarks || ""
      if (action.newStatus === "Follow Up") { body.followUpUser = user?.name || ""; body.followUpRemarks = action.followUpRemarks || "" }

      const res = await fetch(`/api/quotations/${quotation._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      })
      const data = await res.json()
      if (data.success) {
        setQuotations((prev) => prev.map((q) => q._id === quotation._id ? { ...q, ...data.data } : q))
        setStatusAction((prev) => {
          const copy = { ...prev }
          delete copy[quotation._id]
          return copy
        })
      } else {
        alert(data.error || "Failed to update status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
      alert("Failed to update status")
    } finally {
      setUpdatingId(null)
    }
  }

  const handleBillDateSave = async (quotation: QuotationData) => {
    const billDate = billDateInputs[quotation._id]
    if (!billDate) return
    setUpdatingId(quotation._id)
    try {
      const res = await fetch(`/api/quotations/${quotation._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billDate }),
        credentials: "include",
      })
      const data = await res.json()
      if (data.success) {
        setQuotations((prev) => prev.map((q) => q._id === quotation._id ? { ...q, ...data.data } : q))
        setBillDateInputs((prev) => {
          const copy = { ...prev }
          delete copy[quotation._id]
          return copy
        })
      } else {
        alert(data.error || "Failed to save bill date")
      }
    } catch (error) {
      console.error("Error saving bill date:", error)
      alert("Failed to save bill date")
    } finally {
      setUpdatingId(null)
    }
  }

  const handleAmountSave = async (quotation: QuotationData) => {
    const newAmount = editingAmount[quotation._id]
    if (newAmount === undefined || newAmount === "") return
    setSavingAmount(quotation._id)
    try {
      const res = await fetch(`/api/quotations/${quotation._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(newAmount) }),
        credentials: "include",
      })
      const data = await res.json()
      if (data.success) {
        setQuotations((prev) => prev.map((q) => q._id === quotation._id ? { ...q, ...data.data } : q))
        setEditingAmount((prev) => {
          const copy = { ...prev }
          delete copy[quotation._id]
          return copy
        })
      } else {
        alert(data.error || "Failed to update amount")
      }
    } catch (error) {
      console.error("Error updating amount:", error)
      alert("Failed to update amount")
    } finally {
      setSavingAmount(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Quotations List
        </CardTitle>
        <CardDescription>View your submitted quotations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3 mb-4 items-end">
          <div ref={filterCustomerRef} className="relative min-w-[160px]">
            <Label className="text-xs mb-1 block">Customer</Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input value={filterCustomerSearch} onChange={(e) => { setFilterCustomerSearch(e.target.value); setFilterCustomerOpen(true); if (filterCustomer) setFilterCustomer("") }} onFocus={() => setFilterCustomerOpen(true)} placeholder={filterCustomer || "All customers"} className="pl-7 pr-7 h-8 text-xs" />
              {filterCustomer && <button type="button" onClick={() => { setFilterCustomer(""); setFilterCustomerSearch("") }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="h-3 w-3" /></button>}
            </div>
            {filterCustomerOpen && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                <button type="button" onClick={() => { setFilterCustomer(""); setFilterCustomerSearch(""); setFilterCustomerOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 text-gray-500">All customers</button>
                {filteredCustomers.map((c) => (
                  <button key={c} type="button" onClick={() => { setFilterCustomer(c); setFilterCustomerSearch(c); setFilterCustomerOpen(false) }} className={cn("w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 transition-colors", filterCustomer === c ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-900")}>{c}</button>
                ))}
              </div>
            )}
          </div>
          <div ref={filterDeptRef} className="relative min-w-[140px]">
            <Label className="text-xs mb-1 block">Department</Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input value={filterDepartmentSearch} onChange={(e) => { setFilterDepartmentSearch(e.target.value); setFilterDepartmentOpen(true); if (filterDepartment) setFilterDepartment("") }} onFocus={() => setFilterDepartmentOpen(true)} placeholder={filterDepartment || "All depts"} className="pl-7 pr-7 h-8 text-xs" />
              {filterDepartment && <button type="button" onClick={() => { setFilterDepartment(""); setFilterDepartmentSearch("") }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="h-3 w-3" /></button>}
            </div>
            {filterDepartmentOpen && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                <button type="button" onClick={() => { setFilterDepartment(""); setFilterDepartmentSearch(""); setFilterDepartmentOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 text-gray-500">All departments</button>
                {filteredDepts.map((d) => (
                  <button key={d} type="button" onClick={() => { setFilterDepartment(d); setFilterDepartmentSearch(d); setFilterDepartmentOpen(false) }} className={cn("w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 transition-colors", filterDepartment === d ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-900")}>{d}</button>
                ))}
              </div>
            )}
          </div>
          <div ref={filterEngineerRef} className="relative min-w-[160px]">
            <Label className="text-xs mb-1 block">Engineer</Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input value={filterEngineerSearch} onChange={(e) => { setFilterEngineerSearch(e.target.value); setFilterEngineerOpen(true); if (filterEngineer) setFilterEngineer("") }} onFocus={() => setFilterEngineerOpen(true)} placeholder={filterEngineer || "All engineers"} className="pl-7 pr-7 h-8 text-xs" />
              {filterEngineer && <button type="button" onClick={() => { setFilterEngineer(""); setFilterEngineerSearch("") }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="h-3 w-3" /></button>}
            </div>
            {filterEngineerOpen && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                <button type="button" onClick={() => { setFilterEngineer(""); setFilterEngineerSearch(""); setFilterEngineerOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 text-gray-500">All engineers</button>
                {filteredEngs.map((e) => (
                  <button key={e} type="button" onClick={() => { setFilterEngineer(e); setFilterEngineerSearch(e); setFilterEngineerOpen(false) }} className={cn("w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 transition-colors", filterEngineer === e ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-900")}>{e}</button>
                ))}
              </div>
            )}
          </div>
          <div>
            <Label className="text-xs mb-1 block">From</Label>
            <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="h-8 text-xs w-[140px]" />
          </div>
          <div>
            <Label className="text-xs mb-1 block">To</Label>
            <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="h-8 text-xs w-[140px]" />
          </div>
          <div ref={filterStatusRef} className="relative min-w-[130px]">
            <Label className="text-xs mb-1 block">Status</Label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full h-8 px-2 rounded-md border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">All statuses</option>
              {uniqueStatuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          {hasActiveFilters && (
            <Button type="button" variant="outline" size="sm" onClick={clearAllFilters} className="h-8 text-xs">
              <X className="h-3 w-3 mr-1" />Clear
            </Button>
          )}
        </div>
        <p className="text-xs text-slate-400 mb-3">{filteredQuotations.length} of {userQuotations.length} quotations</p>
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
        ) : filteredQuotations.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No quotations yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuotations.map((q) => {
              const action = statusAction[q._id] || { newStatus: "", billDate: "", lostRemarks: "", followUpRemarks: "" }
              const isUpdating = updatingId === q._id

              return (
                <Card key={q._id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-mono text-slate-400">#{q.quotationId}</p>
                        <p className="font-semibold text-lg text-slate-900">{q.customerName}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {statusBadge(q.status)}
                        {q.status === "Approved" && (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${q.billDate ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                            {q.billDate ? "Bill Completed" : "Bill Pending"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 text-sm">
                      <div><p className="text-slate-500 text-xs">Engineer</p><p className="text-slate-900 font-medium">{q.engineerName}</p></div>
                      <div><p className="text-slate-500 text-xs">Quotation Type</p><p className="text-slate-900">{q.quotationType}</p></div>
                      {q.department && <div><p className="text-slate-500 text-xs">Department</p><p className="text-slate-900">{q.department}</p></div>}
                      <div>
                        <p className="text-slate-500 text-xs">Amount</p>
                        {q.status !== "Approved" ? (
                          <div className="flex gap-1 items-center">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editingAmount[q._id] ?? q.amount.toFixed(2)}
                              onChange={(e) => setEditingAmount((prev) => ({ ...prev, [q._id]: e.target.value }))}
                              className="w-24 h-7 text-sm"
                            />
                            {editingAmount[q._id] !== undefined && editingAmount[q._id] !== q.amount.toFixed(2) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleAmountSave(q)}
                                disabled={savingAmount === q._id}
                                className="h-7 px-2 text-xs"
                              >
                                {savingAmount === q._id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                              </Button>
                            )}
                          </div>
                        ) : (
                          <p className="text-slate-900 font-semibold">{q.amount.toFixed(2)}</p>
                        )}
                      </div>
                      <div><p className="text-slate-500 text-xs">Contact Person</p><p className="text-slate-900">{q.contactPerson}</p></div>
                      <div><p className="text-slate-500 text-xs">Contact Number</p><p className="text-slate-900">{q.contactNumber}</p></div>
                      <div><p className="text-slate-500 text-xs">Quotation Date</p><p className="text-slate-900">{formatDateTime(q.quotationDate)}</p></div>
                      {q.billDate && <div><p className="text-slate-500 text-xs">Bill Date</p><p className="text-slate-900">{new Date(q.billDate).toLocaleDateString("en-GB")}</p></div>}
                    </div>

                    {q.products && q.products.length > 0 && (
                      <ProductsSection products={q.products} />
                    )}

                    {(q.status === "Pending" || q.status.startsWith("Follow Up")) && (
                      <div className="border-t pt-3 mb-4">
                        <p className="text-sm font-semibold text-slate-700 mb-2">Change Status</p>
                        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
                          <div className="w-full sm:w-48">
                            <select
                              value={action.newStatus}
                              onChange={(e) => setStatusAction((prev) => ({ ...prev, [q._id]: { ...prev[q._id] || { billDate: "", lostRemarks: "" }, newStatus: e.target.value } }))}
                              className="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                              <option value="">Select status...</option>
                              <option value="Follow Up">Follow Up</option>
                              <option value="Approved">Approved</option>
                              <option value="Cancelled">Cancel</option>
                              <option value="Revised">Revised</option>
                              <option value="Lost">Lost</option>
                            </select>
                          </div>
                          {action.newStatus === "Lost" && (
                            <div className="w-full sm:flex-1">
                              <Label className="text-xs">Remarks</Label>
                              <Textarea
                                value={action.lostRemarks}
                                onChange={(e) => setStatusAction((prev) => ({ ...prev, [q._id]: { ...prev[q._id] || { newStatus: "", billDate: "" }, lostRemarks: e.target.value } }))}
                                placeholder="Enter lost reason..."
                                rows={1}
                                className="min-h-[36px]"
                              />
                            </div>
                          )}
                          {action.newStatus === "Follow Up" && (
                            <div className="w-full sm:flex-1">
                              <Label className="text-xs">Remarks</Label>
                              <Textarea
                                value={action.followUpRemarks}
                                onChange={(e) => setStatusAction((prev) => ({ ...prev, [q._id]: { ...prev[q._id] || { newStatus: "", billDate: "", lostRemarks: "" }, followUpRemarks: e.target.value } }))}
                                placeholder="Enter follow up remarks..."
                                rows={1}
                                className="min-h-[36px]"
                              />
                            </div>
                          )}
                          {action.newStatus && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(q)}
                              disabled={isUpdating || (action.newStatus === "Lost" && !action.lostRemarks)}
                              className="whitespace-nowrap"
                            >
                              {isUpdating ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Updating...</> : "Confirm"}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {q.status === "Approved" && (
                      <div className="border-t pt-3 mb-4">
                        <p className="text-sm font-semibold text-slate-700 mb-2">Bill Date</p>
                        <div className="flex gap-2 items-end">
                          <div className="w-full sm:w-48">
                            <Input
                              type="date"
                              value={billDateInputs[q._id] ?? q.billDate?.split("T")[0] ?? ""}
                              onChange={(e) => setBillDateInputs((prev) => ({ ...prev, [q._id]: e.target.value }))}
                              placeholder="Add bill date"
                            />
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleBillDateSave(q)}
                            disabled={isUpdating || !billDateInputs[q._id]}
                          >
                            {isUpdating ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Saving...</> : "Save"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {q.lostRemarks && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs font-semibold text-gray-600 mb-1">Lost Remarks</p>
                        <p className="text-sm text-gray-800">{q.lostRemarks}</p>
                      </div>
                    )}

                    {q.status !== "Pending" && (
                      <div className="border-t pt-3">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Status Timeline</p>
                        <div className="space-y-2">
                          {(() => {
                            const items: { label: string; ts: string; userName?: string; remarks?: string }[] = [{ label: "Pending", ts: q.createdAt }]
                            if (q.followUpAt?.length) {
                              q.followUpAt.forEach((ts, idx) => {
                                const log = q.followUpLogs?.[idx]
                                items.push({ label: `Follow Up ${idx + 1}`, ts, userName: log?.userName, remarks: log?.remarks })
                              })
                            }
                            statusTransitions.filter((t) => q[t.field]).forEach((t) => items.push({ label: t.status, ts: q[t.field] as string }))
                            return items.map((item, idx) => {
                              if (idx === 0) {
                                return (
                                  <div key={idx} className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Clock className="w-4 h-4 text-yellow-500 shrink-0" />
                                      <span className="text-sm text-slate-700 font-medium">{item.label}</span>
                                      <span className="text-xs text-slate-400">{formatDateTime(item.ts)}</span>
                                    </div>
                                  </div>
                                )
                              }
                              const dur = getDurationMinutes(items[idx - 1].ts, item.ts)
                              return (
                                <div key={idx} className="flex items-center gap-3">
                                  <div className="w-px h-4 bg-slate-300 ml-2" />
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs text-slate-400 font-mono">{formatDuration(dur)}</span>
                                    <span className="text-slate-300 text-xs">&rarr;</span>
                                    {statusIcon(item.label)}
                                    <span className="text-sm text-slate-700 font-medium">{item.label}</span>
                                    <span className="text-xs text-slate-400">{formatDateTime(item.ts)}</span>
                                    {item.userName && <span className="text-xs text-slate-500">by {item.userName}</span>}
                                    {item.remarks && <span className="text-xs text-slate-400 italic">{item.remarks}</span>}
                                  </div>
                                </div>
                              )
                            })
                          })()}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ProductsSection({ products }: { products: ProductEntryData[] }) {
  const [expanded, setExpanded] = useState(false)

  const grandTotal = products.reduce((sum, p) =>
    sum + (p.models || []).reduce((ms, m) => ms + (m.totalPrice || 0), 0), 0
  )

  return (
    <div className="border-t pt-3 mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2 w-full text-left hover:text-slate-900 transition-colors"
      >
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        Products ({products.length})
        <span className="text-xs text-slate-400 font-normal ml-auto">
          Total: {grandTotal.toFixed(2)}
        </span>
      </button>
      {expanded && (
        <div className="space-y-3 pl-2">
          {products.map((product, idx) => {
            const productTotal = (product.models || []).reduce((s, m) => s + (m.totalPrice || 0), 0)
            return (
              <div key={idx} className="border rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 flex items-center justify-between">
                  <span>{product.productName}</span>
                  {product.models.length > 0 && (
                    <span className="text-xs text-slate-500">Subtotal: {productTotal.toFixed(2)}</span>
                  )}
                </div>
                {product.models.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600">
                          <th className="text-left px-3 py-1.5">Model</th>
                          <th className="text-right px-3 py-1.5">Qty</th>
                          <th className="text-right px-3 py-1.5">Unit Price</th>
                          <th className="text-right px-3 py-1.5">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {product.models.map((model, midx) => (
                          <tr key={midx} className="hover:bg-slate-50">
                            <td className="px-3 py-1.5 text-slate-700">{model.modelName}</td>
                            <td className="px-3 py-1.5 text-right text-slate-900">{model.quantity}</td>
                            <td className="px-3 py-1.5 text-right text-slate-700">{model.unitPrice.toFixed(2)}</td>
                            <td className="px-3 py-1.5 text-right text-slate-900 font-medium">{model.totalPrice.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TotalBillTab({ engineerFilter }: { engineerFilter?: string[] }) {
  const { user } = useAuthStore()
  const [rawData, setRawData] = useState<QuotationData[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [filterEngineerSearch, setFilterEngineerSearch] = useState("")
  const [filterEngineerOpen, setFilterEngineerOpen] = useState(false)
  const [filterEngineer, setFilterEngineer] = useState("")
  const [filterDeptSearch, setFilterDeptSearch] = useState("")
  const [filterDeptOpen, setFilterDeptOpen] = useState(false)
  const [filterDept, setFilterDept] = useState("")
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  const filterEngRef = useRef<HTMLDivElement>(null)
  const filterDeptRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterEngRef.current && !filterEngRef.current.contains(e.target as Node)) setFilterEngineerOpen(false)
      if (filterDeptRef.current && !filterDeptRef.current.contains(e.target as Node)) setFilterDeptOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (!user) return
    fetch(`/api/quotations?billable=true`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const userBills = engineerFilter
            ? d.data.filter((q: QuotationData) => engineerFilter.some((n) => q.engineerName.toLowerCase() === n.toLowerCase()))
            : d.data.filter((q: QuotationData) => q.engineerName.toLowerCase() === user.name?.toLowerCase())
          setRawData(userBills)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const filteredRawData = rawData.filter((q) => {
    if (filterEngineer && q.engineerName !== filterEngineer) return false
    if (filterDept && q.department !== filterDept) return false
    if (filterDateFrom) {
      const bDate = new Date(q.billDate!).getTime()
      if (bDate < new Date(filterDateFrom).getTime()) return false
    }
    if (filterDateTo) {
      const bDate = new Date(q.billDate!).getTime()
      if (bDate > new Date(filterDateTo + "T23:59:59").getTime()) return false
    }
    return true
  })

  const data = (() => {
    const grouped: Record<string, QuotationData[]> = {}
    for (const q of filteredRawData) {
      if (!grouped[q.engineerName]) grouped[q.engineerName] = []
      grouped[q.engineerName].push(q)
    }
    return Object.entries(grouped).map(([name, qs]) => ({ engineerName: name, quotations: qs }))
  })()

  const uniqueEngineers = [...new Set(rawData.map((q) => q.engineerName))].filter(Boolean).sort()
  const filteredEngs = uniqueEngineers.filter((e) => e.toLowerCase().includes(filterEngineerSearch.toLowerCase()))
  const uniqueDepts = [...new Set(rawData.map((q) => q.department).filter(Boolean))].sort() as string[]
  const filteredDepts = uniqueDepts.filter((d) => d.toLowerCase().includes(filterDeptSearch.toLowerCase()))

  const totalAmount = data.reduce((sum, g) => sum + g.quotations.reduce((s, q) => s + q.amount, 0), 0)
  const totalCount = data.reduce((sum, g) => sum + g.quotations.length, 0)

  const hasActiveFilters = filterEngineer || filterDept || filterDateFrom || filterDateTo
  const clearAllFilters = () => {
    setFilterEngineer(""); setFilterEngineerSearch("")
    setFilterDept(""); setFilterDeptSearch("")
    setFilterDateFrom(""); setFilterDateTo("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Total Bill
        </CardTitle>
        <CardDescription>Your bill summary</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3 mb-4 items-end">
          <div ref={filterEngRef} className="relative min-w-[180px]">
            <Label className="text-xs mb-1 block">Engineer</Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input value={filterEngineerSearch} onChange={(e) => { setFilterEngineerSearch(e.target.value); setFilterEngineerOpen(true); if (filterEngineer) setFilterEngineer("") }} onFocus={() => setFilterEngineerOpen(true)} placeholder={filterEngineer || "All engineers"} className="pl-7 pr-7 h-8 text-xs" />
              {filterEngineer && <button type="button" onClick={() => { setFilterEngineer(""); setFilterEngineerSearch("") }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="h-3 w-3" /></button>}
            </div>
            {filterEngineerOpen && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                <button type="button" onClick={() => { setFilterEngineer(""); setFilterEngineerSearch(""); setFilterEngineerOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 text-gray-500">All engineers</button>
                {filteredEngs.map((e) => (
                  <button key={e} type="button" onClick={() => { setFilterEngineer(e); setFilterEngineerSearch(e); setFilterEngineerOpen(false) }} className={cn("w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 transition-colors", filterEngineer === e ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-900")}>{e}</button>
                ))}
              </div>
            )}
          </div>
          <div ref={filterDeptRef} className="relative min-w-[150px]">
            <Label className="text-xs mb-1 block">Department</Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input value={filterDeptSearch} onChange={(e) => { setFilterDeptSearch(e.target.value); setFilterDeptOpen(true); if (filterDept) setFilterDept("") }} onFocus={() => setFilterDeptOpen(true)} placeholder={filterDept || "All depts"} className="pl-7 pr-7 h-8 text-xs" />
              {filterDept && <button type="button" onClick={() => { setFilterDept(""); setFilterDeptSearch("") }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="h-3 w-3" /></button>}
            </div>
            {filterDeptOpen && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                <button type="button" onClick={() => { setFilterDept(""); setFilterDeptSearch(""); setFilterDeptOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 text-gray-500">All departments</button>
                {filteredDepts.map((d) => (
                  <button key={d} type="button" onClick={() => { setFilterDept(d); setFilterDeptSearch(d); setFilterDeptOpen(false) }} className={cn("w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 transition-colors", filterDept === d ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-900")}>{d}</button>
                ))}
              </div>
            )}
          </div>
          <div>
            <Label className="text-xs mb-1 block">From</Label>
            <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="h-8 text-xs w-[140px]" />
          </div>
          <div>
            <Label className="text-xs mb-1 block">To</Label>
            <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="h-8 text-xs w-[140px]" />
          </div>
          {hasActiveFilters && (
            <Button type="button" variant="outline" size="sm" onClick={clearAllFilters} className="h-8 text-xs">
              <X className="h-3 w-3 mr-1" />Clear
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
        ) : data.length === 0 || data.every((g) => g.quotations.length === 0) ? (
          <div className="text-center py-16">
            <DollarSign className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No billable quotations</p>
            <p className="text-sm text-slate-400 mt-1">Bills appear once a bill date is set on an approved quotation</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-[200px] p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-green-600 font-semibold uppercase">Total Bills</p>
                <p className="text-2xl font-bold text-green-900">{totalCount}</p>
              </div>
              <div className="flex-1 min-w-[200px] p-4 bg-teal-50 rounded-lg border border-teal-200">
                <p className="text-xs text-teal-600 font-semibold uppercase">Total Amount</p>
                <p className="text-2xl font-bold text-teal-900">{totalAmount.toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-3">
              {data.map((group) => {
                const isExpanded = expanded[group.engineerName]
                const groupTotal = group.quotations.reduce((s, q) => s + q.amount, 0)
                return (
                  <div key={group.engineerName} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpanded((p) => ({ ...p, [group.engineerName]: !isExpanded }))}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                        <span className="font-semibold text-slate-900">{group.engineerName}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-slate-500">{group.quotations.length} bill{group.quotations.length !== 1 ? "s" : ""}</span>
                        <span className="font-semibold text-teal-700">{groupTotal.toFixed(2)}</span>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="divide-y">
                        {group.quotations.map((q) => (
                          <div key={q._id} className="flex items-center justify-between px-4 py-2 pl-12 text-sm">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-slate-400">#{q.quotationId}</span>
                              <span className="text-slate-700">{q.customerName}</span>
                              {q.department && <span className="text-xs text-slate-400">{q.department}</span>}
                              <span className="text-xs text-slate-400">{new Date(q.billDate!).toLocaleDateString("en-GB")}</span>
                            </div>
                            <span className="font-medium text-slate-900">{q.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function ManageQuotationJunior({ showAll, engineerFilter, category }: { showAll?: boolean; engineerFilter?: string[]; category?: string }) {
  const [activeTab, setActiveTab] = useState<TabType>("list")

  const tabs = [
    { id: "list" as TabType, label: "Quotations List", icon: List },
    { id: "total-bill" as TabType, label: "Total Bill", icon: DollarSign },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Manage Quotation
        </h1>
        <p className="text-slate-500">View and manage your quotations</p>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn("flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors", activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300")}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "list" && <QuotationsListTab showAll={showAll} engineerFilter={engineerFilter} category={category} />}
      {activeTab === "total-bill" && <TotalBillTab engineerFilter={engineerFilter} />}
    </div>
  )
}
