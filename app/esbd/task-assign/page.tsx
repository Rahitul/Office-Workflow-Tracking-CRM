"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardList, Loader2, Search, X, List, PlusCircle, RefreshCw, Eye, Timer, CheckCircle, Send, Trash2, Ban, ChevronDown } from "lucide-react"
import { Dialog } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import ServiceTaskList from "@/components/service-task-list"

interface UserData {
  _id: string
  name: string
  email: string
  role: string
}

interface CompanyData {
  _id: string
  name: string
  group: string
  location: string
  contactPerson: string
  contactNumber: string
  locations: Array<{
    location: string
    address: string
    district: string
    area: string
    contactPerson: string
    contactNumber: string
    contacts: Array<{ name: string; phone: string; email: string; designation: string }>
  }>
}

interface QueueItem {
  _id: string
  taskId: string
  callRecordDate: string
  customerName: string
  deviceModel: string
  productCategory: string
  productType: string
  customerCategory: string
  department: string
  problem: string
  location: string
  callType: string
  contactPerson: string
  contactNumber: string
  assignedEngineer: { _id: string; name: string; email: string } | null
  receivedBy: { _id: string; name: string; email: string } | null
  priority: number
  fromLocation: string
  toLocation: string
  vehicleType: string
  gapAssignedToAcknowledge: string
  gapAcknowledgeToTravelStarted: string
  gapTravelStartedToCheckedIn: string
  gapCheckedInToChecklistSubmitted: string
  gapChecklistSubmittedToCompleted: string
  createdAt: string
}

interface TravelTimeEntry {
  _id: string
  fromLocation: string
  toLocation: string
  vehicleType: string
  hours: number
  minutes: number
}

type TabType = "queue" | "assign" | "list" | "canceled"

