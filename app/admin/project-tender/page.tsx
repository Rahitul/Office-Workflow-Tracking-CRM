"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { useAuthStore } from "@/store/authStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { PROJECT_TENDER_CATEGORIES, BANGLADESH_DISTRICTS } from "@/lib/project-tender-constants"
import { Briefcase, Loader2, CheckCircle, XCircle } from "lucide-react"

interface ProjectTenderRecord {
  _id: string
  type: "project" | "tender"
  createdBy: { _id: string; name: string; email: string }
  date: string
  username: string
  category: string
  address: string
  locationDistrict: string
  tentativeCloseDate?: string
  projectName: string
  companyName: string
  contactPersonName: string
  contactPersonNumber: string
  products: { productName: string; models: { modelName: string; quantity: number }[] }[]
  requiresSupport: boolean
  supportRequirements: string[]
  requestedPrice: number
  businessPromotionAmount: number
  documentPurchaseAmount?: number
  securityDepositAmount?: number
  adminStatus: "pending" | "approved" | "revised"
  adminRemarks?: string
  status: string
  negotiablePrice?: number
  negotiablePriceApproved?: boolean
  billNumber?: string
  billDate?: string
  lostRemarks?: string
  statusHistory?: { status: string; changedAt: string; byName?: string; remarks?: string }[]
  createdAt: string
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  quotation_submitted: "Quotation Submitted",
  negotiable_price: "Negotiable Price",
  won: "Won",
  lost: "Lost",
  tender_submitted: "Tender Submitted",
  get_noa: "Get NOA",
  performance_security: "Performance Security",
  contract_signing: "Contract Signing",
}

const STATUS_COLORS: Record<string, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  pending: "warning",
  quotation_submitted: "default",
  negotiable_price: "warning",
  won: "success",
  lost: "destructive",
  tender_submitted: "default",
  get_noa: "default",
  performance_security: "secondary",
  contract_signing: "success",
}

