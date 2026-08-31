"use client"

import { useState, useEffect, useRef } from "react"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import axios from "axios"
import ManageQuotationJunior, { QuotationsListTab } from "@/components/manage-quotation-junior"
import ServiceTaskList from "@/components/service-task-list"
import {
  Phone,
  FileText,
  ClipboardList,
  ChevronRight,
  ChevronDown,
  Loader2,
  CheckCircle,
  X,
  Calendar,
  Plus,
  Trash2,
  List,
  RefreshCw,
  Building2,
  PhoneCall,
  Wrench,
  Package,
  Search,
  PlusCircle,
  AlertTriangle,
  Clock,
  XCircle,
  DollarSign,
} from "lucide-react"

type TabType = "sales" | "service" | "consumable"
type SalesSubView = "menu" | "phone-calls" | "form" | "quotations"
type ServiceSubView = "menu" | "phone-calls" | "quotations" | "visits"
type ConsumableSubView = "menu" | "phone-calls" | "form" | "quotations"
type CallType = "follow-up" | "cold" | null

const SALES_TYPE_OPTIONS = [
  { value: "", label: "Select type..." },
  { value: "General Sales", label: "General Sales" },
  { value: "Tender/Project", label: "Tender/Project" },
  { value: "Bulk Order", label: "Bulk Order" },
  { value: "Special Price", label: "Special Price" },
]

const CONSUMABLE_TYPE_OPTIONS = [
  { value: "", label: "Select type..." },
  { value: "Regular Supply", label: "Regular Supply" },
  { value: "Bulk Order", label: "Bulk Order" },
  { value: "Standing Order", label: "Standing Order" },
]

const SALES_PRODUCTS = ["MFP", "MPS", "Barcode Printers", "Paper Shredder", "Duplicator", "Barcode Scanner / POS", "Solutions", "Tender / Project"]

const CONSUMABLE_PRODUCTS = ["Black & White", "Color", "Duplicator Ink", "Duplicator Master", "MPS"]

interface CompanyData {
  _id: string
  name: string
  group: string
  location: string
  contactPerson: string
  contactNumber: string
  locations: Array<{
    location: string
    contactPerson: string
    contactNumber: string
  }>
}

interface QuotationData {
  _id: string
  quotationId: string
  quotationDate: string
  customerName: string
  engineerName: string
  amount: number
  quotationType: string
  category: string
  products?: Array<{
    productName: string
    models: Array<{
      modelName: string
      quantity: number
      unitPrice: number
      totalPrice: number
    }>
  }>
  contactPerson: string
  contactNumber: string
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
  createdAt: string
}

const branchRoles = [
  "branch_manager", "branch_manager_juniors",
  "branch_service", "branch_service_juniors",
  "branch_sales", "branch_sales_juniors",
  "branch_consumable", "branch_consumable_juniors",
  "branch_accounts", "branch_accounts_juniors",
]

function generateQuotationId(category: string, count: number): string {
  const year = String(new Date().getFullYear())
  const seq = String(count + 1).padStart(2, "0")
  const cat = category.charAt(0).toUpperCase() + category.slice(1)
  return `${seq}-${cat}-${year}`
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

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const TABS: { key: TabType; label: string; icon: React.ElementType }[] = [
  { key: "sales", label: "Sales", icon: PhoneCall },
  { key: "service", label: "Service", icon: Wrench },
  { key: "consumable", label: "Consumable", icon: Package },
]

export default function BranchTrackingPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<TabType>("sales")

  // Sales sub-views
  const [salesView, setSalesView] = useState<SalesSubView>("menu")

  // Service sub-views
  const [serviceView, setServiceView] = useState<ServiceSubView>("menu")

  // Consumable sub-views
  const [consumableView, setConsumableView] = useState<ConsumableSubView>("menu")

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="w-6 h-6" />
          Sales / Service / Consumable Tracking
        </h1>
        <p className="text-slate-500">Track your daily activities across sales, service, and consumable</p>
      </div>

      {/* Top-level tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 pb-2">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key)
                setSalesView("menu")
                setServiceView("menu")
                setConsumableView("menu")
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.key
                  ? "bg-purple-50 text-purple-700 border border-purple-100 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Sales Tab */}
      {activeTab === "sales" && (
        <SalesTabContent view={salesView} setView={setSalesView} />
      )}

      {/* Service Tab */}
      {activeTab === "service" && (
        <ServiceTabContent view={serviceView} setView={setServiceView} />
      )}

      {/* Consumable Tab */}
      {activeTab === "consumable" && (
        <ConsumableTabContent view={consumableView} setView={setConsumableView} />
      )}
    </div>
  )
}

/* ========== SALES TAB ========== */