function formatGapLabel(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m} minutes`
  if (m === 0) return `${h} ${h === 1 ? "hour" : "hours"}`
  return `${h} ${h === 1 ? "hour" : "hours"} ${m} minutes`
}

const hourGapOptions = (() => {
  const opts: { value: string; label: string }[] = [{ value: "", label: "Select gap..." }]
  for (let min = 15; min <= 480; min += 15) {
    const label = formatGapLabel(min)
    opts.push({ value: label, label })
  }
  return opts
})()

const allVehicleTypes = ["Bus", "Bike", "Rickshaw", "Car", "Foot"]

const initialFormData = {
  taskId: "",
  callRecordDate: "",
  customerName: "",
  customerGroup: "Not a group of company",
  deviceModel: "",
  productCategory: "",
  productType: "",
  customerCategory: "",
  department: "",
  problem: "",
  location: "",
  callType: "",
  contactPerson: "",
  contactNumber: "",
  assignedEngineer: "",
  receivedBy: "",
}

function generateId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

function gapValue(hours: number, minutes: number): string {
  return formatGapLabel(hours * 60 + minutes)
}

function AssignForm({ users, allUsers, companies, customerCategories, callTypes, departments, productCategories, productTypes, modelNames, problemOptions, onSuccess }: { users: UserData[]; allUsers: UserData[]; companies: CompanyData[]; customerCategories: string[]; callTypes: string[]; departments: string[]; productCategories: { label: string; parent: string }[]; productTypes: { label: string; parent: string }[]; modelNames: { label: string; parent: string }[]; problemOptions: string[]; onSuccess: () => void }) {
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({ ...initialFormData, taskId: "" })

  const fetchNextId = useCallback(async () => {
    try {
      const res = await fetch("/api/service-tasks?countOnly=true", { credentials: "include" })
      const data = await res.json()
      const count = data.count || 0
      setFormData((p) => ({ ...p, taskId: String(count + 1) }))
    } catch {
      setFormData((p) => ({ ...p, taskId: generateId() }))
    }
  }, [])

  useEffect(() => { fetchNextId() }, [fetchNextId])
  const [engineerSearch, setEngineerSearch] = useState("")
  const [engineerDropdownOpen, setEngineerDropdownOpen] = useState(false)
  const [categorySearch, setCategorySearch] = useState("")
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [callTypeSearch, setCallTypeSearch] = useState("")
  const [callTypeDropdownOpen, setCallTypeDropdownOpen] = useState(false)
  const [modelSearch, setModelSearch] = useState("")
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)
  const [problemSearch, setProblemSearch] = useState("")
  const [problemDropdownOpen, setProblemDropdownOpen] = useState(false)
  const [departmentSearch, setDepartmentSearch] = useState("")
  const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false)
  const [companyList] = useState<CompanyData[]>(companies)
  const [customerSearch, setCustomerSearch] = useState("")
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false)
  const [locationPickerOpen, setLocationPickerOpen] = useState(false)
  const [receivedSearch, setReceivedSearch] = useState("")
  const [receivedDropdownOpen, setReceivedDropdownOpen] = useState(false)
  const [contactSearch, setContactSearch] = useState("")
  const [contactDropdownOpen, setContactDropdownOpen] = useState(false)
  const categoryRef = useRef<HTMLDivElement>(null)
  const callTypeRef = useRef<HTMLDivElement>(null)
  const modelRef = useRef<HTMLDivElement>(null)
  const problemRef = useRef<HTMLDivElement>(null)
  const departmentRef = useRef<HTMLDivElement>(null)
  const customerRef = useRef<HTMLDivElement>(null)
  const locationRef = useRef<HTMLDivElement>(null)
  const receivedRef = useRef<HTMLDivElement>(null)
  const contactRef = useRef<HTMLDivElement>(null)

  const selectedCompany = companyList.find((c) => c.name === formData.customerName)
  const companyLocations = selectedCompany?.locations?.filter(l => l.location.trim()) || 
    (selectedCompany?.location ? [{ location: selectedCompany.location, contactPerson: selectedCompany.contactPerson, contactNumber: selectedCompany.contactNumber }] : [])
  const selectedLocation = selectedCompany?.locations?.find((l) => l.location === formData.location)
  const filteredContacts = (selectedLocation?.contacts || []).filter((c) => c.name.toLowerCase().includes(contactSearch.toLowerCase()))

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) setCategoryDropdownOpen(false)
      if (callTypeRef.current && !callTypeRef.current.contains(e.target as Node)) setCallTypeDropdownOpen(false)
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) setModelDropdownOpen(false)
      if (problemRef.current && !problemRef.current.contains(e.target as Node)) setProblemDropdownOpen(false)
      if (departmentRef.current && !departmentRef.current.contains(e.target as Node)) setDepartmentDropdownOpen(false)
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) setCustomerDropdownOpen(false)
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) setLocationPickerOpen(false)
      if (receivedRef.current && !receivedRef.current.contains(e.target as Node)) setReceivedDropdownOpen(false)
      if (contactRef.current && !contactRef.current.contains(e.target as Node)) setContactDropdownOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredEngineers = users.filter((u) =>
    u.name.toLowerCase().includes(engineerSearch.toLowerCase())
  )
  const selectedEngineer = users.find((u) => u._id === formData.assignedEngineer)

  const filteredReceived = allUsers.filter((u) =>
    u.name.toLowerCase().includes(receivedSearch.toLowerCase())
  )
  const selectedReceived = allUsers.find((u) => u._id === formData.receivedBy)

  const selectReceived = (userId: string) => {
    setFormData((p) => ({ ...p, receivedBy: userId }))
    const user = allUsers.find((u) => u._id === userId)
    setReceivedSearch(user?.name || "")
    setReceivedDropdownOpen(false)
  }

  const clearReceived = () => {
    setFormData((p) => ({ ...p, receivedBy: "" }))
    setReceivedSearch("")
  }

  const filteredCompanies = companyList.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  )

  const handleChange = (field: string, value: string) => setFormData((p) => ({ ...p, [field]: value }))

  const filteredProductTypes = productTypes.filter((t) => t.parent === formData.productCategory)
  const filteredModelNames = modelNames.filter((m) => m.parent === formData.productType)

  const handleProductCategoryChange = (value: string) => {
    setFormData((p) => ({ ...p, productCategory: value, productType: "", deviceModel: "" }))
    setModelSearch("")
  }

  const handleProductTypeChange = (value: string) => {
    setFormData((p) => ({ ...p, productType: value, deviceModel: "" }))
    setModelSearch("")
  }

  const selectCompany = (company: CompanyData) => {
    setFormData((p) => ({
      ...p,
      customerName: company.name,
      customerGroup: company.group || "Not a group of company",
      contactPerson: "",
      contactNumber: "",
      location: "",
    }))
    setCustomerSearch(company.name)
    setCustomerDropdownOpen(false)
    setLocationPickerOpen(true)
  }

  const selectLocation = (loc: { location: string; contactPerson: string; contactNumber: string }) => {
    setFormData((p) => ({
      ...p,
      location: loc.location,
      contactPerson: loc.contactPerson || "",
      contactNumber: loc.contactNumber || "",
    }))
    setContactSearch("")
    setLocationPickerOpen(false)
  }

  const clearCustomer = () => {
    setFormData((p) => ({ ...p, customerName: "", customerGroup: "Not a group of company", contactPerson: "", contactNumber: "", location: "" }))
    setCustomerSearch("")
    setContactSearch("")
  }

  const selectEngineer = (userId: string) => {
    setFormData((p) => ({ ...p, assignedEngineer: userId }))
    const engineer = users.find((u) => u._id === userId)
    setEngineerSearch(engineer?.name || "")
    setEngineerDropdownOpen(false)
  }

  const clearEngineer = () => {
    setFormData((p) => ({ ...p, assignedEngineer: "" }))
    setEngineerSearch("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { assignedEngineer: _, ...payload } = formData
      const res = await fetch("/api/service-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          status: "Queued",
          callRecordDate: new Date(formData.callRecordDate),
        }),
        credentials: "include",
      })
      const data = await res.json()
      if (data.success) {
        setFormData({ ...initialFormData, taskId: "" })
        setEngineerSearch(""); setReceivedSearch(""); setCategorySearch(""); setCallTypeSearch(""); setCustomerSearch(""); setModelSearch(""); setContactSearch("")
        fetchNextId()
        onSuccess()
      } else {
        alert(data.error || "Failed to add to queue")
      }
    } catch (error) {
      console.error("Error adding to queue:", error)
      alert("Failed to add to queue")
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = formData.taskId && formData.customerName

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5" />
          Call/Case Assign Form
        </CardTitle>
        <CardDescription>Fill in the details to add a call/case to the queue</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label htmlFor="taskId">ID</Label><Input id="taskId" value={formData.taskId} readOnly className="bg-slate-50 text-slate-600 cursor-not-allowed" /></div>
            <div><Label htmlFor="callRecordDate">Call Record Date</Label><Input id="callRecordDate" type="date" value={formData.callRecordDate} onChange={(e) => handleChange("callRecordDate", e.target.value)} required /></div>
            <div ref={customerRef}>
              <Label htmlFor="customerName">Customer Name</Label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input id="customerName" value={customerSearch} onChange={(e) => { setCustomerSearch(e.target.value); setCustomerDropdownOpen(true); if (formData.customerName) setFormData((p) => ({ ...p, customerName: "", customerGroup: "Not a group of company", contactPerson: "", contactNumber: "", location: "" })) }} onFocus={() => setCustomerDropdownOpen(true)} placeholder={selectedCompany ? selectedCompany.name : "Search or enter customer name..."} className="pl-9 pr-9" required />
                  {selectedCompany && <button type="button" onClick={clearCustomer} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>}
                </div>
                {customerDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredCompanies.length === 0 ? <div className="px-3 py-2 text-sm text-gray-500">No companies found</div> : filteredCompanies.map((company) => (
                      <button key={company._id} type="button" onClick={() => selectCompany(company)} className={cn("w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors", formData.customerName === company.name ? "bg-blue-50 text-blue-700" : "text-gray-900")}>
                        <div className="font-medium">{company.name}</div>
                        <div className="text-xs text-teal-600">{company.group || "Not a group of company"}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedCompany && <p className="mt-1 text-xs text-green-600">Selected: {selectedCompany.name}</p>}
              {formData.customerGroup && (
                <p className="mt-1 text-xs text-teal-600">Group: {formData.customerGroup}</p>
              )}
              {selectedCompany && companyLocations.length > 0 && (
                <div ref={locationRef} className="mt-2">
                  <Label>Select Location</Label>
                  <div className="relative">
                    <Input
                      value={formData.location ? `${formData.location}${formData.contactPerson ? ` — ${formData.contactPerson}` : ""}` : "Select a location..."}
                      onFocus={() => setLocationPickerOpen(true)}
                      readOnly
                      className="cursor-pointer bg-white"
                    />
                    {formData.location && (
                      <button
                        type="button"
                        onClick={() => { setFormData((p) => ({ ...p, location: "", contactPerson: "", contactNumber: "" })); setLocationPickerOpen(false) }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    {locationPickerOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {companyLocations.map((loc, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onMouseDown={() => selectLocation(loc)}
                            className={cn("w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors", formData.location === loc.location ? "bg-blue-50 text-blue-700" : "text-gray-900")}
                          >
                            <div className="font-medium">{loc.location}</div>
                            {(loc.contactPerson || loc.contactNumber) && (
                              <div className="text-xs text-gray-500">
                                {loc.contactPerson}{loc.contactPerson && loc.contactNumber ? " — " : ""}{loc.contactNumber}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {formData.location && !selectedCompany && (
                <div className="mt-2">
                  <Label>Location</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    placeholder="Enter location"
                  />
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="productCategory">Product Category</Label>
              <Select
                id="productCategory"
                value={formData.productCategory}
                onChange={(e) => handleProductCategoryChange(e.target.value)}
                options={[
                  { value: "", label: "Select category..." },
                  ...productCategories.map((c) => ({ value: c.label, label: c.label })),
                ]}
              />
            </div>
            <div>
              <Label htmlFor="productType">Product Type</Label>
              <Select
                id="productType"
                value={formData.productType}
                onChange={(e) => handleProductTypeChange(e.target.value)}
                disabled={!formData.productCategory}
                options={[
                  { value: "", label: formData.productCategory ? "Select type..." : "Select a category first" },
                  ...filteredProductTypes.map((t) => ({ value: t.label, label: t.label })),
                ]}
              />
            </div>
            <div ref={modelRef}>
              <Label htmlFor="deviceModel">Model</Label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input id="deviceModel" value={modelSearch} onChange={(e) => { setModelSearch(e.target.value); setModelDropdownOpen(true); handleChange("deviceModel", e.target.value) }} onFocus={() => setModelDropdownOpen(true)} placeholder={formData.deviceModel || "Search or enter model..."} className="pl-9 pr-9" required />
                  {formData.deviceModel && <button type="button" onClick={() => { handleChange("deviceModel", ""); setModelSearch("") }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>}
                </div>
                {modelDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredModelNames.filter((o) => o.label.toLowerCase().includes(modelSearch.toLowerCase())).length === 0 ? <div className="px-3 py-2 text-sm text-gray-500">No options found</div> : filteredModelNames.filter((o) => o.label.toLowerCase().includes(modelSearch.toLowerCase())).map((option) => (
                      <button key={option.label} type="button" onClick={() => { handleChange("deviceModel", option.label); setModelSearch(option.label); setModelDropdownOpen(false) }} className={cn("w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors", formData.deviceModel === option.label ? "bg-blue-50 text-blue-700" : "text-gray-900")}>{option.label}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div ref={categoryRef}>
              <Label htmlFor="customerCategory">Customer Category</Label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input id="customerCategory" value={categorySearch} onChange={(e) => { setCategorySearch(e.target.value); setCategoryDropdownOpen(true); handleChange("customerCategory", e.target.value) }} onFocus={() => setCategoryDropdownOpen(true)} placeholder={formData.customerCategory || "Search or enter customer category..."} className="pl-9 pr-9" required />
                  {formData.customerCategory && <button type="button" onClick={() => { handleChange("customerCategory", ""); setCategorySearch("") }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>}
                </div>
                {categoryDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {customerCategories.filter((o) => o.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 ? <div className="px-3 py-2 text-sm text-gray-500">No options found</div> : customerCategories.filter((o) => o.toLowerCase().includes(categorySearch.toLowerCase())).map((option) => (
                      <button key={option} type="button" onClick={() => { handleChange("customerCategory", option); setCategorySearch(option); setCategoryDropdownOpen(false) }} className={cn("w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors", formData.customerCategory === option ? "bg-blue-50 text-blue-700" : "text-gray-900")}>{option}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div ref={departmentRef}>
              <Label htmlFor="department">Department</Label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input id="department" value={departmentSearch} onChange={(e) => { setDepartmentSearch(e.target.value); setDepartmentDropdownOpen(true); handleChange("department", e.target.value) }} onFocus={() => setDepartmentDropdownOpen(true)} placeholder={formData.department || "Search or enter department..."} className="pl-9 pr-9" required />
                  {formData.department && <button type="button" onClick={() => { handleChange("department", ""); setDepartmentSearch("") }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>}
                </div>
                {departmentDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {departments.filter((o) => o.toLowerCase().includes(departmentSearch.toLowerCase())).length === 0 ? <div className="px-3 py-2 text-sm text-gray-500">No options found</div> : departments.filter((o) => o.toLowerCase().includes(departmentSearch.toLowerCase())).map((option) => (
                      <button key={option} type="button" onClick={() => { handleChange("department", option); setDepartmentSearch(option); setDepartmentDropdownOpen(false) }} className={cn("w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors", formData.department === option ? "bg-blue-50 text-blue-700" : "text-gray-900")}>{option}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div ref={callTypeRef}>
              <Label htmlFor="callType">Call Type</Label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input id="callType" value={callTypeSearch} onChange={(e) => { setCallTypeSearch(e.target.value); setCallTypeDropdownOpen(true); handleChange("callType", e.target.value) }} onFocus={() => setCallTypeDropdownOpen(true)} placeholder={formData.callType || "Search or enter call type..."} className="pl-9 pr-9" required />
                  {formData.callType && <button type="button" onClick={() => { handleChange("callType", ""); setCallTypeSearch("") }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>}
                </div>
                {callTypeDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {callTypes.filter((o) => o.toLowerCase().includes(callTypeSearch.toLowerCase())).length === 0 ? <div className="px-3 py-2 text-sm text-gray-500">No options found</div> : callTypes.filter((o) => o.toLowerCase().includes(callTypeSearch.toLowerCase())).map((option) => (
                      <button key={option} type="button" onClick={() => { handleChange("callType", option); setCallTypeSearch(option); setCallTypeDropdownOpen(false) }} className={cn("w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors", formData.callType === option ? "bg-blue-50 text-blue-700" : "text-gray-900")}>{option}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div ref={contactRef}>
              <Label htmlFor="contactPerson">Contact Person</Label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input id="contactPerson" value={contactSearch || formData.contactPerson} onChange={(e) => { setContactSearch(e.target.value); handleChange("contactPerson", e.target.value); if (!contactDropdownOpen) setContactDropdownOpen(true) }} onFocus={() => { if (selectedLocation && selectedLocation.contacts?.length > 0) setContactDropdownOpen(true) }} placeholder={selectedLocation && selectedLocation.contacts?.length > 0 ? "Select or type contact person..." : "Enter contact person name"} className="pl-9 pr-9" required />
                  {formData.contactPerson && <button type="button" onClick={() => { handleChange("contactPerson", ""); setContactSearch("") }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>}
                </div>
                {contactDropdownOpen && selectedLocation && filteredContacts.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredContacts.map((contact, idx) => (
                      <button key={idx} type="button" onClick={() => { handleChange("contactPerson", contact.name); if (contact.phone) handleChange("contactNumber", contact.phone); setContactSearch(contact.name); setContactDropdownOpen(false) }} className={cn("w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors", formData.contactPerson === contact.name ? "bg-blue-50 text-blue-700" : "text-gray-900")}>
                        <div className="font-medium">{contact.name}</div>
                        {contact.designation && <div className="text-xs text-gray-500">{contact.designation}</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div><Label htmlFor="contactNumber">Contact Number</Label><Input id="contactNumber" value={formData.contactNumber} onChange={(e) => handleChange("contactNumber", e.target.value)} placeholder="Enter contact number" required /></div>
          </div>
            <div ref={problemRef}>
              <Label htmlFor="problem">Problem</Label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input id="problem" value={problemSearch} onChange={(e) => { setProblemSearch(e.target.value); setProblemDropdownOpen(true); handleChange("problem", e.target.value) }} onFocus={() => setProblemDropdownOpen(true)} placeholder={formData.problem || "Search or enter problem..."} className="pl-9 pr-9" required />
                  {formData.problem && <button type="button" onClick={() => { handleChange("problem", ""); setProblemSearch("") }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>}
                </div>
                {problemDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {problemOptions.filter((o) => o.toLowerCase().includes(problemSearch.toLowerCase())).length === 0 ? <div className="px-3 py-2 text-sm text-gray-500">No options found</div> : problemOptions.filter((o) => o.toLowerCase().includes(problemSearch.toLowerCase())).map((option) => (
                      <button key={option} type="button" onClick={() => { handleChange("problem", option); setProblemSearch(option); setProblemDropdownOpen(false) }} className={cn("w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors", formData.problem === option ? "bg-blue-50 text-blue-700" : "text-gray-900")}>{option}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          <div><Label htmlFor="location">Location</Label><Textarea id="location" value={formData.location} onChange={(e) => handleChange("location", e.target.value)} placeholder="Enter customer location or job site" required /></div>
          <div ref={receivedRef}>
            <Label htmlFor="receivedBy">Received by</Label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input id="receivedBy" value={receivedSearch} onChange={(e) => { setReceivedSearch(e.target.value); setReceivedDropdownOpen(true); if (formData.receivedBy) setFormData((p) => ({ ...p, receivedBy: "" })) }} onFocus={() => setReceivedDropdownOpen(true)} placeholder={selectedReceived ? selectedReceived.name : "Search for a user..."} className="pl-9 pr-9" />
                {selectedReceived && <button type="button" onClick={clearReceived} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>}
              </div>
              {receivedDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredReceived.length === 0 ? <div className="px-3 py-2 text-sm text-gray-500">No users found</div> : filteredReceived.map((user) => (
                    <button key={user._id} type="button" onClick={() => selectReceived(user._id)} className={cn("w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors", formData.receivedBy === user._id ? "bg-blue-50 text-blue-700" : "text-gray-900")}>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.role} &mdash; {user.email}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedReceived && <p className="mt-1 text-xs text-green-600">Selected: {selectedReceived.name}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={!canSubmit || submitting}>
            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</> : <><Timer className="w-4 h-4 mr-2" />Add to Queue</>}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function QueueTab({
  tasks,
  users,
  customerCategories,
  callTypes,
  onRefresh,
}: {
  tasks: QueueItem[]
  users: UserData[]
  customerCategories: string[]
  callTypes: string[]
  onRefresh: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [savingSet, setSavingSet] = useState<Set<string>>(new Set())
  const [assigningSet, setAssigningSet] = useState<Set<string>>(new Set())
  const [deletingSet, setDeletingSet] = useState<Set<string>>(new Set())
  const [localTasks, setLocalTasks] = useState<QueueItem[]>([])
  const [savedSet, setSavedSet] = useState<Set<string>>(new Set())
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
  const [viewingTask, setViewingTask] = useState<QueueItem | null>(null)
  const [travelTimes, setTravelTimes] = useState<TravelTimeEntry[]>([])
  const [engineerSearchMap, setEngineerSearchMap] = useState<Record<string, string>>({})
  const [engineerDropdownMap, setEngineerDropdownMap] = useState<Record<string, boolean>>({})
  const [fromSearchMap, setFromSearchMap] = useState<Record<string, string>>({})
  const [fromDropdownMap, setFromDropdownMap] = useState<Record<string, boolean>>({})
  const [toSearchMap, setToSearchMap] = useState<Record<string, string>>({})
  const [toDropdownMap, setToDropdownMap] = useState<Record<string, boolean>>({})
  const [vehicleTypeMap, setVehicleTypeMap] = useState<Record<string, string>>({})
  const [search, setSearch] = useState("")
  const [callTypeFilter, setCallTypeFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [engineerFilter, setEngineerFilter] = useState("")
  const [filterEngineerSearch, setFilterEngineerSearch] = useState("")
  const [filterEngineerDropdownOpen, setFilterEngineerDropdownOpen] = useState(false)
  const engineerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLocalTasks(tasks)
  }, [tasks])

  useEffect(() => {
    fetch("/api/travel-times", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.travelTimes) setTravelTimes(d.travelTimes) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const getVehicleOptionsForRoute = (fromLocation: string, toLocation: string): string[] => {
    if (!fromLocation || !toLocation) return allVehicleTypes
    const matched = travelTimes.filter(
      (tt) => (tt.fromLocation.toLowerCase() === fromLocation.toLowerCase() &&
               tt.toLocation.toLowerCase() === toLocation.toLowerCase()) ||
              (tt.fromLocation.toLowerCase() === toLocation.toLowerCase() &&
               tt.toLocation.toLowerCase() === fromLocation.toLowerCase())
    )
    if (matched.length === 0) return allVehicleTypes
    const types = [...new Set(matched.map((tt) => tt.vehicleType))]
    return types
  }

  const handleFromChange = (id: string, fromLocation: string, currentTo: string, vehicleType?: string) => {
    setLocalTasks((prev) => prev.map((t) => {
      if (t._id !== id) return t
      const updated = { ...t, fromLocation, vehicleType: vehicleType || t.vehicleType || "Bus" }
      if (fromLocation && currentTo) autoFillGap(updated, fromLocation, currentTo, vehicleType || t.vehicleType || "Bus")
      return updated
    }))
  }

  const handleToChange = (id: string, toLocation: string, currentFrom: string, vehicleType?: string) => {
    setLocalTasks((prev) => prev.map((t) => {
      if (t._id !== id) return t
      const updated = { ...t, toLocation, vehicleType: vehicleType || t.vehicleType || "Bus" }
      if (currentFrom && toLocation) autoFillGap(updated, currentFrom, toLocation, vehicleType || t.vehicleType || "Bus")
      return updated
    }))
  }

  const autoFillGap = (item: QueueItem, fromLocation: string, toLocation: string, vehicleType?: string) => {
    const match = travelTimes.find(
      (tt) => tt.fromLocation.toLowerCase() === fromLocation.toLowerCase() && 
              tt.toLocation.toLowerCase() === toLocation.toLowerCase() &&
              (!vehicleType || tt.vehicleType === vehicleType)
    ) || travelTimes.find(
      (tt) => tt.fromLocation.toLowerCase() === toLocation.toLowerCase() && 
              tt.toLocation.toLowerCase() === fromLocation.toLowerCase() &&
              (!vehicleType || tt.vehicleType === vehicleType)
    )
    if (match) {
      const val = gapValue(match.hours, match.minutes)
      item.gapTravelStartedToCheckedIn = val
    }
  }

  const handleGapChange = (id: string, field: string, value: string) => {
    setLocalTasks((prev) => prev.map((t) => t._id === id ? { ...t, [field]: value } : t))
  }

  const fetchNextAvailablePriority = useCallback(async (engineerId: string, excludeId: string): Promise<number> => {
    const used = new Set<number>()
    try {
      const res = await fetch(`/api/service-tasks?assignedTo=${engineerId}`, { credentials: "include" })
      const data = await res.json()
      if (data.success) data.data.forEach((t: any) => { if (t.priority > 0) used.add(t.priority) })
    } catch {}
    localTasks.forEach((t) => {
      if (t._id !== excludeId && t.assignedEngineer?._id === engineerId && t.priority > 0) used.add(t.priority)
    })
    let next = 1
    while (used.has(next)) next++
    return next
  }, [localTasks])

  const selectEngineer = async (id: string, userId: string) => {
    const engineer = users.find((u) => u._id === userId)
    setLocalTasks((prev) => prev.map((t) => t._id === id ? { ...t, assignedEngineer: { _id: userId, name: engineer?.name || "", email: engineer?.email || "" } } : t))
    setEngineerSearchMap((p) => ({ ...p, [id]: engineer?.name || "" }))
    setEngineerDropdownMap((p) => ({ ...p, [id]: false }))
    const next = await fetchNextAvailablePriority(userId, id)
    if (next > 0) setLocalTasks((prev) => prev.map((t) => t._id === id ? { ...t, priority: next } : t))
  }

  const handleSave = async (item: QueueItem) => {
    setSavingSet((prev) => new Set(prev).add(item._id))
    try {
      const res = await fetch(`/api/service-tasks/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priority: item.priority,
          fromLocation: item.fromLocation,
          toLocation: item.toLocation,
          vehicleType: vehicleTypeMap[item._id] || item.vehicleType || "Bus",
          gapAssignedToAcknowledge: item.gapAssignedToAcknowledge,
          gapAcknowledgeToTravelStarted: item.gapAcknowledgeToTravelStarted,
          gapTravelStartedToCheckedIn: item.gapTravelStartedToCheckedIn,
          gapCheckedInToChecklistSubmitted: item.gapCheckedInToChecklistSubmitted,
        }),
        credentials: "include",
      })
      const data = await res.json()
      if (data.success) {
        setSavedSet((prev) => new Set(prev).add(item._id))
      } else {
        alert(data.error || "Failed to save queue")
      }
    } catch (error) {
      console.error("Error saving queue:", error)
      alert("Failed to save queue")
    } finally {
      setSavingSet((prev) => { const n = new Set(prev); n.delete(item._id); return n })
    }
  }

  const handleAssign = async (item: QueueItem) => {
    setAssigningSet((prev) => new Set(prev).add(item._id))
    try {
      const res = await fetch(`/api/service-tasks/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Assigned",
          assignedEngineer: item.assignedEngineer?._id,
          priority: item.priority,
          fromLocation: item.fromLocation,
          toLocation: item.toLocation,
          gapAssignedToAcknowledge: item.gapAssignedToAcknowledge,
          gapAcknowledgeToTravelStarted: item.gapAcknowledgeToTravelStarted,
          gapTravelStartedToCheckedIn: item.gapTravelStartedToCheckedIn,
          gapCheckedInToChecklistSubmitted: item.gapCheckedInToChecklistSubmitted,
        }),
        credentials: "include",
      })
      const data = await res.json()
      if (data.success) {
        onRefresh()
      } else {
        alert(data.error || "Failed to assign call/case")
      }
    } catch (error) {
      console.error("Error assigning task:", error)
      alert("Failed to assign call/case")
    } finally {
      setAssigningSet((prev) => { const n = new Set(prev); n.delete(item._id); return n })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this call/case from the queue?")) return
    setDeletingSet((prev) => new Set(prev).add(id))
    try {
      const res = await fetch(`/api/service-tasks/${id}`, { method: "DELETE", credentials: "include" })
      const data = await res.json()
      if (data.success) {
        onRefresh()
      } else {
        alert(data.error || "Failed to delete call/case")
      }
    } catch (error) {
      console.error("Error deleting task:", error)
      alert("Failed to delete call/case")
    } finally {
      setDeletingSet((prev) => { const n = new Set(prev); n.delete(id); return n })
    }
  }

  const uniqueLocations = useMemo(() => {
    const set = new Set<string>()
    travelTimes.forEach((tt) => { set.add(tt.fromLocation); set.add(tt.toLocation) })
    return Array.from(set).sort()
  }, [travelTimes])

  const uniqueEngineers = useMemo(() => {
    const map = new Map<string, { _id: string; name: string }>()
    localTasks.forEach((t) => {
      if (t.assignedEngineer?._id) map.set(t.assignedEngineer._id, { _id: t.assignedEngineer._id, name: t.assignedEngineer.name })
    })
    return Array.from(map.values())
  }, [localTasks])

  const filteredEngineers = uniqueEngineers.filter((e) =>
    e.name.toLowerCase().includes(filterEngineerSearch.toLowerCase())
  )

  const filteredTasks = useMemo(() => {
    return localTasks.filter((task) => {
      const matchSearch = !search || task.customerName.toLowerCase().includes(search.toLowerCase()) || task.taskId.toLowerCase().includes(search.toLowerCase()) || task.deviceModel.toLowerCase().includes(search.toLowerCase()) || (task.productCategory || "").toLowerCase().includes(search.toLowerCase()) || (task.productType || "").toLowerCase().includes(search.toLowerCase())
      const matchCallType = !callTypeFilter || task.callType === callTypeFilter
      const matchCategory = !categoryFilter || task.customerCategory === categoryFilter
      const matchEngineer = !engineerFilter || task.assignedEngineer?.name === engineerFilter
      const taskDate = new Date(task.createdAt)
      const matchStart = !startDate || taskDate >= new Date(startDate)
      const matchEnd = !endDate || taskDate <= new Date(endDate + "T23:59:59")
      return matchSearch && matchCallType && matchCategory && matchEngineer && matchStart && matchEnd
    })
  }, [localTasks, search, callTypeFilter, categoryFilter, engineerFilter, startDate, endDate])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (engineerRef.current && !engineerRef.current.contains(e.target as Node)) setFilterEngineerDropdownOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by customer, call/case ID, or model..." className="pl-9" />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div ref={engineerRef} className="relative w-full sm:w-48">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={filterEngineerSearch}
              onChange={(e) => { setFilterEngineerSearch(e.target.value); setFilterEngineerDropdownOpen(true); if (engineerFilter) setEngineerFilter("") }}
              onFocus={() => setFilterEngineerDropdownOpen(true)}
              placeholder={engineerFilter || "All Engineers"}
              className="pl-9 pr-9"
            />
            {engineerFilter && (
              <button type="button" onClick={() => { setEngineerFilter(""); setFilterEngineerSearch("") }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {filterEngineerDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              <button type="button" onClick={() => { setEngineerFilter(""); setFilterEngineerSearch(""); setFilterEngineerDropdownOpen(false) }} className={cn("w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors", !engineerFilter ? "bg-blue-50 text-blue-700" : "text-gray-900")}>All Engineers</button>
              {filteredEngineers.map((eng) => (
                <button key={eng._id} type="button" onClick={() => { setEngineerFilter(eng.name); setFilterEngineerSearch(eng.name); setFilterEngineerDropdownOpen(false) }} className={cn("w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors", engineerFilter === eng.name ? "bg-blue-50 text-blue-700" : "text-gray-900")}>{eng.name}</button>
              ))}
            </div>
          )}
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={[
              { value: "", label: "All Call Types" },
              ...callTypes.map((c) => ({ value: c, label: c })),
            ]}
            value={callTypeFilter}
            onChange={(e) => setCallTypeFilter(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={[
              { value: "", label: "All Categories" },
              ...customerCategories.map((c) => ({ value: c, label: c })),
            ]}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-44">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="Start date" />
        </div>
        <div className="w-full sm:w-44">
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="End date" />
        </div>
      </div>
      {filteredTasks.length === 0 ? (
        <Card><CardContent className="py-16"><div className="text-center"><Timer className="w-12 h-12 mx-auto text-slate-300 mb-3" /><p className="text-slate-500">{localTasks.length === 0 ? "Queue is empty" : "No calls/cases match your filters"}</p><p className="text-sm text-slate-400 mt-1">{localTasks.length === 0 ? "Add calls/cases from the Assign Call/Case tab" : "Try adjusting your filter criteria"}</p></div></CardContent></Card>
      ) : (
        filteredTasks.map((item) => {
          const engineerName = item.assignedEngineer?.name || "N/A"
          const receivedName = item.receivedBy?.name || "N/A"
          return (
            <Card key={item._id}>
              <div onClick={() => setExpandedCardId(expandedCardId === item._id ? null : item._id)} className="cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{item.customerName}</CardTitle>
                    <span className="text-sm text-slate-500">{item.callType}</span>
                    {item.department && <span className="text-sm text-slate-400">&middot; {item.department}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">{item.productCategory && item.productType ? `${item.productCategory} / ${item.productType} \u00B7 ${item.deviceModel}` : item.deviceModel}</span>
                    {savedSet.has(item._id) && (
                      <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Saved
                      </span>
                    )}
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setViewingTask(item) }}>
                      <Eye className="w-4 h-4 mr-1" /> View
                    </Button>
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(item._id) }} disabled={deletingSet.has(item._id)} className="text-red-500 hover:text-red-700 border-red-200 hover:border-red-300">
                      {deletingSet.has(item._id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                    <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", expandedCardId === item._id && "rotate-180")} />
                  </div>
                </div>
                <CardDescription>Received by: {receivedName} &middot; Assigned to: {engineerName}</CardDescription>
              </CardHeader>
              </div>
              {expandedCardId === item._id && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label>Priority</Label>
                    <Input type="number" min={0} value={item.priority || 0} onChange={(e) => setLocalTasks((prev) => prev.map((t) => t._id === item._id ? { ...t, priority: parseInt(e.target.value) || 0 } : t))} className="w-24" />
                  </div>
                  <div>
                    <Label>Assigned Engineer</Label>
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          value={engineerSearchMap[item._id] ?? engineerName}
                          onChange={(e) => {
                            setEngineerSearchMap((p) => ({ ...p, [item._id]: e.target.value }))
                            setEngineerDropdownMap((p) => ({ ...p, [item._id]: true }))
                            if (item.assignedEngineer) setLocalTasks((prev) => prev.map((t) => t._id === item._id ? { ...t, assignedEngineer: null } : t))
                          }}
                          onFocus={() => setEngineerDropdownMap((p) => ({ ...p, [item._id]: true }))}
                          placeholder="Change engineer..."
                          className="pl-9"
                        />
                      </div>
                      {engineerDropdownMap[item._id] && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {users.filter((u) => u.name.toLowerCase().includes((engineerSearchMap[item._id] ?? "").toLowerCase())).length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">No engineers found</div>
                          ) : (
                            users.filter((u) => u.name.toLowerCase().includes((engineerSearchMap[item._id] ?? "").toLowerCase())).map((eng) => (
                              <button key={eng._id} type="button" onClick={() => selectEngineer(item._id, eng._id)} className={cn("w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors", item.assignedEngineer?._id === eng._id ? "bg-blue-50 text-blue-700" : "text-gray-900")}>
                                <div className="font-medium">{eng.name}</div>
                                <div className="text-xs text-gray-500">{eng.role} &mdash; {eng.email}</div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <Label>From Location</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        value={fromSearchMap[item._id] ?? item.fromLocation}
                        onChange={(e) => {
                          setFromSearchMap((p) => ({ ...p, [item._id]: e.target.value }))
                          setFromDropdownMap((p) => ({ ...p, [item._id]: true }))
                          if (item.fromLocation) setLocalTasks((prev) => prev.map((t) => t._id === item._id ? { ...t, fromLocation: "" } : t))
                        }}
                        onFocus={() => setFromDropdownMap((p) => ({ ...p, [item._id]: true }))}
                        onBlur={() => setTimeout(() => setFromDropdownMap((p) => ({ ...p, [item._id]: false })), 200)}
                        placeholder={item.fromLocation || "Search from location..."}
                        className="pl-9"
                      />
                    </div>
                    {fromDropdownMap[item._id] && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {uniqueLocations.filter((l) => l.toLowerCase().includes((fromSearchMap[item._id] ?? item.fromLocation).toLowerCase())).length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">No locations found</div>
                        ) : (
                          uniqueLocations.filter((l) => l.toLowerCase().includes((fromSearchMap[item._id] ?? item.fromLocation).toLowerCase())).map((loc) => (
                            <button key={loc} type="button" onMouseDown={() => { handleFromChange(item._id, loc, item.toLocation, vehicleTypeMap[item._id] || item.vehicleType); setFromSearchMap((p) => ({ ...p, [item._id]: loc })); setFromDropdownMap((p) => ({ ...p, [item._id]: false })) }} className={cn("w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors", item.fromLocation === loc ? "bg-blue-50 text-blue-700" : "text-gray-900")}>{loc}</button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <Label>To Location</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        value={toSearchMap[item._id] ?? item.toLocation}
                        onChange={(e) => {
                          setToSearchMap((p) => ({ ...p, [item._id]: e.target.value }))
                          setToDropdownMap((p) => ({ ...p, [item._id]: true }))
                          if (item.toLocation) setLocalTasks((prev) => prev.map((t) => t._id === item._id ? { ...t, toLocation: "" } : t))
                        }}
                        onFocus={() => setToDropdownMap((p) => ({ ...p, [item._id]: true }))}
                        onBlur={() => setTimeout(() => setToDropdownMap((p) => ({ ...p, [item._id]: false })), 200)}
                        placeholder={item.toLocation || "Search to location..."}
                        className="pl-9"
                      />
                    </div>
                    {toDropdownMap[item._id] && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {uniqueLocations.filter((l) => l.toLowerCase().includes((toSearchMap[item._id] ?? item.toLocation).toLowerCase())).length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">No locations found</div>
                        ) : (
                          uniqueLocations.filter((l) => l.toLowerCase().includes((toSearchMap[item._id] ?? item.toLocation).toLowerCase())).map((loc) => (
                            <button key={loc} type="button" onMouseDown={() => { handleToChange(item._id, loc, item.fromLocation, vehicleTypeMap[item._id] || item.vehicleType); setToSearchMap((p) => ({ ...p, [item._id]: loc })); setToDropdownMap((p) => ({ ...p, [item._id]: false })) }} className={cn("w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors", item.toLocation === loc ? "bg-blue-50 text-blue-700" : "text-gray-900")}>{loc}</button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label>Vehicle Type</Label>
                    {(() => {
                      const routeOptions = getVehicleOptionsForRoute(item.fromLocation, item.toLocation)
                      const currentValue = vehicleTypeMap[item._id] || item.vehicleType || "Bus"
                      const effectiveValue = routeOptions.includes(currentValue) ? currentValue : routeOptions[0] || "Bus"
                      return (
                        <select
                          value={effectiveValue}
                          onChange={(e) => {
                            const newVehicleType = e.target.value
                            setVehicleTypeMap((p) => ({ ...p, [item._id]: newVehicleType }))
                            if (item.fromLocation && item.toLocation) {
                              const updated = { ...item, vehicleType: newVehicleType }
                              autoFillGap(updated, item.fromLocation, item.toLocation, newVehicleType)
                              setLocalTasks((prev) => prev.map((t) => t._id === item._id ? { ...t, vehicleType: newVehicleType, gapTravelStartedToCheckedIn: updated.gapTravelStartedToCheckedIn } : t))
                            }
                          }}
                          className="w-full h-9 px-2 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          {routeOptions.map((v) => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      )
                    })()}
                  </div>
                </div>
                <div className="border-t pt-4">
                  <Label className="text-sm font-semibold mb-3 block">Status Timeline &mdash; Estimated Minimum Hour Gaps</Label>
                  <div className="overflow-x-auto pb-2">
                    <div className="flex items-center gap-2 min-w-max">
                      <div className="px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-sm font-medium text-slate-700 whitespace-nowrap">Assigned</div>
                      <span className="text-slate-300 hidden sm:block">&mdash;</span>
                      <div className="w-32">
                        <Select options={hourGapOptions} value={item.gapAssignedToAcknowledge} onChange={(e) => handleGapChange(item._id, "gapAssignedToAcknowledge", e.target.value)} className="text-xs" />
                      </div>
                      <span className="text-slate-300 hidden sm:block">&mdash;</span>
                      <div className="px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-sm font-medium text-slate-700 whitespace-nowrap">Acknowledge</div>
                      <span className="text-slate-300 hidden sm:block">&mdash;</span>
                      <div className="w-32">
                        <Select options={hourGapOptions} value={item.gapAcknowledgeToTravelStarted} onChange={(e) => handleGapChange(item._id, "gapAcknowledgeToTravelStarted", e.target.value)} className="text-xs" />
                      </div>
                      <span className="text-slate-300 hidden sm:block">&mdash;</span>
                      <div className="px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-sm font-medium text-slate-700 whitespace-nowrap">Travel Started</div>
                      <span className="text-slate-300 hidden sm:block">&mdash;</span>
                      <div className="w-32">
                        <div className={cn("px-3 py-2 rounded-lg border text-sm font-medium text-center", item.gapTravelStartedToCheckedIn ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-slate-50 border-slate-200 text-slate-400")}>
                          {item.gapTravelStartedToCheckedIn || "Auto-fill"}
                        </div>
                      </div>
                      <span className="text-slate-300 hidden sm:block">&mdash;</span>
                      <div className="px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-sm font-medium text-slate-700 whitespace-nowrap">Checked In</div>
                      <span className="text-slate-300 hidden sm:block">&mdash;</span>
                      <div className="w-32">
                        <Select options={hourGapOptions} value={item.gapCheckedInToChecklistSubmitted} onChange={(e) => handleGapChange(item._id, "gapCheckedInToChecklistSubmitted", e.target.value)} className="text-xs" />
                      </div>
                      <span className="text-slate-300 hidden sm:block">&mdash;</span>
                      <div className="px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-sm font-medium text-slate-700 whitespace-nowrap">Checklist Submitted</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  {!savedSet.has(item._id) ? (
                    <Button size="sm" onClick={() => handleSave(item)} disabled={savingSet.has(item._id)} className="bg-teal-600 hover:bg-teal-700">
                      {savingSet.has(item._id) ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><CheckCircle className="w-4 h-4 mr-2" />Save Queue</>}
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => handleAssign(item)} disabled={assigningSet.has(item._id)} className="bg-blue-600 hover:bg-blue-700">
                      {assigningSet.has(item._id) ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Assigning...</> : <><Send className="w-4 h-4 mr-2" />Assign</>}
                    </Button>
          )}
                </div>
              </CardContent>
              )}
            </Card>
          )
        })
      )}
      <Dialog open={!!viewingTask} onClose={() => setViewingTask(null)} title={viewingTask ? `Queue Details - #${viewingTask.taskId}` : ""}>
        {viewingTask && (
              <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-slate-500 font-medium">Customer Name</p><p className="text-slate-900">{viewingTask.customerName}</p></div>
              <div><p className="text-slate-500 font-medium">Call/Case ID</p><p className="text-slate-900">#{viewingTask.taskId}</p></div>
              <div><p className="text-slate-500 font-medium">Device Model</p><p className="text-slate-900">{viewingTask.deviceModel}</p></div>
              <div><p className="text-slate-500 font-medium">Product Category</p><p className="text-slate-900">{viewingTask.productCategory || "—"}</p></div>
              <div><p className="text-slate-500 font-medium">Product Type</p><p className="text-slate-900">{viewingTask.productType || "—"}</p></div>
              <div><p className="text-slate-500 font-medium">Department</p><p className="text-slate-900">{viewingTask.department || "—"}</p></div>
              <div><p className="text-slate-500 font-medium">Received by</p><p className="text-slate-900">{viewingTask.receivedBy?.name || "N/A"}</p></div>
              <div><p className="text-slate-500 font-medium">Assigned Engineer</p><p className="text-slate-900">{viewingTask.assignedEngineer?.name || "N/A"}</p></div>
              <div><p className="text-slate-500 font-medium">Contact Person</p><p className="text-slate-900">{viewingTask.contactPerson}</p></div>
              <div><p className="text-slate-500 font-medium">Contact Number</p><p className="text-slate-900">{viewingTask.contactNumber}</p></div>
              <div><p className="text-slate-500 font-medium">Call Type</p><p className="text-slate-900">{viewingTask.callType}</p></div>
              <div><p className="text-slate-500 font-medium">Category</p><p className="text-slate-900">{viewingTask.customerCategory}</p></div>
              <div><p className="text-slate-500 font-medium">Location</p><p className="text-slate-900">{viewingTask.location}</p></div>
            </div>
            <div><p className="text-slate-500 font-medium">Problem</p><p className="text-slate-900">{viewingTask.problem}</p></div>
          </div>
        )}
      </Dialog>
    </div>
  )
}

function CanceledTab({ userId, onRefresh }: { userId: string; onRefresh: () => void }) {
  const [tasks, setTasks] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const fetchCancelled = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/service-tasks?createdBy=${userId}&status=Cancelled`, { credentials: "include" })
        const data = await res.json()
        if (data.success) setTasks(data.data)
      } catch (error) {
        console.error("Error fetching cancelled tasks:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchCancelled()
  }, [userId, refreshKey, onRefresh])

  const filteredTasks = tasks.filter((task) => {
    if (!search) return true
    const q = search.toLowerCase()
    return task.customerName.toLowerCase().includes(q) || task.taskId.toLowerCase().includes(q) || task.deviceModel.toLowerCase().includes(q) || (task.productCategory || "").toLowerCase().includes(q) || (task.productType || "").toLowerCase().includes(q)
  })

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>

  return (
    <div className="space-y-4">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search cancelled calls/cases..." className="pl-9" />
      </div>
      {filteredTasks.length === 0 ? (
        <Card><CardContent className="py-16"><div className="text-center"><Ban className="w-12 h-12 mx-auto text-slate-300 mb-3" /><p className="text-slate-500">No cancelled calls/cases</p></div></CardContent></Card>
      ) : (
        filteredTasks.map((item) => (
          <Card key={item._id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-slate-400">#{item.taskId}</span>
                  <CardTitle className="text-lg">{item.customerName}</CardTitle>
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">Cancelled</span>
              </div>
              <CardDescription>{item.productCategory && item.productType ? `${item.productCategory} / ${item.productType} \u00B7 ${item.deviceModel}` : item.deviceModel} &middot; Received by: {item.receivedBy?.name || "N/A"} &middot; {item.assignedEngineer?.name || "N/A"} &middot; {item.callType}{item.department ? ` \u00B7 ${item.department}` : ""}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-slate-500 font-medium">Contact Person</p><p className="text-slate-900">{item.contactPerson}</p></div>
                <div><p className="text-slate-500 font-medium">Phone</p><p className="text-slate-900">{item.contactNumber}</p></div>
                <div><p className="text-slate-500 font-medium">Location</p><p className="text-slate-900 truncate">{item.location}</p></div>
                <div><p className="text-slate-500 font-medium">Created At</p><p className="text-slate-900">{formatDateTime(item.createdAt)}</p></div>
                <div><p className="text-slate-500 font-medium">Department</p><p className="text-slate-900">{item.department || "—"}</p></div>
                <div className="col-span-2"><p className="text-slate-500 font-medium">Problem</p><p className="text-slate-900 truncate">{item.problem}</p></div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

export default function TaskAssignPage() {
  const { user } = useAuthStore()
  const [users, setUsers] = useState<UserData[]>([])
  const [allUsers, setAllUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>("queue")
  const [refreshKey, setRefreshKey] = useState(0)
  const [companies, setCompanies] = useState<CompanyData[]>([])
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [customerCategories, setCustomerCategories] = useState<string[]>([])
  const [callTypes, setCallTypes] = useState<string[]>([])
  const [problemOptions, setProblemOptions] = useState<string[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [productCategories, setProductCategories] = useState<{ label: string; parent: string }[]>([])
  const [productTypes, setProductTypes] = useState<{ label: string; parent: string }[]>([])
  const [modelNames, setModelNames] = useState<{ label: string; parent: string }[]>([])

  const fetchQueue = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/service-tasks?createdBy=${user._id}&status=Queued`, { credentials: "include" })
      const data = await res.json()
      if (data.success) setQueue(data.data)
    } catch (error) {
      console.error("Error fetching queue:", error)
    }
  }, [user])

  useEffect(() => {
    fetchQueue()
  }, [refreshKey, fetchQueue])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users", { credentials: "include" })
        const data = await res.json()
        if (data.users) {
          setAllUsers(data.users)
          const filtered = data.users.filter((u: UserData) => ["service", "esbd", "service_juniors", "esbd_juniors", "branch_manager", "branch_manager_juniors", "branch_service", "branch_service_juniors", "branch_sales", "branch_sales_juniors", "branch_consumable", "branch_consumable_juniors", "branch_accounts", "branch_accounts_juniors"].includes(u.role))
          setUsers(filtered)
        }
      } catch (error) {
        console.error("Error fetching users:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
    fetch("/api/companiesforservice", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.companies) setCompanies(d.companies) })
      .catch(() => {})
    fetch("/api/dropdowns?kind=customer_category", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setCustomerCategories((d.options || []).map((o: { label: string }) => o.label)) })
      .catch(() => {})
    fetch("/api/dropdowns?kind=call_type", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setCallTypes((d.options || []).map((o: { label: string }) => o.label)) })
      .catch(() => {})
    fetch("/api/dropdowns?kind=problem", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setProblemOptions((d.options || []).map((o: { label: string }) => o.label)) })
      .catch(() => {})
    fetch("/api/dropdowns?kind=department", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setDepartments((d.options || []).map((o: { label: string }) => o.label)) })
      .catch(() => {})
    fetch("/api/dropdowns?kind=product_category", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setProductCategories((d.options || []).map((o: { label: string; parent: string }) => ({ label: o.label, parent: o.parent || "" }))) })
      .catch(() => {})
    fetch("/api/dropdowns?kind=product_type", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setProductTypes((d.options || []).map((o: { label: string; parent: string }) => ({ label: o.label, parent: o.parent || "" }))) })
      .catch(() => {})
    fetch("/api/dropdowns?kind=model_name", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setModelNames((d.options || []).map((o: { label: string; parent: string }) => ({ label: o.label, parent: o.parent || "" }))) })
      .catch(() => {})
  }, [])

  const refreshQueue = () => {
    setRefreshKey((k) => k + 1)
  }

  const refreshList = () => {
    setRefreshKey((k) => k + 1)
  }

  const tabs = [
    { id: "queue" as TabType, label: "Call/Case Queue", icon: Timer },
    { id: "assign" as TabType, label: "Assign Call/Case", icon: PlusCircle },
    { id: "list" as TabType, label: "Call/Case List", icon: List },
    { id: "canceled" as TabType, label: "Canceled", icon: Ban },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Call/Case Assign</h1>
        <p className="text-slate-500">Assign and manage service calls/cases</p>
      </div>
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn("flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors relative", activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300")}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === "queue" && queue.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 text-[10px] font-bold flex items-center justify-center bg-blue-600 text-white rounded-full">{queue.length}</span>
              )}
            </button>
          ))}
          {activeTab !== "assign" && (
            <button onClick={refreshList} className="ml-auto flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors" title="Refresh list">
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </nav>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
      ) : (
        <>
          {activeTab === "queue" && (
            <QueueTab
              tasks={queue}
              users={users}
              customerCategories={customerCategories}
              callTypes={callTypes}
              onRefresh={refreshQueue}
            />
          )}
          {activeTab === "assign" && <AssignForm users={users} allUsers={allUsers} companies={companies} customerCategories={customerCategories} callTypes={callTypes} departments={departments} productCategories={productCategories} productTypes={productTypes} modelNames={modelNames} problemOptions={problemOptions} onSuccess={() => { refreshQueue(); setActiveTab("queue") }} />}
          {activeTab === "list" && user && <ServiceTaskList refreshKey={refreshKey} userId={user._id} />}
          {activeTab === "canceled" && user && <CanceledTab userId={user._id} onRefresh={refreshList} />}
        </>
      )}
    </div>
  )
}
