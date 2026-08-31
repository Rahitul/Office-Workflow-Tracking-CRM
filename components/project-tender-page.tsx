"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { PROJECT_TENDER_CATEGORIES, BANGLADESH_DISTRICTS } from "@/lib/project-tender-constants"
import {
  Briefcase,
  FileText,
  List,
  Plus,
  Trash2,
  Loader2,
  X,
  CheckCircle,
} from "lucide-react"

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

interface ProductForm {
  productName: string
  models: { modelName: string; quantity: string }[]
}

type TabType = "form" | "list"
type FormTabType = "project" | "tender"

const PROJECT_STATUS_FLOW = ["quotation_submitted", "negotiable_price", "won", "lost"]
const TENDER_STATUS_FLOW = ["tender_submitted", "get_noa", "performance_security", "contract_signing", "lost"]

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

export default function ProjectTenderPage({ role }: { role: string }) {
  const router = useRouter()
  const { user, checkAuth } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState<TabType>("form")
  const [formTab, setFormTab] = useState<FormTabType>("project")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [category, setCategory] = useState("")
  const [address, setAddress] = useState("")
  const [locationDistrict, setLocationDistrict] = useState("")
  const [tentativeCloseDate, setTentativeCloseDate] = useState("")
  const [projectName, setProjectName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [contactPersonName, setContactPersonName] = useState("")
  const [contactPersonNumber, setContactPersonNumber] = useState("")
  const [products, setProducts] = useState<ProductForm[]>([
    { productName: "", models: [{ modelName: "", quantity: "1" }] },
  ])
  const [requiresSupport, setRequiresSupport] = useState(false)
  const [supportRequirements, setSupportRequirements] = useState<string[]>([""])
  const [requestedPrice, setRequestedPrice] = useState("")
  const [businessPromotionAmount, setBusinessPromotionAmount] = useState("")
  const [documentPurchaseAmount, setDocumentPurchaseAmount] = useState("")
  const [securityDepositAmount, setSecurityDepositAmount] = useState("")

  // List state
  const [records, setRecords] = useState<ProjectTenderRecord[]>([])
  const [loading, setLoading] = useState(false)
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

  // Detail dialog
  const [selectedRecord, setSelectedRecord] = useState<ProjectTenderRecord | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Edit/resubmit after revision
  const [editRecordId, setEditRecordId] = useState<string | null>(null)
  const [revisedRemarks, setRevisedRemarks] = useState("")

  // Workflow action states
  const [workflowLoading, setWorkflowLoading] = useState(false)
  const [nextStatus, setNextStatus] = useState("")
  const [nextPrice, setNextPrice] = useState("")
  const [nextBillNo, setNextBillNo] = useState("")
  const [nextBillDate, setNextBillDate] = useState("")
  const [nextLostRemarks, setNextLostRemarks] = useState("")
  const [billSaving, setBillSaving] = useState(false)
  const [editBillNo, setEditBillNo] = useState("")
  const [editBillDate, setEditBillDate] = useState("")

  useEffect(() => { setMounted(true); checkAuth() }, [])

  useEffect(() => {
    if (mounted && !user) { router.push("/login") }
  }, [mounted, user])

  useEffect(() => {
    if (tab === "list" && mounted && user) {
      fetchRecords()
    }
  }, [tab, mounted, user])

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

  const addProduct = () => {
    setProducts([...products, { productName: "", models: [{ modelName: "", quantity: "1" }] }])
  }

  const removeProduct = (idx: number) => {
    if (products.length <= 1) return
    setProducts(products.filter((_, i) => i !== idx))
  }

  const updateProduct = (idx: number, field: keyof ProductForm, value: string) => {
    const updated = [...products]
    updated[idx] = { ...updated[idx], [field]: value }
    setProducts(updated)
  }

  const addModel = (productIdx: number) => {
    const updated = [...products]
    updated[productIdx].models.push({ modelName: "", quantity: "1" })
    setProducts(updated)
  }

  const removeModel = (productIdx: number, modelIdx: number) => {
    const updated = [...products]
    if (updated[productIdx].models.length <= 1) return
    updated[productIdx].models = updated[productIdx].models.filter((_, i) => i !== modelIdx)
    setProducts(updated)
  }

  const updateModel = (productIdx: number, modelIdx: number, field: "modelName" | "quantity", value: string) => {
    const updated = [...products]
    updated[productIdx].models[modelIdx] = { ...updated[productIdx].models[modelIdx], [field]: value }
    setProducts(updated)
  }

  const addSupportReq = () => setSupportRequirements([...supportRequirements, ""])
  const removeSupportReq = (idx: number) => {
    if (supportRequirements.length <= 1) { setSupportRequirements([]); return }
    setSupportRequirements(supportRequirements.filter((_, i) => i !== idx))
  }
  const updateSupportReq = (idx: number, value: string) => {
    const updated = [...supportRequirements]
    updated[idx] = value
    setSupportRequirements(updated)
  }

  const validate = (): string | null => {
    if (!category) return "Category is required"
    if (!locationDistrict) return "Location (District) is required"
    if (!tentativeCloseDate) return "Tentative close date is required"
    if (!projectName.trim()) return "Project name is required"
    if (!companyName.trim()) return "Company name is required"
    if (!contactPersonName.trim()) return "Contact person name is required"
    if (!contactPersonNumber.trim()) return "Contact person number is required"
    if (!requestedPrice || isNaN(Number(requestedPrice)) || Number(requestedPrice) < 0) return "Valid requested price is required"
    if (!businessPromotionAmount || isNaN(Number(businessPromotionAmount)) || Number(businessPromotionAmount) < 0) return "Valid business promotion amount is required"
    for (const p of products) {
      if (!p.productName.trim()) return "All products must have a name"
      for (const m of p.models) {
        if (!m.modelName.trim()) return "All models must have a name"
        if (!m.quantity || isNaN(Number(m.quantity)) || Number(m.quantity) < 1) return "All models must have a valid quantity"
      }
    }
    if (requiresSupport) {
      const valid = supportRequirements.filter(s => s.trim())
      if (valid.length === 0) return "Add at least one support requirement"
    }
    if (formTab === "tender") {
      if (!documentPurchaseAmount || isNaN(Number(documentPurchaseAmount)) || Number(documentPurchaseAmount) < 0) return "Valid document purchase amount is required"
      if (!securityDepositAmount || isNaN(Number(securityDepositAmount)) || Number(securityDepositAmount) < 0) return "Valid security deposit amount is required"
    }
    return null
  }

  const resetForm = () => {
    setDate(new Date().toISOString().split("T")[0])
    setCategory("")
    setAddress("")
    setLocationDistrict("")
    setTentativeCloseDate("")
    setProjectName("")
    setCompanyName("")
    setContactPersonName("")
    setContactPersonNumber("")
    setProducts([{ productName: "", models: [{ modelName: "", quantity: "1" }] }])
    setRequiresSupport(false)
    setSupportRequirements([""])
    setRequestedPrice("")
    setBusinessPromotionAmount("")
    setDocumentPurchaseAmount("")
    setSecurityDepositAmount("")
    setEditRecordId(null)
    setRevisedRemarks("")
  }

  const buildPayload = () => ({
    type: formTab,
    date,
    username: user?.name || user?.email?.split("@")[0] || "User",
    category: category.trim(),
    address: address.trim(),
    locationDistrict: locationDistrict.trim(),
    tentativeCloseDate,
    projectName: projectName.trim(),
    companyName: companyName.trim(),
    contactPersonName: contactPersonName.trim(),
    contactPersonNumber: contactPersonNumber.trim(),
    products: products.map(p => ({
      productName: p.productName.trim(),
      models: p.models.map(m => ({
        modelName: m.modelName.trim(),
        quantity: Number(m.quantity),
      })),
    })),
    requiresSupport,
    supportRequirements: requiresSupport ? supportRequirements.filter(s => s.trim()) : [],
    requestedPrice: Number(requestedPrice),
    businessPromotionAmount: Number(businessPromotionAmount),
    ...(formTab === "tender" && {
      documentPurchaseAmount: Number(documentPurchaseAmount),
      securityDepositAmount: Number(securityDepositAmount),
    }),
  })

  const handleSubmit = async () => {
    const err = validate()
    if (err) { setError(err); return }
    setError("")
    setSubmitting(true)
    try {
      if (editRecordId) {
        await axios.patch(`/api/project-tender/${editRecordId}`, { ...buildPayload(), resubmit: true }, { withCredentials: true })
        setSuccess("Resubmitted successfully")
      } else {
        await axios.post("/api/project-tender", buildPayload(), { withCredentials: true })
        setSuccess(`${formTab === "project" ? "Project" : "Tender"} submitted successfully`)
      }
      resetForm()
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      setError(err.response?.data?.error || "Submission failed")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveBill = async () => {
    if (!selectedRecord) return
    setBillSaving(true)
    try {
      await axios.patch(`/api/project-tender/${selectedRecord._id}`, {
        billNumber: editBillNo,
        billDate: editBillDate,
      }, { withCredentials: true })
      setSuccess("Bill info saved")
      setTimeout(() => setSuccess(""), 3000)
      fetchRecords()
      setSelectedRecord(prev => prev ? { ...prev, billNumber: editBillNo, billDate: editBillDate } : prev)
    } catch {
      setError("Failed to save bill info")
    } finally {
      setBillSaving(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!selectedRecord || !nextStatus) return
    setWorkflowLoading(true)
    try {
      const updateData: Record<string, unknown> = { status: nextStatus }

      if (nextStatus === "negotiable_price" && nextPrice) {
        updateData.negotiablePrice = Number(nextPrice)
      }
      if ((nextStatus === "won" || nextStatus === "get_noa") && nextBillNo && nextBillDate) {
        updateData.billNumber = nextBillNo
        updateData.billDate = nextBillDate
      }
      if (nextStatus === "lost" && nextLostRemarks) {
        updateData.lostRemarks = nextLostRemarks
      }

      await axios.patch(`/api/project-tender/${selectedRecord._id}`, updateData, { withCredentials: true })
      setDetailOpen(false)
      setSelectedRecord(null)
      setNextStatus("")
      setNextPrice("")
      setNextBillNo("")
      setNextBillDate("")
      setNextLostRemarks("")
      fetchRecords()
    } catch {
      setError("Workflow update failed")
    } finally {
      setWorkflowLoading(false)
    }
  }

  const openDetail = (record: ProjectTenderRecord) => {
    setSelectedRecord(record)
    setNextStatus("")
    setNextPrice("")
    setNextBillNo("")
    setNextBillDate("")
    setNextLostRemarks("")
    setEditBillNo(record.billNumber || "")
    setEditBillDate(record.billDate ? record.billDate.split("T")[0] : "")
    setDetailOpen(true)
  }

  const startEdit = (record: ProjectTenderRecord) => {
    const recordDate = record.date ? record.date.split("T")[0] : new Date().toISOString().split("T")[0]
    setDate(recordDate)
    setCategory(record.category || "")
    setAddress(record.address || "")
    setLocationDistrict(record.locationDistrict || "")
    setTentativeCloseDate(record.tentativeCloseDate ? record.tentativeCloseDate.split("T")[0] : "")
    setProjectName(record.projectName)
    setCompanyName(record.companyName)
    setContactPersonName(record.contactPersonName)
    setContactPersonNumber(record.contactPersonNumber)
    setProducts(record.products.map(p => ({
      productName: p.productName,
      models: p.models.map(m => ({ modelName: m.modelName, quantity: String(m.quantity) })),
    })))
    setRequiresSupport(record.requiresSupport)
    setSupportRequirements(
      record.supportRequirements && record.supportRequirements.length > 0
        ? record.supportRequirements
        : [""]
    )
    setRequestedPrice(String(record.requestedPrice ?? ""))
    setBusinessPromotionAmount(String(record.businessPromotionAmount ?? ""))
    setDocumentPurchaseAmount(String(record.documentPurchaseAmount ?? ""))
    setSecurityDepositAmount(String(record.securityDepositAmount ?? ""))
    setFormTab(record.type)
    setEditRecordId(record._id)
    setRevisedRemarks(record.adminRemarks || "")
    setError("")
    setTab("form")
  }

  const cancelEdit = () => {
    setEditRecordId(null)
    setRevisedRemarks("")
    resetForm()
  }

  const canUserEdit = (record: ProjectTenderRecord) => {
    return record.adminStatus === "approved"
  }

  const ALL_STATUSES: Record<string, { value: string; label: string; needsPrice?: boolean; needsBill?: boolean; needsRemarks?: boolean }[]> = {
    project: [
      { value: "pending", label: "Pending" },
      { value: "quotation_submitted", label: "Quotation Submitted" },
      { value: "negotiable_price", label: "Negotiable Price", needsPrice: true },
      { value: "won", label: "Won" },
      { value: "lost", label: "Lost", needsRemarks: true },
    ],
    tender: [
      { value: "pending", label: "Pending" },
      { value: "tender_submitted", label: "Tender Submitted" },
      { value: "get_noa", label: "Get NOA" },
      { value: "performance_security", label: "Performance Security" },
      { value: "contract_signing", label: "Contract Signing" },
      { value: "lost", label: "Lost", needsRemarks: true },
    ],
  }

  const getStatusOptions = (record: ProjectTenderRecord) => ALL_STATUSES[record.type] || []

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

  if (!mounted || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Project / Tender</h1>
          <p className="text-sm text-slate-500">Submit and track project and tender requests</p>
        </div>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {/* Top Tabs: Form / List */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab("form")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
            tab === "form" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-800"
          )}
        >
          <FileText className="w-4 h-4" /> Form
        </button>
        <button
          onClick={() => setTab("list")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
            tab === "list" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-800"
          )}
        >
          <List className="w-4 h-4" /> List
        </button>
      </div>

      {tab === "form" ? (
        <Card>
          <CardHeader>
            {/* Sub-tabs: Project / Tender (disabled when editing) */}
            <div className="flex gap-4 border-b border-slate-200 pb-3">
              <button
                onClick={() => { if (!editRecordId) { setFormTab("project"); setError("") } }}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                  formTab === "project" ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:text-slate-700",
                  editRecordId && "opacity-50 cursor-not-allowed"
                )}
              >
                Project
              </button>
              <button
                onClick={() => { if (!editRecordId) { setFormTab("tender"); setError("") } }}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                  formTab === "tender" ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:text-slate-700",
                  editRecordId && "opacity-50 cursor-not-allowed"
                )}
              >
                Tender
              </button>
            </div>
            {revisedRemarks && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <span className="font-medium">Admin Revision Remarks:</span> {revisedRemarks}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Date & Username */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <Label>Username</Label>
                <Input value={user?.name || user?.email || ""} disabled />
              </div>
            </div>

            {/* Category & Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm w-full">
                  <option value="">-- Select Category --</option>
                  {PROJECT_TENDER_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label>Location (District)</Label>
                <input
                  list="districtOptions"
                  value={locationDistrict}
                  onChange={e => setLocationDistrict(e.target.value)}
                  placeholder="Type or select a district..."
                  className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm w-full"
                />
                <datalist id="districtOptions">
                  {BANGLADESH_DISTRICTS.map(d => <option key={d} value={d} />)}
                </datalist>
              </div>
            </div>

            {/* Project / Company Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Project Name</Label>
                <Input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Enter project name" />
              </div>
              <div>
                <Label>Company Name</Label>
                <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Enter company name" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Contact Person Name</Label>
                <Input value={contactPersonName} onChange={e => setContactPersonName(e.target.value)} placeholder="Contact person name" />
              </div>
              <div>
                <Label>Contact Person Number</Label>
                <Input value={contactPersonNumber} onChange={e => setContactPersonNumber(e.target.value)} placeholder="Contact person number" />
              </div>
            </div>

            {/* Address & Tentative Close Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Address</Label>
                <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter address" />
              </div>
              <div>
                <Label>Tentative Close Date</Label>
                <Input type="date" value={tentativeCloseDate} onChange={e => setTentativeCloseDate(e.target.value)} />
              </div>
            </div>

            {/* Products */}
            <div>
              <Label className="mb-2 block">Product Details</Label>
              {products.map((product, pIdx) => (
                <div key={pIdx} className="border border-slate-200 rounded-lg p-4 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-700">Product {pIdx + 1}</span>
                    {products.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeProduct(pIdx)} className="text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="mb-3">
                    <Label className="text-xs">Product Name</Label>
                    <Input value={product.productName} onChange={e => updateProduct(pIdx, "productName", e.target.value)} placeholder="Product name" />
                  </div>
                  <div className="space-y-2">
                    {product.models.map((model, mIdx) => (
                      <div key={mIdx} className="flex items-center gap-2">
                        <div className="flex-1">
                          <Label className="text-xs">Model Name</Label>
                          <Input value={model.modelName} onChange={e => updateModel(pIdx, mIdx, "modelName", e.target.value)} placeholder="Model name" />
                        </div>
                        <div className="w-24">
                          <Label className="text-xs">Qty</Label>
                          <Input type="number" min="1" value={model.quantity} onChange={e => updateModel(pIdx, mIdx, "quantity", e.target.value)} />
                        </div>
                        {product.models.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => removeModel(pIdx, mIdx)} className="mt-5 text-red-500">
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => addModel(pIdx)} className="mt-2">
                    <Plus className="w-3 h-3 mr-1" /> Add Model
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addProduct} className="mt-1">
                <Plus className="w-4 h-4 mr-1" /> Add Product
              </Button>
            </div>

            {/* Required Support */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Label>Required Support from Principal</Label>
                <select
                  value={requiresSupport ? "yes" : "no"}
                  onChange={e => setRequiresSupport(e.target.value === "yes")}
                  className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              {requiresSupport && (
                <div className="ml-2 space-y-2">
                  {supportRequirements.map((req, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={req}
                        onChange={e => updateSupportReq(idx, e.target.value)}
                        placeholder="Support requirement"
                        className="flex-1"
                      />
                      {supportRequirements.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeSupportReq(idx)} className="text-red-500">
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addSupportReq}>
                    <Plus className="w-3 h-3 mr-1" /> Add Requirement
                  </Button>
                </div>
              )}
            </div>

            {/* Financial Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Requested Price (Without VAT)</Label>
                <Input type="number" min="0" value={requestedPrice} onChange={e => setRequestedPrice(e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label>Business Promotion Amount</Label>
                <Input type="number" min="0" value={businessPromotionAmount} onChange={e => setBusinessPromotionAmount(e.target.value)} placeholder="0" />
              </div>
            </div>

            {/* Tender-only fields */}
            {formTab === "tender" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Document Purchase Amount</Label>
                  <Input type="number" min="0" value={documentPurchaseAmount} onChange={e => setDocumentPurchaseAmount(e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label>Security Deposit Amount</Label>
                  <Input type="number" min="0" value={securityDepositAmount} onChange={e => setSecurityDepositAmount(e.target.value)} placeholder="0" />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {editRecordId && (
                <Button variant="outline" onClick={cancelEdit} disabled={submitting} className="flex-1">
                  Cancel
                </Button>
              )}
              <Button onClick={handleSubmit} disabled={submitting} className={editRecordId ? "flex-1" : "w-full"}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editRecordId ? "Resubmit" : `Submit ${formTab === "project" ? "Project" : "Tender"}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* ─── LIST VIEW ─── */
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4 pb-3">
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
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : filteredRecords.length === 0 ? (
                <p className="text-center text-slate-400 py-8">No submissions found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-2 font-medium text-slate-500">Date</th>
                        <th className="text-left py-3 px-2 font-medium text-slate-500">Type</th>
                        <th className="text-left py-3 px-2 font-medium text-slate-500">Project Name</th>
                        <th className="text-left py-3 px-2 font-medium text-slate-500">Company</th>
                        <th className="text-left py-3 px-2 font-medium text-slate-500">Status</th>
                        <th className="text-left py-3 px-2 font-medium text-slate-500">Admin</th>
                        <th className="text-left py-3 px-2 font-medium text-slate-500">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map(record => (
                        <tr key={record._id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-2">{formatDate(record.date)}</td>
                          <td className="py-3 px-2">
                            <Badge variant={record.type === "project" ? "default" : "secondary"}>
                              {record.type === "project" ? "Project" : "Tender"}
                            </Badge>
                          </td>
                          <td className="py-3 px-2 font-medium text-slate-800">{record.projectName}</td>
                          <td className="py-3 px-2 text-slate-600">{record.companyName}</td>
                          <td className="py-3 px-2">
                            <Badge variant={STATUS_COLORS[record.status] || "secondary"}>
                              {STATUS_LABELS[record.status] || record.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-2">
                            <Badge variant={record.adminStatus === "approved" ? "success" : record.adminStatus === "revised" ? "destructive" : "warning"}>
                              {record.adminStatus}
                            </Badge>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm" onClick={() => openDetail(record)}>
                                View
                              </Button>
                              {record.adminStatus === "revised" && (
                                <Button variant="outline" size="sm" onClick={() => startEdit(record)} className="text-amber-600 border-amber-300">
                                  Edit
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detail Dialog */}
      {selectedRecord && (
        <Dialog open={detailOpen} onClose={() => { setDetailOpen(false); setSelectedRecord(null); setNextStatus(""); setEditBillNo(""); setEditBillDate("") }} title={`${selectedRecord.type === "project" ? "Project" : "Tender"} Details`}>
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

            {/* Products */}
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

            {/* Support */}
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
              <div className="border border-slate-200 rounded-lg p-3 text-sm space-y-2">
                <h4 className="font-medium text-slate-700">Bill Information</h4>
                <div className="flex gap-2">
                  <Input placeholder="Bill Number" value={editBillNo} onChange={e => setEditBillNo(e.target.value)} className="flex-1" />
                  <Input type="date" value={editBillDate} onChange={e => setEditBillDate(e.target.value)} className="w-40" />
                  <Button size="sm" onClick={handleSaveBill} disabled={billSaving}>
                    {billSaving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                    Save
                  </Button>
                </div>
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
                <span className="font-medium text-slate-500">Workflow Status:</span>
                <Badge variant={STATUS_COLORS[selectedRecord.status] || "secondary"}>
                  {STATUS_LABELS[selectedRecord.status] || selectedRecord.status}
                </Badge>
              </div>
              {selectedRecord.adminRemarks && (
                <p className="mt-1 text-slate-600">Admin Remarks: {selectedRecord.adminRemarks}</p>
              )}
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

            {/* Workflow Status Dropdown */}
            {canUserEdit(selectedRecord) && (
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <h4 className="text-sm font-medium text-slate-700">Update Status</h4>
                <select
                  value={nextStatus}
                  onChange={e => { setNextStatus(e.target.value); setNextPrice(""); setNextBillNo(""); setNextBillDate(""); setNextLostRemarks("") }}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full"
                >
                  <option value="">-- Select status --</option>
                  {getStatusOptions(selectedRecord).map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

                {nextStatus && (
                  <div className="space-y-3">
                    {getStatusOptions(selectedRecord).find(s => s.value === nextStatus)?.needsPrice && (
                      <Input type="number" placeholder="Negotiated price" value={nextPrice} onChange={e => setNextPrice(e.target.value)} />
                    )}
                    {getStatusOptions(selectedRecord).find(s => s.value === nextStatus)?.needsBill && (
                      <div className="flex gap-2">
                        <Input placeholder="Bill Number" value={nextBillNo} onChange={e => setNextBillNo(e.target.value)} className="flex-1" />
                        <Input type="date" value={nextBillDate} onChange={e => setNextBillDate(e.target.value)} className="w-40" />
                      </div>
                    )}
                    {getStatusOptions(selectedRecord).find(s => s.value === nextStatus)?.needsRemarks && (
                      <Input placeholder="Lost remarks" value={nextLostRemarks} onChange={e => setNextLostRemarks(e.target.value)} />
                    )}
                    <Button onClick={handleStatusUpdate} disabled={workflowLoading} className="w-full">
                      {workflowLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Update Status
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-slate-200 pt-3 text-xs text-slate-400">
              Created: {formatDate(selectedRecord.createdAt)}
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}
