"use client"

import { useEffect, useState, useRef } from "react"
import axios from "axios"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { UserPlus, List, Loader2, Upload, Trash2, Edit, Search, X, Image as ImageIcon, Eye } from "lucide-react"
import { Dialog } from "@/components/ui/dialog"

interface DropdownOption {
  _id: string
  kind: string
  label: string
}

interface EngineerInfoRecord {
  _id: string
  engineerId: { _id: string; name: string; email: string; role: string }
  designation: string
  department: string
  nationalId: string
  mobileNumber: string
  altMobileNumber: string
  presentAddress: string
  permanentAddress: string
  joiningDate?: string
  bloodGroup: string
  image: string
  createdBy: { _id: string; name: string }
  createdAt: string
}

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

const ENGINEER_ROLES = [
  { value: "service", label: "Service" },
  { value: "service_juniors", label: "Service Juniors" },
  { value: "esbd", label: "ESBD" },
  { value: "esbd_juniors", label: "ESBD Juniors" },
  { value: "branch_service", label: "Branch Service" },
  { value: "branch_service_juniors", label: "Branch Service Juniors" },
]

export default function EngineerInfoPage() {
  const [activeTab, setActiveTab] = useState<"add" | "list">("add")

  const [designations, setDesignations] = useState<DropdownOption[]>([])
  const [departments, setDepartments] = useState<DropdownOption[]>([])
  const [engineers, setEngineers] = useState<EngineerInfoRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [accountName, setAccountName] = useState("")
  const [accountEmail, setAccountEmail] = useState("")
  const [accountPassword, setAccountPassword] = useState("")
  const [accountRole, setAccountRole] = useState("")
  const [designation, setDesignation] = useState("")
  const [department, setDepartment] = useState("")
  const [nationalId, setNationalId] = useState("")
  const [mobileNumber, setMobileNumber] = useState("")
  const [altMobileNumber, setAltMobileNumber] = useState("")
  const [presentAddress, setPresentAddress] = useState("")
  const [permanentAddress, setPermanentAddress] = useState("")
  const [joiningDate, setJoiningDate] = useState("")
  const [bloodGroup, setBloodGroup] = useState("")
  const [image, setImage] = useState("")
  const [imagePreview, setImagePreview] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [emailCheckStatus, setEmailCheckStatus] = useState<"idle" | "checking" | "new-user" | "existing-user" | "already-added">("idle")
  const [existingUserId, setExistingUserId] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [nameFilter, setNameFilter] = useState("")
  const [designationFilter, setDesignationFilter] = useState("")
  const [nationalIdFilter, setNationalIdFilter] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("")
  const [phoneFilter, setPhoneFilter] = useState("")
  const [joiningDateFilter, setJoiningDateFilter] = useState("")
  const [bloodGroupFilter, setBloodGroupFilter] = useState("")

  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [viewingEngineer, setViewingEngineer] = useState<EngineerInfoRecord | null>(null)

  const fetchData = async () => {
    try {
      const [desigRes, deptRes, engRes] = await Promise.all([
        axios.get("/api/dropdowns?kind=designation", { withCredentials: true }),
        axios.get("/api/dropdowns?kind=department", { withCredentials: true }),
        axios.get("/api/engineer-info", { withCredentials: true }),
      ])
      setDesignations(desigRes.data.options || [])
      setDepartments(deptRes.data.options || [])
      setEngineers(engRes.data.engineers || [])
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const resetForm = () => {
    setAccountName("")
    setAccountEmail("")
    setAccountPassword("")
    setAccountRole("")
    setDesignation("")
    setDepartment("")
    setNationalId("")
    setMobileNumber("")
    setAltMobileNumber("")
    setPresentAddress("")
    setPermanentAddress("")
    setJoiningDate("")
    setBloodGroup("")
    setImage("")
    setImagePreview("")
    setEditingId(null)
    setEmailCheckStatus("idle")
    setExistingUserId(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    setUploadingImage(true)
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader()
        r.onloadend = () => resolve(r.result as string)
        r.onerror = reject
        r.readAsDataURL(file)
      })

      const res = await axios.post("/api/upload-engineer-photo", { image: base64 }, { withCredentials: true })
      if (res.data.url) {
        setImage(res.data.url)
      }
    } catch (error) {
      console.error("Failed to upload image:", error)
      alert("Failed to upload image")
      setImagePreview("")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleEmailBlur = async () => {
    const email = accountEmail.trim()
    if (!email || editingId) return

    setEmailCheckStatus("checking")
    try {
      const res = await axios.get(`/api/engineer-info/check-user?email=${encodeURIComponent(email)}`, { withCredentials: true })
      if (res.data.found) {
        if (res.data.hasEngineerInfo) {
          setEmailCheckStatus("already-added")
          const engRes = await axios.get(`/api/engineer-info/${res.data.engineerInfoId}`, { withCredentials: true })
          const eng = engRes.data.engineer
          setEditingId(eng._id)
          setAccountName(eng.engineerId.name)
          setAccountEmail(eng.engineerId.email)
          setAccountPassword("")
          setAccountRole(eng.engineerId.role)
          setDesignation(eng.designation)
          setDepartment(eng.department || "")
          setNationalId(eng.nationalId)
          setMobileNumber(eng.mobileNumber)
          setAltMobileNumber(eng.altMobileNumber)
          setPresentAddress(eng.presentAddress)
          setPermanentAddress(eng.permanentAddress)
          setJoiningDate(eng.joiningDate ? eng.joiningDate.split("T")[0] : "")
          setBloodGroup(eng.bloodGroup)
          setImage(eng.image)
          setImagePreview(eng.image)
          setActiveTab("add")
        } else {
          setEmailCheckStatus("existing-user")
          setAccountName(res.data.user.name)
          setAccountRole(res.data.user.role)
          setExistingUserId(res.data.user._id)
        }
      } else {
        setEmailCheckStatus("new-user")
      }
    } catch {
      setEmailCheckStatus("idle")
    }
  }

  const handleSubmit = async () => {
    if (editingId) {
      if (!accountName.trim() || !accountEmail.trim() || !designation || !mobileNumber) {
        alert("Please fill in name, email, designation, and mobile number")
        return
      }
      if (accountPassword && accountPassword.length < 6) {
        alert("Password must be at least 6 characters")
        return
      }
    } else {
      if (!designation || !mobileNumber) {
        alert("Please fill in designation and mobile number")
        return
      }
      if (!existingUserId) {
        if (!accountName.trim() || !accountEmail.trim() || !accountPassword || !accountRole) {
          alert("Please fill in name, email, password, and role")
          return
        }
        if (!/^\S+@\S+\.\S+$/.test(accountEmail.trim())) {
          alert("Please enter a valid email address")
          return
        }
        if (accountPassword.length < 6) {
          alert("Password must be at least 6 characters")
          return
        }
      }
    }

    setSubmitting(true)
    try {
      if (editingId) {
        await axios.patch(
          `/api/engineer-info/${editingId}`,
          {
            name: accountName.trim(),
            email: accountEmail.trim(),
            ...(accountPassword ? { password: accountPassword } : {}),
            designation, department, nationalId, mobileNumber, altMobileNumber, presentAddress, permanentAddress, joiningDate, bloodGroup, image,
          },
          { withCredentials: true }
        )
      } else {
        await axios.post(
          "/api/engineer-info",
          {
            ...(existingUserId
              ? { existingUserId }
              : { name: accountName.trim(), email: accountEmail.trim(), password: accountPassword, role: accountRole }),
            designation, department, nationalId, mobileNumber, altMobileNumber, presentAddress, permanentAddress, joiningDate, bloodGroup, image,
          },
          { withCredentials: true }
        )
      }
      resetForm()
      await fetchData()
      setActiveTab("list")
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to save engineer info")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (eng: EngineerInfoRecord) => {
    setEditingId(eng._id)
    setAccountName(eng.engineerId.name)
    setAccountEmail(eng.engineerId.email)
    setAccountPassword("")
    setAccountRole(eng.engineerId.role)
    setDesignation(eng.designation)
    setDepartment(eng.department || "")
    setNationalId(eng.nationalId)
    setMobileNumber(eng.mobileNumber)
    setAltMobileNumber(eng.altMobileNumber)
    setPresentAddress(eng.presentAddress)
    setPermanentAddress(eng.permanentAddress)
    setJoiningDate(eng.joiningDate ? eng.joiningDate.split("T")[0] : "")
    setBloodGroup(eng.bloodGroup)
    setImage(eng.image)
    setImagePreview(eng.image)
    setEmailCheckStatus("idle")
    setExistingUserId(null)
    setActiveTab("add")
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this engineer record?")) return
    setDeleteLoading(id)
    try {
      await axios.delete(`/api/engineer-info/${id}`, { withCredentials: true })
      await fetchData()
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to delete")
    } finally {
      setDeleteLoading(null)
    }
  }

  const filteredEngineers = engineers
    .filter((eng) => {
      const searchLower = search.toLowerCase()
      const matchesSearch =
        !search ||
        eng.engineerId.name.toLowerCase().includes(searchLower) ||
        eng.mobileNumber.toLowerCase().includes(searchLower) ||
        eng.nationalId.toLowerCase().includes(searchLower)
      const matchesName =
        !nameFilter || eng.engineerId.name.toLowerCase().includes(nameFilter.toLowerCase())
      const matchesDesignation = !designationFilter || eng.designation === designationFilter
      const matchesNationalId =
        !nationalIdFilter || eng.nationalId.toLowerCase().includes(nationalIdFilter.toLowerCase())
      const matchesDepartment =
        !departmentFilter || (eng.department || "").toLowerCase().includes(departmentFilter.toLowerCase())
      const matchesPhone =
        !phoneFilter || eng.mobileNumber.toLowerCase().includes(phoneFilter.toLowerCase()) || eng.altMobileNumber.toLowerCase().includes(phoneFilter.toLowerCase())
      const matchesJoiningDate =
        !joiningDateFilter || (eng.joiningDate ? new Date(eng.joiningDate).toISOString().split("T")[0] === joiningDateFilter : false)
      const matchesBloodGroup = !bloodGroupFilter || eng.bloodGroup === bloodGroupFilter
      return matchesSearch && matchesName && matchesDesignation && matchesNationalId && matchesDepartment && matchesPhone && matchesJoiningDate && matchesBloodGroup
    })

  const uniqueDesignations = [...new Set(engineers.map((e) => e.designation))]
  const uniqueDepartments = [...new Set(engineers.map((e) => e.department).filter(Boolean))].sort()
  const engineerNames = [...new Set(engineers.map((e) => e.engineerId.name).filter(Boolean))].sort()
  const uniqueNationalIds = [...new Set(engineers.map((e) => e.nationalId).filter(Boolean))].sort()
  const uniquePhones = [...new Set(engineers.map((e) => e.mobileNumber).filter(Boolean))].sort()

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
        <h1 className="text-2xl font-bold text-slate-900">Engineer&apos;s Info</h1>
        <p className="text-slate-500">Create engineer login accounts and manage their details</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => { setActiveTab("add"); if (!editingId) resetForm() }}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "add"
              ? "bg-teal-600 text-white shadow-md"
              : "bg-white border border-slate-200 text-slate-700 hover:border-teal-300 hover:text-teal-700"
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Add Engineer&apos;s Details
        </button>
        <button
          onClick={() => { setActiveTab("list"); resetForm() }}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "list"
              ? "bg-teal-600 text-white shadow-md"
              : "bg-white border border-slate-200 text-slate-700 hover:border-teal-300 hover:text-teal-700"
          }`}
        >
          <List className="w-4 h-4" />
          Engineer&apos;s List
        </button>
      </div>

      {activeTab === "add" && (
        <Card className="border-slate-200 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-teal-600" />
              {editingId ? "Edit Engineer Details" : "Add Engineer Details"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {emailCheckStatus === "existing-user" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
                Existing user found — <strong>{accountName}</strong>. Only engineer details will be added. Name, email, password, and role are locked.
              </div>
            )}
            {emailCheckStatus === "already-added" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                This user already has engineer details. Switching to edit mode...
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Enter full name..."
                  disabled={!editingId && emailCheckStatus === "existing-user"}
                  readOnly={!editingId && emailCheckStatus === "existing-user"}
                />
              </div>

              <div className="space-y-2">
                <Label>Email (Login ID) *</Label>
                <Input
                  type="email"
                  value={accountEmail}
                  onChange={(e) => {
                    setAccountEmail(e.target.value)
                    if (emailCheckStatus !== "idle") {
                      setEmailCheckStatus("idle")
                      setExistingUserId(null)
                    }
                  }}
                  onBlur={handleEmailBlur}
                  placeholder="Enter email for login..."
                  disabled={!editingId && emailCheckStatus === "existing-user"}
                  readOnly={!editingId && emailCheckStatus === "existing-user"}
                />
                {emailCheckStatus === "checking" && (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Checking user...
                  </p>
                )}
              </div>

              {!editingId && emailCheckStatus === "existing-user" ? null : (
                <div className="space-y-2">
                  <Label>{editingId ? "New Password" : "Password *"} {editingId && "(optional)"}</Label>
                  <Input
                    type="password"
                    value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                    placeholder={editingId ? "Leave blank to keep current password..." : "Enter password (min 6 characters)..."}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>App Role *</Label>
                <Select
                  value={accountRole}
                  onChange={(e) => setAccountRole(e.target.value)}
                  disabled={!!editingId || (!editingId && emailCheckStatus === "existing-user")}
                  options={[
                    { value: "", label: editingId ? ENGINEER_ROLES.find((r) => r.value === accountRole)?.label || "Current role" : "Select app role..." },
                    ...ENGINEER_ROLES.map((r) => ({ value: r.value, label: r.label })),
                  ]}
                />
              </div>

              <div className="space-y-2">
                <Label>Designation *</Label>
                <Select
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  options={[
                    { value: "", label: "Select designation..." },
                    ...designations.map((d) => ({ value: d.label, label: d.label })),
                  ]}
                />
              </div>

              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  options={[
                    { value: "", label: "Select department..." },
                    ...departments.map((d) => ({ value: d.label, label: d.label })),
                  ]}
                />
              </div>

              <div className="space-y-2">
                <Label>National ID Number</Label>
                <Input
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="Enter national ID..."
                />
              </div>

              <div className="space-y-2">
                <Label>Mobile Number *</Label>
                <Input
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="Enter mobile number..."
                />
              </div>

              <div className="space-y-2">
                <Label>Alternative Mobile Number</Label>
                <Input
                  value={altMobileNumber}
                  onChange={(e) => setAltMobileNumber(e.target.value)}
                  placeholder="Enter alternative mobile..."
                />
              </div>

              <div className="space-y-2">
                <Label>Joining Date</Label>
                <Input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Blood Group</Label>
                <Select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  options={[
                    { value: "", label: "Select blood group..." },
                    ...BLOOD_GROUPS.map((bg) => ({ value: bg, label: bg })),
                  ]}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Present Address</Label>
                <Input
                  value={presentAddress}
                  onChange={(e) => setPresentAddress(e.target.value)}
                  placeholder="Enter present address..."
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Permanent Address</Label>
                <Input
                  value={permanentAddress}
                  onChange={(e) => setPermanentAddress(e.target.value)}
                  placeholder="Enter permanent address..."
                />
              </div>

              <div className="space-y-2">
                <Label>Image Upload</Label>
                <div className="flex items-center gap-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="engineer-image-upload"
                  />
                  <label
                    htmlFor="engineer-image-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-teal-300 hover:text-teal-700 cursor-pointer transition-colors"
                  >
                    {uploadingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {uploadingImage ? "Uploading..." : "Choose Image"}
                  </label>
                  {imagePreview && (
                    <div className="relative">
                      <img
                        src={image.startsWith("/") ? image : imagePreview}
                        alt="Preview"
                        className="w-16 h-16 rounded-lg object-cover border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => { setImage(""); setImagePreview(""); if (fileInputRef.current) fileInputRef.current.value = "" }}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button
                onClick={handleSubmit}
                disabled={submitting || uploadingImage}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                {editingId ? "Update Engineer" : "Add Engineer"}
              </Button>
              {editingId && (
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "list" && (
        <Card className="border-slate-200 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <List className="w-5 h-5 text-teal-600" />
              Engineer&apos;s List
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, mobile, or national ID..."
                  className="pl-9"
                />
              </div>
              <div className="min-w-[180px]">
                <Input
                  list="engineer-name-filter-options"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  placeholder="Filter by name..."
                />
                <datalist id="engineer-name-filter-options">
                  {engineerNames.map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
              </div>
              <div className="min-w-[180px]">
                <Select
                  value={designationFilter}
                  onChange={(e) => setDesignationFilter(e.target.value)}
                  options={[
                    { value: "", label: "All Designations" },
                    ...uniqueDesignations.map((d) => ({ value: d, label: d })),
                  ]}
                />
              </div>
              <div className="min-w-[180px]">
                <Input
                  list="engineer-dept-filter-options"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  placeholder="Filter by department..."
                />
                <datalist id="engineer-dept-filter-options">
                  {uniqueDepartments.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>
              <div className="min-w-[180px]">
                <Input
                  list="engineer-nationalid-filter-options"
                  value={nationalIdFilter}
                  onChange={(e) => setNationalIdFilter(e.target.value)}
                  placeholder="Filter by National ID..."
                />
                <datalist id="engineer-nationalid-filter-options">
                  {uniqueNationalIds.map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
              </div>
              <div className="min-w-[180px]">
                <Input
                  list="engineer-phone-filter-options"
                  value={phoneFilter}
                  onChange={(e) => setPhoneFilter(e.target.value)}
                  placeholder="Filter by phone..."
                />
                <datalist id="engineer-phone-filter-options">
                  {uniquePhones.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>
              <div className="min-w-[160px]">
                <Input
                  type="date"
                  value={joiningDateFilter}
                  onChange={(e) => setJoiningDateFilter(e.target.value)}
                  placeholder="Filter by joining date..."
                />
              </div>
              <div className="min-w-[160px]">
                <Select
                  value={bloodGroupFilter}
                  onChange={(e) => setBloodGroupFilter(e.target.value)}
                  options={[
                    { value: "", label: "All Blood Groups" },
                    ...BLOOD_GROUPS.map((bg) => ({ value: bg, label: bg })),
                  ]}
                />
              </div>
            </div>

            {filteredEngineers.length === 0 ? (
              <div className="py-12 text-center">
                <ImageIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No engineers found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Photo</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Designation</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Department</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Mobile</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">National ID</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Joining Date</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Blood Group</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEngineers.map((eng) => (
                      <tr key={eng._id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => setViewingEngineer(eng)}>
                        <td className="py-3 px-4">
                          {eng.image ? (
                            <img src={eng.image} alt={eng.engineerId.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-medium text-sm">
                              {eng.engineerId.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">{eng.engineerId.name}</td>
                        <td className="py-3 px-4 text-slate-700">{eng.designation}</td>
                        <td className="py-3 px-4 text-slate-700">{eng.department || "-"}</td>
                        <td className="py-3 px-4 text-slate-700">{eng.mobileNumber}</td>
                        <td className="py-3 px-4 text-slate-700">{eng.nationalId || "-"}</td>
                        <td className="py-3 px-4 text-slate-700">{eng.joiningDate ? new Date(eng.joiningDate).toLocaleDateString() : "-"}</td>
                        <td className="py-3 px-4 text-slate-700">{eng.bloodGroup || "-"}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingEngineer(eng)}
                              className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 h-8 w-8 p-0"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(eng)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(eng._id)}
                              disabled={deleteLoading === eng._id}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                            >
                              {deleteLoading === eng._id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="text-xs text-slate-500 pt-2">
              Showing {filteredEngineers.length} of {engineers.length} engineers
              {(search || nameFilter || designationFilter || nationalIdFilter || departmentFilter || phoneFilter || joiningDateFilter || bloodGroupFilter) && (
                <button
                  onClick={() => {
                    setSearch("")
                    setNameFilter("")
                    setDesignationFilter("")
                    setNationalIdFilter("")
                    setDepartmentFilter("")
                    setPhoneFilter("")
                    setJoiningDateFilter("")
                    setBloodGroupFilter("")
                  }}
                  className="ml-2 text-teal-600 hover:text-teal-700 underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={!!viewingEngineer}
        onClose={() => setViewingEngineer(null)}
        title="Engineer Details"
      >
        {viewingEngineer && (
          <div className="space-y-6">
            <div className="flex items-center gap-5">
              {viewingEngineer.image ? (
                <img
                  src={viewingEngineer.image}
                  alt={viewingEngineer.engineerId.name}
                  className="w-24 h-24 rounded-xl object-cover border-2 border-slate-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-3xl border-2 border-slate-200">
                  {viewingEngineer.engineerId.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold text-slate-900">{viewingEngineer.engineerId.name}</h3>
                <p className="text-sm text-slate-500">{viewingEngineer.engineerId.email}</p>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                  {viewingEngineer.designation}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Mobile Number</p>
                <p className="text-sm font-medium text-slate-900">{viewingEngineer.mobileNumber || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Alt. Mobile Number</p>
                <p className="text-sm font-medium text-slate-900">{viewingEngineer.altMobileNumber || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Designation</p>
                <p className="text-sm font-medium text-slate-900">{viewingEngineer.designation || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Department</p>
                <p className="text-sm font-medium text-slate-900">{viewingEngineer.department || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">National ID</p>
                <p className="text-sm font-medium text-slate-900">{viewingEngineer.nationalId || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Blood Group</p>
                <p className="text-sm font-medium text-slate-900">{viewingEngineer.bloodGroup || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Joining Date</p>
                <p className="text-sm font-medium text-slate-900">
                  {viewingEngineer.joiningDate ? new Date(viewingEngineer.joiningDate).toLocaleDateString() : "-"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Role</p>
                <p className="text-sm font-medium text-slate-900 capitalize">{viewingEngineer.engineerId.role.replace(/_/g, " ")}</p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Present Address</p>
              <p className="text-sm font-medium text-slate-900">{viewingEngineer.presentAddress || "-"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Permanent Address</p>
              <p className="text-sm font-medium text-slate-900">{viewingEngineer.permanentAddress || "-"}</p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => { setViewingEngineer(null); handleEdit(viewingEngineer) }}
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => setViewingEngineer(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
