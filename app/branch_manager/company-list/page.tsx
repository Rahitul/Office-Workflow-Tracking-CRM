"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Select } from "@/components/ui/select"
import { BANGLADESH_DISTRICTS } from "@/lib/project-tender-constants"
import { BANGLADESH_POLICE_STATIONS } from "@/lib/bangladesh-police-stations"
import { Building2, Plus, Pencil, Trash2, Search, X, MapPin, User, Phone, Mail, Download, Upload } from "lucide-react"
import axios from "axios"

interface Company {
  _id: string
  name: string
  group: string
  category: string
  location: string
  contactPerson: string
  contactNumber: string
  locations: CompanyLocation[]
  createdAt: string
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

interface ImportRow {
  company: string
  group: string
  category: string
  location: string
  district: string
  address: string
  contactPerson: string
  designation: string
  contactNumber: string
  email: string
}

const emptyLocation = (): CompanyLocation => ({
  location: "",
  address: "",
  district: "",
  area: "",
  contactPerson: "",
  contactNumber: "",
  contacts: [{ name: "", phone: "", email: "", designation: "" }],
})

const toLocationPayload = (loc: CompanyLocation) => ({
  location: loc.area || loc.location,
  address: loc.address || "",
  district: loc.district || "",
  area: loc.area || "",
  contactPerson: (loc.contacts && loc.contacts[0] ? loc.contacts[0].name : loc.contactPerson) || "",
  contactNumber: (loc.contacts && loc.contacts[0] ? loc.contacts[0].phone : loc.contactNumber) || "",
  contacts: loc.contacts || [],
})

export default function CompanyListPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [groups, setGroups] = useState<string[]>(["Not a group of company"])
  const [companyCategories, setCompanyCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"add" | "list">("list")
  const [formData, setFormData] = useState({ name: "", group: "Not a group of company", category: "", location: "", contactPerson: "", contactNumber: "" })
  const [formLocations, setFormLocations] = useState<CompanyLocation[]>([emptyLocation()])
  const [formGroupInput, setFormGroupInput] = useState("Not a group of company")
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const groupDropdownRef = useRef<HTMLDivElement>(null)
  const groupFilterDropdownRef = useRef<HTMLDivElement>(null)
  const categoryFilterDropdownRef = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState("")
  const [groupFilter, setGroupFilter] = useState("")
  const [groupFilterInput, setGroupFilterInput] = useState("")
  const [groupFilterDropdownOpen, setGroupFilterDropdownOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState("")
  const [categoryFilterInput, setCategoryFilterInput] = useState("")
  const [categoryFilterDropdownOpen, setCategoryFilterDropdownOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editGroup, setEditGroup] = useState("")
  const [editGroupInput, setEditGroupInput] = useState("")
  const [editCategory, setEditCategory] = useState("")
  const [editLocations, setEditLocations] = useState<CompanyLocation[]>([])
  const [editLocation, setEditLocation] = useState("")
  const [editContactPerson, setEditContactPerson] = useState("")
  const [editContactNumber, setEditContactNumber] = useState("")

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) &&
    (groupFilter === "" || c.group === groupFilter) &&
    (categoryFilter === "" || (c.category || "") === categoryFilter)
  )

  const filteredGroups = groups.filter(g => 
    g.toLowerCase().includes(groupFilterInput.toLowerCase())
  )

  const filteredCategories = companyCategories.filter(c => 
    c.toLowerCase().includes(categoryFilterInput.toLowerCase())
  )

