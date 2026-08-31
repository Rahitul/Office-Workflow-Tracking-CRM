"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Monitor, History, ClipboardList, Search, Share2 } from "lucide-react"
import { Dialog } from "@/components/ui/dialog"
import axios from "axios"
import { useAuthStore } from "@/store/authStore"

interface Company {
  _id: string
  name: string
  group: string
  location: string
  contactPerson: string
  contactNumber: string
  locations: CompanyLocation[]
}

interface CompanyLocation {
  location: string
  address: string
  district: string
  area: string
  contactPerson: string
  contactNumber: string
  contacts: Array<{ name: string; phone: string; email: string; designation: string }>
}

interface Brand {
  _id: string
  name: string
}

interface DropdownOption {
  _id: string
  label: string
  parent: string
}

interface Machine {
  _id: string
  machineId: string
  customerName: string
  customerGroup: string
  location: string
  contactPerson: string
  contactNumber: string
  email: string
  address: string
  department: string
  brandName: string
  modelName: string
  serialNumber: string
  productCategory: string
  productType: string
  option: string
  sla: string
  billNumber: string
  billDate: string
  warrantyExpired: string
  notes: string
  createdAt: string
}

function dayDiff(from: Date, to: Date) {
  const a = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())
  const b = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate())
  return Math.round((b - a) / 86400000)
}

function formatPeriod(days: number) {
  const months = Math.floor(days / 30)
  const remDays = days % 30
  const parts: string[] = []
  if (months > 0) parts.push(`${months} month${months > 1 ? "s" : ""}`)
  if (remDays > 0) parts.push(`${remDays} day${remDays > 1 ? "s" : ""}`)
  return `${days} days (${parts.length > 0 ? parts.join(" ") : "0"})`
}

