"use client"

import { useEffect, useState, useMemo } from "react"
import axios from "axios"
import { useAuthStore } from "@/store/authStore"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { CheckCircle, AlertCircle, Calendar, Banknote, Pencil, Trash2 } from "lucide-react"

interface User {
  _id: string
  name: string
  role: string
}

interface DailyEntry {
  _id: string
  projectClientName: string
  month: number
  year: number
  entryDate: string
  amountBDT: number
  gpMargin: number
  executiveName: string
  notes: string
}

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
]

export default function PriceSupportPage() {
  const { user: currentUser } = useAuthStore()
  const currentYear = new Date().getFullYear()
  const currentMonth = (new Date().getMonth() + 1).toString()
  const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(y => ({ value: y.toString(), label: y.toString() }))

  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [entries, setEntries] = useState<DailyEntry[]>([])
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [usersLoading, setUsersLoading] = useState(true)

  const [projectClientName, setProjectClientName] = useState("")
  const [month, setMonth] = useState(currentMonth)
  const [year, setYear] = useState(currentYear.toString())
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0])
  const [amountBDT, setAmountBDT] = useState("")
  const [gpMargin, setGpMargin] = useState("")
  const [executiveName, setExecutiveName] = useState("")
  const [notes, setNotes] = useState("")

  const [filterMonth, setFilterMonth] = useState("")
  const [filterYear, setFilterYear] = useState("")
  const [filterProject, setFilterProject] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState("")
  const [editGpMargin, setEditGpMargin] = useState("")
  const [editNotes, setEditNotes] = useState("")

  const fetchUsers = async () => {
    setUsersLoading(true)
    try {
      const response = await axios.get("/api/users", { withCredentials: true })
      const allUsers = response.data.users || []
      const filteredUsers = allUsers.filter((u: User) => u.role === "user" || u.role === "user_juniors")
      setUsers(filteredUsers)
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setUsersLoading(false)
    }
  }

  const fetchEntries = async () => {
    try {
      const params = new URLSearchParams()
      if (filterMonth) params.append("month", filterMonth)
      if (filterYear) params.append("year", filterYear)
      if (filterProject) params.append("projectClientName", filterProject)

      const response = await axios.get(`/api/daily-price-supports?${params.toString()}`, { withCredentials: true })
      setEntries(response.data.entries || [])
    } catch (error) {
      console.error("Failed to fetch price support entries:", error)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchEntries()
  }, [])

  useEffect(() => {
    fetchEntries()
  }, [filterMonth, filterYear, filterProject])

  const validateForm = () => {
    const errors: string[] = []

    if (!projectClientName.trim()) {
      errors.push("Project/Client Name")
    }
    if (!month) {
      errors.push("Month")
    }
    if (!year) {
      errors.push("Year")
    }
    if (!entryDate) {
      errors.push("Entry Date")
    }
    if (!amountBDT || parseFloat(amountBDT) <= 0) {
      errors.push("Amount (BDT)")
    }
    if (!gpMargin || parseFloat(gpMargin) <= 0) {
      errors.push("GP Margin")
    }
    if (!executiveName) {
      errors.push("Executive Name")
    }

    if (errors.length > 0) {
      setErrorMessage(`Please fill in: ${errors.join(", ")}`)
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const monthNum = parseInt(month)
      const yearNum = parseInt(year)

      await axios.post("/api/daily-price-supports", {
        projectClientName,
        month: monthNum,
        year: yearNum,
        entryDate,
        amountBDT: parseFloat(amountBDT),
        gpMargin: parseFloat(gpMargin),
        executiveName,
        notes,
      }, { withCredentials: true })

      setSuccessMessage(`Daily price support entry added successfully`)
      setProjectClientName("")
      setAmountBDT("")
      setGpMargin("")
      setNotes("")
      setExecutiveName("")
      setEntryDate(new Date().toISOString().split("T")[0])
      fetchEntries()
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } }
      setErrorMessage(err.response?.data?.error || "Failed to add price support entry")
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT" }).format(amount)
  }

  const formatMonthYear = (month: number, year: number) => {
    return `${MONTHS.find(m => parseInt(m.value) === month)?.label} ${year}`
  }

  const handleEdit = (entry: DailyEntry) => {
    setEditingId(entry._id)
    setEditAmount(entry.amountBDT.toString())
    setEditGpMargin(entry.gpMargin.toString())
    setEditNotes(entry.notes || "")
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return
    try {
      await axios.delete(`/api/daily-price-supports/${id}`, { withCredentials: true })
      fetchEntries()
    } catch (error) {
      console.error("Failed to delete entry:", error)
    }
  }

  const handleSaveEdit = async (id: string) => {
    try {
      await axios.put(`/api/daily-price-supports/${id}`, { amountBDT: parseFloat(editAmount), gpMargin: parseFloat(editGpMargin), notes: editNotes }, { withCredentials: true })
      setEditingId(null)
      fetchEntries()
    } catch (error) {
      console.error("Failed to update entry:", error)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditAmount("")
    setEditGpMargin("")
    setEditNotes("")
  }

  const executiveOptions = useMemo(() => {
    return users.map(u => ({
      value: u.name,
      label: u.name,
    }))
  }, [users])

  const filteredEntries = useMemo(() => {
    const monthNum = filterMonth ? parseInt(filterMonth) : undefined
    const yearNum = filterYear ? parseInt(filterYear) : undefined

    return entries.filter(e => {
      if (monthNum && e.month !== monthNum) return false
      if (yearNum && e.year !== yearNum) return false
      if (filterProject && e.projectClientName !== filterProject) return false
      return true
    })
  }, [entries, filterMonth, filterYear, filterProject])

  const projectFilterOptions = useMemo(() => {
    const uniqueProjects = [...new Set(entries.map(e => e.projectClientName))]
    return uniqueProjects.map(p => ({ value: p, label: p }))
  }, [entries])

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Price Support</h1>
        <p className="text-slate-500">Add and view price support entries</p>
      </div>

      <Card className="border-slate-200 shadow-lg bg-white">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-amber-600" />
            Add Price Support Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {successMessage && (
              <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700">
                <CheckCircle className="w-5 h-5" />
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-5 h-5" />
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Month</Label>
                <Select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  options={MONTHS}
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Year</Label>
                <Select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  options={YEARS}
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Project/Client</Label>
                <Input
                  type="text"
                  value={projectClientName}
                  onChange={(e) => setProjectClientName(e.target.value)}
                  placeholder="Enter project/client name"
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Entry Date</Label>
                <Input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Amount (BDT)</Label>
                <Input
                  type="number"
                  value={amountBDT}
                  onChange={(e) => setAmountBDT(e.target.value)}
                  placeholder="Enter amount"
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">GP Margin (%)</Label>
                <Input
                  type="number"
                  value={gpMargin}
                  onChange={(e) => setGpMargin(e.target.value)}
                  placeholder="Enter GP margin"
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Executive Name</Label>
                {usersLoading ? (
                  <div className="h-10 bg-slate-50 border border-slate-200 rounded-md flex items-center px-3">
                    <span className="text-slate-400 text-sm">Loading users...</span>
                  </div>
                ) : executiveOptions.length > 0 ? (
                  <Select
                    value={executiveName}
                    onChange={(e) => setExecutiveName(e.target.value)}
                    options={[{ value: "", label: "Select Executive" }, ...executiveOptions]}
                    className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10"
                  />
                ) : (
                  <div className="h-10 bg-red-50 border border-red-200 rounded-md flex items-center px-3">
                    <span className="text-red-500 text-sm">No users found with user/user_juniors roles</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Notes (Optional)</Label>
                <Input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes"
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10"
                />
              </div>

              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={loading || usersLoading || executiveOptions.length === 0}
                  className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {loading ? "Saving..." : "Add Entry"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-lg bg-white">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            Entries List
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Month</Label>
                <Select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  options={[{ value: "", label: "All Months" }, ...MONTHS]}
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Year</Label>
                <Select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  options={[{ value: "", label: "All Years" }, ...YEARS]}
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Project/Client</Label>
                <Select
                  value={filterProject}
                  onChange={(e) => setFilterProject(e.target.value)}
                  options={[{ value: "", label: "All Projects" }, ...projectFilterOptions]}
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-10"
                />
              </div>
            </div>
          </div>

          {filteredEntries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Project/Client</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Executive</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Amount (BDT)</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">GP Margin</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Notes</th>
                    <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr key={entry._id} className="border-b border-slate-50">
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{entry.entryDate}</td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{entry.projectClientName}</td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{entry.executiveName}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-emerald-600 text-right">
                        {editingId === entry._id ? (
                          <Input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-24 h-8 text-right"
                          />
                        ) : (
                          formatAmount(entry.amountBDT)
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-slate-900 text-right">
                        {editingId === entry._id ? (
                          <Input
                            type="number"
                            value={editGpMargin}
                            onChange={(e) => setEditGpMargin(e.target.value)}
                            className="w-16 h-8 text-right"
                          />
                        ) : (
                          `${entry.gpMargin}%`
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500 max-w-xs truncate">
                        {editingId === entry._id ? (
                          <Input
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="h-8"
                          />
                        ) : (
                          entry.notes || "-"
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {editingId === entry._id ? (
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              onClick={() => handleSaveEdit(entry._id)}
                              className="h-8 px-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              Save
                            </Button>
                            <Button
                              onClick={handleCancelEdit}
                              className="h-8 px-2 bg-slate-400 hover:bg-slate-500 text-white"
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              onClick={() => handleEdit(entry)}
                              className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(entry._id)}
                              className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              No entries found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}