function SalesTabContent({ view, setView }: { view: SalesSubView; setView: (v: SalesSubView) => void }) {
  if (view === "phone-calls") {
    return <SalesPhoneCallsForm onBack={() => setView("menu")} />
  }
  if (view === "form") {
    return <BranchSalesActivityForm onBack={() => setView("menu")} />
  }
  if (view === "quotations") {
    const [quotationsTab, setQuotationsTab] = useState<"create" | "list" | "total-bill">("create")
    return (
      <div>
        <button onClick={() => setView("menu")} className="text-sm text-purple-600 hover:text-purple-700 mb-4 flex items-center gap-1">
          <ChevronRight className="w-4 h-4 rotate-180" /> Back to Sales
        </button>

        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-1">
            <button
              onClick={() => setQuotationsTab("create")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                quotationsTab === "create" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              <PlusCircle className="w-4 h-4" />
              Create Quotation
            </button>
            <button
              onClick={() => setQuotationsTab("list")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                quotationsTab === "list" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              <List className="w-4 h-4" />
              Quotation List
            </button>
            <button
              onClick={() => setQuotationsTab("total-bill")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                quotationsTab === "total-bill" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              <DollarSign className="w-4 h-4" />
              Total Bill
            </button>
          </nav>
        </div>

        {quotationsTab === "create" && <ProductCreateForm category="sales" onSuccess={() => setQuotationsTab("list")} />}
        {quotationsTab === "list" && <QuotationsListTab category="sales" />}
        {quotationsTab === "total-bill" && <CategoryTotalBillTab category="sales" />}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <button onClick={() => setView("phone-calls")} className="text-left">
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-200 h-full">
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center">
              <Phone className="w-7 h-7 text-purple-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Today Phone Calls</h3>
            <p className="text-sm text-slate-500">Log follow-up or cold calls</p>
          </CardContent>
        </Card>
      </button>
      <button onClick={() => setView("form")} className="text-left">
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-200 h-full">
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center">
              <ClipboardList className="w-7 h-7 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Form</h3>
            <p className="text-sm text-slate-500">Submit daily sales activity</p>
          </CardContent>
        </Card>
      </button>
      <button onClick={() => setView("quotations")} className="text-left">
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-200 h-full">
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center">
              <FileText className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Manage Quotation</h3>
            <p className="text-sm text-slate-500">Manage your quotations</p>
          </CardContent>
        </Card>
      </button>
    </div>
  )
}

/* ========== SERVICE TAB ========== */

function ServiceTabContent({ view, setView }: { view: ServiceSubView; setView: (v: ServiceSubView) => void }) {
  if (view === "phone-calls") {
    return <ServicePhoneCallsForm onBack={() => setView("menu")} />
  }
  if (view === "quotations") {
    return <AssignedQuotations onBack={() => setView("menu")} />
  }
  if (view === "visits") {
    return <AssignedVisits onBack={() => setView("menu")} />
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <button onClick={() => setView("phone-calls")} className="text-left">
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-200 h-full">
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center">
              <Phone className="w-7 h-7 text-purple-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Today Phone Calls</h3>
            <p className="text-sm text-slate-500">Log service phone calls</p>
          </CardContent>
        </Card>
      </button>
      <button onClick={() => setView("quotations")} className="text-left">
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-200 h-full">
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center">
              <FileText className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Assigned Quotation</h3>
            <p className="text-sm text-slate-500">Manage your quotations</p>
          </CardContent>
        </Card>
      </button>
      <button onClick={() => setView("visits")} className="text-left">
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-200 h-full">
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center">
              <List className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Assigned Visit Calls</h3>
            <p className="text-sm text-slate-500">View assigned service calls/cases</p>
          </CardContent>
        </Card>
      </button>
    </div>
  )
}

/* ========== CONSUMABLE TAB ========== */

function ConsumableTabContent({ view, setView }: { view: ConsumableSubView; setView: (v: ConsumableSubView) => void }) {
  if (view === "phone-calls") {
    return <ConsumablePhoneCallsForm onBack={() => setView("menu")} />
  }
  if (view === "form") {
    return <ConsumableActivityForm onBack={() => setView("menu")} />
  }
  if (view === "quotations") {
    const [quotationsTab, setQuotationsTab] = useState<"create" | "list" | "total-bill">("create")
    return (
      <div>
        <button onClick={() => setView("menu")} className="text-sm text-purple-600 hover:text-purple-700 mb-4 flex items-center gap-1">
          <ChevronRight className="w-4 h-4 rotate-180" /> Back to Consumable
        </button>

        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-1">
            <button
              onClick={() => setQuotationsTab("create")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                quotationsTab === "create" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              <PlusCircle className="w-4 h-4" />
              Create Quotation
            </button>
            <button
              onClick={() => setQuotationsTab("list")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                quotationsTab === "list" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              <List className="w-4 h-4" />
              Quotation List
            </button>
            <button
              onClick={() => setQuotationsTab("total-bill")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                quotationsTab === "total-bill" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              <DollarSign className="w-4 h-4" />
              Total Bill
            </button>
          </nav>
        </div>

        {quotationsTab === "create" && <ProductCreateForm category="consumable" onSuccess={() => setQuotationsTab("list")} />}
        {quotationsTab === "list" && <QuotationsListTab category="consumable" />}
        {quotationsTab === "total-bill" && <CategoryTotalBillTab category="consumable" />}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <button onClick={() => setView("phone-calls")} className="text-left">
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-200 h-full">
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center">
              <Phone className="w-7 h-7 text-purple-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Today Phone Calls</h3>
            <p className="text-sm text-slate-500">Log consumable phone calls</p>
          </CardContent>
        </Card>
      </button>
      <button onClick={() => setView("form")} className="text-left">
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-200 h-full">
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center">
              <ClipboardList className="w-7 h-7 text-orange-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Form</h3>
            <p className="text-sm text-slate-500">Submit daily consumable activity</p>
          </CardContent>
        </Card>
      </button>
      <button onClick={() => setView("quotations")} className="text-left">
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-200 h-full">
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center">
              <FileText className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Manage Quotation</h3>
            <p className="text-sm text-slate-500">Manage your quotations</p>
          </CardContent>
        </Card>
      </button>
    </div>
  )
}

/* ─── PRODUCT/MODEL CREATE FORM (sales & consumable) ─────────────────── */

function ProductCreateForm({ category, onSuccess }: { category: "sales" | "consumable"; onSuccess: () => void }) {
  const { user } = useAuthStore()
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [customerName, setCustomerName] = useState("")
  const [customerSearch, setCustomerSearch] = useState("")
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false)
  const [companies, setCompanies] = useState<CompanyData[]>([])
  const [contactPerson, setContactPerson] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [locationPickerOpen, setLocationPickerOpen] = useState(false)
  const customerRef = useRef<HTMLDivElement>(null)
  const locationRef = useRef<HTMLDivElement>(null)
  const [quotationType, setQuotationType] = useState("")
  const [products, setProducts] = useState<{ productName: string; models: { modelName: string; quantity: string; unitPrice: string }[] }[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [quotationId, setQuotationId] = useState("")

  const productList = category === "sales" ? SALES_PRODUCTS : CONSUMABLE_PRODUCTS
  const typeOptions = category === "sales" ? SALES_TYPE_OPTIONS : CONSUMABLE_TYPE_OPTIONS

  useEffect(() => {
    fetch("/api/quotations", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        const count = data.data?.length || 0
        setQuotationId(generateQuotationId(category, count))
      })
      .catch(() => setQuotationId(generateQuotationId(category, 0)))
  }, [user, category])

  useEffect(() => {
    fetch("/api/companiesforservice", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.companies) setCompanies(d.companies) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) setCustomerDropdownOpen(false)
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) setLocationPickerOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  )
  const selectedCompany = companies.find((c) => c.name === customerName)
  const companyLocations = selectedCompany?.locations?.filter(l => l.location.trim()) ||
    (selectedCompany?.location ? [{ location: selectedCompany.location, contactPerson: selectedCompany.contactPerson, contactNumber: selectedCompany.contactNumber }] : [])

  const selectCompany = (company: CompanyData) => {
    setCustomerName(company.name)
    setCustomerSearch(company.name)
    setContactPerson(company.locations?.[0]?.contactPerson || company.contactPerson || "")
    setContactNumber(company.locations?.[0]?.contactNumber || company.contactNumber || "")
    setCustomerDropdownOpen(false)
    if (companyLocations.length > 1) setLocationPickerOpen(true)
  }

  const selectLocation = (loc: { location: string; contactPerson: string; contactNumber: string }) => {
    setContactPerson(loc.contactPerson || contactPerson)
    setContactNumber(loc.contactNumber || contactNumber)
    setLocationPickerOpen(false)
  }

  const clearCustomer = () => {
    setCustomerName(""); setCustomerSearch(""); setContactPerson(""); setContactNumber("")
  }

  const addProduct = () => {
    setProducts([...products, { productName: "", models: [{ modelName: "", quantity: "1", unitPrice: "0" }] }])
  }

  const removeProduct = (idx: number) => {
    setProducts(products.filter((_, i) => i !== idx))
  }

  const updateProduct = (idx: number, productName: string) => {
    const updated = [...products]
    updated[idx] = { ...updated[idx], productName }
    setProducts(updated)
  }

  const addModel = (productIdx: number) => {
    const updated = [...products]
    updated[productIdx].models.push({ modelName: "", quantity: "1", unitPrice: "0" })
    setProducts(updated)
  }

  const removeModel = (productIdx: number, modelIdx: number) => {
    const updated = [...products]
    updated[productIdx].models = updated[productIdx].models.filter((_, i) => i !== modelIdx)
    setProducts(updated)
  }

  const updateModel = (productIdx: number, modelIdx: number, field: "modelName" | "quantity" | "unitPrice", value: string) => {
    const updated = [...products]
    updated[productIdx].models[modelIdx] = { ...updated[productIdx].models[modelIdx], [field]: value }
    setProducts(updated)
  }

  const calcTotal = () => {
    return products.reduce((sum, p) => {
      return sum + p.models.reduce((ms, m) => ms + (parseFloat(m.unitPrice) || 0) * (parseInt(m.quantity) || 0), 0)
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)
    try {
      const productsPayload = products.map(p => ({
        productName: p.productName,
        models: p.models.map(m => ({
          modelName: m.modelName,
          quantity: parseInt(m.quantity) || 0,
          unitPrice: parseFloat(m.unitPrice) || 0,
          totalPrice: (parseFloat(m.unitPrice) || 0) * (parseInt(m.quantity) || 0),
        })),
      }))

      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quotationDate: date,
          customerName,
          engineerName: user.name,
          quotationType,
          category,
          products: productsPayload,
          contactPerson,
          contactNumber,
        }),
        credentials: "include",
      })
      const data = await res.json()
      if (data.success) {
        setProducts([])
        setCustomerName(""); setCustomerSearch(""); setContactPerson(""); setContactNumber("")
        setQuotationType("")
        onSuccess()
      } else {
        alert(data.error || "Failed to create quotation")
      }
    } catch (error) {
      console.error("Error creating quotation:", error)
      alert("Failed to create quotation")
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = customerName && date && quotationType && products.length > 0 && products.some(p => p.productName && p.models.some(m => m.modelName))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          New {category === "sales" ? "Sales" : "Consumable"} Quotation
        </CardTitle>
        <CardDescription>Create a new {category} quotation with product and model details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>ID</Label>
              <Input value={quotationId} readOnly className="bg-slate-50 text-slate-600 cursor-not-allowed" />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
              <Label>Engineer Name</Label>
              <Input value={user?.name || ""} disabled className="bg-slate-50 text-slate-600" />
            </div>
            <div ref={customerRef}>
              <Label>Customer Name</Label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input value={customerSearch} onChange={(e) => { setCustomerSearch(e.target.value); setCustomerDropdownOpen(true); if (customerName) clearCustomer() }} onFocus={() => setCustomerDropdownOpen(true)} placeholder={selectedCompany ? selectedCompany.name : "Search or enter customer name..."} className="pl-9 pr-9" required />
                  {selectedCompany && <button type="button" onClick={clearCustomer} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>}
                </div>
                {customerDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredCompanies.length === 0 ? <div className="px-3 py-2 text-sm text-gray-500">No companies found</div> : filteredCompanies.map((company) => (
                      <button key={company._id} type="button" onClick={() => selectCompany(company)} className={cn("w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors", customerName === company.name ? "bg-blue-50 text-blue-700" : "text-gray-900")}>
                        <div className="font-medium">{company.name}</div>
                        <div className="text-xs text-teal-600">{company.group || "Not a group of company"}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedCompany && <p className="mt-1 text-xs text-green-600">Selected: {selectedCompany.name}</p>}
              {selectedCompany && companyLocations.length > 1 && (
                <div ref={locationRef} className="mt-2">
                  <Label>Select Location for Contact</Label>
                  <div className="relative">
                    <Input value={contactPerson || contactNumber ? `${contactPerson}${contactPerson && contactNumber ? " — " : ""}${contactNumber}` : "Select a location..."} onFocus={() => setLocationPickerOpen(true)} readOnly className="cursor-pointer bg-white" />
                    {locationPickerOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {companyLocations.map((loc, idx) => (
                          <button key={idx} type="button" onMouseDown={() => selectLocation(loc)} className={cn("w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors")}>
                            <div className="font-medium">{loc.location}</div>
                            {(loc.contactPerson || loc.contactNumber) && <div className="text-xs text-gray-500">{loc.contactPerson}{loc.contactPerson && loc.contactNumber ? " — " : ""}{loc.contactNumber}</div>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div>
              <Label>Quotation Type</Label>
              <select value={quotationType} onChange={(e) => setQuotationType(e.target.value)} className="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" required>
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Contact Person</Label>
              <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Enter contact person" required />
            </div>
            <div>
              <Label>Contact Number</Label>
              <Input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="Enter contact number" required />
            </div>
          </div>

          {/* Products & Models */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold">Products</Label>
              <Button type="button" onClick={addProduct} variant="outline" size="sm">
                <PlusCircle className="w-4 h-4 mr-1" /> Add Product
              </Button>
            </div>
            {products.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
                <p className="text-slate-400 mb-2">No products added yet</p>
                <Button type="button" onClick={addProduct} variant="outline" size="sm">
                  <PlusCircle className="w-4 h-4 mr-1" /> Add Product
                </Button>
              </div>
            )}
            {products.map((product, pIdx) => (
              <Card key={pIdx} className="mb-3 border-slate-200">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-4">
                      <Label className="text-xs">Product Name</Label>
                      <select
                        value={product.productName}
                        onChange={(e) => updateProduct(pIdx, e.target.value)}
                        className="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 mt-1"
                      >
                        <option value="">Select product...</option>
                        {productList.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <button type="button" onClick={() => removeProduct(pIdx)} className="text-red-400 hover:text-red-600 mt-6"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-semibold">Models</Label>
                      <Button type="button" onClick={() => addModel(pIdx)} variant="ghost" size="sm" className="h-7 text-xs">
                        <PlusCircle className="w-3 h-3 mr-1" /> Add Model
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {product.models.map((model, mIdx) => (
                        <div key={mIdx} className="flex gap-2 items-end">
                          <div className="flex-1">
                            <Label className="text-xs">Model</Label>
                            <Input value={model.modelName} onChange={(e) => updateModel(pIdx, mIdx, "modelName", e.target.value)} placeholder="Model name" className="text-sm" />
                          </div>
                          <div className="w-20">
                            <Label className="text-xs">Qty</Label>
                            <Input type="number" min="1" value={model.quantity} onChange={(e) => updateModel(pIdx, mIdx, "quantity", e.target.value)} className="text-sm" />
                          </div>
                          <div className="w-28">
                            <Label className="text-xs">Unit Price</Label>
                            <Input type="number" step="0.01" min="0" value={model.unitPrice} onChange={(e) => updateModel(pIdx, mIdx, "unitPrice", e.target.value)} className="text-sm" />
                          </div>
                          <div className="w-28 pt-5 text-sm font-medium text-slate-700">
                            = {((parseFloat(model.unitPrice) || 0) * (parseInt(model.quantity) || 0)).toFixed(2)}
                          </div>
                          {product.models.length > 1 && (
                            <button type="button" onClick={() => removeModel(pIdx, mIdx)} className="text-red-400 hover:text-red-600 pt-5"><X className="w-4 h-4" /></button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
            <span className="font-semibold text-slate-700">Total Amount:</span>
            <span className="text-xl font-bold text-teal-700">{calcTotal().toFixed(2)} BDT</span>
          </div>

          <Button type="submit" className="w-full" disabled={!canSubmit || submitting}>
            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : <><FileText className="w-4 h-4 mr-2" />Create {category === "sales" ? "Sales" : "Consumable"} Quotation</>}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

/* ─── QUOTATIONS LIST (sales & consumable) ──────────────────────────── */

function SalesConsumableQuotationsList({ refreshKey, category }: { refreshKey: number; category: string }) {
  const { user } = useAuthStore()
  const [quotations, setQuotations] = useState<QuotationData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [statusAction, setStatusAction] = useState<Record<string, { newStatus: string; billDate: string; lostRemarks: string; followUpRemarks: string }>>({})
  const [billDateInputs, setBillDateInputs] = useState<Record<string, string>>({})
  const [editingAmount, setEditingAmount] = useState<Record<string, string>>({})
  const [savingAmount, setSavingAmount] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    const params = new URLSearchParams()
    params.set("category", category)
    params.set("createdBy", user._id)
    fetch(`/api/quotations?${params}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.success) setQuotations(data.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, refreshKey, category])

  const filteredQuotations = quotations.filter((q) => {
    if (!search) return true
    const s = search.toLowerCase()
    return q.customerName.toLowerCase().includes(s) || q.quotationId.toLowerCase().includes(s) || q.engineerName.toLowerCase().includes(s)
  })

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

  const catLabel = category === "sales" ? "Sales" : "Consumable"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {catLabel} Quotations List
        </CardTitle>
        <CardDescription>View your submitted {catLabel.toLowerCase()} quotations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative max-w-md mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search quotations..." className="pl-9" />
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
        ) : filteredQuotations.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No {catLabel.toLowerCase()} quotations yet</p>
            <p className="text-sm text-slate-400 mt-1">Create your first {catLabel.toLowerCase()} quotation from the Create tab</p>
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
                          <p className="text-slate-900 font-medium">{q.amount.toFixed(2)}</p>
                        )}
                      </div>
                    </div>

                    {q.products && q.products.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-slate-500 mb-1">Products</p>
                        <div className="flex flex-wrap gap-2">
                          {q.products.map((p, i) => (
                            <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">{p.productName} ({p.models.reduce((s, m) => s + m.quantity, 0)})</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center gap-3">
                      {!["Approved", "Cancelled", "Revised", "Lost"].some(s => q.status === s || q.status.startsWith(s)) && !q.status.startsWith("Follow Up") && (
                        <div className="flex items-center gap-2">
                          <select
                            value={action.newStatus}
                            onChange={(e) => setStatusAction((prev) => ({ ...prev, [q._id]: { ...action, newStatus: e.target.value } }))}
                            className="h-8 px-2 rounded-md border border-slate-200 text-xs bg-white"
                          >
                            <option value="">Update status...</option>
                            <option value="Approved">Approved</option>
                            <option value="Cancelled">Cancelled</option>
                            <option value="Revised">Revised</option>
                            <option value="Lost">Lost</option>
                          </select>
                          {action.newStatus && (
                            <Button size="sm" onClick={() => handleStatusChange(q)} disabled={isUpdating} className="h-8 text-xs">
                              {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                            </Button>
                          )}
                        </div>
                      )}

                      {q.status === "Approved" && !q.billDate && (
                        <div className="flex items-center gap-2">
                          <Input type="date" value={billDateInputs[q._id] || ""} onChange={(e) => setBillDateInputs((prev) => ({ ...prev, [q._id]: e.target.value }))} className="w-36 h-8 text-xs" />
                          {billDateInputs[q._id] && (
                            <Button size="sm" onClick={() => handleBillDateSave(q)} disabled={isUpdating} className="h-8 text-xs">
                              {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save Bill Date"}
                            </Button>
                          )}
                        </div>
                      )}

                      {!["Approved", "Cancelled", "Revised", "Lost"].some(s => q.status === s || q.status.startsWith(s)) && (
                        <div className="flex items-center gap-2">
                          <select
                            value={action.newStatus === "Follow Up" ? "Follow Up" : ""}
                            onChange={(e) => setStatusAction((prev) => ({ ...prev, [q._id]: { ...action, newStatus: "Follow Up" } }))}
                            className="h-8 px-2 rounded-md border border-slate-200 text-xs bg-white"
                          >
                            <option value="">Follow up...</option>
                            <option value="Follow Up">Follow Up</option>
                          </select>
                          {action.newStatus === "Follow Up" && (
                            <>
                              <Input value={action.followUpRemarks} onChange={(e) => setStatusAction((prev) => ({ ...prev, [q._id]: { ...action, followUpRemarks: e.target.value } }))} placeholder="Remarks" className="w-36 h-8 text-xs" />
                              <Button size="sm" onClick={() => handleStatusChange(q)} disabled={isUpdating} className="h-8 text-xs">
                                {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                              </Button>
                            </>
                          )}
                        </div>
                      )}

                      {q.status === "Approved" && q.billDate && (
                        <span className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Bill Completed on {new Date(q.billDate).toLocaleDateString("en-GB")}</span>
                      )}
                    </div>
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

/* ─── TOTAL BILL TAB (sales & consumable) ──────────────────────── */

function CategoryTotalBillTab({ category }: { category: string }) {
  const [data, setData] = useState<{ engineerName: string; quotations: QuotationData[] }[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [engineerSearch, setEngineerSearch] = useState("")
  const [selectedEngineer, setSelectedEngineer] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/quotations?billable=true&category=${category}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const grouped: Record<string, QuotationData[]> = {}
          d.data.forEach((q: QuotationData) => {
            const name = q.engineerName
            if (!grouped[name]) grouped[name] = []
            grouped[name].push(q)
          })
          setData(Object.entries(grouped).map(([name, qs]) => ({ engineerName: name, quotations: qs })))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const allEngineers = data.map((g) => g.engineerName)
  const filteredEngineers = allEngineers.filter((name) =>
    name.toLowerCase().includes(engineerSearch.toLowerCase())
  )
  const filteredData = selectedEngineer
    ? data.filter((g) => g.engineerName === selectedEngineer)
    : data

  const totalAmount = filteredData.reduce((sum, g) => sum + g.quotations.reduce((s, q) => s + q.amount, 0), 0)
  const totalCount = filteredData.reduce((sum, g) => sum + g.quotations.length, 0)

  const selectEngineer = (name: string) => {
    setSelectedEngineer(name)
    setEngineerSearch(name)
    setDropdownOpen(false)
  }

  const clearEngineer = () => {
    setSelectedEngineer("")
    setEngineerSearch("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Total Bill
        </CardTitle>
        <CardDescription>View bill summary for {category} quotations by engineer</CardDescription>
      </CardHeader>
      <CardContent>
        <div ref={dropdownRef} className="relative max-w-md mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={engineerSearch}
              onChange={(e) => { setEngineerSearch(e.target.value); setDropdownOpen(true); if (selectedEngineer) setSelectedEngineer("") }}
              onFocus={() => setDropdownOpen(true)}
              placeholder={selectedEngineer || "Search for an engineer..."}
              className="pl-9 pr-9"
            />
            {selectedEngineer && (
              <button type="button" onClick={clearEngineer} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {dropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredEngineers.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">No engineers found</div>
              ) : (
                filteredEngineers.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => selectEngineer(name)}
                    className={cn("w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors", selectedEngineer === name ? "bg-blue-50 text-blue-700" : "text-gray-900")}
                  >
                    <div className="font-medium">{name}</div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-16">
            <DollarSign className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No billable {category} quotations</p>
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
              {filteredData.map((group) => {
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
                              <span className="text-xs text-slate-400">{q.billDate ? new Date(q.billDate).toLocaleDateString("en-GB") : "-"}</span>
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

/* ========== SALES PHONE CALLS FORM ========== */

function SalesPhoneCallsForm({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<"choose" | "form">("choose")
  const [callType, setCallType] = useState<CallType>(null)
  const [submittedCalls, setSubmittedCalls] = useState<any[]>([])
  const [callsFilter, setCallsFilter] = useState<"all" | "follow-up" | "cold">("all")
  const [loadingCalls, setLoadingCalls] = useState(true)
  const [selectedCall, setSelectedCall] = useState<any>(null)

  const fetchCalls = async () => {
    setLoadingCalls(true)
    try {
      const params = new URLSearchParams()
      if (callsFilter !== "all") params.set("type", callsFilter)
      const res = await axios.get(`/api/branch-sales-phone-calls?${params}`, { withCredentials: true })
      setSubmittedCalls(res.data.calls || [])
    } catch { } finally { setLoadingCalls(false) }
  }

  useEffect(() => { if (step === "choose") fetchCalls() }, [step, callsFilter])

  if (step === "choose") {
    return (
      <div>
        <button onClick={onBack} className="text-sm text-purple-600 hover:text-purple-700 mb-4 flex items-center gap-1">
          <ChevronRight className="w-4 h-4 rotate-180" /> Back to Sales
        </button>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Today Phone Calls</h2>
        <p className="text-slate-500 mb-6">Choose call type to log:</p>
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <button
            onClick={() => { setCallType("follow-up"); setStep("form") }}
            className="text-left"
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-200">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                  <PhoneCall className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Follow Up Calls</h3>
                  <p className="text-sm text-slate-500">Log follow-up call details</p>
                </div>
              </CardContent>
            </Card>
          </button>
          <button
            onClick={() => { setCallType("cold"); setStep("form") }}
            className="text-left"
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-indigo-200">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
                  <PhoneCall className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Cold Calls</h3>
                  <p className="text-sm text-slate-500">Log cold call details</p>
                </div>
              </CardContent>
            </Card>
          </button>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">My Submitted Calls</h3>
            <div className="flex gap-1">
              {(["all", "follow-up", "cold"] as const).map((f) => (
                <button key={f} onClick={() => setCallsFilter(f)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                    callsFilter === f
                      ? "bg-purple-600 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {f === "all" ? "All" : f === "follow-up" ? "Follow Up" : "Cold"}
                </button>
              ))}
            </div>
          </div>
          {loadingCalls ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
          ) : submittedCalls.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No calls submitted yet</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Company</th>
                    <th className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                    <th className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Type</th>
                    <th className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Product</th>
                    <th className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {submittedCalls.map((call: any) => (
                    <tr key={call._id} onClick={() => setSelectedCall(call)} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                      <td className="px-3 py-2 text-xs text-slate-700">{call.date}</td>
                      <td className="px-3 py-2 text-xs font-semibold text-slate-900">{call.companyName}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">{call.contactPersonName}</td>
                      <td className="px-3 py-2 text-xs">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          call.type === "follow-up" ? "bg-blue-50 text-blue-700" : "bg-indigo-50 text-indigo-700"
                        }`}>
                          {call.type === "follow-up" ? "Follow Up" : "Cold"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">{call.product || "-"}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">{call.outcomeFromCall ? call.outcomeFromCall.slice(0, 40) + (call.outcomeFromCall.length > 40 ? "..." : "") : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Dialog open={!!selectedCall} onClose={() => setSelectedCall(null)} title="Call Details">
          {selectedCall && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Date</p>
                  <p className="text-slate-900">{selectedCall.date}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Type</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedCall.type === "follow-up" ? "bg-blue-50 text-blue-700" : "bg-indigo-50 text-indigo-700"
                  }`}>
                    {selectedCall.type === "follow-up" ? "Follow Up" : "Cold"}
                  </span>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Company</p>
                  <p className="text-slate-900">{selectedCall.companyName}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Contact Person</p>
                  <p className="text-slate-900">{selectedCall.contactPersonName}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Contact Phone</p>
                  <p className="text-slate-900">{selectedCall.contactPersonPhone || "-"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Product</p>
                  <p className="text-slate-900">{selectedCall.product || "-"}</p>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Cause for Call</p>
                  <p className="text-slate-900">{selectedCall.causeForCall || "-"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Outcome</p>
                  <p className="text-slate-900">{selectedCall.outcomeFromCall || "-"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Outgoing Call Type</p>
                  <p className="text-slate-900">{selectedCall.outgoingCallType || "-"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Feedback Type</p>
                  <p className="text-slate-900">{selectedCall.feedbackType || "-"}</p>
                </div>
                <div className="flex gap-6">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Lead Search</p>
                    <p className="text-slate-900">{selectedCall.isLeadSearch ? "Yes" : "No"}</p>
                  </div>
                  {selectedCall.isLeadSearch && (
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Lead Found</p>
                      <p className="text-slate-900">{selectedCall.leadFound || "No"}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Dialog>
      </div>
    )
  }

  return (
    <div>
      <button onClick={() => setStep("choose")} className="text-sm text-purple-600 hover:text-purple-700 mb-4 flex items-center gap-1">
        <ChevronRight className="w-4 h-4 rotate-180" /> Back
      </button>
      <OutgoingCallForm
        callType={callType}
        callTypeLabel={callType === "follow-up" ? "Follow Up" : "Cold"}
        onSuccess={() => setStep("choose")}
      />
    </div>
  )
}

/* ========== OUTGOING CALL FORM (shared for Sales/Service/Consumable) ========== */

function OutgoingCallForm({ callType, callTypeLabel, onSuccess, apiEndpoint }: { callType?: "cold" | "follow-up" | null; callTypeLabel: string; onSuccess: () => void; apiEndpoint?: string }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    companyName: "",
    contactPersonName: "",
    contactPersonPhone: "",
    product: "",
    causeForCall: "",
    outcomeFromCall: "",
    isLeadSearch: false,
    leadFound: "" as "" | "Yes" | "No",
    outgoingCallType: "Sales" as "Sales" | "Support",
    feedbackType: "" as "" | "Good" | "Average" | "Poor",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.companyName || !form.contactPersonName || !form.contactPersonPhone) {
      setError("Company name, contact person, and phone are required")
      return
    }
    setSaving(true)
    setError("")
    try {
      const payload: any = {
        date: new Date().toISOString().split("T")[0],
        ...form,
        outgoingCallType: form.outgoingCallType,
      }
      if (callType) {
        payload.type = callType
      }
      if (apiEndpoint) {
        await axios.post(apiEndpoint, payload, { withCredentials: true })
      } else if (callType) {
        await axios.post("/api/branch-sales-phone-calls", payload, { withCredentials: true })
      } else {
        payload.callType = "outgoing"
        await axios.post("/api/frontdesk-calls", payload, { withCredentials: true })
      }
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onSuccess()
      }, 1500)
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save call")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-t-2 border-t-purple-500">
      <CardHeader className="bg-slate-50 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900">Call Details - {callTypeLabel}</h3>
      </CardHeader>
      <CardContent className="p-6">
        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-700 text-sm">
            <CheckCircle className="w-4 h-4" /> Call saved successfully!
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="Company name" />
            </div>
            <div className="space-y-2">
              <Label>Product</Label>
              <Input value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} placeholder="Product" />
            </div>
            <div className="space-y-2">
              <Label>Contact Person Name *</Label>
              <Input value={form.contactPersonName} onChange={(e) => setForm({ ...form, contactPersonName: e.target.value })} placeholder="Contact person name" />
            </div>
            <div className="space-y-2">
              <Label>Contact Person Phone *</Label>
              <Input value={form.contactPersonPhone} onChange={(e) => setForm({ ...form, contactPersonPhone: e.target.value })} placeholder="Phone number" />
            </div>
            <div className="space-y-2">
              <Label>Call Type</Label>
              <Select
                options={[{ value: "Sales", label: "Sales" }, { value: "Support", label: "Support" }]}
                value={form.outgoingCallType}
                onChange={(e) => setForm({ ...form, outgoingCallType: e.target.value as "Sales" | "Support" })}
              />
            </div>
            <div className="space-y-2">
              <Label>Lead Search</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isLeadSearch}
                  onChange={(e) => setForm({ ...form, isLeadSearch: e.target.checked })}
                  className="rounded border-slate-300"
                />
                <span className="text-sm text-slate-600">Is this a lead search?</span>
              </div>
            </div>
            {form.isLeadSearch && (
              <div className="space-y-2">
                <Label>Lead Found</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="leadFound"
                      value="Yes"
                      checked={form.leadFound === "Yes"}
                      onChange={() => setForm({ ...form, leadFound: "Yes" })}
                      className="accent-purple-600"
                    />
                    <span className="text-sm text-slate-700">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="leadFound"
                      value="No"
                      checked={form.leadFound === "No"}
                      onChange={() => setForm({ ...form, leadFound: "No" })}
                      className="accent-purple-600"
                    />
                    <span className="text-sm text-slate-700">No</span>
                  </label>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Cause for Call</Label>
            <Textarea value={form.causeForCall} onChange={(e) => setForm({ ...form, causeForCall: e.target.value })} placeholder="Reason for the call" />
          </div>
          <div className="space-y-2">
            <Label>Outcome from Call</Label>
            <Textarea value={form.outcomeFromCall} onChange={(e) => setForm({ ...form, outcomeFromCall: e.target.value })} placeholder="Call outcome" />
          </div>
          <div className="space-y-2">
            <Label>Feedback</Label>
            <Select
              options={[
                { value: "", label: "Select feedback" },
                { value: "Good", label: "Good" },
                { value: "Average", label: "Average" },
                { value: "Poor", label: "Poor" },
              ]}
              value={form.feedbackType}
              onChange={(e) => setForm({ ...form, feedbackType: e.target.value as "" | "Good" | "Average" | "Poor" })}
            />
          </div>
          <Button type="submit" disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Call Record"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

/* ========== SERVICE PHONE CALLS FORM ========== */

function ServicePhoneCallsForm({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<"choose" | "form">("choose")
  const [callType, setCallType] = useState<CallType>(null)
  const [submittedCalls, setSubmittedCalls] = useState<any[]>([])
  const [callsFilter, setCallsFilter] = useState<"all" | "follow-up" | "cold">("all")
  const [loadingCalls, setLoadingCalls] = useState(true)
  const [selectedCall, setSelectedCall] = useState<any>(null)

  const fetchCalls = async () => {
    setLoadingCalls(true)
    try {
      const params = new URLSearchParams()
      if (callsFilter !== "all") params.set("type", callsFilter)
      const res = await axios.get(`/api/branch-service-phone-calls?${params}`, { withCredentials: true })
      setSubmittedCalls(res.data.calls || [])
    } catch { } finally { setLoadingCalls(false) }
  }

  useEffect(() => { if (step === "choose") fetchCalls() }, [step, callsFilter])

  if (step === "choose") {
    return (
      <div>
        <button onClick={onBack} className="text-sm text-purple-600 hover:text-purple-700 mb-4 flex items-center gap-1">
          <ChevronRight className="w-4 h-4 rotate-180" /> Back to Service
        </button>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Today Phone Calls</h2>
        <p className="text-slate-500 mb-6">Choose call type to log:</p>
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <button
            onClick={() => { setCallType("follow-up"); setStep("form") }}
            className="text-left"
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-200">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                  <PhoneCall className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Follow Up Calls</h3>
                  <p className="text-sm text-slate-500">Log follow-up call details</p>
                </div>
              </CardContent>
            </Card>
          </button>
          <button
            onClick={() => { setCallType("cold"); setStep("form") }}
            className="text-left"
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-indigo-200">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
                  <PhoneCall className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Cold Calls</h3>
                  <p className="text-sm text-slate-500">Log cold call details</p>
                </div>
              </CardContent>
            </Card>
          </button>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">My Submitted Calls</h3>
            <div className="flex gap-1">
              {(["all", "follow-up", "cold"] as const).map((f) => (
                <button key={f} onClick={() => setCallsFilter(f)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                    callsFilter === f
                      ? "bg-purple-600 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {f === "all" ? "All" : f === "follow-up" ? "Follow Up" : "Cold"}
                </button>
              ))}
            </div>
          </div>
          {loadingCalls ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
          ) : submittedCalls.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No calls submitted yet</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Company</th>
                    <th className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                    <th className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Type</th>
                    <th className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Product</th>
                    <th className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {submittedCalls.map((call: any) => (
                    <tr key={call._id} onClick={() => setSelectedCall(call)} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                      <td className="px-3 py-2 text-xs text-slate-700">{call.date}</td>
                      <td className="px-3 py-2 text-xs font-semibold text-slate-900">{call.companyName}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">{call.contactPersonName}</td>
                      <td className="px-3 py-2 text-xs">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          call.type === "follow-up" ? "bg-blue-50 text-blue-700" : "bg-indigo-50 text-indigo-700"
                        }`}>
                          {call.type === "follow-up" ? "Follow Up" : "Cold"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">{call.product || "-"}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">{call.outcomeFromCall ? call.outcomeFromCall.slice(0, 40) + (call.outcomeFromCall.length > 40 ? "..." : "") : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Dialog open={!!selectedCall} onClose={() => setSelectedCall(null)} title="Call Details">
          {selectedCall && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Date</p>
                  <p className="text-slate-900">{selectedCall.date}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Type</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedCall.type === "follow-up" ? "bg-blue-50 text-blue-700" : "bg-indigo-50 text-indigo-700"
                  }`}>
                    {selectedCall.type === "follow-up" ? "Follow Up" : "Cold"}
                  </span>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Company</p>
                  <p className="text-slate-900">{selectedCall.companyName}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Contact Person</p>
                  <p className="text-slate-900">{selectedCall.contactPersonName}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Contact Phone</p>
                  <p className="text-slate-900">{selectedCall.contactPersonPhone || "-"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Product</p>
                  <p className="text-slate-900">{selectedCall.product || "-"}</p>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Cause for Call</p>
                  <p className="text-slate-900">{selectedCall.causeForCall || "-"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Outcome</p>
                  <p className="text-slate-900">{selectedCall.outcomeFromCall || "-"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Outgoing Call Type</p>
                  <p className="text-slate-900">{selectedCall.outgoingCallType || "-"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Feedback Type</p>
                  <p className="text-slate-900">{selectedCall.feedbackType || "-"}</p>
                </div>
                <div className="flex gap-6">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Lead Search</p>
                    <p className="text-slate-900">{selectedCall.isLeadSearch ? "Yes" : "No"}</p>
                  </div>
                  {selectedCall.isLeadSearch && (
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Lead Found</p>
                      <p className="text-slate-900">{selectedCall.leadFound || "No"}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Dialog>
      </div>
    )
  }

  return (
    <div>
      <button onClick={() => setStep("choose")} className="text-sm text-purple-600 hover:text-purple-700 mb-4 flex items-center gap-1">
        <ChevronRight className="w-4 h-4 rotate-180" /> Back
      </button>
      <OutgoingCallForm
        callType={callType}
        callTypeLabel={callType === "follow-up" ? "Follow Up" : "Cold"}
        apiEndpoint="/api/branch-service-phone-calls"
        onSuccess={() => setStep("choose")}
      />
    </div>
  )
}

/* ========== CONSUMABLE PHONE CALLS FORM ========== */

function ConsumablePhoneCallsForm({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<"choose" | "form">("choose")
  const [callType, setCallType] = useState<CallType>(null)
  const [submittedCalls, setSubmittedCalls] = useState<any[]>([])
  const [callsFilter, setCallsFilter] = useState<"all" | "follow-up" | "cold">("all")
  const [loadingCalls, setLoadingCalls] = useState(true)
  const [selectedCall, setSelectedCall] = useState<any>(null)

  const fetchCalls = async () => {
    setLoadingCalls(true)
    try {
      const params = new URLSearchParams()
      if (callsFilter !== "all") params.set("type", callsFilter)
      const res = await axios.get(`/api/branch-consumable-phone-calls?${params}`, { withCredentials: true })
      setSubmittedCalls(res.data.calls || [])
    } catch { } finally { setLoadingCalls(false) }
  }

  useEffect(() => { if (step === "choose") fetchCalls() }, [step, callsFilter])

  if (step === "choose") {
    return (
      <div>
        <button onClick={onBack} className="text-sm text-purple-600 hover:text-purple-700 mb-4 flex items-center gap-1">
          <ChevronRight className="w-4 h-4 rotate-180" /> Back to Consumable
        </button>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Today Phone Calls</h2>
        <p className="text-slate-500 mb-6">Choose call type to log:</p>
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <button
            onClick={() => { setCallType("follow-up"); setStep("form") }}
            className="text-left"
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-200">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                  <PhoneCall className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Follow Up Calls</h3>
                  <p className="text-sm text-slate-500">Log follow-up call details</p>
                </div>
              </CardContent>
            </Card>
          </button>
          <button
            onClick={() => { setCallType("cold"); setStep("form") }}
            className="text-left"
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-indigo-200">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
                  <PhoneCall className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Cold Calls</h3>
                  <p className="text-sm text-slate-500">Log cold call details</p>
                </div>
              </CardContent>
            </Card>
          </button>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">My Submitted Calls</h3>
            <div className="flex gap-1">
              {(["all", "follow-up", "cold"] as const).map((f) => (
                <button key={f} onClick={() => setCallsFilter(f)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                    callsFilter === f
                      ? "bg-purple-600 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {f === "all" ? "All" : f === "follow-up" ? "Follow Up" : "Cold"}
                </button>
              ))}
            </div>
          </div>
          {loadingCalls ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
          ) : submittedCalls.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No calls submitted yet</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Company</th>
                    <th className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                    <th className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Type</th>
                    <th className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Product</th>
                    <th className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {submittedCalls.map((call: any) => (
                    <tr key={call._id} onClick={() => setSelectedCall(call)} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                      <td className="px-3 py-2 text-xs text-slate-700">{call.date}</td>
                      <td className="px-3 py-2 text-xs font-semibold text-slate-900">{call.companyName}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">{call.contactPersonName}</td>
                      <td className="px-3 py-2 text-xs">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          call.type === "follow-up" ? "bg-blue-50 text-blue-700" : "bg-indigo-50 text-indigo-700"
                        }`}>
                          {call.type === "follow-up" ? "Follow Up" : "Cold"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">{call.product || "-"}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">{call.outcomeFromCall ? call.outcomeFromCall.slice(0, 40) + (call.outcomeFromCall.length > 40 ? "..." : "") : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Dialog open={!!selectedCall} onClose={() => setSelectedCall(null)} title="Call Details">
          {selectedCall && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Date</p>
                  <p className="text-slate-900">{selectedCall.date}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Type</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedCall.type === "follow-up" ? "bg-blue-50 text-blue-700" : "bg-indigo-50 text-indigo-700"
                  }`}>
                    {selectedCall.type === "follow-up" ? "Follow Up" : "Cold"}
                  </span>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Company</p>
                  <p className="text-slate-900">{selectedCall.companyName}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Contact Person</p>
                  <p className="text-slate-900">{selectedCall.contactPersonName}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Contact Phone</p>
                  <p className="text-slate-900">{selectedCall.contactPersonPhone || "-"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Product</p>
                  <p className="text-slate-900">{selectedCall.product || "-"}</p>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Cause for Call</p>
                  <p className="text-slate-900">{selectedCall.causeForCall || "-"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Outcome</p>
                  <p className="text-slate-900">{selectedCall.outcomeFromCall || "-"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Outgoing Call Type</p>
                  <p className="text-slate-900">{selectedCall.outgoingCallType || "-"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Feedback Type</p>
                  <p className="text-slate-900">{selectedCall.feedbackType || "-"}</p>
                </div>
                <div className="flex gap-6">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Lead Search</p>
                    <p className="text-slate-900">{selectedCall.isLeadSearch ? "Yes" : "No"}</p>
                  </div>
                  {selectedCall.isLeadSearch && (
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Lead Found</p>
                      <p className="text-slate-900">{selectedCall.leadFound || "No"}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Dialog>
      </div>
    )
  }

  return (
    <div>
      <button onClick={() => setStep("choose")} className="text-sm text-purple-600 hover:text-purple-700 mb-4 flex items-center gap-1">
        <ChevronRight className="w-4 h-4 rotate-180" /> Back
      </button>
      <OutgoingCallForm
        callType={callType}
        callTypeLabel={callType === "follow-up" ? "Follow Up" : "Cold"}
        apiEndpoint="/api/branch-consumable-phone-calls"
        onSuccess={() => setStep("choose")}
      />
    </div>
  )
}

/* ========== ASSIGNED QUOTATIONS ========== */

function AssignedQuotations({ onBack }: { onBack: () => void }) {
  return (
    <div>
      <button onClick={onBack} className="text-sm text-purple-600 hover:text-purple-700 mb-4 flex items-center gap-1">
        <ChevronRight className="w-4 h-4 rotate-180" /> Back to Service
      </button>
      <ManageQuotationJunior category="service" />
      </div>
    )
}

function AssignedVisits({ onBack }: { onBack: () => void }) {
  const { user } = useAuthStore()
  const [refreshKey, setRefreshKey] = useState(0)

  if (!user) return null

  return (
    <div>
      <button onClick={onBack} className="text-sm text-purple-600 hover:text-purple-700 mb-4 flex items-center gap-1">
        <ChevronRight className="w-4 h-4 rotate-180" /> Back to Service
      </button>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900">Assigned Visit Calls</h2>
        <button onClick={() => setRefreshKey((k) => k + 1)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      <ServiceTaskList refreshKey={refreshKey} userId={user._id} />
    </div>
  )
}

/* ========== BRANCH SALES ACTIVITY FORM ========== */

function BranchSalesActivityForm({ onBack }: { onBack: () => void }) {
  const { user } = useAuthStore()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const today = new Date().toISOString().split("T")[0]
  const [form, setForm] = useState({
    activityDate: today,
    newAppointmentsFixed: 0,
    customerVisitsCompleted: 0,
    salesEmailsSent: 0,
    primaryProductFocus: "",
    secondaryProductFocus: [] as string[],
    visits: [] as {
      customerName: string
      contactPersonName: string
      contactPersonPhone: string
      primaryPurpose: string
      productsDiscussed: string[]
      outcome: string
      nextActionRequired: string
      nextActionDate: string
    }[],
    quotationsIssuedToday: 0,
    ordersClosedToday: 0,
    orderValueMfp: 0, orderValueMps: 0, orderValueBarcodePrinters: 0,
    orderValuePaperShredder: 0, orderValueDuplicator: 0,
    orderValueBarcodeScanner: 0, orderValueSolutions: 0, orderValueTender: 0,
    billsClosedToday: 0,
    billValueMfp: 0, billValueMps: 0, billValueBarcodePrinters: 0,
    billValuePaperShredder: 0, billValueDuplicator: 0,
    billValueBarcodeScanner: 0, billValueSolutions: 0, billValueTender: 0,
    tomorrowPlan: "",
  })

  const totalOrderValue = form.orderValueMfp + form.orderValueMps + form.orderValueBarcodePrinters +
    form.orderValuePaperShredder + form.orderValueDuplicator + form.orderValueBarcodeScanner +
    form.orderValueSolutions + form.orderValueTender

  const totalBillValue = form.billValueMfp + form.billValueMps + form.billValueBarcodePrinters +
    form.billValuePaperShredder + form.billValueDuplicator + form.billValueBarcodeScanner +
    form.billValueSolutions + form.billValueTender

  const PRODUCTS = ["MFP", "MPS", "Barcode Printers", "Paper Shredder", "Duplicator", "Barcode Scanner / POS", "Solutions", "Tender / Project"]

  const addVisit = () => {
    setForm({
      ...form,
      visits: [...form.visits, {
        customerName: "", contactPersonName: "", contactPersonPhone: "",
        primaryPurpose: "N/A", productsDiscussed: [], outcome: "N/A",
        nextActionRequired: "", nextActionDate: "",
      }],
    })
  }

  const updateVisit = (index: number, field: string, value: unknown) => {
    const visits = [...form.visits]
    visits[index] = { ...visits[index], [field]: value }
    setForm({ ...form, visits })
  }

  const removeVisit = (index: number) => {
    setForm({ ...form, visits: form.visits.filter((_, i) => i !== index) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      const sanitizedVisits = form.visits.map(v => ({
        ...v,
        nextActionDate: v.nextActionDate || null,
      }))
      console.log("DEBUG: About to POST to /api/branch-sales-activity", { ...form, visits: sanitizedVisits })
      const res = await axios.post("/api/branch-sales-activity", { ...form, visits: sanitizedVisits }, { withCredentials: true })
      console.log("DEBUG: POST response", res.status, res.data)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onBack()
      }, 1500)
    } catch (err: any) {
      console.error("DEBUG: POST error:", err)
      console.error("DEBUG: err.response:", err?.response)
      console.error("DEBUG: err.response?.data:", err?.response?.data)
      console.error("DEBUG: err.message:", err?.message)
      setError(err.response?.data?.error || err?.message || "Failed to save activity")
    } finally {
      setSaving(false)
    }
  }

  const OrderValueFields = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {["Mfp", "Mps", "BarcodePrinters", "PaperShredder", "Duplicator", "BarcodeScanner", "Solutions", "Tender"].map((p) => (
        <div key={p} className="space-y-1">
          <Label className="text-xs">{PRODUCTS[["Mfp", "Mps", "BarcodePrinters", "PaperShredder", "Duplicator", "BarcodeScanner", "Solutions", "Tender"].indexOf(p)]}</Label>
          <Input
            type="number"
            value={(form as any)[`orderValue${p}`]}
            onChange={(e) => setForm({ ...form, [`orderValue${p}`]: Number(e.target.value) })}
            className="text-sm"
          />
        </div>
      ))}
    </div>
  )

  const BillValueFields = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {["Mfp", "Mps", "BarcodePrinters", "PaperShredder", "Duplicator", "BarcodeScanner", "Solutions", "Tender"].map((p) => (
        <div key={p} className="space-y-1">
          <Label className="text-xs">{PRODUCTS[["Mfp", "Mps", "BarcodePrinters", "PaperShredder", "Duplicator", "BarcodeScanner", "Solutions", "Tender"].indexOf(p)]}</Label>
          <Input
            type="number"
            value={(form as any)[`billValue${p}`]}
            onChange={(e) => setForm({ ...form, [`billValue${p}`]: Number(e.target.value) })}
            className="text-sm"
          />
        </div>
      ))}
    </div>
  )

  return (
    <div>
      <button onClick={onBack} className="text-sm text-purple-600 hover:text-purple-700 mb-4 flex items-center gap-1">
        <ChevronRight className="w-4 h-4 rotate-180" /> Back to Sales
      </button>

      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-700 text-sm">
          <CheckCircle className="w-4 h-4" /> Activity submitted successfully!
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Information Details */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <h3 className="font-semibold text-slate-800">Information Details</h3>
          </div>
          <Card>
            <CardContent className="p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={form.activityDate} onChange={(e) => setForm({ ...form, activityDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={user?.name || ""} disabled className="bg-slate-50" />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Key Performance Indicators */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <h3 className="font-semibold text-slate-800">Key Performance Indicators</h3>
          </div>
          <Card className="border-t-2 border-t-emerald-500">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Appointments</Label>
                  <Input type="number" value={form.newAppointmentsFixed} onChange={(e) => setForm({ ...form, newAppointmentsFixed: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Visits</Label>
                  <Input type="number" value={form.customerVisitsCompleted} onChange={(e) => setForm({ ...form, customerVisitsCompleted: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Sales Emails Sent</Label>
                  <Input type="number" value={form.salesEmailsSent} onChange={(e) => setForm({ ...form, salesEmailsSent: Number(e.target.value) })} />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Strategic Focus */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-amber-500 rounded-full" />
            <h3 className="font-semibold text-slate-800">Strategic Focus</h3>
          </div>
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label>Primary Product Focus</Label>
                <div className="flex flex-wrap gap-2">
                  {PRODUCTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm({ ...form, primaryProductFocus: p })}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm border transition-colors",
                        form.primaryProductFocus === p
                          ? "bg-purple-100 border-purple-300 text-purple-700"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Secondary Product Focus</Label>
                <div className="flex flex-wrap gap-2">
                  {PRODUCTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        const current = form.secondaryProductFocus
                        const updated = current.includes(p)
                          ? current.filter((x) => x !== p)
                          : [...current, p]
                        setForm({ ...form, secondaryProductFocus: updated })
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm border transition-colors",
                        form.secondaryProductFocus.includes(p)
                          ? "bg-indigo-100 border-indigo-300 text-indigo-700"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Customer Interaction Records */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <h3 className="font-semibold text-slate-800">Customer Interaction Records</h3>
          </div>
          <Card className="border-t-2 border-t-blue-500">
            <CardContent className="p-4 space-y-4">
              {form.visits.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
                  <p className="text-slate-400 mb-2">No visits recorded yet</p>
                  <Button type="button" onClick={addVisit} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-1" /> Add Visit
                  </Button>
                </div>
              )}
              {form.visits.map((visit, i) => (
                <Card key={i} className="border-slate-200">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm text-slate-700">Visit #{i + 1}</h4>
                      <button type="button" onClick={() => removeVisit(i)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Customer Name</Label>
                        <Input value={visit.customerName} onChange={(e) => updateVisit(i, "customerName", e.target.value)} className="text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Contact Person Name</Label>
                        <Input value={visit.contactPersonName} onChange={(e) => updateVisit(i, "contactPersonName", e.target.value)} className="text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Contact Person Phone</Label>
                        <Input value={visit.contactPersonPhone} onChange={(e) => updateVisit(i, "contactPersonPhone", e.target.value)} className="text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Purpose</Label>
                        <Select
                          options={[
                            { value: "Opportunity Advancement", label: "Opportunity Advancement" },
                            { value: "Opportunity Creation", label: "Opportunity Creation" },
                            { value: "Relationship & Account Management", label: "Relationship & Account Management" },
                            { value: "Commercial / Control", label: "Commercial / Control" },
                            { value: "N/A", label: "N/A" },
                          ]}
                          value={visit.primaryPurpose}
                          onChange={(e) => updateVisit(i, "primaryPurpose", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Outcome</Label>
                        <Select
                          options={[
                            { value: "Advanced / Positive", label: "Advanced / Positive" },
                            { value: "Neutral – Follow up required", label: "Neutral – Follow up required" },
                            { value: "Delayed", label: "Delayed" },
                            { value: "Lost / Negative", label: "Lost / Negative" },
                            { value: "N/A", label: "N/A" },
                          ]}
                          value={visit.outcome}
                          onChange={(e) => updateVisit(i, "outcome", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Next Action Required</Label>
                        <Input value={visit.nextActionRequired} onChange={(e) => updateVisit(i, "nextActionRequired", e.target.value)} className="text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Next Action Date</Label>
                        <Input type="date" value={visit.nextActionDate} onChange={(e) => updateVisit(i, "nextActionDate", e.target.value)} className="text-sm" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {form.visits.length > 0 && (
                <Button type="button" onClick={addVisit} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Add Another Visit
                </Button>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Commercial Impact */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full" />
            <h3 className="font-semibold text-slate-800">Commercial Impact</h3>
          </div>
          <Card className="border-t-2 border-t-purple-500">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>Quotations Issued</Label>
                  <Input type="number" value={form.quotationsIssuedToday} onChange={(e) => setForm({ ...form, quotationsIssuedToday: Number(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label>Orders Closed</Label>
                  <Input type="number" value={form.ordersClosedToday} onChange={(e) => setForm({ ...form, ordersClosedToday: Number(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label>Bills Closed</Label>
                  <Input type="number" value={form.billsClosedToday} onChange={(e) => setForm({ ...form, billsClosedToday: Number(e.target.value) })} />
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold">Order Value Targets</Label>
                <p className="text-xs text-slate-400 mb-2">Total: {totalOrderValue.toLocaleString()} BDT</p>
                <OrderValueFields />
              </div>

              <div>
                <Label className="text-sm font-semibold">Bill Value Targets</Label>
                <p className="text-xs text-slate-400 mb-2">Total: {totalBillValue.toLocaleString()} BDT</p>
                <BillValueFields />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Tomorrow's Strategy */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full" />
            <h3 className="font-semibold text-slate-800">Tomorrow&apos;s Strategy</h3>
          </div>
          <Card className="border-t-2 border-t-orange-500">
            <CardContent className="p-4">
              <Textarea
                value={form.tomorrowPlan}
                onChange={(e) => setForm({ ...form, tomorrowPlan: e.target.value })}
                placeholder="Plan for tomorrow..."
                rows={3}
              />
            </CardContent>
          </Card>
        </section>

        <Button type="submit" disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700">
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Submit Activity"}
        </Button>
      </form>
    </div>
  )
}

/* ========== CONSUMABLE ACTIVITY FORM ========== */

function ConsumableActivityForm({ onBack }: { onBack: () => void }) {
  const { user } = useAuthStore()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const today = new Date().toISOString().split("T")[0]
  const [form, setForm] = useState({
    activityDate: today,
    calls: 0,
    visits: 0,
    quotation: 0,
    quotationQty: 0,
    orderQty: 0,
    orderValueBlackAndWhite: 0, orderValueColor: 0,
    orderValueDuplicatorInk: 0, orderValueDuplicatorMaster: 0, orderValueMps: 0,
    billQty: 0,
    billValueBlackAndWhite: 0, billValueColor: 0,
    billValueDuplicatorInk: 0, billValueDuplicatorMaster: 0, billValueMps: 0,
  })

  const totalOrderValue = form.orderValueBlackAndWhite + form.orderValueColor +
    form.orderValueDuplicatorInk + form.orderValueDuplicatorMaster + form.orderValueMps

  const totalBillValue = form.billValueBlackAndWhite + form.billValueColor +
    form.billValueDuplicatorInk + form.billValueDuplicatorMaster + form.billValueMps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setError("")
    try {
      await axios.post("/api/branch-consumable-activity", {
        ...form,
        userId: user._id,
      }, { withCredentials: true })
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onBack()
      }, 1500)
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save activity")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <button onClick={onBack} className="text-sm text-purple-600 hover:text-purple-700 mb-4 flex items-center gap-1">
        <ChevronRight className="w-4 h-4 rotate-180" /> Back to Consumable
      </button>

      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-700 text-sm">
          <CheckCircle className="w-4 h-4" /> Activity submitted successfully!
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full" />
            <h3 className="font-semibold text-slate-800">Information Details</h3>
          </div>
          <Card>
            <CardContent className="p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={form.activityDate} onChange={(e) => setForm({ ...form, activityDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={user?.name || ""} disabled className="bg-slate-50" />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <h3 className="font-semibold text-slate-800">Activity Details</h3>
          </div>
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[["calls", "Calls"], ["visits", "Visits"], ["quotation", "Quotation"], ["quotationQty", "Quotation Qty"], ["orderQty", "Order Qty"], ["billQty", "Bill Qty"]].map(([field, label]) => (
                  <div key={field} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <Input
                      type="number"
                      value={(form as any)[field]}
                      onChange={(e) => setForm({ ...form, [field]: Number(e.target.value) })}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full" />
            <h3 className="font-semibold text-slate-800">Commercial Impact</h3>
          </div>
          <Card className="border-t-2 border-t-purple-500">
            <CardContent className="p-4 space-y-4">
              <div>
                <Label className="text-sm font-semibold">Total Orders Value: {totalOrderValue.toLocaleString()} BDT</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2">
                  {[["BlackAndWhite", "Black & White"], ["Color", "Color"], ["DuplicatorInk", "Duplicator Ink"], ["DuplicatorMaster", "Duplicator Master"], ["Mps", "MPS"]].map(([f, l]) => (
                    <div key={f} className="space-y-1">
                      <Label className="text-xs">{l}</Label>
                      <Input type="number" value={(form as any)[`orderValue${f}`]} onChange={(e) => setForm({ ...form, [`orderValue${f}`]: Number(e.target.value) })} />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold">Total Bills Value: {totalBillValue.toLocaleString()} BDT</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2">
                  {[["BlackAndWhite", "Black & White"], ["Color", "Color"], ["DuplicatorInk", "Duplicator Ink"], ["DuplicatorMaster", "Duplicator Master"], ["Mps", "MPS"]].map(([f, l]) => (
                    <div key={f} className="space-y-1">
                      <Label className="text-xs">{l}</Label>
                      <Input type="number" value={(form as any)[`billValue${f}`]} onChange={(e) => setForm({ ...form, [`billValue${f}`]: Number(e.target.value) })} />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <Button type="submit" disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700">
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Submit Activity"}
        </Button>
      </form>
    </div>
  )
}