export default function MachineListPage() {
  const [activeTab] = useState<"info">("info")
  const [companies, setCompanies] = useState<Company[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [nextId, setNextId] = useState(1)
  const [productCategories, setProductCategories] = useState<DropdownOption[]>([])
  const [productTypes, setProductTypes] = useState<DropdownOption[]>([])
  const [slaOptions, setSlaOptions] = useState<DropdownOption[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [filterMachineId, setFilterMachineId] = useState("")
  const filterMachineIdRef = useRef<HTMLInputElement>(null)
  const [filterCustomer, setFilterCustomer] = useState("")
  const [filterBrand, setFilterBrand] = useState("")
  const [filterModel, setFilterModel] = useState("")
  const [filterSerial, setFilterSerial] = useState("")
  const [filterProductCategory, setFilterProductCategory] = useState("")
  const [filterDepartment, setFilterDepartment] = useState("")
  const [filterLocation, setFilterLocation] = useState("")
  const [machineListSearch, setMachineListSearch] = useState("")
  const [warrantyChecking, setWarrantyChecking] = useState(false)

  const [users, setUsers] = useState<{ _id: string; name: string; email: string; role: string }[]>([])
  const [shDialogOpen, setShDialogOpen] = useState(false)
  const [shRecords, setShRecords] = useState<any[]>([])
  const [shSubmitting, setShSubmitting] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [linkRegenerating, setLinkRegenerating] = useState(false)
  const [engineerSearch, setEngineerSearch] = useState("")
  const [engineerDropdownOpen, setEngineerDropdownOpen] = useState(false)
  const engineerDropdownRef = useRef<HTMLDivElement>(null)
  const { user } = useAuthStore()
  const [shForm, setShForm] = useState({
    callDate: "",
    problem: "",
    solution: "",
    ewTaka: "",
    bwMeterReading: "",
    colorMeterReading: "",
    printerHeadLife: "",
    scan: "",
    attendTime: "",
    endTime: "",
    userComments: "",
    engineerId: "",
  })

  const [formData, setFormData] = useState({
    customerName: "",
    customerGroup: "",
    location: "",
    contactPerson: "",
    contactNumber: "",
    email: "",
    address: "",
    department: "",
    brandName: "",
    modelName: "",
    serialNumber: "",
    productCategory: "",
    productType: "",
    option: "",
    sla: "",
    billNumber: "",
    billDate: "",
    warrantyExpired: "",
    notes: "",
  })

  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false)
  const [companySearch, setCompanySearch] = useState("")
  const companyDropdownRef = useRef<HTMLDivElement>(null)

  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false)
  const [locationSearch, setLocationSearch] = useState("")
  const locationDropdownRef = useRef<HTMLDivElement>(null)

  const [contactDropdownOpen, setContactDropdownOpen] = useState(false)
  const [contactSearch, setContactSearch] = useState("")
  const contactDropdownRef = useRef<HTMLDivElement>(null)

  const [departmentOptions, setDepartmentOptions] = useState<DropdownOption[]>([])
  const [departmentSuggestions, setDepartmentSuggestions] = useState<string[]>([])
  const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false)
  const [departmentSearch, setDepartmentSearch] = useState("")
  const departmentDropdownRef = useRef<HTMLDivElement>(null)

  const [modelOptions, setModelOptions] = useState<DropdownOption[]>([])
  const [modelSuggestions, setModelSuggestions] = useState<string[]>([])
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)
  const [modelSearch, setModelSearch] = useState("")
  const modelDropdownRef = useRef<HTMLDivElement>(null)

  const [optionOptions, setOptionOptions] = useState<DropdownOption[]>([])
  const [optionSuggestions, setOptionSuggestions] = useState<string[]>([])
  const [optionDropdownOpen, setOptionDropdownOpen] = useState(false)
  const [optionSearch, setOptionSearch] = useState("")
  const optionDropdownRef = useRef<HTMLDivElement>(null)

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(companySearch.toLowerCase())
  )

  const selectedCompany = companies.find(c => c.name === formData.customerName)

  const filteredLocations = selectedCompany
    ? selectedCompany.locations.filter(l =>
        (l.location || l.area || "").toLowerCase().includes(locationSearch.toLowerCase())
      )
    : []

  const selectedLocation = selectedCompany
    ? selectedCompany.locations.find(l => (l.location || "") === formData.location)
    : undefined

  const filteredContacts = selectedLocation
    ? (selectedLocation.contacts || []).filter(c =>
        c.name.toLowerCase().includes(contactSearch.toLowerCase())
      )
    : []

  const filteredProductTypes = productTypes.filter(t => t.parent === formData.productCategory)

  const filteredMachines = machines.filter(m => {
    if (filterMachineId && !m.machineId.toLowerCase().includes(filterMachineId.toLowerCase())) return false
    if (filterCustomer && !m.customerName.toLowerCase().includes(filterCustomer.toLowerCase())) return false
    if (filterBrand && !m.brandName.toLowerCase().includes(filterBrand.toLowerCase())) return false
    if (filterModel && !m.modelName.toLowerCase().includes(filterModel.toLowerCase())) return false
    if (filterSerial && !m.serialNumber.toLowerCase().includes(filterSerial.toLowerCase())) return false
    if (filterProductCategory && !m.productCategory.toLowerCase().includes(filterProductCategory.toLowerCase())) return false
    if (filterDepartment && !m.department.toLowerCase().includes(filterDepartment.toLowerCase())) return false
    if (filterLocation && !m.location.toLowerCase().includes(filterLocation.toLowerCase())) return false
    return true
  })

  const displayedMachines = filteredMachines.filter(m => {
    const q = machineListSearch.toLowerCase()
    return !q || m.customerName.toLowerCase().includes(q) || m.machineId.toLowerCase().includes(q) || m.brandName.toLowerCase().includes(q) || m.modelName.toLowerCase().includes(q) || m.serialNumber.toLowerCase().includes(q) || (m.location || "").toLowerCase().includes(q) || (m.department || "").toLowerCase().includes(q)
  })

  const filterBrandOptions = Array.from(new Set(machines.map(m => m.brandName).filter(Boolean))).sort()
  const filterModelOptions = Array.from(new Set(machines.map(m => m.modelName).filter(Boolean))).sort()
  const filterProductCategoryOptions = Array.from(new Set(machines.map(m => m.productCategory).filter(Boolean))).sort()
  const filterDepartmentOptions = Array.from(new Set(machines.map(m => m.department).filter(Boolean))).sort()
  const filterLocationOptions = Array.from(new Set(machines.map(m => m.location).filter(Boolean))).sort()

  const hasActiveFilter = Boolean(filterMachineId || filterCustomer || filterBrand || filterModel || filterSerial || filterProductCategory || filterDepartment || filterLocation)
  const selectedMachine = hasActiveFilter ? filteredMachines[0] : machines[0]
  const billDateObj = selectedMachine?.billDate ? new Date(selectedMachine.billDate) : null
  const warrantyExpiredObj = selectedMachine?.warrantyExpired ? new Date(selectedMachine.warrantyExpired) : null
  const totalWarrantyDays = billDateObj && warrantyExpiredObj ? dayDiff(billDateObj, warrantyExpiredObj) : null
  const remainingWarrantyDays = warrantyExpiredObj ? dayDiff(new Date(), warrantyExpiredObj) : null
  const isWarrantyActive = remainingWarrantyDays !== null && remainingWarrantyDays >= 0

  const selectedServiceEngineer = users.find((u) => u._id === shForm.engineerId)
  const filteredServiceEngineers = users.filter((u) =>
    u.name.toLowerCase().includes(engineerSearch.toLowerCase())
  )

  useEffect(() => {
    fetchMachines()
  }, [])

  useEffect(() => {
    if (activeTab === "info") {
      filterMachineIdRef.current?.focus()
      filterMachineIdRef.current?.select()
    }
  }, [activeTab])

  useEffect(() => {
    fetch("/api/users", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.users) {
          const filtered = data.users.filter((u: any) => u.role === "service" || u.role === "service_juniors" || u.role === "esbd_juniors")
          setUsers(filtered)
          if (user?._id) {
            const match = filtered.find((u: any) => u._id === user._id)
            if (match) {
              setShForm((p) => ({ ...p, engineerId: match._id }))
              setEngineerSearch(match.name)
            }
          }
        }
      })
      .catch(() => {})
  }, [user?._id])

  useEffect(() => {
    if (!selectedMachine?._id) return
    fetch(`/api/machines/${selectedMachine._id}/service-history`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setShRecords(data.records || []))
      .catch(() => setShRecords([]))
  }, [selectedMachine?._id])

  const handleCopyLink = async (regenerate = false) => {
    if (!selectedMachine) return
    setLinkRegenerating(true)
    try {
      const url = regenerate ? `/api/machines/${selectedMachine._id}/share-link?action=regenerate` : `/api/machines/${selectedMachine._id}/share-link`
      const r = await fetch(url, { method: "POST", credentials: "include" })
      const data = await r.json()
      if (!data.url) throw new Error("Failed to generate link")
      await navigator.clipboard.writeText(data.url)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (error) {
      console.error("Failed to generate share link:", error)
      alert("Failed to generate share link")
    } finally {
      setLinkRegenerating(false)
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        setCompanyDropdownOpen(false)
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setLocationDropdownOpen(false)
      }
      if (contactDropdownRef.current && !contactDropdownRef.current.contains(event.target as Node)) {
        setContactDropdownOpen(false)
      }
      if (departmentDropdownRef.current && !departmentDropdownRef.current.contains(event.target as Node)) {
        setDepartmentDropdownOpen(false)
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setModelDropdownOpen(false)
      }
      if (optionDropdownRef.current && !optionDropdownRef.current.contains(event.target as Node)) {
        setOptionDropdownOpen(false)
      }
      if (engineerDropdownRef.current && !engineerDropdownRef.current.contains(event.target as Node)) {
        setEngineerDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchMachines = async () => {
    try {
      const response = await axios.get("/api/machines", { withCredentials: true })
      setMachines(response.data.machines || [])
      if (response.data.nextId) setNextId(response.data.nextId)
    } catch (error) {
      console.error("Failed to fetch machines:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDropdownSuggestions = (kind: string, parent: string, setter: (vals: string[]) => void) => {
    const opts =
      kind === "model_name"
        ? modelOptions
        : kind === "department"
          ? departmentOptions
          : kind === "option"
            ? optionOptions
            : []
    const filtered = parent
      ? opts.filter((o) => o.parent === parent)
      : opts
    setter(filtered.map((o) => o.label).filter((v) => v))
  }

  const handleCompanySelect = (name: string) => {
    const company = companies.find(c => c.name === name)
    setFormData(prev => ({
      ...prev,
      customerName: name,
      customerGroup: company?.group || "",
      location: "",
      address: "",
      contactPerson: "",
      contactNumber: "",
      email: "",
    }))
    setCompanyDropdownOpen(false)
    setCompanySearch("")
  }

  const handleLocationSelect = (loc: CompanyLocation) => {
    const primaryContact = loc.contacts && loc.contacts.length > 0 ? loc.contacts[0] : null
    setFormData(prev => ({
      ...prev,
      location: loc.location,
      address: loc.address || "",
      contactPerson: primaryContact?.name || loc.contactPerson || "",
      contactNumber: primaryContact?.phone || loc.contactNumber || "",
      email: primaryContact?.email || "",
    }))
    setLocationDropdownOpen(false)
    setLocationSearch("")
  }

  const handleContactSelect = (contact: { name: string; phone: string; email: string }) => {
    setFormData(prev => ({
      ...prev,
      contactPerson: contact.name,
      contactNumber: contact.phone,
      email: contact.email,
    }))
    setContactDropdownOpen(false)
    setContactSearch("")
  }

  const handleAutocompleteSelect = (
    field: "department" | "modelName" | "option",
    value: string,
    setDropdown: (v: boolean) => void,
    setSearch: (v: string) => void
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setDropdown(false)
    setSearch("")
  }

  const handleInputChange = (
    field: string,
    value: string
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleProductCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, productCategory: value, productType: "", modelName: "" }))
  }

  const handleProductTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, productType: value, modelName: "" }))
    setModelSuggestions([])
  }

  const resetForm = () => {
    setFormData({
      customerName: "",
      customerGroup: "",
      location: "",
      contactPerson: "",
      contactNumber: "",
      email: "",
      address: "",
      department: "",
      brandName: "",
      modelName: "",
      serialNumber: "",
      productCategory: "",
      productType: "",
      option: "",
      sla: "",
      billNumber: "",
      billDate: "",
      warrantyExpired: "",
      notes: "",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Machine List</h1>
        <p className="text-slate-500">Manage service machines</p>
      </div>

      <Card>
          <CardHeader>
            <CardTitle className="text-lg">Saved Machines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">ID</label>
                <Input
                  ref={filterMachineIdRef}
                  value={filterMachineId}
                  onChange={(e) => setFilterMachineId(e.target.value.replace(/\D/g, ""))}
                  placeholder="Filter ID..."
                  inputMode="numeric"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Customer</label>
                <Input
                  value={filterCustomer}
                  onChange={(e) => setFilterCustomer(e.target.value)}
                  placeholder="Filter customer..."
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Serial No</label>
                <Input
                  value={filterSerial}
                  onChange={(e) => setFilterSerial(e.target.value)}
                  placeholder="Filter serial..."
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : !selectedMachine ? (
              <div className="text-center py-12 text-slate-500">
                <Monitor className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No machines found</p>
              </div>
            ) : (
              <>
              <div className="bg-[#FDF0E6] rounded-xl border border-[#E8D5B5] p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <h2 className="text-lg font-bold text-slate-900">{selectedMachine.customerName}</h2>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleCopyLink()}
                      disabled={linkRegenerating}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      {linkCopied ? "Link Copied" : "Copy Customer Link"}
                    </Button>
                    <Button variant="outline" onClick={() => handleCopyLink(true)} disabled={linkRegenerating} className="text-xs">
                      {linkRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Regenerate
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                  {/* Row 1 */}
                  <div className="md:col-span-3">
                    <label className="block text-[#1B2A4A] font-medium text-xs mb-0.5">Customer ID</label>
                    <div className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 min-h-[32px]">{selectedMachine.machineId || "—"}</div>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[#1B2A4A] font-medium text-xs mb-0.5">Group Name</label>
                    <div className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 min-h-[32px]">{selectedMachine.customerGroup || "—"}</div>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[#1B2A4A] font-medium text-xs mb-0.5">Department</label>
                    <div className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 min-h-[32px]">{selectedMachine.department || "—"}</div>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[#1B2A4A] font-medium text-xs mb-0.5">Product Category</label>
                    <div className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 min-h-[32px]">{selectedMachine.productCategory || "—"}</div>
                  </div>

                  {/* Row 2 */}
                  <div className="md:col-span-4">
                    <label className="block text-[#1B2A4A] font-medium text-xs mb-0.5">Customer Name</label>
                    <div className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 min-h-[32px]">{selectedMachine.customerName}</div>
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-[#1B2A4A] font-medium text-xs mb-0.5">Bill No</label>
                    <div className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 min-h-[32px]">{selectedMachine.billNumber || "—"}</div>
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-[#1B2A4A] font-medium text-xs mb-0.5">Bill Date</label>
                    <div className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 min-h-[32px]">{selectedMachine.billDate ? new Date(selectedMachine.billDate).toLocaleDateString() : "—"}</div>
                  </div>

                  {/* Row 3 */}
                  <div className="md:col-span-6">
                    <label className="block text-[#1B2A4A] font-medium text-xs mb-0.5">Location</label>
                    <div className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 min-h-[32px]">{selectedMachine.location || "—"}</div>
                  </div>
                  <div className="md:col-span-6">
                    <label className="block text-[#1B2A4A] font-medium text-xs mb-0.5">Address</label>
                    <div className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 min-h-[32px]">{selectedMachine.address || "—"}</div>
                  </div>

                  {/* Row 4 */}
                  <div className="md:col-span-3">
                    <label className="block text-[#1B2A4A] font-medium text-xs mb-0.5">Brand</label>
                    <div className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 min-h-[32px]">{selectedMachine.brandName || "—"}</div>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[#1B2A4A] font-medium text-xs mb-0.5">Model</label>
                    <div className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 min-h-[32px]">{selectedMachine.modelName || "—"}</div>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[#1B2A4A] font-medium text-xs mb-0.5">Serial No</label>
                    <div className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 min-h-[32px]">{selectedMachine.serialNumber || "—"}</div>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[#1B2A4A] font-medium text-xs mb-0.5">SLA</label>
                    <div className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 min-h-[32px]">{selectedMachine.sla || "—"}</div>
                  </div>

                  {/* Row 5 */}
                  <div className="md:col-span-3">
                    <label className="block text-[#1B2A4A] font-medium text-xs mb-0.5">Contact Person</label>
                    <div className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 min-h-[32px]">{selectedMachine.contactPerson || "—"}</div>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[#1B2A4A] font-medium text-xs mb-0.5">Mobile</label>
                    <div className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 min-h-[32px]">{selectedMachine.contactNumber || "—"}</div>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[#1B2A4A] font-medium text-xs mb-0.5">Email</label>
                    <div className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 min-h-[32px]">{selectedMachine.email || "—"}</div>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[#1B2A4A] font-medium text-xs mb-0.5">Warranty Expired</label>
                    <div className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 min-h-[32px]">{selectedMachine.warrantyExpired ? new Date(selectedMachine.warrantyExpired).toLocaleDateString() : "—"}</div>
                  </div>

                  {/* Row 6 */}
                  <div className="md:col-span-3">
                    <label className="block text-[#1B2A4A] font-medium text-xs mb-0.5">Option</label>
                    <div className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 min-h-[32px]">{selectedMachine.option || "—"}</div>
                  </div>
                  <div className="md:col-span-9">
                    <label className="block text-[#1B2A4A] font-medium text-xs mb-0.5">Note</label>
                    <div className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 min-h-[32px]">{selectedMachine.notes || "—"}</div>
                  </div>
                </div>
              </div>

              <div className={`mt-4 rounded-xl border p-4 shadow-sm ${isWarrantyActive ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                  <h2 className={`text-lg font-bold mb-2 ${isWarrantyActive ? "text-green-900" : "text-red-900"}`}>Warranty Period</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-0.5 text-green-800">Bill Date</label>
                      <div className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 min-h-[32px]">{billDateObj ? billDateObj.toLocaleDateString() : "—"}</div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-0.5 text-green-800">Warranty Expired</label>
                      <div className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 min-h-[32px]">{warrantyExpiredObj ? warrantyExpiredObj.toLocaleDateString() : "—"}</div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-0.5 text-green-800">Total Warranty</label>
                      <div className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 min-h-[32px]">{totalWarrantyDays !== null ? formatPeriod(totalWarrantyDays) : "—"}</div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-0.5 text-green-800">Days Remaining</label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 min-h-[32px]">{remainingWarrantyDays !== null ? formatPeriod(Math.max(remainingWarrantyDays, 0)) : "—"}</div>
                        {remainingWarrantyDays !== null && (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${isWarrantyActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {isWarrantyActive ? "Active" : "Expired"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => {
                    const match = users.find((u) => u._id === user?._id)
                    setShForm((p) => ({ ...p, callDate: "", problem: "", solution: "", ewTaka: "", bwMeterReading: "", colorMeterReading: "", printerHeadLife: "", scan: "", attendTime: "", endTime: "", userComments: "", engineerId: match?._id || "" }))
                    setEngineerSearch(match?.name || "")
                    setShDialogOpen(true)
                  }}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Add Service History
                </Button>
              </div>

              <div className="mt-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Service History</h2>
                {shRecords.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
                    <History className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>No service history found</p>
                  </div>
                ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="text-sm whitespace-nowrap">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 border-b border-slate-200">Date</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 border-b border-slate-200">Engineer</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 border-b border-slate-200 min-w-[250px]">Problem</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 border-b border-slate-200 min-w-[250px]">Solution</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 border-b border-slate-200">E/W</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 border-b border-slate-200">BW Meter</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 border-b border-slate-200">Color Meter</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 border-b border-slate-200">Scan Meter</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 border-b border-slate-200">Total</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 border-b border-slate-200">Printer Head Life</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 border-b border-slate-200">Attend</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 border-b border-slate-200">End</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 border-b border-slate-200 min-w-[200px]">Comments</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shRecords.map((record: any) => (
                            <tr key={record._id} className="hover:bg-slate-50 border-b border-slate-100 last:border-b-0">
                              <td className="px-4 py-3 text-slate-900 text-xs align-top">{new Date(record.callDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                              <td className="px-4 py-3 text-slate-600 text-xs align-top max-w-[180px] truncate">{record.engineerId?.name || "N/A"}</td>
                              <td className="px-4 py-3 text-xs text-slate-800 align-top whitespace-normal min-w-[250px]">{record.problem || "—"}</td>
                              <td className="px-4 py-3 text-xs text-slate-800 align-top whitespace-normal min-w-[250px]">{record.solution || "—"}</td>
                              <td className="px-4 py-3 text-slate-800 text-center text-xs align-top">{record.ewTaka || "—"}</td>
                              <td className="px-4 py-3 text-slate-800 text-center text-xs align-top">{record.bwMeterReading || "0"}</td>
                              <td className="px-4 py-3 text-slate-800 text-center text-xs align-top">{record.colorMeterReading || "0"}</td>
                              <td className="px-4 py-3 text-slate-800 text-center text-xs align-top">{record.scan || "0"}</td>
                              <td className="px-4 py-3 text-slate-800 text-center text-xs align-top">{record.total || "0"}</td>
                              <td className="px-4 py-3 text-slate-800 text-center text-xs align-top">{record.printerHeadLife || "0"}</td>
                              <td className="px-4 py-3 text-xs text-slate-600 align-top">{record.attendTime ? new Date(record.attendTime).toLocaleString() : "—"}</td>
                              <td className="px-4 py-3 text-xs text-slate-600 align-top">{record.endTime ? new Date(record.endTime).toLocaleString() : "—"}</td>
                              <td className="px-4 py-3 text-xs text-slate-600 align-top whitespace-normal min-w-[200px]" title={record.userComments || ""}>{record.userComments || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
              </div>
              </>
            )}
          </CardContent>
        </Card>

      <Dialog open={shDialogOpen} onClose={() => setShDialogOpen(false)} title="Add Service History">
        <form onSubmit={async (e) => {
          e.preventDefault()
          if (!selectedMachine || !shForm.callDate || !shForm.engineerId) return
          setShSubmitting(true)
          try {
            await fetch(`/api/machines/${selectedMachine._id}/service-history`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(shForm),
              credentials: "include",
            })
            setShDialogOpen(false)
            const r = await fetch(`/api/machines/${selectedMachine._id}/service-history`, { credentials: "include" })
            const data = await r.json()
            setShRecords(data.records || [])
          } catch (error) {
            console.error("Failed to add service history:", error)
          } finally {
            setShSubmitting(false)
          }
        }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <Label>Call Date</Label>
              <Input type="date" value={shForm.callDate} onChange={(e) => setShForm((p) => ({ ...p, callDate: e.target.value }))} required />
            </div>
            <div>
              <Label>E/W Taka</Label>
              <Input value={shForm.ewTaka} onChange={(e) => setShForm((p) => ({ ...p, ewTaka: e.target.value }))} placeholder="Enter amount or leave empty" />
            </div>
            <div>
              <Label>BW Meter Reading</Label>
              <Input type="number" min="0" value={shForm.bwMeterReading} onChange={(e) => {
                const v = e.target.value
                setShForm((p) => ({ ...p, bwMeterReading: v }))
              }} placeholder="0" />
            </div>
            <div>
              <Label>Color Meter Reading</Label>
              <Input type="number" min="0" value={shForm.colorMeterReading} onChange={(e) => {
                const v = e.target.value
                setShForm((p) => ({ ...p, colorMeterReading: v }))
              }} placeholder="0" />
            </div>
            <div>
              <Label>Scan Meter Reading</Label>
              <Input type="number" min="0" value={shForm.scan} onChange={(e) => {
                const v = e.target.value
                setShForm((p) => ({ ...p, scan: v }))
              }} placeholder="0" />
            </div>
            <div>
              <Label>Total</Label>
              <Input value={(Number(shForm.bwMeterReading) || 0) + (Number(shForm.colorMeterReading) || 0)} readOnly className="bg-slate-50 font-medium" />
            </div>
            <div>
              <Label>Printer Head Life (KM)</Label>
              <Input type="number" min="0" value={shForm.printerHeadLife} onChange={(e) => {
                const v = e.target.value
                setShForm((p) => ({ ...p, printerHeadLife: v }))
              }} placeholder="0" />
            </div>
            <div>
              <Label>Attend Time</Label>
              <Input type="datetime-local" value={shForm.attendTime} onChange={(e) => setShForm((p) => ({ ...p, attendTime: e.target.value }))} />
            </div>
            <div>
              <Label>End Time</Label>
              <Input type="datetime-local" value={shForm.endTime} onChange={(e) => setShForm((p) => ({ ...p, endTime: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <Label>Problem</Label>
              <Textarea value={shForm.problem} onChange={(e) => setShForm((p) => ({ ...p, problem: e.target.value }))} placeholder="Describe the problem" />
            </div>
            <div className="md:col-span-2">
              <Label>Solution</Label>
              <Textarea value={shForm.solution} onChange={(e) => setShForm((p) => ({ ...p, solution: e.target.value }))} placeholder="Describe the solution" />
            </div>
            <div className="md:col-span-2">
              <Label>User Comments</Label>
              <Textarea value={shForm.userComments} onChange={(e) => setShForm((p) => ({ ...p, userComments: e.target.value }))} placeholder="Enter any comments" />
            </div>
            <div className="md:col-span-2 relative" ref={engineerDropdownRef}>
              <Label>Select Engineer</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={engineerSearch || selectedServiceEngineer?.name || ""}
                  onChange={(e) => { setEngineerSearch(e.target.value); setEngineerDropdownOpen(true); if (shForm.engineerId) setShForm((p) => ({ ...p, engineerId: "" })) }}
                  onFocus={() => setEngineerDropdownOpen(true)}
                  placeholder="Search for an engineer..."
                  className="pl-9"
                />
                {engineerDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredServiceEngineers.length === 0 ? (
                      <div className="px-2.5 py-1.5 text-sm text-gray-500">No engineers found</div>
                    ) : (
                      filteredServiceEngineers.map((engineer) => (
                        <button
                          key={engineer._id}
                          type="button"
                          onClick={() => {
                            setShForm((p) => ({ ...p, engineerId: engineer._id }))
                            setEngineerSearch(engineer.name)
                            setEngineerDropdownOpen(false)
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-sm hover:bg-blue-50 transition-colors"
                        >
                          <div className="font-medium">{engineer.name}</div>
                          <div className="text-xs text-gray-500">{engineer.role} &mdash; {engineer.email}</div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {selectedServiceEngineer && <p className="mt-1 text-xs text-green-600">Selected: {selectedServiceEngineer.name}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setShDialogOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={shSubmitting || !shForm.callDate || !shForm.engineerId} className="bg-teal-600 hover:bg-teal-700">
              {shSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save Service History"}
            </Button>
          </div>
        </form>
      </Dialog>

    </div>
  )
}
