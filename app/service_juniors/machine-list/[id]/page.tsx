"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, ArrowLeft, History, ClipboardList, Search, Share2 } from "lucide-react"
import { Dialog } from "@/components/ui/dialog"
import { useAuthStore } from "@/store/authStore"

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

export default function MachineDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [machine, setMachine] = useState<Machine | null>(null)
  const [loading, setLoading] = useState(true)

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

  const selectedServiceEngineer = users.find((u) => u._id === shForm.engineerId)
  const filteredServiceEngineers = users.filter((u) =>
    u.name.toLowerCase().includes(engineerSearch.toLowerCase())
  )

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (engineerDropdownRef.current && !engineerDropdownRef.current.contains(event.target as Node)) {
        setEngineerDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (!params.id) return
    setLoading(true)
    fetch(`/api/machines/${params.id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.machine) setMachine(data.machine)
      })
      .catch(console.error)
      .finally(() => setLoading(false))

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

    fetch(`/api/machines/${params.id}/service-history`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setShRecords(data.records || []))
      .catch(() => setShRecords([]))
  }, [params.id, user?._id])

  const handleCopyLink = async (regenerate = false) => {
    if (!machine) return
    setLinkRegenerating(true)
    try {
      const url = regenerate ? `/api/machines/${machine._id}/share-link?action=regenerate` : `/api/machines/${machine._id}/share-link`
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!machine) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p>Machine not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/service_juniors/machine-list")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
        </Button>
      </div>
    )
  }

  const billDateObj = machine.billDate ? new Date(machine.billDate) : null
  const warrantyExpiredObj = machine.warrantyExpired ? new Date(machine.warrantyExpired) : null
  const totalWarrantyDays = billDateObj && warrantyExpiredObj ? dayDiff(billDateObj, warrantyExpiredObj) : null
  const remainingWarrantyDays = warrantyExpiredObj ? dayDiff(new Date(), warrantyExpiredObj) : null
  const isWarrantyActive = remainingWarrantyDays !== null && remainingWarrantyDays >= 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/service_juniors/machine-list")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Machine Details</h1>
          <p className="text-slate-500">{machine.customerName} · {machine.machineId || "No ID"}</p>
        </div>
      </div>

      <Button
        onClick={() => {
          const match = users.find((u) => u._id === user?._id)
          setShForm((p) => ({ ...p, callDate: "", problem: "", solution: "", ewTaka: "", bwMeterReading: "", colorMeterReading: "", printerHeadLife: "", scan: "", attendTime: "", endTime: "", userComments: "", engineerId: match?._id || "" }))
          setEngineerSearch(match?.name || "")
          setShDialogOpen(true)
        }}
        className="bg-teal-600 hover:bg-teal-700 w-fit"
      >
        <ClipboardList className="w-4 h-4 mr-2" />
        Add Service History
      </Button>

      <div className="flex items-center gap-2">
        <Button
          onClick={() => handleCopyLink()}
          disabled={linkRegenerating}
          className="bg-blue-600 hover:bg-blue-700 w-fit"
        >
          <Share2 className="w-4 h-4 mr-2" />
          {linkCopied ? "Link Copied" : "Copy Customer Link"}
        </Button>
        <Button variant="outline" onClick={() => handleCopyLink(true)} disabled={linkRegenerating} className="w-fit text-xs">
          {linkRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Regenerate
        </Button>
      </div>

      <div className="bg-[#FDF0E6] rounded-xl border border-[#E8D5B5] p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Row 1 */}
          <div className="md:col-span-3">
            <label className="block text-[#1B2A4A] font-medium text-sm mb-1">Customer ID</label>
            <div className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 min-h-[38px]">{machine.machineId || "—"}</div>
          </div>
          <div className="md:col-span-3">
            <label className="block text-[#1B2A4A] font-medium text-sm mb-1">Group Name</label>
            <div className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 min-h-[38px]">{machine.customerGroup || "—"}</div>
          </div>
          <div className="md:col-span-3">
            <label className="block text-[#1B2A4A] font-medium text-sm mb-1">Department</label>
            <div className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 min-h-[38px]">{machine.department || "—"}</div>
          </div>
          <div className="md:col-span-3">
            <label className="block text-[#1B2A4A] font-medium text-sm mb-1">Product Category</label>
            <div className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 min-h-[38px]">{machine.productCategory || "—"}</div>
          </div>

          {/* Row 2 */}
          <div className="md:col-span-4">
            <label className="block text-[#1B2A4A] font-medium text-sm mb-1">Customer Name</label>
            <div className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 min-h-[38px]">{machine.customerName}</div>
          </div>
          <div className="md:col-span-4">
            <label className="block text-[#1B2A4A] font-medium text-sm mb-1">Bill No</label>
            <div className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 min-h-[38px]">{machine.billNumber || "—"}</div>
          </div>
          <div className="md:col-span-4">
            <label className="block text-[#1B2A4A] font-medium text-sm mb-1">Bill Date</label>
            <div className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 min-h-[38px]">{machine.billDate ? new Date(machine.billDate).toLocaleDateString() : "—"}</div>
          </div>

          {/* Row 3 */}
          <div className="md:col-span-6">
            <label className="block text-[#1B2A4A] font-medium text-sm mb-1">Location</label>
            <div className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 min-h-[38px]">{machine.location || "—"}</div>
          </div>
          <div className="md:col-span-6">
            <label className="block text-[#1B2A4A] font-medium text-sm mb-1">Address</label>
            <div className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 min-h-[38px]">{machine.address || "—"}</div>
          </div>

          {/* Row 4 */}
          <div className="md:col-span-3">
            <label className="block text-[#1B2A4A] font-medium text-sm mb-1">Brand</label>
            <div className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 min-h-[38px]">{machine.brandName || "—"}</div>
          </div>
          <div className="md:col-span-3">
            <label className="block text-[#1B2A4A] font-medium text-sm mb-1">Model</label>
            <div className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 min-h-[38px]">{machine.modelName || "—"}</div>
          </div>
          <div className="md:col-span-3">
            <label className="block text-[#1B2A4A] font-medium text-sm mb-1">Serial No</label>
            <div className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 min-h-[38px]">{machine.serialNumber || "—"}</div>
          </div>
          <div className="md:col-span-3">
            <label className="block text-[#1B2A4A] font-medium text-sm mb-1">SLA</label>
            <div className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 min-h-[38px]">{machine.sla || "—"}</div>
          </div>

          {/* Row 5 */}
          <div className="md:col-span-3">
            <label className="block text-[#1B2A4A] font-medium text-sm mb-1">Contact Person</label>
            <div className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 min-h-[38px]">{machine.contactPerson || "—"}</div>
          </div>
          <div className="md:col-span-3">
            <label className="block text-[#1B2A4A] font-medium text-sm mb-1">Mobile</label>
            <div className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 min-h-[38px]">{machine.contactNumber || "—"}</div>
          </div>
          <div className="md:col-span-3">
            <label className="block text-[#1B2A4A] font-medium text-sm mb-1">Email</label>
            <div className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 min-h-[38px]">{machine.email || "—"}</div>
          </div>
          <div className="md:col-span-3">
            <label className="block text-[#1B2A4A] font-medium text-sm mb-1">Warranty Expired</label>
            <div className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 min-h-[38px]">{machine.warrantyExpired ? new Date(machine.warrantyExpired).toLocaleDateString() : "—"}</div>
          </div>

          {/* Row 6 */}
          <div className="md:col-span-3">
            <label className="block text-[#1B2A4A] font-medium text-sm mb-1">Option</label>
            <div className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 min-h-[38px]">{machine.option || "—"}</div>
          </div>
          <div className="md:col-span-9">
            <label className="block text-[#1B2A4A] font-medium text-sm mb-1">Note</label>
            <div className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 min-h-[38px]">{machine.notes || "—"}</div>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-[#E8D5B5]">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Warranty Period</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[#1B2A4A] font-medium text-sm mb-1">Bill Date</label>
              <div className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 min-h-[38px]">{billDateObj ? billDateObj.toLocaleDateString() : "—"}</div>
            </div>
            <div>
              <label className="block text-[#1B2A4A] font-medium text-sm mb-1">Warranty Expired</label>
              <div className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 min-h-[38px]">{warrantyExpiredObj ? warrantyExpiredObj.toLocaleDateString() : "—"}</div>
            </div>
            <div>
              <label className="block text-[#1B2A4A] font-medium text-sm mb-1">Total Warranty</label>
              <div className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 min-h-[38px]">{totalWarrantyDays !== null ? formatPeriod(totalWarrantyDays) : "—"}</div>
            </div>
            <div>
              <label className="block text-[#1B2A4A] font-medium text-sm mb-1">Days Remaining</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 min-h-[38px]">{remainingWarrantyDays !== null ? formatPeriod(Math.max(remainingWarrantyDays, 0)) : "—"}</div>
                {remainingWarrantyDays !== null && (
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${isWarrantyActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {isWarrantyActive ? "Active" : "Expired"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
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

      <Dialog open={shDialogOpen} onClose={() => setShDialogOpen(false)} title="Add Service History">
        <form onSubmit={async (e) => {
          e.preventDefault()
          if (!shForm.callDate || !shForm.engineerId) return
          setShSubmitting(true)
          try {
            await fetch(`/api/machines/${machine._id}/service-history`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(shForm),
              credentials: "include",
            })
            setShDialogOpen(false)
          } catch (error) {
            console.error("Failed to add service history:", error)
          } finally {
            setShSubmitting(false)
          }
        }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <div className="px-3 py-2 text-sm text-gray-500">No engineers found</div>
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
                          className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors"
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