export default function AdminProjectTenderPage() {
  const router = useRouter()
  const { user, checkAuth } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const [records, setRecords] = useState<ProjectTenderRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [projectFilter, setProjectFilter] = useState("")
  const [companyFilter, setCompanyFilter] = useState("")
  const [usernameFilter, setUsernameFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [billNoFilter, setBillNoFilter] = useState("")
  const [billDateFilter, setBillDateFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const [tentativeCloseDateFilter, setTentativeCloseDateFilter] = useState("")

  const [selectedRecord, setSelectedRecord] = useState<ProjectTenderRecord | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [adminRemarks, setAdminRemarks] = useState("")
  const [showReviseInput, setShowReviseInput] = useState(false)
  const [showPriceReviseInput, setShowPriceReviseInput] = useState(false)
  const [priceReviseRemarks, setPriceReviseRemarks] = useState("")

  useEffect(() => { setMounted(true); checkAuth() }, [])

  useEffect(() => {
    if (mounted && user && user.role !== "admin") { router.push("/login") }
  }, [mounted, user])

  useEffect(() => {
    if (mounted) fetchRecords()
  }, [mounted])

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const res = await axios.get("/api/project-tender", { withCredentials: true })
      setRecords(res.data.data || [])
    } catch {
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  const openDetail = (record: ProjectTenderRecord) => {
    setSelectedRecord(record)
    setAdminRemarks(record.adminRemarks || "")
    setShowReviseInput(false)
    setDetailOpen(true)
  }

  const handleApprove = async () => {
    if (!selectedRecord) return
    setActionLoading(true)
    try {
      await axios.patch(`/api/project-tender/${selectedRecord._id}`, {
        adminStatus: "approved",
        adminRemarks,
      }, { withCredentials: true })
      setDetailOpen(false)
      setSelectedRecord(null)
      fetchRecords()
    } catch {
      // ignore
    } finally {
      setActionLoading(false)
    }
  }

  const handleRevise = async () => {
    if (!selectedRecord || !adminRemarks.trim()) return
    setActionLoading(true)
    try {
      await axios.patch(`/api/project-tender/${selectedRecord._id}`, {
        adminStatus: "revised",
        adminRemarks: adminRemarks.trim(),
      }, { withCredentials: true })
      setDetailOpen(false)
      setSelectedRecord(null)
      setShowReviseInput(false)
      fetchRecords()
    } catch {
      // ignore
    } finally {
      setActionLoading(false)
    }
  }

  const handleApproveNegotiablePrice = async () => {
    if (!selectedRecord) return
    setActionLoading(true)
    try {
      await axios.patch(`/api/project-tender/${selectedRecord._id}`, {
        negotiablePriceApproved: true,
      }, { withCredentials: true })
      setDetailOpen(false)
      setSelectedRecord(null)
      fetchRecords()
    } catch {
      // ignore
    } finally {
      setActionLoading(false)
    }
  }

  const handleReviseNegotiablePrice = async () => {
    if (!selectedRecord || !priceReviseRemarks.trim()) return
    setActionLoading(true)
    try {
      await axios.patch(`/api/project-tender/${selectedRecord._id}`, {
        priceRevision: true,
        adminRemarks: priceReviseRemarks.trim(),
      }, { withCredentials: true })
      setDetailOpen(false)
      setSelectedRecord(null)
      setShowPriceReviseInput(false)
      setPriceReviseRemarks("")
      fetchRecords()
    } catch {
      // ignore
    } finally {
      setActionLoading(false)
    }
  }

  const projectOptions = [...new Set(records.map(r => r.projectName))]
  const companyOptions = [...new Set(records.map(r => r.companyName))]
  const usernameOptions = [...new Set(records.map(r => r.username))]

  const clearFilters = () => {
    setTypeFilter("all")
    setDateFrom("")
    setDateTo("")
    setProjectFilter("")
    setCompanyFilter("")
    setUsernameFilter("")
    setStatusFilter("")
    setBillNoFilter("")
    setBillDateFilter("")
    setCategoryFilter("")
    setLocationFilter("")
    setTentativeCloseDateFilter("")
  }

  const formatDate = (d: string) => {
    if (!d) return ""
    return new Date(d).toLocaleDateString("en-GB")
  }

  const formatDateTime = (d: string) => {
    if (!d) return ""
    return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  const trackingLabel = (status: string) =>
    STATUS_LABELS[status] ||
    (status === "approved" ? "Approved (Admin)"
      : status === "revised" ? "Revised (Admin)"
      : status === "price_approved" ? "Price Approved (Admin)"
      : status === "price_revised" ? "Price Revised (Admin)"
      : status)

  const filteredRecords = records.filter(r => {
    if (typeFilter !== "all" && r.type !== typeFilter) return false
    if (dateFrom && new Date(r.date) < new Date(dateFrom)) return false
    if (dateTo && new Date(r.date) > new Date(dateTo + "T23:59:59")) return false
    if (projectFilter && !r.projectName.toLowerCase().includes(projectFilter.toLowerCase())) return false
    if (companyFilter && !r.companyName.toLowerCase().includes(companyFilter.toLowerCase())) return false
    if (usernameFilter && !r.username.toLowerCase().includes(usernameFilter.toLowerCase())) return false
    if (statusFilter && r.status !== statusFilter) return false
    if (billNoFilter && !(r.billNumber || "").toLowerCase().includes(billNoFilter.toLowerCase())) return false
    if (billDateFilter) {
      const bd = r.billDate ? new Date(r.billDate).toISOString().split("T")[0] : ""
      if (bd !== billDateFilter) return false
    }
    if (categoryFilter && r.category !== categoryFilter) return false
    if (locationFilter && r.locationDistrict !== locationFilter) return false
    if (tentativeCloseDateFilter) {
      const tcd = r.tentativeCloseDate ? new Date(r.tentativeCloseDate).toISOString().split("T")[0] : ""
      if (tcd !== tentativeCloseDateFilter) return false
    }
    return true
  })

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Project / Tender Management</h1>
          <p className="text-sm text-slate-500">Review, approve, and manage all submissions</p>
        </div>
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={fetchRecords} disabled={loading}>
            <Loader2 className={cn("w-4 h-4 mr-1", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <p className="text-lg font-bold text-blue-800">
              Total Submissions: <span className="text-2xl">{filteredRecords.length}</span>
            </p>
            <Button variant="ghost" size="sm" onClick={clearFilters}>Clear Filters</Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Type</Label>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm w-full">
                <option value="all">All</option>
                <option value="project">Project</option>
                <option value="tender">Tender</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Date From</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-sm" />
            </div>
            <div>
              <Label className="text-xs">Date To</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-sm" />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm w-full">
                <option value="">All</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Project Name</Label>
              <input list="projectOpts" value={projectFilter} onChange={e => setProjectFilter(e.target.value)} placeholder="Type or select..." className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm w-full" />
              <datalist id="projectOpts">{projectOptions.map(o => <option key={o} value={o} />)}</datalist>
            </div>
            <div>
              <Label className="text-xs">Company Name</Label>
              <input list="companyOpts" value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} placeholder="Type or select..." className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm w-full" />
              <datalist id="companyOpts">{companyOptions.map(o => <option key={o} value={o} />)}</datalist>
            </div>
            <div>
              <Label className="text-xs">Username</Label>
              <input list="userOpts" value={usernameFilter} onChange={e => setUsernameFilter(e.target.value)} placeholder="Type or select..." className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm w-full" />
              <datalist id="userOpts">{usernameOptions.map(o => <option key={o} value={o} />)}</datalist>
            </div>
            <div>
              <Label className="text-xs">Bill Number</Label>
              <Input type="text" value={billNoFilter} onChange={e => setBillNoFilter(e.target.value)} placeholder="Search bill no..." className="text-sm" />
            </div>
            <div>
              <Label className="text-xs">Category</Label>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm w-full">
                <option value="">All</option>
                {PROJECT_TENDER_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Location (District)</Label>
              <input list="districtFilterOptions" value={locationFilter} onChange={e => setLocationFilter(e.target.value)} placeholder="Type or select..." className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm w-full" />
              <datalist id="districtFilterOptions">{BANGLADESH_DISTRICTS.map(d => <option key={d} value={d} />)}</datalist>
            </div>
            <div>
              <Label className="text-xs">Tentative Close Date</Label>
              <Input type="date" value={tentativeCloseDateFilter} onChange={e => setTentativeCloseDateFilter(e.target.value)} className="text-sm" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : filteredRecords.length === 0 ? (
            <p className="text-center text-slate-400 py-12">No submissions found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Project Name</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Company</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Submitted By</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Admin</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map(record => (
                    <tr key={record._id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-600">{formatDate(record.date)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={record.type === "project" ? "default" : "secondary"}>
                          {record.type === "project" ? "Project" : "Tender"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{record.projectName}</td>
                      <td className="py-3 px-4 text-slate-600">{record.companyName}</td>
                      <td className="py-3 px-4 text-slate-600">{record.username}</td>
                      <td className="py-3 px-4">
                        <Badge variant={STATUS_COLORS[record.status] || "secondary"}>
                          {STATUS_LABELS[record.status] || record.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={record.adminStatus === "approved" ? "success" : record.adminStatus === "revised" ? "destructive" : "warning"}>
                          {record.adminStatus}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="outline" size="sm" onClick={() => openDetail(record)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedRecord && (
        <Dialog open={detailOpen} onClose={() => { setDetailOpen(false); setSelectedRecord(null); setShowReviseInput(false); setShowPriceReviseInput(false); setPriceReviseRemarks("") }} title={`${selectedRecord.type === "project" ? "Project" : "Tender"} — ${selectedRecord.projectName}`}>
          <div className="space-y-4 max-w-4xl">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="font-medium text-slate-500">Date:</span> {formatDate(selectedRecord.date)}</div>
              <div><span className="font-medium text-slate-500">Username:</span> {selectedRecord.username}</div>
              <div><span className="font-medium text-slate-500">Category:</span> {selectedRecord.category || "—"}</div>
              <div><span className="font-medium text-slate-500">Location (District):</span> {selectedRecord.locationDistrict || "—"}</div>
              <div><span className="font-medium text-slate-500">Address:</span> {selectedRecord.address || "—"}</div>
              <div><span className="font-medium text-slate-500">Tentative Close Date:</span> {formatDate(selectedRecord.tentativeCloseDate || "") || "—"}</div>
              <div><span className="font-medium text-slate-500">Project Name:</span> {selectedRecord.projectName}</div>
              <div><span className="font-medium text-slate-500">Company Name:</span> {selectedRecord.companyName}</div>
              <div><span className="font-medium text-slate-500">Contact Person:</span> {selectedRecord.contactPersonName}</div>
              <div><span className="font-medium text-slate-500">Contact Number:</span> {selectedRecord.contactPersonNumber}</div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">Product Details</h4>
              {selectedRecord.products.map((p, pIdx) => (
                <div key={pIdx} className="border border-slate-200 rounded-lg p-3 mb-2 text-sm">
                  <p className="font-medium text-slate-800">{p.productName}</p>
                  <ul className="ml-4 mt-1 list-disc text-slate-600">
                    {p.models.map((m, mIdx) => (
                      <li key={mIdx}>{m.modelName} — Qty: {m.quantity}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {selectedRecord.requiresSupport && selectedRecord.supportRequirements.length > 0 && (
              <div className="text-sm">
                <span className="font-medium text-slate-500">Support Requirements:</span>
                <ul className="ml-4 mt-1 list-disc text-slate-600">
                  {selectedRecord.supportRequirements.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="font-medium text-slate-500">Requested Price:</span> {selectedRecord.requestedPrice?.toLocaleString()}</div>
              <div><span className="font-medium text-slate-500">Business Promotion:</span> {selectedRecord.businessPromotionAmount?.toLocaleString()}</div>
              {selectedRecord.type === "tender" && (
                <>
                  <div><span className="font-medium text-slate-500">Document Purchase:</span> {selectedRecord.documentPurchaseAmount?.toLocaleString()}</div>
                  <div><span className="font-medium text-slate-500">Security Deposit:</span> {selectedRecord.securityDepositAmount?.toLocaleString()}</div>
                </>
              )}
            </div>

            {selectedRecord.negotiablePrice !== undefined && (
              <div className="text-sm">
                <span className="font-medium text-slate-500">Negotiable Price:</span> {selectedRecord.negotiablePrice?.toLocaleString()}
                {selectedRecord.negotiablePriceApproved ? (
                  <Badge variant="success" className="ml-2">Approved</Badge>
                ) : selectedRecord.status === "negotiable_price" ? (
                  <Badge variant="warning" className="ml-2">Pending Approval</Badge>
                ) : (
                  <Badge variant="destructive" className="ml-2">Revised</Badge>
                )}
              </div>
            )}

            {(selectedRecord.status === "won" || selectedRecord.status === "contract_signing") && (
              <div className="text-sm">
                <span className="font-medium text-slate-500">Bill Number:</span> {selectedRecord.billNumber || "—"}
                {selectedRecord.billDate && <> — {formatDate(selectedRecord.billDate)}</>}
              </div>
            )}

            {selectedRecord.lostRemarks && (
              <div className="text-sm">
                <span className="font-medium text-slate-500">Lost Remarks:</span> {selectedRecord.lostRemarks}
              </div>
            )}

            <div className="border-t border-slate-200 pt-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-500">Admin Status:</span>
                <Badge variant={selectedRecord.adminStatus === "approved" ? "success" : selectedRecord.adminStatus === "revised" ? "destructive" : "warning"}>
                  {selectedRecord.adminStatus}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-medium text-slate-500">Workflow:</span>
                <Badge variant={STATUS_COLORS[selectedRecord.status] || "secondary"}>
                  {STATUS_LABELS[selectedRecord.status] || selectedRecord.status}
                </Badge>
              </div>
            </div>

            {/* Status Tracking */}
            <div className="border-t border-slate-200 pt-3">
              <h4 className="text-sm font-medium text-slate-700 mb-3">Status Tracking</h4>
              {(() => {
                const history = selectedRecord.statusHistory?.length
                  ? [...selectedRecord.statusHistory].sort((a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime())
                  : [{ status: selectedRecord.status, changedAt: selectedRecord.createdAt, byName: selectedRecord.username }]
                return (
                  <div className="space-y-0">
                    {history.map((entry, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={cn("w-3 h-3 rounded-full mt-1 shrink-0", idx === history.length - 1 ? "bg-blue-500" : "bg-slate-300")} />
                          {idx < history.length - 1 && <div className="w-0.5 flex-1 bg-slate-200" />}
                        </div>
                        <div className="pb-4">
                          <p className="text-sm font-medium text-slate-800">{trackingLabel(entry.status)}</p>
                          <p className="text-xs text-slate-500">
                            {formatDateTime(entry.changedAt)}
                            {entry.byName ? ` · by ${entry.byName}` : ""}
                            {entry.remarks ? ` — ${entry.remarks}` : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>

            {/* Admin Actions */}
            {selectedRecord.adminStatus === "pending" && (
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <h4 className="text-sm font-medium text-slate-700">Admin Actions</h4>
                <div className="space-y-2">
                  <Label>Remarks (optional for approve, required for revise)</Label>
                  <Input
                    value={adminRemarks}
                    onChange={e => setAdminRemarks(e.target.value)}
                    placeholder="Add remarks..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleApprove} disabled={actionLoading} className="bg-green-600 hover:bg-green-700">
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                    Approve
                  </Button>
                  <Button onClick={() => setShowReviseInput(true)} disabled={actionLoading} variant="outline" className="text-amber-600 border-amber-300">
                    <XCircle className="w-4 h-4 mr-1" />
                    Revise
                  </Button>
                  {showReviseInput && (
                    <Button onClick={handleRevise} disabled={actionLoading || !adminRemarks.trim()} variant="destructive">
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                      Submit Revision
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Approve / Revise Negotiable Price */}
            {selectedRecord.adminStatus === "approved" && selectedRecord.status === "negotiable_price" && !selectedRecord.negotiablePriceApproved && (
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <h4 className="text-sm font-medium text-slate-700">Negotiable Price</h4>
                <div className="flex gap-2">
                  <Button onClick={handleApproveNegotiablePrice} disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700">
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                    Approve Price
                  </Button>
                  <Button onClick={() => setShowPriceReviseInput(true)} disabled={actionLoading} variant="outline" className="text-amber-600 border-amber-300">
                    <XCircle className="w-4 h-4 mr-1" />
                    Revise Price
                  </Button>
                </div>
                {showPriceReviseInput && (
                  <div className="space-y-2">
                    <Input
                      value={priceReviseRemarks}
                      onChange={e => setPriceReviseRemarks(e.target.value)}
                      placeholder="Remarks for price revision..."
                    />
                    <Button onClick={handleReviseNegotiablePrice} disabled={actionLoading || !priceReviseRemarks.trim()} variant="destructive" size="sm">
                      {actionLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                      Submit Price Revision
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-slate-200 pt-3 text-xs text-slate-400">
              Submitted: {formatDate(selectedRecord.createdAt)} | ID: {selectedRecord._id}
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}