  useEffect(() => {
    fetchCompanies()
    fetchGroups()
    fetchCompanyCategories()
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (groupDropdownRef.current && !groupDropdownRef.current.contains(event.target as Node)) {
        setGroupDropdownOpen(false)
      }
      if (groupFilterDropdownRef.current && !groupFilterDropdownRef.current.contains(event.target as Node)) {
        setGroupFilterDropdownOpen(false)
      }
      if (categoryFilterDropdownRef.current && !categoryFilterDropdownRef.current.contains(event.target as Node)) {
        setCategoryFilterDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchGroups = async () => {
    try {
      const response = await axios.get("/api/companiesforservice/groups", { withCredentials: true })
      setGroups(response.data.groups || ["Not a group of company"])
    } catch (error) {
      console.error("Failed to fetch groups:", error)
    }
  }

  const fetchCompanyCategories = async () => {
    try {
      const response = await axios.get("/api/dropdowns?kind=customer_category", { withCredentials: true })
      const options = response.data.options || []
      setCompanyCategories(options.map((o: { label: string }) => o.label))
    } catch (error) {
      console.error("Failed to fetch company categories:", error)
    }
  }

  const fetchCompanies = async () => {
    try {
      const response = await axios.get("/api/companiesforservice", { withCredentials: true })
      setCompanies(response.data.companies || [])
    } catch (error) {
      console.error("Failed to fetch companies:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportExcel = async () => {
    const ExcelJS = (await import("exceljs")).default
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet("Companies")

    sheet.columns = [
      { header: "Company", key: "company", width: 30 },
      { header: "Group", key: "group", width: 25 },
      { header: "Location", key: "location", width: 25 },
      { header: "District", key: "district", width: 20 },
      { header: "Address", key: "address", width: 40 },
      { header: "Contact Person", key: "contactPerson", width: 25 },
      { header: "Designation", key: "designation", width: 20 },
      { header: "Contact Number", key: "contactNumber", width: 20 },
      { header: "Email", key: "email", width: 30 },
      { header: "Customer Category", key: "category", width: 25 },
    ]

    const pushRow = (company: Company, loc: { location: string; district: string; address: string } | null, contact: { name: string; designation: string; phone: string; email: string }) => {
      sheet.addRow({
        company: company.name,
        group: company.group || "Not a group of company",
        location: loc ? loc.location : "",
        district: loc ? loc.district : "",
        address: loc ? loc.address : "",
        contactPerson: contact.name,
        designation: contact.designation,
        contactNumber: contact.phone,
        email: contact.email,
        category: company.category || "",
      })
    }

    companies.forEach((company) => {
      if (company.locations && company.locations.length > 0) {
        company.locations.forEach((loc) => {
          const usableContacts = (loc.contacts || []).filter((c) => c.name || c.phone || c.email || c.designation)
          if (usableContacts.length > 0) {
            usableContacts.forEach((c) => {
              pushRow(company, { location: loc.area || loc.location, district: loc.district || "", address: loc.address || "" }, { name: c.name || "", designation: c.designation || "", phone: c.phone || "", email: c.email || "" })
            })
          } else {
            pushRow(company, { location: loc.area || loc.location, district: loc.district || "", address: loc.address || "" }, { name: loc.contactPerson || "", designation: "", phone: loc.contactNumber || "", email: "" })
          }
        })
      } else {
        pushRow(company, { location: company.location || "", district: "", address: "" }, { name: company.contactPerson || "", designation: "", phone: company.contactNumber || "", email: "" })
      }
    })

    const headerRow = sheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } }
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0F766E" } }
    headerRow.alignment = { vertical: "middle", horizontal: "center" }
    headerRow.height = 22
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 10 } }

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `companies-${new Date().toISOString().slice(0, 10)}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setImporting(true)
    try {
      const ExcelJS = (await import("exceljs")).default
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(await file.arrayBuffer())
      const sheet = workbook.worksheets[0]
      if (!sheet) {
        alert("No sheet found in the selected file")
        return
      }

      const rows: ImportRow[] = []
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return
        const cell = (n: number): string => {
          const v = row.getCell(n).value
          if (typeof v === "object" && v !== null) {
            const o = v as { text?: string; result?: unknown }
            if (o.text) return String(o.text).trim()
            if (o.result !== undefined) return String(o.result).trim()
          }
          if (v === null || v === undefined) return ""
          return String(v).trim()
        }
        rows.push({
          company: cell(1),
          group: cell(2),
          location: cell(3),
          district: cell(4),
          address: cell(5),
          contactPerson: cell(6),
          designation: cell(7),
          contactNumber: cell(8),
          email: cell(9),
          category: cell(10),
        })
      })

      const companyMap = new Map<string, { name: string; group: string; category: string; locations: Map<string, { location: string; district: string; address: string; contacts: Array<{ name: string; phone: string; email: string; designation: string }> }> }>()
      for (const r of rows) {
        if (!r.company) continue
        const compKey = r.company.toLowerCase()
        let comp = companyMap.get(compKey)
        if (!comp) {
          comp = { name: r.company, group: r.group || "Not a group of company", category: r.category || "", locations: new Map() }
          companyMap.set(compKey, comp)
        }
        const locKey = `${r.location}|${r.district}|${r.address}`
        let loc = comp.locations.get(locKey)
        if (!loc) {
          loc = { location: r.location, district: r.district, address: r.address, contacts: [] }
          comp.locations.set(locKey, loc)
        }
        if (r.contactPerson || r.designation || r.contactNumber || r.email) {
          loc.contacts.push({ name: r.contactPerson, phone: r.contactNumber, email: r.email, designation: r.designation })
        }
      }

      const existingNames = new Set(companies.map((c) => c.name.toLowerCase().trim()))
      const payloads: Array<{ name: string; group: string; category: string; locations: Array<{ location: string; address: string; district: string; area: string; contactPerson: string; contactNumber: string; contacts: Array<{ name: string; phone: string; email: string; designation: string }> }> }> = []
      let skipped = 0
      for (const comp of companyMap.values()) {
        if (existingNames.has(comp.name.toLowerCase().trim())) {
          skipped++
          continue
        }
        const locations = [...comp.locations.values()]
          .filter((l) => l.location)
          .map((l) => ({
            location: l.location,
            address: l.address,
            district: l.district,
            area: l.location,
            contactPerson: l.contacts[0]?.name || "",
            contactNumber: l.contacts[0]?.phone || "",
            contacts: l.contacts,
          }))
        if (locations.length === 0) {
          skipped++
          continue
        }
        payloads.push({ name: comp.name, group: comp.group || "Not a group of company", category: comp.category || "", locations })
      }

      if (payloads.length === 0) {
        alert(`No new companies to import${skipped ? ` — ${skipped} already exist or have no valid location` : ""}`)
        return
      }

      let created = 0
      let failed = 0
      for (const p of payloads) {
        try {
          await axios.post("/api/companiesforservice", p, { withCredentials: true })
          created++
        } catch {
          failed++
        }
      }
      fetchCompanies()
      fetchGroups()
      alert(`Import finished: ${created} created, ${skipped} skipped (already exist or no valid location), ${failed} failed`)
    } catch (error) {
      console.error("Import error:", error)
      alert("Failed to import file. Make sure it matches the exported Excel format.")
    } finally {
      setImporting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    
    const validLocations = formLocations.filter(loc => loc.area.trim() !== "" || loc.location.trim() !== "")
    if (validLocations.length === 0) {
      alert("At least one location is required")
      return
    }
    
    setSubmitting(true)
    try {
      const submitData = {
        name: formData.name,
        group: formGroupInput || "Not a group of company",
        category: formData.category,
        locations: validLocations.map(toLocationPayload),
      }
      await axios.post("/api/companiesforservice", submitData, { withCredentials: true })
      setFormData({ name: "", group: "Not a group of company", category: "", location: "", contactPerson: "", contactNumber: "" })
      setFormLocations([emptyLocation()])
      setFormGroupInput("Not a group of company")
      setActiveTab("list")
      fetchCompanies()
      fetchGroups()
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to create company")
    } finally {
      setSubmitting(false)
    }
  }

  const addLocationField = () => {
    setFormLocations([...formLocations, emptyLocation()])
  }

  const removeLocationField = (index: number) => {
    if (formLocations.length > 1) {
      setFormLocations(formLocations.filter((_, i) => i !== index))
    }
  }

  const updateLocationField = (index: number, field: "location" | "address" | "district" | "area" | "contactPerson" | "contactNumber", value: string) => {
    const updated = [...formLocations]
    if (field === "district") {
      updated[index] = { ...updated[index], district: value, area: "" }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setFormLocations(updated)
  }

  const updateContactField = (locIndex: number, contactIndex: number, field: "name" | "phone" | "email" | "designation", value: string) => {
    const updated = [...formLocations]
    const contacts = [...(updated[locIndex].contacts || [])]
    contacts[contactIndex] = { ...contacts[contactIndex], [field]: value }
    updated[locIndex] = { ...updated[locIndex], contacts }
    setFormLocations(updated)
  }

  const addContactField = (locIndex: number) => {
    const updated = [...formLocations]
    updated[locIndex] = { ...updated[locIndex], contacts: [...(updated[locIndex].contacts || []), { name: "", phone: "", email: "", designation: "" }] }
    setFormLocations(updated)
  }

  const removeContactField = (locIndex: number, contactIndex: number) => {
    const updated = [...formLocations]
    const contacts = [...(updated[locIndex].contacts || [])]
    if (contacts.length > 1) {
      contacts.splice(contactIndex, 1)
      updated[locIndex] = { ...updated[locIndex], contacts }
      setFormLocations(updated)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this company?")) return
    try {
      await axios.delete(`/api/companiesforservice/${id}`, { withCredentials: true })
      setCompanies(companies.filter(c => c._id !== id))
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to delete company")
    }
  }

  const startEdit = (company: Company) => {
    setEditingId(company._id)
    setEditName(company.name)
    setEditGroup(company.group)
    setEditGroupInput(company.group)
    setEditCategory(company.category || "")
    setEditLocations(company.locations && company.locations.length > 0 ? company.locations.map(loc => ({
      location: loc.location || "",
      address: loc.address || "",
      district: loc.district || "",
      area: loc.area || "",
      contactPerson: loc.contactPerson || "",
      contactNumber: loc.contactNumber || "",
      contacts: (loc.contacts && loc.contacts.length > 0 ? loc.contacts : [{ name: loc.contactPerson || "", phone: loc.contactNumber || "", email: "", designation: "" }]),
    })) : [{ location: company.location || "", address: "", district: "", area: "", contactPerson: company.contactPerson || "", contactNumber: company.contactNumber || "", contacts: [{ name: company.contactPerson || "", phone: company.contactNumber || "", email: "", designation: "" }] }])
    setEditLocation(company.location)
    setEditContactPerson(company.contactPerson)
    setEditContactNumber(company.contactNumber)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName("")
    setEditGroup("")
    setEditGroupInput("")
    setEditCategory("")
    setEditLocations([])
    setEditLocation("")
    setEditContactPerson("")
    setEditContactNumber("")
  }

  const addEditLocationField = () => {
    setEditLocations([...editLocations, emptyLocation()])
  }

  const removeEditLocationField = (index: number) => {
    if (editLocations.length > 1) {
      setEditLocations(editLocations.filter((_, i) => i !== index))
    }
  }

  const updateEditLocationField = (index: number, field: "location" | "address" | "district" | "area" | "contactPerson" | "contactNumber", value: string) => {
    const updated = [...editLocations]
    if (field === "district") {
      updated[index] = { ...updated[index], district: value, area: "" }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setEditLocations(updated)
  }

  const updateEditContactField = (locIndex: number, contactIndex: number, field: "name" | "phone" | "email" | "designation", value: string) => {
    const updated = [...editLocations]
    const contacts = [...(updated[locIndex].contacts || [])]
    contacts[contactIndex] = { ...contacts[contactIndex], [field]: value }
    updated[locIndex] = { ...updated[locIndex], contacts }
    setEditLocations(updated)
  }

  const addEditContactField = (locIndex: number) => {
    const updated = [...editLocations]
    updated[locIndex] = { ...updated[locIndex], contacts: [...(updated[locIndex].contacts || []), { name: "", phone: "", email: "", designation: "" }] }
    setEditLocations(updated)
  }

  const removeEditContactField = (locIndex: number, contactIndex: number) => {
    const updated = [...editLocations]
    const contacts = [...(updated[locIndex].contacts || [])]
    if (contacts.length > 1) {
      contacts.splice(contactIndex, 1)
      updated[locIndex] = { ...updated[locIndex], contacts }
      setEditLocations(updated)
    }
  }

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return
    
    const validLocations = editLocations.filter(loc => loc.area.trim() !== "" || loc.location.trim() !== "")
    if (validLocations.length === 0) {
      alert("At least one location is required")
      return
    }
    
    setSubmitting(true)
    try {
      const updateData = {
        name: editName,
        group: editGroupInput,
        category: editCategory,
        locations: validLocations.map(toLocationPayload),
      }
      await axios.put(`/api/companiesforservice/${id}`, updateData, { withCredentials: true })
      setCompanies(companies.map(c => c._id === id ? { ...c, name: editName, group: editGroupInput, category: editCategory, locations: validLocations, location: validLocations[0].location, contactPerson: validLocations[0].contactPerson, contactNumber: validLocations[0].contactNumber } : c))
      setEditingId(null)
      setEditName("")
      setEditGroup("")
      setEditGroupInput("")
      setEditCategory("")
      setEditLocations([])
      setEditLocation("")
      setEditContactPerson("")
      setEditContactNumber("")
      fetchGroups()
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to update company")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Company List</h1>
        <p className="text-slate-500">Manage companies and their locations</p>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("add")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${activeTab === "add" ? "border-teal-600 text-teal-700" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}
        >
          <Plus size={16} />
          Add Company
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("list")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${activeTab === "list" ? "border-teal-600 text-teal-700" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}
        >
          <Building2 size={16} />
          Company List
        </button>
      </div>

      {activeTab === "add" && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 flex-row items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Building2 size={20} />
            </div>
            <div>
              <CardTitle>Add New Company</CardTitle>
              <p className="text-sm text-slate-500">Fill in the company details below</p>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., ABC Corporation"
                    required
                  />
                </div>
                <div ref={groupDropdownRef} className="space-y-1.5">
                  <Label htmlFor="group" className="text-sm font-medium">Group</Label>
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="group"
                        value={formGroupInput}
                        onChange={(e) => { setFormGroupInput(e.target.value); setGroupDropdownOpen(true) }}
                        onFocus={() => setGroupDropdownOpen(true)}
                        placeholder="Search for a group..."
                        className="pl-9 pr-9"
                      />
                      {formGroupInput && (
                        <button
                          type="button"
                          onClick={() => setFormGroupInput("Not a group of company")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {groupDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {groups.filter(g => g.toLowerCase().includes(formGroupInput.toLowerCase())).length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">No groups found</div>
                        ) : (
                          groups.filter(g => g.toLowerCase().includes(formGroupInput.toLowerCase())).map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => { setFormGroupInput(g); setGroupDropdownOpen(false) }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors text-gray-900 cursor-pointer"
                            >
                              <div className="font-medium">{g}</div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-sm font-medium">Customer Category</Label>
                  <Select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    options={[
                      { value: "", label: "Select category..." },
                      ...companyCategories.map((c) => ({ value: c, label: c })),
                    ]}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-slate-400" />
                    <Label className="text-sm font-semibold">Locations</Label>
                    <span className="text-xs font-medium text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">{formLocations.length}</span>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addLocationField} className="cursor-pointer">
                    <Plus size={16} className="mr-1" /> Add Location
                  </Button>
                </div>
                <div className="space-y-3">
                  {formLocations.map((loc, index) => (
                    <div key={index} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Location {index + 1}</p>
                        {formLocations.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 cursor-pointer -mr-2"
                            onClick={() => removeLocationField(index)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-slate-500">District</p>
                          <SearchableSelect
                            options={BANGLADESH_DISTRICTS.map(d => ({ value: d, label: d }))}
                            value={loc.district || ""}
                            onChange={(value) => updateLocationField(index, "district", value)}
                            placeholder="Select district..."
                          />
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-slate-500">Area (Police Station)</p>
                          <SearchableSelect
                            options={(BANGLADESH_POLICE_STATIONS[loc.district] || []).map(a => ({ value: a, label: a }))}
                            value={loc.area || ""}
                            disabled={!loc.district}
                            onChange={(value) => updateLocationField(index, "area", value)}
                            placeholder={loc.district ? "Select police station..." : "Select district first"}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-slate-500">Address</p>
                        <Input
                          value={loc.address || ""}
                          onChange={(e) => updateLocationField(index, "address", e.target.value)}
                          placeholder="Enter address"
                        />
                      </div>
                      {!loc.area && loc.location && (
                        <p className="text-xs text-slate-400">Legacy location: {loc.location}</p>
                      )}
                      <div className="border-t border-slate-200 pt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Contact Persons</p>
                          <Button type="button" variant="outline" size="sm" onClick={() => addContactField(index)} className="cursor-pointer">
                            <Plus size={16} className="mr-1" /> Add Contact
                          </Button>
                        </div>
                        {loc.contacts.map((c, ci) => (
                          <div key={ci} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] items-center">
                            <Input
                              value={c.name}
                              onChange={(e) => updateContactField(index, ci, "name", e.target.value)}
                              placeholder="Contact Person"
                            />
                            <Input
                              value={c.designation || ""}
                              onChange={(e) => updateContactField(index, ci, "designation", e.target.value)}
                              placeholder="Designation"
                            />
                            <Input
                              value={c.phone}
                              onChange={(e) => updateContactField(index, ci, "phone", e.target.value)}
                              placeholder="Contact Number"
                            />
                            <Input
                              value={c.email || ""}
                              onChange={(e) => updateContactField(index, ci, "email", e.target.value)}
                              placeholder="Email"
                            />
                            {loc.contacts.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-600 cursor-pointer"
                                onClick={() => removeContactField(index, ci)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <Button type="submit" disabled={submitting} className="bg-teal-600 hover:bg-teal-700 cursor-pointer">
                  {submitting ? "Creating..." : "Create Company"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setActiveTab("list")} className="cursor-pointer">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === "list" && (
        <>
      <div className="mb-4 flex gap-4">
        <Input
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="relative" ref={groupFilterDropdownRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={groupFilterInput || groupFilter || ""}
              onChange={(e) => { setGroupFilterInput(e.target.value); setGroupFilterDropdownOpen(true); setGroupFilter("") }}
              onFocus={() => setGroupFilterDropdownOpen(true)}
              placeholder="Filter by group..."
              className="pl-9 pr-9 w-48"
            />
            {(groupFilter || groupFilterInput) && (
              <button
                type="button"
                onClick={() => { setGroupFilter(""); setGroupFilterInput("") }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {groupFilterDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              <button
                type="button"
                onClick={() => { setGroupFilter(""); setGroupFilterInput(""); setGroupFilterDropdownOpen(false) }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors text-gray-900 font-medium"
              >
                All Groups
              </button>
              {filteredGroups.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">No groups found</div>
              ) : (
                filteredGroups.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => { setGroupFilter(g); setGroupFilterInput(g); setGroupFilterDropdownOpen(false) }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors text-gray-900"
                  >
                    {g}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        {groupFilter && (
          <Button variant="outline" size="sm" onClick={() => { setGroupFilter(""); setGroupFilterInput("") }}>
            Clear Filter
          </Button>
        )}
        <div className="relative" ref={categoryFilterDropdownRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={categoryFilterInput || categoryFilter || ""}
              onChange={(e) => { setCategoryFilterInput(e.target.value); setCategoryFilterDropdownOpen(true); setCategoryFilter("") }}
              onFocus={() => setCategoryFilterDropdownOpen(true)}
              placeholder="Filter by category..."
              className="pl-9 pr-9 w-48"
            />
            {(categoryFilter || categoryFilterInput) && (
              <button
                type="button"
                onClick={() => { setCategoryFilter(""); setCategoryFilterInput("") }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {categoryFilterDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              <button
                type="button"
                onClick={() => { setCategoryFilter(""); setCategoryFilterInput(""); setCategoryFilterDropdownOpen(false) }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors text-gray-900 font-medium"
              >
                All Categories
              </button>
              {filteredCategories.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">No categories found</div>
              ) : (
                filteredCategories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { setCategoryFilter(c); setCategoryFilterInput(c); setCategoryFilterDropdownOpen(false) }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors text-gray-900"
                  >
                    {c}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        {categoryFilter && (
          <Button variant="outline" size="sm" onClick={() => { setCategoryFilter(""); setCategoryFilterInput("") }}>
            Clear Category Filter
          </Button>
        )}
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 flex-row items-center justify-between">
          <CardTitle>All Companies</CardTitle>
          <div className="flex items-center gap-2">
            <Button onClick={exportExcel} variant="outline" size="sm" className="cursor-pointer">
              <Download size={16} className="mr-1.5" />
              Export
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm" className="cursor-pointer" disabled={importing}>
              <Upload size={16} className="mr-1.5" />
              {importing ? "Importing..." : "Import"}
            </Button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {filteredCompanies.length === 0 ? (
            <div className="py-12 text-center">
              <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No companies yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCompanies.map((company) => (
                <div key={company._id} className="group cursor-pointer rounded-xl border border-slate-200 bg-white shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                  {editingId === company._id ? (
                    <div className="flex-1 space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="edit-name" className="text-sm font-medium">Company Name</Label>
                          <Input
                            id="edit-name"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Company name"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="edit-group" className="text-sm font-medium">Group</Label>
                          <Input
                            id="edit-group"
                            list="edit-group-options"
                            value={editGroupInput}
                            onChange={(e) => setEditGroupInput(e.target.value)}
                            placeholder="Group"
                          />
                          <datalist id="edit-group-options">
                            {groups.map((g) => (
                              <option key={g} value={g} />
                            ))}
                          </datalist>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="edit-category" className="text-sm font-medium">Customer Category</Label>
                          <Select
                            id="edit-category"
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            options={[
                              { value: "", label: "Select category..." },
                              ...companyCategories.map((c) => ({ value: c, label: c })),
                            ]}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-slate-400" />
                            <Label className="text-sm font-semibold">Locations</Label>
                            <span className="text-xs font-medium text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">{editLocations.length}</span>
                          </div>
                          <Button type="button" variant="outline" size="sm" onClick={addEditLocationField} className="cursor-pointer">
                            <Plus size={16} className="mr-1" /> Add Location
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {editLocations.map((loc, idx) => (
                            <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Location {idx + 1}</p>
                                {editLocations.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-600 cursor-pointer -mr-2"
                                    onClick={() => removeEditLocationField(idx)}
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                )}
                              </div>
                              <div className="grid gap-3 sm:grid-cols-2">
                                <SearchableSelect
                                  options={BANGLADESH_DISTRICTS.map(d => ({ value: d, label: d }))}
                                  value={loc.district || ""}
                                  onChange={(value) => updateEditLocationField(idx, "district", value)}
                                  placeholder="Select district..."
                                />
                                <SearchableSelect
                                  options={(BANGLADESH_POLICE_STATIONS[loc.district] || []).map(a => ({ value: a, label: a }))}
                                  value={loc.area || ""}
                                  disabled={!loc.district}
                                  onChange={(value) => updateEditLocationField(idx, "area", value)}
                                  placeholder={loc.district ? "Select police station..." : "Select district first"}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <p className="text-xs font-medium text-slate-500">Address</p>
                                <Input
                                  value={loc.address || ""}
                                  onChange={(e) => updateEditLocationField(idx, "address", e.target.value)}
                                  placeholder="Address"
                                />
                              </div>
                              {!loc.area && loc.location && (
                                <p className="text-xs text-slate-400">Legacy location: {loc.location}</p>
                              )}
                              <div className="border-t border-slate-200 pt-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Contact Persons</p>
                                  <Button type="button" variant="outline" size="sm" onClick={() => addEditContactField(idx)} className="cursor-pointer">
                                    <Plus size={16} className="mr-1" /> Add Contact
                                  </Button>
                                </div>
                                {loc.contacts.map((c, ci) => (
                                  <div key={ci} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] items-center">
                                    <Input
                                      value={c.name}
                                      onChange={(e) => updateEditContactField(idx, ci, "name", e.target.value)}
                                      placeholder="Contact Person"
                                    />
                                    <Input
                                      value={c.designation || ""}
                                      onChange={(e) => updateEditContactField(idx, ci, "designation", e.target.value)}
                                      placeholder="Designation"
                                    />
                                    <Input
                                      value={c.phone}
                                      onChange={(e) => updateEditContactField(idx, ci, "phone", e.target.value)}
                                      placeholder="Contact Number"
                                    />
                                    <Input
                                      value={c.email || ""}
                                      onChange={(e) => updateEditContactField(idx, ci, "email", e.target.value)}
                                      placeholder="Email"
                                    />
                                    {loc.contacts.length > 1 && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-600 cursor-pointer"
                                        onClick={() => removeEditContactField(idx, ci)}
                                      >
                                        <Trash2 size={14} />
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4 border-t border-slate-100">
                        <Button size="sm" onClick={() => saveEdit(company._id)} disabled={submitting} className="bg-teal-600 hover:bg-teal-700 cursor-pointer">
                          {submitting ? "Saving..." : "Save"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit} className="cursor-pointer">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-slate-900">{company.name}</p>
                          <span className="text-[11px] font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-2 py-0.5">
                            {company.group || "Not a group of company"}
                          </span>
                          {company.category && (
                            <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-2 py-0.5">
                              {company.category}
                            </span>
                          )}
                        </div>
                        {(company.locations && company.locations.length > 0) ? (
                          <div className="mt-3 space-y-3">
                            {company.locations.map((loc, idx) => (
                              <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50/60 overflow-hidden">
                                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                                  <div className="p-3">
                                    <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                                      <MapPin size={13} /> Location
                                    </p>
                                    {(loc.area || loc.location) && (
                                      <p className="text-sm font-medium text-slate-700">{loc.area || loc.location}</p>
                                    )}
                                    {loc.district && <p className="text-sm text-slate-500">{loc.district}</p>}
                                    {loc.address && <p className="text-sm text-slate-500">{loc.address}</p>}
                                    {!loc.area && !loc.location && !loc.district && !loc.address && (
                                      <p className="text-xs text-slate-400">No location details</p>
                                    )}
                                  </div>
                                  <div className="p-3">
                                    <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                                      <User size={13} /> Contact Person
                                    </p>
                                    {loc.contacts && loc.contacts.length > 0 ? (
                                      loc.contacts.filter(c => c.name || c.phone || c.email || c.designation).length > 0 ? (
                                        <ul className="space-y-2">
                                          {loc.contacts.map((c, ci) => (
                                            (c.name || c.phone || c.email || c.designation) && (
                                              <li key={ci} className="text-sm">
                                                <p className="text-slate-700">
                                                  {c.name && <span className="font-medium">{c.name}</span>}
                                                  {c.designation && <span className="text-slate-400"> ({c.designation})</span>}
                                                </p>
                                                {c.phone && (
                                                  <p className="flex items-center gap-1 text-slate-500">
                                                    <Phone size={12} /> {c.phone}
                                                  </p>
                                                )}
                                                {c.email && (
                                                  <p className="flex items-center gap-1 text-slate-500">
                                                    <Mail size={12} /> {c.email}
                                                  </p>
                                                )}
                                              </li>
                                            )
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="text-xs text-slate-400">No contacts</p>
                                      )
                                    ) : (
                                      <p className="text-sm text-slate-600">
                                        {loc.contactPerson || "—"}
                                        {loc.contactNumber && <span className="text-slate-400"> · {loc.contactNumber}</span>}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/60 overflow-hidden">
                            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                              <div className="p-3">
                                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                                  <MapPin size={13} /> Location
                                </p>
                                {company.location ? (
                                  <p className="text-sm text-slate-600">{company.location}</p>
                                ) : (
                                  <p className="text-xs text-slate-400">—</p>
                                )}
                              </div>
                              <div className="p-3">
                                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                                  <User size={13} /> Contact Person
                                </p>
                                {company.contactPerson && (
                                  <p className="text-sm font-medium text-slate-700">{company.contactPerson}</p>
                                )}
                                {company.contactNumber && (
                                  <p className="flex items-center gap-1 text-sm text-slate-500">
                                    <Phone size={12} /> {company.contactNumber}
                                  </p>
                                )}
                                {!company.contactPerson && !company.contactNumber && (
                                  <p className="text-xs text-slate-400">—</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="grid transition-all duration-300 grid-cols-[0fr] group-hover:grid-cols-[1fr]">
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-2 pl-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                              onClick={() => startEdit(company)}
                            >
                              <Pencil size={16} />
                            </Button>
                            <Button
                              size="sm"
                              className="bg-red-500 hover:bg-red-600 text-white cursor-pointer"
                              onClick={() => handleDelete(company._id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </>
      )}
    </div>
  )
}
