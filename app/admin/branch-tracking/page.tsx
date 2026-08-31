"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Dialog } from "@/components/ui/dialog"
import {
  Building2,
  Target,
  BarChart3,
  List,
  Phone,
  FileText,
  Wrench,
  Package,
  PhoneCall,
  CheckCircle,
  Loader2,
  Users,
  Mail,
  Banknote,
  TrendingUp,
  TrendingDown,
  Minus,
  ShoppingCart,
  Receipt,
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Footprints,
  X,
} from "lucide-react"
import ManageQuotationJunior from "@/components/manage-quotation-junior"
import ServiceTaskList from "@/components/service-task-list"
import { cn } from "@/lib/utils"

type TopTab = "target" | "dashboard" | "details"
type SubTab = "sales" | "service" | "consumable"

interface BranchUser {
  _id: string
  name: string
  email: string
  role: string
}

const BRANCH_ROLE_VALUES = [
  "branch_manager", "branch_manager_juniors", "branch_service", "branch_service_juniors",
  "branch_sales", "branch_sales_juniors", "branch_consumable", "branch_consumable_juniors",
  "branch_accounts", "branch_accounts_juniors",
]

interface Branch {
  _id: string
  name: string
  code: string
  users: BranchUser[]
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

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(y => ({ value: y.toString(), label: y.toString() }))

const TABS: { key: TopTab; label: string; icon: React.ElementType }[] = [
  { key: "target", label: "Target", icon: Target },
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "details", label: "Details", icon: List },
]

const SUB_TABS: { key: SubTab; label: string; icon: React.ElementType }[] = [
  { key: "sales", label: "Sales", icon: PhoneCall },
  { key: "service", label: "Service", icon: Wrench },
  { key: "consumable", label: "Consumable", icon: Package },
]

export default function AdminBranchTrackingPage() {
  const [topTab, setTopTab] = useState<TopTab>("target")
  const [subTab, setSubTab] = useState<SubTab>("sales")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="w-6 h-6" />
          Branch Tracking
        </h1>
        <p className="text-slate-500">Manage branch targets, view dashboards, and review details</p>
      </div>

      {/* Top-level tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setTopTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-all",
                topTab === tab.key
                  ? "bg-white text-blue-700 border border-b-0 border-slate-200 -mb-[3px] shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setSubTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                subTab === tab.key
                  ? "bg-blue-50 text-blue-700 border border-blue-100"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {topTab === "target" && <TargetTabContent subTab={subTab} />}
      {topTab === "dashboard" && <DashboardTabContent subTab={subTab} />}
      {topTab === "details" && <DetailsTabContent subTab={subTab} />}
    </div>
  )
}

/* ========== TARGET TAB ========== */

function TargetTabContent({ subTab }: { subTab: SubTab }) {
  switch (subTab) {
    case "sales": return <SalesTargetSection />
    case "service": return <ServiceTargetSection />
    case "consumable": return <ConsumableTargetSection />
  }
}

function SalesTargetSection() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [targets, setTargets] = useState<any[]>([])
  const [selectedBranch, setSelectedBranch] = useState("")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString())
  const [selectedYear, setSelectedYear] = useState(currentYear.toString())
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingTarget, setLoadingTarget] = useState(false)

  const [form, setForm] = useState({
    coldCallsMade: 0, followUpCallsMade: 0, newAppointmentsFixed: 0,
    customerVisitsCompleted: 0, salesEmailsSent: 0,
    quotationsIssuedTodayValue: 0,
    orderValueMfp: 0, orderValueMps: 0, orderValueBarcodePrinters: 0,
    orderValuePaperShredder: 0, orderValueDuplicator: 0,
    orderValueBarcodeScanner: 0, orderValueSolutions: 0, orderValueTender: 0,
    billValueMfp: 0, billValueMps: 0, billValueBarcodePrinters: 0,
    billValuePaperShredder: 0, billValueDuplicator: 0,
    billValueBarcodeScanner: 0, billValueSolutions: 0, billValueTender: 0,
  })

  useEffect(() => {
    fetchBranches()
    fetchTargets()
  }, [])

  const fetchBranches = async () => {
    try {
      const res = await axios.get("/api/branches", { withCredentials: true })
      setBranches(res.data.branches || [])
    } catch (err) { console.error(err) }
  }

  const fetchTargets = async () => {
    try {
      const res = await axios.get("/api/branch-sales-targets", { withCredentials: true })
      setTargets(res.data.targets || [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const branchUsers = selectedBranch
    ? (branches.find(b => b._id === selectedBranch)?.users || []).filter(u => BRANCH_ROLE_VALUES.includes(u.role))
    : []

  useEffect(() => {
    if (!selectedBranch || !selectedUserId || !selectedMonth || !selectedYear) return
    const existing = targets.find((t: any) =>
      t.branchId?._id === selectedBranch &&
      t.userId?._id === selectedUserId &&
      t.month === parseInt(selectedMonth) &&
      t.year === parseInt(selectedYear)
    )
    if (existing) {
      const resetForm: any = {}
      for (const key of Object.keys(form)) resetForm[key] = existing[key] || 0
      setForm(resetForm)
    } else {
      setForm({
        coldCallsMade: 0, followUpCallsMade: 0, newAppointmentsFixed: 0,
        customerVisitsCompleted: 0, salesEmailsSent: 0,
        quotationsIssuedTodayValue: 0,
        orderValueMfp: 0, orderValueMps: 0, orderValueBarcodePrinters: 0,
        orderValuePaperShredder: 0, orderValueDuplicator: 0,
        orderValueBarcodeScanner: 0, orderValueSolutions: 0, orderValueTender: 0,
        billValueMfp: 0, billValueMps: 0, billValueBarcodePrinters: 0,
        billValuePaperShredder: 0, billValueDuplicator: 0,
        billValueBarcodeScanner: 0, billValueSolutions: 0, billValueTender: 0,
      })
    }
  }, [selectedBranch, selectedUserId, selectedMonth, selectedYear, targets])

  const handleSave = async () => {
    if (!selectedBranch || !selectedUserId) return
    setSaving(true)
    try {
      await axios.post("/api/branch-sales-targets", {
        branchId: selectedBranch,
        userId: selectedUserId,
        month: parseInt(selectedMonth),
        year: parseInt(selectedYear),
        ...form,
      }, { withCredentials: true })
      setSuccess(true)
      fetchTargets()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  const PRODUCT_LABELS: Record<string, string> = {
    Mfp: "MFP", Mps: "MPS", BarcodePrinters: "Barcode Printers",
    PaperShredder: "Paper Shredder", Duplicator: "Duplicator",
    BarcodeScanner: "Barcode Scanner / POS", Solutions: "Solutions", Tender: "Tender / Project",
  }
  const productFields = ["Mfp", "Mps", "BarcodePrinters", "PaperShredder", "Duplicator", "BarcodeScanner", "Solutions", "Tender"]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Configure Branch Sales Target</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-700 text-sm">
              <CheckCircle className="w-4 h-4" /> Target saved successfully!
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select
                options={[{ value: "", label: "Select branch..." }, ...branches.map(b => ({ value: b._id, label: b.name }))]}
                value={selectedBranch}
                onChange={(e) => { setSelectedBranch(e.target.value); setSelectedUserId("") }}
              />
            </div>
            <div className="space-y-2">
              <Label>User</Label>
              <Select
                options={[{ value: "", label: "Select user..." }, ...branchUsers.map(u => ({ value: u._id, label: u.name }))]}
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={!selectedBranch}
              />
            </div>
            <div className="space-y-2">
              <Label>Month</Label>
              <Select options={MONTHS} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Select options={YEARS} value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} />
            </div>
          </div>
          {selectedBranch && branchUsers.length === 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
              No branch-role users found in this branch. Add users via the Branches page.
            </div>
          )}

          <div className="border-t pt-4">
            <Label className="font-semibold mb-3 block">Performance Benchmarks</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { key: "coldCallsMade", label: "Cold Calls" },
                { key: "followUpCallsMade", label: "Follow-ups" },
                { key: "newAppointmentsFixed", label: "Appointments" },
                { key: "customerVisitsCompleted", label: "Site Visits" },
                { key: "salesEmailsSent", label: "Sales Emails" },
              ].map(f => (
                <div key={f.key} className="space-y-1">
                  <Label className="text-xs">{f.label}</Label>
                  <Input type="number" value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: Number(e.target.value) })} />
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <Label className="font-semibold block">Order Value Targets (BDT)</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
              {productFields.map(p => (
                <div key={p} className="space-y-1">
                  <Label className="text-xs">{PRODUCT_LABELS[p]}</Label>
                  <Input type="number" value={(form as any)[`orderValue${p}`]} onChange={e => setForm({ ...form, [`orderValue${p}`]: Number(e.target.value) })} />
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <Label className="font-semibold block">Bill Value Targets (BDT)</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
              {productFields.map(p => (
                <div key={p} className="space-y-1">
                  <Label className="text-xs">{PRODUCT_LABELS[p]}</Label>
                  <Input type="number" value={(form as any)[`billValue${p}`]} onChange={e => setForm({ ...form, [`billValue${p}`]: Number(e.target.value) })} />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-t pt-4">
            {[
              { key: "quotationsIssuedTodayValue", label: "Quotations (Value)" },
            ].map(f => (
              <div key={f.key} className="space-y-1">
                <Label className="text-xs">{f.label}</Label>
                <Input type="number" value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: Number(e.target.value) })} />
              </div>
            ))}
          </div>

          <Button onClick={handleSave} disabled={saving || !selectedBranch || !selectedUserId} className="bg-blue-600 hover:bg-blue-700">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Target className="w-4 h-4 mr-2" /> Save Target</>}
          </Button>
        </CardContent>
      </Card>

      {/* Existing targets */}
      <Card>
        <CardHeader><CardTitle>Existing Targets</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : targets.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No targets set yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-[11px] font-bold text-slate-500 uppercase">
                    <th className="pb-2 pr-4">Branch</th>
                    <th className="pb-2 pr-4">User</th>
                    <th className="pb-2 pr-4">Period</th>
                    <th className="pb-2 pr-4">Cold Calls</th>
                    <th className="pb-2 pr-4">Follow-ups</th>
                    <th className="pb-2 pr-4">Appointments</th>
                    <th className="pb-2 pr-4">Site Visits</th>
                    <th className="pb-2 pr-4">Sales Emails</th>
                    <th className="pb-2 pr-4">Quotations (Val)</th>
                    <th className="pb-2 pr-4">Total Orders (Val)</th>
                    <th className="pb-2 pr-4">Total Bills (Val)</th>
                  </tr>
                </thead>
                <tbody>
                  {targets.map((t: any) => {
                    const totalOrderVal = ["Mfp","Mps","BarcodePrinters","PaperShredder","Duplicator","BarcodeScanner","Solutions","Tender"].reduce((s: number, p: string) => s + (t[`orderValue${p}`] || 0), 0)
                    const totalBillVal = ["Mfp","Mps","BarcodePrinters","PaperShredder","Duplicator","BarcodeScanner","Solutions","Tender"].reduce((s: number, p: string) => s + (t[`billValue${p}`] || 0), 0)
                    return (
                    <tr key={t._id} className="border-t border-slate-100">
                      <td className="py-2 pr-4 font-medium">{t.branchId?.name || "N/A"}</td>
                      <td className="py-2 pr-4">{t.userId?.name || "N/A"}</td>
                      <td className="py-2 pr-4">{MONTHS[parseInt(t.month) - 1]?.label} {t.year}</td>
                      <td className="py-2 pr-4">{t.coldCallsMade}</td>
                      <td className="py-2 pr-4">{t.followUpCallsMade}</td>
                      <td className="py-2 pr-4">{t.newAppointmentsFixed}</td>
                      <td className="py-2 pr-4">{t.customerVisitsCompleted}</td>
                      <td className="py-2 pr-4">{t.salesEmailsSent}</td>
                      <td className="py-2 pr-4">৳{(t.quotationsIssuedTodayValue || 0).toLocaleString()}</td>
                      <td className="py-2 pr-4">৳{totalOrderVal.toLocaleString()}</td>
                      <td className="py-2 pr-4">৳{totalBillVal.toLocaleString()}</td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ServiceTargetSection() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [targets, setTargets] = useState<any[]>([])
  const [selectedBranch, setSelectedBranch] = useState("")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString())
  const [selectedYear, setSelectedYear] = useState(currentYear.toString())
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ phoneCallsTarget: 0, quotationsTarget: 0, ordersTarget: 0, billsTarget: 0 })

  useEffect(() => {
    fetchBranches()
    fetchTargets()
  }, [])

  const fetchBranches = async () => {
    try { const res = await axios.get("/api/branches", { withCredentials: true }); setBranches(res.data.branches || []) } catch (err) { console.error(err) }
  }

  const fetchTargets = async () => {
    try {
      const res = await axios.get("/api/branch-service-targets", { withCredentials: true }); setTargets(res.data.targets || [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const branchUsers = selectedBranch
    ? (branches.find(b => b._id === selectedBranch)?.users || []).filter(u => BRANCH_ROLE_VALUES.includes(u.role))
    : []

  useEffect(() => {
    if (!selectedBranch || !selectedUserId || !selectedMonth || !selectedYear) return
    const existing = targets.find((t: any) =>
      t.branchId?._id === selectedBranch &&
      t.userId?._id === selectedUserId &&
      t.month === parseInt(selectedMonth) &&
      t.year === parseInt(selectedYear)
    )
    setForm({
      phoneCallsTarget: existing?.phoneCallsTarget || 0,
      quotationsTarget: existing?.quotationsTarget || 0,
      ordersTarget: existing?.ordersTarget || 0,
      billsTarget: existing?.billsTarget || 0,
    })
  }, [selectedBranch, selectedUserId, selectedMonth, selectedYear, targets])

  const handleSave = async () => {
    if (!selectedBranch || !selectedUserId) return
    setSaving(true)
    try {
      await axios.post("/api/branch-service-targets", { branchId: selectedBranch, userId: selectedUserId, month: parseInt(selectedMonth), year: parseInt(selectedYear), ...form }, { withCredentials: true })
      setSuccess(true)
      fetchTargets()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Configure Branch Service Target</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {success && <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-700 text-sm"><CheckCircle className="w-4 h-4" /> Target saved!</div>}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select options={[{ value: "", label: "Select branch..." }, ...branches.map(b => ({ value: b._id, label: b.name }))]} value={selectedBranch} onChange={(e) => { setSelectedBranch(e.target.value); setSelectedUserId("") }} />
            </div>
            <div className="space-y-2">
              <Label>User</Label>
              <Select options={[{ value: "", label: "Select user..." }, ...branchUsers.map(u => ({ value: u._id, label: u.name }))]} value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} disabled={!selectedBranch} />
            </div>
            <div className="space-y-2">
              <Label>Month</Label>
              <Select options={MONTHS} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Select options={YEARS} value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} />
            </div>
          </div>
          {selectedBranch && branchUsers.length === 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
              No branch-role users found in this branch. Add users via the Branches page.
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: "phoneCallsTarget", label: "Phone Calls" },
              { key: "quotationsTarget", label: "Quotations" },
              { key: "ordersTarget", label: "Orders" },
              { key: "billsTarget", label: "Bills" },
            ].map(f => (
              <div key={f.key} className="space-y-1">
                <Label>{f.label}</Label>
                <Input type="number" value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: Number(e.target.value) })} />
              </div>
            ))}
          </div>
          <Button onClick={handleSave} disabled={saving || !selectedBranch || !selectedUserId} className="bg-blue-600 hover:bg-blue-700">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Target"}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Existing Targets</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div> : targets.length === 0 ? <p className="text-slate-500 text-center py-8">No targets set</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-[11px] font-bold text-slate-500 uppercase">
                    <th className="pb-2 pr-4">Branch</th><th className="pb-2 pr-4">User</th><th className="pb-2 pr-4">Period</th>
                    <th className="pb-2 pr-4">Phone Calls</th><th className="pb-2 pr-4">Quotations</th>
                    <th className="pb-2 pr-4">Orders</th><th className="pb-2 pr-4">Bills</th>
                  </tr>
                </thead>
                <tbody>
                  {targets.map((t: any) => (
                    <tr key={t._id} className="border-t border-slate-100">
                      <td className="py-2 pr-4 font-medium">{t.branchId?.name || "N/A"}</td>
                      <td className="py-2 pr-4">{t.userId?.name || "N/A"}</td>
                      <td className="py-2 pr-4">{MONTHS[parseInt(t.month) - 1]?.label} {t.year}</td>
                      <td className="py-2 pr-4">{t.phoneCallsTarget}</td>
                      <td className="py-2 pr-4">{t.quotationsTarget}</td>
                      <td className="py-2 pr-4">{t.ordersTarget}</td>
                      <td className="py-2 pr-4">{t.billsTarget}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ConsumableTargetSection() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [targets, setTargets] = useState<any[]>([])
  const [selectedBranch, setSelectedBranch] = useState("")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString())
  const [selectedYear, setSelectedYear] = useState(currentYear.toString())
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    callsTarget: 0, visitsTarget: 0, quotationTarget: 0,
    orderValueBlackAndWhite: 0, orderValueColor: 0, orderValueDuplicatorInk: 0,
    orderValueDuplicatorMaster: 0, orderValueMps: 0,
    billValueBlackAndWhite: 0, billValueColor: 0, billValueDuplicatorInk: 0,
    billValueDuplicatorMaster: 0, billValueMps: 0,
  })

  useEffect(() => {
    fetchBranches()
    fetchTargets()
  }, [])

  const fetchBranches = async () => {
    try { const res = await axios.get("/api/branches", { withCredentials: true }); setBranches(res.data.branches || []) } catch (err) { console.error(err) }
  }

  const fetchTargets = async () => {
    try {
      const res = await axios.get("/api/branch-consumable-targets", { withCredentials: true }); setTargets(res.data.targets || [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const branchUsers = selectedBranch
    ? (branches.find(b => b._id === selectedBranch)?.users || []).filter(u => BRANCH_ROLE_VALUES.includes(u.role))
    : []

  useEffect(() => {
    if (!selectedBranch || !selectedUserId || !selectedMonth || !selectedYear) return
    const existing = targets.find((t: any) =>
      t.branchId?._id === selectedBranch &&
      t.userId?._id === selectedUserId &&
      t.month === parseInt(selectedMonth) &&
      t.year === parseInt(selectedYear)
    )
    if (existing) {
      const resetForm: any = {}
      for (const key of Object.keys(form)) resetForm[key] = existing[key] || 0
      setForm(resetForm)
    } else {
      setForm({
        callsTarget: 0, visitsTarget: 0, quotationTarget: 0,
        orderValueBlackAndWhite: 0, orderValueColor: 0, orderValueDuplicatorInk: 0,
        orderValueDuplicatorMaster: 0, orderValueMps: 0,
        billValueBlackAndWhite: 0, billValueColor: 0, billValueDuplicatorInk: 0,
        billValueDuplicatorMaster: 0, billValueMps: 0,
      })
    }
  }, [selectedBranch, selectedUserId, selectedMonth, selectedYear, targets])

  const handleSave = async () => {
    if (!selectedBranch || !selectedUserId) return
    setSaving(true)
    try {
      await axios.post("/api/branch-consumable-targets", { branchId: selectedBranch, userId: selectedUserId, month: parseInt(selectedMonth), year: parseInt(selectedYear), ...form }, { withCredentials: true })
      setSuccess(true)
      fetchTargets()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  const ORDER_PRODUCTS = [
    { key: "orderValueBlackAndWhite", label: "Black & White" },
    { key: "orderValueColor", label: "Color" },
    { key: "orderValueDuplicatorInk", label: "Duplicator Ink" },
    { key: "orderValueDuplicatorMaster", label: "Duplicator Master" },
    { key: "orderValueMps", label: "MPS" },
  ]

  const BILL_PRODUCTS = [
    { key: "billValueBlackAndWhite", label: "Black & White" },
    { key: "billValueColor", label: "Color" },
    { key: "billValueDuplicatorInk", label: "Duplicator Ink" },
    { key: "billValueDuplicatorMaster", label: "Duplicator Master" },
    { key: "billValueMps", label: "MPS" },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Configure Branch Consumable Target</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {success && <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-700 text-sm"><CheckCircle className="w-4 h-4" /> Target saved!</div>}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select options={[{ value: "", label: "Select branch..." }, ...branches.map(b => ({ value: b._id, label: b.name }))]} value={selectedBranch} onChange={(e) => { setSelectedBranch(e.target.value); setSelectedUserId("") }} />
            </div>
            <div className="space-y-2">
              <Label>User</Label>
              <Select options={[{ value: "", label: "Select user..." }, ...branchUsers.map(u => ({ value: u._id, label: u.name }))]} value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} disabled={!selectedBranch} />
            </div>
            <div className="space-y-2"><Label>Month</Label><Select options={MONTHS} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} /></div>
            <div className="space-y-2"><Label>Year</Label><Select options={YEARS} value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} /></div>
          </div>
          {selectedBranch && branchUsers.length === 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
              No branch-role users found in this branch. Add users via the Branches page.
            </div>
          )}
          <div className="border-t pt-4">
            <Label className="font-semibold mb-3 block">Performance Benchmarks</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key: "callsTarget", label: "Calls" },
                { key: "visitsTarget", label: "Visits" },
                { key: "quotationTarget", label: "Quotation (BDT)" },
              ].map(f => (
                <div key={f.key} className="space-y-1">
                  <Label className="text-xs">{f.label}</Label>
                  <Input type="number" value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: Number(e.target.value) })} />
                </div>
              ))}
            </div>
          </div>
          <div className="border-t pt-4">
            <Label className="font-semibold block">Order Amount Targets</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2">
              {ORDER_PRODUCTS.map(p => (
                <div key={p.key} className="space-y-1">
                  <Label className="text-xs">{p.label}</Label>
                  <Input type="number" value={(form as any)[p.key]} onChange={e => setForm({ ...form, [p.key]: Number(e.target.value) })} />
                </div>
              ))}
            </div>
            <Label className="font-semibold block mt-4">Bill Amount Targets</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2">
              {BILL_PRODUCTS.map(p => (
                <div key={p.key} className="space-y-1">
                  <Label className="text-xs">{p.label}</Label>
                  <Input type="number" value={(form as any)[p.key]} onChange={e => setForm({ ...form, [p.key]: Number(e.target.value) })} />
                </div>
              ))}
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving || !selectedBranch || !selectedUserId} className="bg-blue-600 hover:bg-blue-700">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Target"}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Existing Targets</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div> : targets.length === 0 ? <p className="text-slate-500 text-center py-8">No targets set</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-[11px] font-bold text-slate-500 uppercase">
                    <th className="pb-2 pr-4">Branch</th><th className="pb-2 pr-4">User</th><th className="pb-2 pr-4">Period</th>
                    <th className="pb-2 pr-4">Calls</th><th className="pb-2 pr-4">Visits</th>
                    <th className="pb-2 pr-4">Quotation</th>
                    <th className="pb-2 pr-4">Order Value (Total)</th>
                    <th className="pb-2 pr-4">Bill Value (Total)</th>
                  </tr>
                </thead>
                <tbody>
                  {targets.map((t: any) => {
                    const totalOrder = ["BlackAndWhite","Color","DuplicatorInk","DuplicatorMaster","Mps"].reduce((s: number, p: string) => s + (t[`orderValue${p}`] || 0), 0)
                    const totalBill = ["BlackAndWhite","Color","DuplicatorInk","DuplicatorMaster","Mps"].reduce((s: number, p: string) => s + (t[`billValue${p}`] || 0), 0)
                    return (
                    <tr key={t._id} className="border-t border-slate-100">
                      <td className="py-2 pr-4 font-medium">{t.branchId?.name || "N/A"}</td>
                      <td className="py-2 pr-4">{t.userId?.name || "N/A"}</td>
                      <td className="py-2 pr-4">{MONTHS[parseInt(t.month) - 1]?.label} {t.year}</td>
                      <td className="py-2 pr-4">{t.callsTarget}</td>
                      <td className="py-2 pr-4">{t.visitsTarget}</td>
                      <td className="py-2 pr-4">{t.quotationTarget}</td>
                      <td className="py-2 pr-4">৳{totalOrder.toLocaleString()}</td>
                      <td className="py-2 pr-4">৳{totalBill.toLocaleString()}</td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ========== DASHBOARD TAB ========== */

function DashboardTabContent({ subTab }: { subTab: SubTab }) {
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState("")
  const [dateRange, setDateRange] = useState({ start: "", end: "" })
  const hasDateRange = dateRange.start && dateRange.end
  const clearDateRange = () => setDateRange({ start: "", end: "" })
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString())
  const [selectedYear, setSelectedYear] = useState(currentYear.toString())

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await axios.get("/api/branches", { withCredentials: true })
        const fetched = res.data.branches || []
        setBranches(fetched)
        setSelectedBranch("all")
      } catch (err) { console.error(err) }
    }
    fetchBranches()
  }, [])

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Branch</Label>
              <Select
                options={[{ value: "all", label: "All Branches" }, ...branches.map(b => ({ value: b._id, label: b.name }))]}
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Start Date</Label>
              <Input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} className="text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End Date</Label>
              <div className="flex gap-2">
                <Input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} className="text-sm flex-1" />
                {hasDateRange && (
                  <Button variant="ghost" size="icon" onClick={clearDateRange} className="h-10 w-10 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                    <X size={16} />
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Target Month</Label>
              <Select options={MONTHS} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Target Year</Label>
              <Select options={YEARS} value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {subTab === "sales" && <SalesDashboardSection branchId={selectedBranch} dateRange={dateRange} month={selectedMonth} year={selectedYear} />}
      {subTab === "service" && <ServiceDashboardSection branchId={selectedBranch} dateRange={dateRange} month={selectedMonth} year={selectedYear} />}
      {subTab === "consumable" && <ConsumableDashboardSection branchId={selectedBranch} dateRange={dateRange} month={selectedMonth} year={selectedYear} />}
    </div>
  )
}

/* ─── Dashboard helpers ─────────────────────────────────────────────────── */

const calcPct = (achieved: number, target: number) => {
  if (target === 0) return achieved > 0 ? 100 : 0
  return Math.round((achieved / target) * 100)
}

const calcRangeFactor = (start: string, end: string) => {
  if (!start || !end) return 1
  const [y1, m1, d1] = start.split("-").map(Number)
  const [y2, m2, d2] = end.split("-").map(Number)
  const s = new Date(Date.UTC(y1, m1 - 1, d1))
  const e = new Date(Date.UTC(y2, m2 - 1, d2))
  const diff = Math.ceil(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
  return diff / 30
}

const ringColor = (pct: number) => {
  if (pct >= 100) return "#1D9E75"
  if (pct >= 70) return "#BA7517"
  return "#E24B4A"
}

const badgeStyle = (pct: number): React.CSSProperties => {
  if (pct >= 100) return { background: "#e8f9f0", color: "#0d6e40" }
  if (pct >= 70) return { background: "#fef3e2", color: "#9a5b00" }
  return { background: "#fdeaea", color: "#9a1f1f" }
}

const fmtValue = (v: number, isVal: boolean) => {
  if (!isVal) return v.toLocaleString()
  return "৳" + v.toLocaleString()
}

function RadialRing({ pct, size = 52, stroke = 5 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = Math.min(pct, 100) / 100 * circ
  const color = ringColor(pct)
  const cx = size / 2
  const cy = size / 2

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <circle
        cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dasharray 0.5s ease" }}
      />
    </svg>
  )
}

function TrendIcon({ pct }: { pct: number }) {
  if (pct >= 100) return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
  if (pct >= 70) return <Minus className="h-3.5 w-3.5 text-amber-500" />
  return <TrendingDown className="h-3.5 w-3.5 text-red-500" />
}

interface DashboardMetric {
  id: string
  name: string
  icon: React.ElementType
  group: "activity" | "financial"
  achieved: number
  target: number
  isValue: boolean
  productBreakdown?: { name: string; value: number; target: number }[]
}

function KpiCard({ metric, selected, onClick }: { metric: DashboardMetric; selected: boolean; onClick: () => void }) {
  const pct = calcPct(metric.achieved, metric.target)
  const Icon = metric.icon

  return (
    <button onClick={onClick} className={`w-full text-left bg-white rounded-2xl border transition-all duration-200 p-4 group ${selected ? "border-slate-900 ring-2 ring-slate-900/10 shadow-lg" : "border-slate-200 hover:border-slate-400 hover:shadow-md"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-slate-100 transition-colors">
          <Icon className="h-4 w-4 text-slate-600" />
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={badgeStyle(pct)}>{pct}%</span>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <RadialRing pct={pct} size={48} stroke={5} />
        <div className="min-w-0">
          <p className="text-lg font-black leading-none" style={{ color: ringColor(pct) }}>{pct}%</p>
          <p className="text-xs text-slate-500 mt-1 truncate font-medium">{metric.name}</p>
        </div>
      </div>
      <div className="flex justify-between border-t border-slate-100 pt-2.5 mt-1">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Achieved</p>
          <p className="text-xs font-bold text-slate-800 mt-0.5">{fmtValue(metric.achieved, metric.isValue)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target</p>
          <p className="text-xs font-bold text-slate-800 mt-0.5">{fmtValue(metric.target, metric.isValue)}</p>
        </div>
      </div>
    </button>
  )
}

function DetailPanel({ metric, userPerformances }: { metric: DashboardMetric; userPerformances: UserPerformance[] }) {
  const pct = calcPct(metric.achieved, metric.target)
  const color = ringColor(pct)
  const gap = metric.target - metric.achieved
  const Icon = metric.icon

  const BREAKDOWN_COLORS = ["#378ADD", "#7F77DD", "#D4537E", "#1D9E75", "#BA7517", "#E24B4A", "#185FA5"]

  const usersForMetric = userPerformances.map((u) => {
    const m = u.metrics.find((x) => x.id === metric.id)
    return m ? { id: u.id, name: u.name, achieved: m.achieved, target: m.target, pct: calcPct(m.achieved, m.target) } : null
  }).filter(Boolean) as { id: string; name: string; achieved: number; target: number; pct: number }[]

  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 space-y-6 mt-2">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
            <Icon className="h-5 w-5 text-slate-700" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{metric.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{metric.isValue ? "Value in BDT" : "Activity count"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TrendIcon pct={pct} />
          <span className="text-sm font-bold px-3 py-1 rounded-full" style={badgeStyle(pct)}>{pct}% achieved</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Achieved", value: metric.achieved, highlight: color },
          { label: "Target", value: metric.target, highlight: undefined },
          { label: gap > 0 ? "Remaining" : "Over target", value: Math.abs(gap), highlight: gap > 0 ? "#E24B4A" : "#1D9E75" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-3.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{s.label}</p>
            <p className="text-xl font-black" style={{ color: s.highlight ?? "#1e293b" }}>{fmtValue(s.value, metric.isValue)}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="flex justify-between text-xs font-medium text-slate-500 mb-1.5">
          <span>Progress toward target</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
        </div>
      </div>

      {metric.productBreakdown && metric.productBreakdown.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Product breakdown</p>
          <div className="space-y-2.5">
            {metric.productBreakdown.map((b, i) => {
              const bpct = calcPct(b.value, b.target)
              return (
                <div key={b.name} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: BREAKDOWN_COLORS[i % BREAKDOWN_COLORS.length] }} />
                  <p className="text-xs text-slate-600 w-32 flex-shrink-0 font-medium">{b.name}</p>
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(bpct, 100)}%`, background: BREAKDOWN_COLORS[i % BREAKDOWN_COLORS.length] }} />
                  </div>
                  <p className="text-xs font-bold text-slate-800 min-w-[52px] text-right">{fmtValue(b.value, metric.isValue)}</p>
                  <p className="text-[10px] font-bold min-w-[32px] text-right" style={{ color: ringColor(bpct) }}>{bpct}%</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {usersForMetric.length > 0 && (
        <div className="border-t border-slate-200 pt-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Team performance</p>
          <div className="space-y-3">
            {usersForMetric.map((u) => {
              const initials = u.name.split(" ").map((x: string) => x[0]).join("").slice(0, 2)
              const uColor = ringColor(u.pct)
              return (
                <div key={u.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{initials}</div>
                  <p className="text-sm font-medium text-slate-800 w-28 flex-shrink-0 truncate">{u.name}</p>
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(u.pct, 100)}%`, background: ringColor(u.pct) }} />
                  </div>
                  <p className="text-xs font-bold min-w-[36px] text-right" style={{ color: uColor }}>{u.pct}%</p>
                  <p className="text-xs text-slate-500 min-w-[60px] text-right">{fmtValue(u.achieved, metric.isValue)}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Per-User Dashboard Card ───────────────────────────────────────────── */

interface UserPerformance {
  id: string
  name: string
  metrics: DashboardMetric[]
}

function buildUserMetrics(
  userData: Record<string, number>,
  userTarget: Record<string, number>
): DashboardMetric[] {
  const orderProducts = [
    { key: "orderValueMfp", label: "MFP" }, { key: "orderValueMps", label: "MPS" },
    { key: "orderValueBarcodePrinters", label: "Barcode Printers" }, { key: "orderValuePaperShredder", label: "Paper Shredder" },
    { key: "orderValueDuplicator", label: "Duplicator" }, { key: "orderValueBarcodeScanner", label: "Barcode Scanner" },
    { key: "orderValueSolutions", label: "Solutions" }, { key: "orderValueTender", label: "Tender" },
  ]

  const billProducts = [
    { key: "billValueMfp", label: "MFP" }, { key: "billValueMps", label: "MPS" },
    { key: "billValueBarcodePrinters", label: "Barcode Printers" }, { key: "billValuePaperShredder", label: "Paper Shredder" },
    { key: "billValueDuplicator", label: "Duplicator" }, { key: "billValueBarcodeScanner", label: "Barcode Scanner" },
    { key: "billValueSolutions", label: "Solutions" }, { key: "billValueTender", label: "Tender" },
  ]

  const orderAchieved = orderProducts.reduce((s, p) => s + (userData[p.key] || 0), 0)
  const orderTarget = orderProducts.reduce((s, p) => s + (userTarget[p.key] || 0), 0)
  const billAchieved = billProducts.reduce((s, p) => s + (userData[p.key] || 0), 0)
  const billTarget = billProducts.reduce((s, p) => s + (userTarget[p.key] || 0), 0)

  return [
    {
      id: "newAppointmentsFixed", name: "New Appointments", icon: Calendar, group: "activity",
      achieved: userData.newAppointmentsFixed || 0, target: userTarget.newAppointmentsFixed || 0, isValue: false,
    },
    {
      id: "customerVisitsCompleted", name: "Customer Visits", icon: Users, group: "activity",
      achieved: userData.customerVisitsCompleted || 0, target: userTarget.customerVisitsCompleted || 0, isValue: false,
    },
    {
      id: "salesEmailsSent", name: "Sales Emails", icon: Mail, group: "activity",
      achieved: userData.salesEmailsSent || 0, target: userTarget.salesEmailsSent || 0, isValue: false,
    },
    {
      id: "quotationsIssuedToday", name: "Quotations Issued", icon: FileText, group: "activity",
      achieved: userData.quotationsIssuedToday || 0, target: userTarget.quotationsIssuedTodayValue || 0, isValue: false,
    },
    {
      id: "coldCallsMade", name: "Cold Calls", icon: Phone, group: "activity",
      achieved: userData.coldCallsMade || 0, target: userTarget.coldCallsMade || 0, isValue: false,
    },
    {
      id: "followUpCallsMade", name: "Follow Up Calls", icon: Phone, group: "activity",
      achieved: userData.followUpCallsMade || 0, target: userTarget.followUpCallsMade || 0, isValue: false,
    },
    {
      id: "orderValue", name: "Total Order Value", icon: Banknote, group: "financial",
      achieved: orderAchieved, target: orderTarget, isValue: true,
      productBreakdown: orderProducts.map(p => ({ name: p.label, value: userData[p.key] || 0, target: userTarget[p.key] || 0 })),
    },
    {
      id: "billValue", name: "Total Bill Value", icon: Banknote, group: "financial",
      achieved: billAchieved, target: billTarget, isValue: true,
      productBreakdown: billProducts.map(p => ({ name: p.label, value: userData[p.key] || 0, target: userTarget[p.key] || 0 })),
    },
  ]
}

function buildServiceUserMetrics(
  userData: Record<string, number>,
  userTarget: Record<string, number>
): DashboardMetric[] {
  return [
    { id: "phoneCalls", name: "Phone Calls", icon: Phone, group: "activity", achieved: userData.phoneCalls || 0, target: userTarget.phoneCallsTarget || 0, isValue: false },
    { id: "quotations", name: "Quotations", icon: FileText, group: "financial", achieved: userData.quotations || 0, target: userTarget.quotationsTarget || 0, isValue: true },
    { id: "orders", name: "Orders", icon: ShoppingCart, group: "financial", achieved: userData.orders || 0, target: userTarget.ordersTarget || 0, isValue: true },
    { id: "bills", name: "Bills", icon: Receipt, group: "financial", achieved: userData.bills || 0, target: userTarget.billsTarget || 0, isValue: true },
  ]
}

function buildConsumableUserMetrics(
  userData: Record<string, number>,
  userTarget: Record<string, number>
): DashboardMetric[] {
  const conOrderProducts = [
    { key: "orderValueBlackAndWhite", label: "Black & White" },
    { key: "orderValueColor", label: "Color" },
    { key: "orderValueDuplicatorInk", label: "Duplicator Ink" },
    { key: "orderValueDuplicatorMaster", label: "Duplicator Master" },
    { key: "orderValueMps", label: "MPS" },
  ]
  const conBillProducts = [
    { key: "billValueBlackAndWhite", label: "Black & White" },
    { key: "billValueColor", label: "Color" },
    { key: "billValueDuplicatorInk", label: "Duplicator Ink" },
    { key: "billValueDuplicatorMaster", label: "Duplicator Master" },
    { key: "billValueMps", label: "MPS" },
  ]

  const orderAchieved = conOrderProducts.reduce((s, p) => s + (userData[p.key] || 0), 0)
  const orderTarget = conOrderProducts.reduce((s, p) => s + (userTarget[p.key] || 0), 0)
  const billAchieved = conBillProducts.reduce((s, p) => s + (userData[p.key] || 0), 0)
  const billTarget = conBillProducts.reduce((s, p) => s + (userTarget[p.key] || 0), 0)

  return [
    { id: "visits", name: "Visits", icon: Footprints, group: "activity", achieved: userData.visits || 0, target: userTarget.visitsTarget || 0, isValue: false },
    { id: "quotation", name: "Quotations", icon: FileText, group: "activity", achieved: userData.quotation || 0, target: userTarget.quotationTarget || 0, isValue: false },
    { id: "phoneCalls", name: "Phone Calls", icon: Phone, group: "activity", achieved: userData.phoneCalls || 0, target: userTarget.callsTarget || 0, isValue: false },
    {
      id: "orderValue", name: "Total Order Value", icon: Banknote, group: "financial", achieved: orderAchieved, target: orderTarget, isValue: true,
      productBreakdown: conOrderProducts.map(p => ({ name: p.label, value: userData[p.key] || 0, target: userTarget[p.key] || 0 })),
    },
    {
      id: "billValue", name: "Total Bill Value", icon: Banknote, group: "financial", achieved: billAchieved, target: billTarget, isValue: true,
      productBreakdown: conBillProducts.map(p => ({ name: p.label, value: userData[p.key] || 0, target: userTarget[p.key] || 0 })),
    },
  ]
}

function UserPerformanceCard({ user }: { user: UserPerformance }) {
  const [expanded, setExpanded] = useState(false)
  const [selectedMetricId, setSelectedMetricId] = useState<string | null>(null)

  const overallPct = Math.round(
    user.metrics.reduce((sum, m) => sum + calcPct(m.achieved, m.target), 0) /
      user.metrics.length
  )

  const initials = user.name.split(" ").map((x) => x[0]).join("").slice(0, 2)
  const selectedMetric = user.metrics.find((m) => m.id === selectedMetricId)

  return (
    <Card className="border-slate-200 shadow-lg rounded-3xl overflow-hidden border-l-[5px] border-l-indigo-600">
      <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm">
            {initials}
          </div>
          <div>
            <p className="text-white font-bold">{user.name}</p>
            <p className="text-indigo-300/60 text-[10px] font-bold uppercase tracking-widest">Individual performance</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <RadialRing pct={overallPct} size={32} stroke={3} />
            <span className="text-sm font-bold" style={{ color: ringColor(overallPct) }}>{overallPct}% avg</span>
          </div>
          <button onClick={() => setExpanded((v) => !v)} className="text-slate-400 hover:text-white transition-colors p-1">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="px-6 py-4 flex flex-wrap gap-2 border-b border-slate-100">
        {user.metrics.map((m) => {
          const p = calcPct(m.achieved, m.target)
          return (
            <button
              key={m.id}
              onClick={() => { setExpanded(true); setSelectedMetricId((prev) => (prev === m.id ? null : m.id)) }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedMetricId === m.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>{m.name}</span>
              <span className="text-[10px] font-black" style={{ color: selectedMetricId === m.id ? "white" : ringColor(p) }}>{p}%</span>
            </button>
          )
        })}
      </div>

      {expanded && (
        <CardContent className="p-6">
          {selectedMetric ? (
            <DetailPanel metric={selectedMetric} userPerformances={[]} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {user.metrics.map((m) => (
                <KpiCard key={m.id} metric={m} selected={false} onClick={() => setSelectedMetricId(m.id)} />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

/* ─── SALES DASHBOARD ────────────────────────────────────────────────────── */

function SalesDashboardSection({ branchId, dateRange, month, year }: { branchId: string; dateRange: { start: string; end: string }; month: string; year: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
  const [activeMetricTab, setActiveMetricTab] = useState<"all" | "activity" | "financial">("all")

  useEffect(() => {
    fetchData()
  }, [branchId, dateRange, month, year])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (branchId) params.set("branchId", branchId)
      if (dateRange.start) params.set("startDate", dateRange.start)
      if (dateRange.end) params.set("endDate", dateRange.end)
      params.set("month", month)
      params.set("year", year)
      const res = await axios.get(`/api/branch-dashboard/sales?${params}`, { withCredentials: true })
      setData(res.data)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
  if (!data) return <Card><CardContent className="p-8 text-center text-slate-500">Failed to load dashboard data</CardContent></Card>

  const a = data.aggregated
  const t = data.target || {}
  const userTargetMap = data.userTargetMap || {}
  const rangeFactor = calcRangeFactor(dateRange.start, dateRange.end)

  const orderProducts = [
    { key: "orderValueMfp", label: "MFP" }, { key: "orderValueMps", label: "MPS" },
    { key: "orderValueBarcodePrinters", label: "Barcode Printers" }, { key: "orderValuePaperShredder", label: "Paper Shredder" },
    { key: "orderValueDuplicator", label: "Duplicator" }, { key: "orderValueBarcodeScanner", label: "Barcode Scanner" },
    { key: "orderValueSolutions", label: "Solutions" }, { key: "orderValueTender", label: "Tender" },
  ]

  const billProducts = [
    { key: "billValueMfp", label: "MFP" }, { key: "billValueMps", label: "MPS" },
    { key: "billValueBarcodePrinters", label: "Barcode Printers" }, { key: "billValuePaperShredder", label: "Paper Shredder" },
    { key: "billValueDuplicator", label: "Duplicator" }, { key: "billValueBarcodeScanner", label: "Barcode Scanner" },
    { key: "billValueSolutions", label: "Solutions" }, { key: "billValueTender", label: "Tender" },
  ]

  const hasTarget = data.target !== null

  const activityMetrics: DashboardMetric[] = [
    { id: "newAppointmentsFixed", name: "New Appointments", icon: Calendar, group: "activity", achieved: a.newAppointmentsFixed || 0, target: Math.round((t.newAppointmentsFixed || 0) * rangeFactor), isValue: false },
    { id: "customerVisitsCompleted", name: "Customer Visits", icon: Users, group: "activity", achieved: a.customerVisitsCompleted || 0, target: Math.round((t.customerVisitsCompleted || 0) * rangeFactor), isValue: false },
    { id: "salesEmailsSent", name: "Sales Emails", icon: Mail, group: "activity", achieved: a.salesEmailsSent || 0, target: Math.round((t.salesEmailsSent || 0) * rangeFactor), isValue: false },
    { id: "quotationsIssuedToday", name: "Quotations Issued", icon: FileText, group: "activity", achieved: a.quotationsIssuedToday || 0, target: Math.round((t.quotationsIssuedTodayValue || 0) * rangeFactor), isValue: false },
    { id: "coldCallsMade", name: "Cold Calls", icon: Phone, group: "activity", achieved: a.coldCallsMade || 0, target: Math.round((t.coldCallsMade || 0) * rangeFactor), isValue: false },
    { id: "followUpCallsMade", name: "Follow Up Calls", icon: Phone, group: "activity", achieved: a.followUpCallsMade || 0, target: Math.round((t.followUpCallsMade || 0) * rangeFactor), isValue: false },
  ]

  const orderTotal = a.orderValueMfp + a.orderValueMps + a.orderValueBarcodePrinters + a.orderValuePaperShredder + a.orderValueDuplicator + a.orderValueBarcodeScanner + a.orderValueSolutions + a.orderValueTender
  const orderTargetTotal = Math.round((((t.orderValueMfp || 0) + (t.orderValueMps || 0) + (t.orderValueBarcodePrinters || 0) + (t.orderValuePaperShredder || 0) + (t.orderValueDuplicator || 0) + (t.orderValueBarcodeScanner || 0) + (t.orderValueSolutions || 0) + (t.orderValueTender || 0)) * rangeFactor))

  const billTotal = a.billValueMfp + a.billValueMps + a.billValueBarcodePrinters + a.billValuePaperShredder + a.billValueDuplicator + a.billValueBarcodeScanner + a.billValueSolutions + a.billValueTender
  const billTargetTotal = Math.round((((t.billValueMfp || 0) + (t.billValueMps || 0) + (t.billValueBarcodePrinters || 0) + (t.billValuePaperShredder || 0) + (t.billValueDuplicator || 0) + (t.billValueBarcodeScanner || 0) + (t.billValueSolutions || 0) + (t.billValueTender || 0)) * rangeFactor))

  const financialMetrics: DashboardMetric[] = [
    {
      id: "orderValue", name: "Total Order Value", icon: Banknote, group: "financial", achieved: orderTotal, target: orderTargetTotal, isValue: true,
      productBreakdown: orderProducts.map(p => ({ name: p.label, value: (a as any)[p.key] || 0, target: Math.round(((t as any)[p.key] || 0) * rangeFactor) })),
    },
    {
      id: "billValue", name: "Total Bill Value", icon: Banknote, group: "financial", achieved: billTotal, target: billTargetTotal, isValue: true,
      productBreakdown: billProducts.map(p => ({ name: p.label, value: (a as any)[p.key] || 0, target: Math.round(((t as any)[p.key] || 0) * rangeFactor) })),
    },
  ]

  const allMetrics = [...activityMetrics, ...financialMetrics]
  const visibleMetrics = allMetrics.filter(m => activeMetricTab === "all" || m.group === activeMetricTab)
  const selected = visibleMetrics.find(m => m.id === selectedMetric) ?? visibleMetrics[0]

  const prorateTarget = (obj: any) => {
    if (!obj) return obj
    const prorated: any = {}
    for (const [k, v] of Object.entries(obj)) {
      prorated[k] = typeof v === "number" ? Math.round(v * rangeFactor) : v
    }
    return prorated
  }

  const userPerformances: UserPerformance[] = (() => {
    const seen = new Set<string>()
    const result: UserPerformance[] = []
    for (const [uid, u] of Object.entries(data.userActivityMap || {}) as any[]) {
      if (userTargetMap[uid] || branchId === "all") {
        result.push({ id: uid, name: u.name, metrics: buildUserMetrics(u.data, prorateTarget(userTargetMap[uid] || {})) })
        seen.add(uid)
      }
    }
    for (const [uid] of Object.entries(data.userTargetMap || {})) {
      if (!seen.has(uid)) {
        result.push({ id: uid, name: data.userActivityMap?.[uid]?.name || userTargetMap[uid]._name || "User", metrics: buildUserMetrics({}, prorateTarget(userTargetMap[uid])) })
        seen.add(uid)
      }
    }
    return result
  })()

  return (
    <div className="space-y-4">
      {!hasTarget && branchId !== "all" && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
          No target set for this branch/period. KPIs show achieved counts without target comparison. Set a target in the Target tab.
        </div>
      )}
      <div className="text-xs text-slate-400 mb-2">{userPerformances.length} {"user" + (userPerformances.length !== 1 ? "s" : "")}{branchId === "all" ? " in this period" : " with targets in this period"}</div>

      <div className="flex gap-2 flex-wrap">
        {([{ key: "all", label: "All metrics" }, { key: "activity", label: "Activity" }, { key: "financial", label: "Financial" }] as const).map((tab) => (
          <button key={tab.key} onClick={() => { setActiveMetricTab(tab.key); setSelectedMetric(null) }}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
              activeMetricTab === tab.key
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {visibleMetrics.map(m => (
          <KpiCard key={m.id} metric={m} selected={selectedMetric === m.id} onClick={() => setSelectedMetric(selectedMetric === m.id ? null : m.id)} />
        ))}
      </div>

      {selected && <DetailPanel metric={selected} userPerformances={userPerformances} />}

      {userPerformances.length > 0 && (
        <div className="space-y-5 border-t border-slate-200 pt-6 mt-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-md shadow-slate-200">
              <Target className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Individual performance</h2>
          </div>
          <div className="space-y-5">
            {userPerformances.map((user) => (
              <UserPerformanceCard key={user.id} user={user} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── SERVICE DASHBOARD ──────────────────────────────────────────────────── */

function ServiceDashboardSection({ branchId, dateRange, month, year }: { branchId: string; dateRange: { start: string; end: string }; month: string; year: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
  const [activeMetricTab, setActiveMetricTab] = useState<"all" | "activity" | "financial">("all")

  useEffect(() => {
    fetchData()
  }, [branchId, dateRange, month, year])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (branchId) params.set("branchId", branchId)
      if (dateRange.start) params.set("startDate", dateRange.start)
      if (dateRange.end) params.set("endDate", dateRange.end)
      params.set("month", month)
      params.set("year", year)
      const res = await axios.get(`/api/branch-dashboard/service?${params}`, { withCredentials: true })
      setData(res.data)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
  if (!data) return <Card><CardContent className="p-8 text-center text-slate-500">Failed to load dashboard data</CardContent></Card>

  const a = data.aggregated
  const t = data.target || {}
  const userTargetMap = data.userTargetMap || {}
  const rangeFactor = calcRangeFactor(dateRange.start, dateRange.end)
  const hasTarget = data.target !== null

  const metrics: DashboardMetric[] = [
    { id: "phoneCalls", name: "Phone Calls", icon: Phone, group: "activity", achieved: a.phoneCalls || 0, target: Math.round((t.phoneCallsTarget || 0) * rangeFactor), isValue: false },
    { id: "quotations", name: "Quotations", icon: FileText, group: "financial", achieved: a.quotations || 0, target: Math.round((t.quotationsTarget || 0) * rangeFactor), isValue: true },
    { id: "orders", name: "Orders", icon: ShoppingCart, group: "financial", achieved: a.orders || 0, target: Math.round((t.ordersTarget || 0) * rangeFactor), isValue: true },
    { id: "bills", name: "Bills", icon: Receipt, group: "financial", achieved: a.bills || 0, target: Math.round((t.billsTarget || 0) * rangeFactor), isValue: true },
  ]

  const visibleMetrics = metrics.filter(m => activeMetricTab === "all" || m.group === activeMetricTab)
  const selected = visibleMetrics.find(m => m.id === selectedMetric)

  const prorateTarget = (obj: any) => {
    if (!obj) return obj
    const prorated: any = {}
    for (const [k, v] of Object.entries(obj)) {
      prorated[k] = typeof v === "number" ? Math.round(v * rangeFactor) : v
    }
    return prorated
  }

  const userPerformances: UserPerformance[] = (() => {
    const seen = new Set<string>()
    const result: UserPerformance[] = []
    for (const [uid, u] of Object.entries(data.userActivityMap || {}) as any[]) {
      if (userTargetMap[uid] || branchId === "all") {
        result.push({ id: uid, name: u.name, metrics: buildServiceUserMetrics(u.data, prorateTarget(userTargetMap[uid] || {})) })
        seen.add(uid)
      }
    }
    for (const [uid] of Object.entries(data.userTargetMap || {})) {
      if (!seen.has(uid)) {
        result.push({ id: uid, name: data.userActivityMap?.[uid]?.name || userTargetMap[uid]._name || "User", metrics: buildServiceUserMetrics({}, prorateTarget(userTargetMap[uid])) })
        seen.add(uid)
      }
    }
    return result
  })()

  return (
    <div className="space-y-4">
      {!hasTarget && branchId !== "all" && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
          No target set for this branch/period. KPIs show achieved values without target comparison. Set a target in the Target tab.
        </div>
      )}
      <div className="text-xs text-slate-400 mb-2">{userPerformances.length} {"user" + (userPerformances.length !== 1 ? "s" : "")}{branchId === "all" ? " in this period" : " with targets in this period"}</div>

      <div className="flex gap-2 flex-wrap">
        {([{ key: "all", label: "All metrics" }, { key: "activity", label: "Activity" }, { key: "financial", label: "Financial" }] as const).map((tab) => (
          <button key={tab.key} onClick={() => { setActiveMetricTab(tab.key); setSelectedMetric(null) }}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
              activeMetricTab === tab.key
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {visibleMetrics.map(m => (
          <KpiCard key={m.id} metric={m} selected={selectedMetric === m.id} onClick={() => setSelectedMetric(selectedMetric === m.id ? null : m.id)} />
        ))}
      </div>

      {selected && <DetailPanel metric={selected} userPerformances={userPerformances} />}

      {userPerformances.length > 0 && (
        <div className="space-y-5 border-t border-slate-200 pt-6 mt-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-md shadow-slate-200">
              <Target className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Individual performance</h2>
          </div>
          <div className="space-y-5">
            {userPerformances.map((user) => (
              <UserPerformanceCard key={user.id} user={user} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── CONSUMABLE DASHBOARD ───────────────────────────────────────────────── */

function ConsumableDashboardSection({ branchId, dateRange, month, year }: { branchId: string; dateRange: { start: string; end: string }; month: string; year: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
  const [activeMetricTab, setActiveMetricTab] = useState<"all" | "activity" | "financial">("all")

  useEffect(() => {
    fetchData()
  }, [branchId, dateRange, month, year])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (branchId) params.set("branchId", branchId)
      if (dateRange.start) params.set("startDate", dateRange.start)
      if (dateRange.end) params.set("endDate", dateRange.end)
      params.set("month", month)
      params.set("year", year)
      const res = await axios.get(`/api/branch-dashboard/consumable?${params}`, { withCredentials: true })
      setData(res.data)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
  if (!data) return <Card><CardContent className="p-8 text-center text-slate-500">Failed to load dashboard data</CardContent></Card>

  const a = data.aggregated
  const t = data.target || {}
  const userTargetMap = data.userTargetMap || {}
  const rangeFactor = calcRangeFactor(dateRange.start, dateRange.end)

  const conOrderProducts = [
    { key: "orderValueBlackAndWhite", label: "Black & White" }, { key: "orderValueColor", label: "Color" },
    { key: "orderValueDuplicatorInk", label: "Duplicator Ink" }, { key: "orderValueDuplicatorMaster", label: "Duplicator Master" },
    { key: "orderValueMps", label: "MPS" },
  ]

  const conBillProducts = [
    { key: "billValueBlackAndWhite", label: "Black & White" }, { key: "billValueColor", label: "Color" },
    { key: "billValueDuplicatorInk", label: "Duplicator Ink" }, { key: "billValueDuplicatorMaster", label: "Duplicator Master" },
    { key: "billValueMps", label: "MPS" },
  ]

  const hasTarget = data.target !== null

  const activityMetrics: DashboardMetric[] = [
    { id: "visits", name: "Visits", icon: Footprints, group: "activity", achieved: a.visits || 0, target: Math.round((t.visitsTarget || 0) * rangeFactor), isValue: false },
    { id: "quotation", name: "Quotations", icon: FileText, group: "activity", achieved: a.quotation || 0, target: Math.round((t.quotationTarget || 0) * rangeFactor), isValue: false },
    { id: "phoneCalls", name: "Phone Calls", icon: Phone, group: "activity", achieved: a.phoneCalls || 0, target: Math.round((t.callsTarget || 0) * rangeFactor), isValue: false },
  ]

  const orderTotal = conOrderProducts.reduce((sum, p) => sum + ((a as any)[p.key] || 0), 0)
  const orderTargetTotal = Math.round(conOrderProducts.reduce((sum, p) => sum + ((t as any)[p.key] || 0), 0) * rangeFactor)

  const billTotal = conBillProducts.reduce((sum, p) => sum + ((a as any)[p.key] || 0), 0)
  const billTargetTotal = Math.round(conBillProducts.reduce((sum, p) => sum + ((t as any)[p.key] || 0), 0) * rangeFactor)

  const financialMetrics: DashboardMetric[] = [
    {
      id: "orderValue", name: "Total Order Value", icon: Banknote, group: "financial", achieved: orderTotal, target: orderTargetTotal, isValue: true,
      productBreakdown: conOrderProducts.map(p => ({ name: p.label, value: (a as any)[p.key] || 0, target: Math.round(((t as any)[p.key] || 0) * rangeFactor) })),
    },
    {
      id: "billValue", name: "Total Bill Value", icon: Banknote, group: "financial", achieved: billTotal, target: billTargetTotal, isValue: true,
      productBreakdown: conBillProducts.map(p => ({ name: p.label, value: (a as any)[p.key] || 0, target: Math.round(((t as any)[p.key] || 0) * rangeFactor) })),
    },
  ]

  const allMetrics = [...activityMetrics, ...financialMetrics]
  const visibleMetrics = allMetrics.filter(m => activeMetricTab === "all" || m.group === activeMetricTab)
  const selected = visibleMetrics.find(m => m.id === selectedMetric) ?? visibleMetrics[0]

  const prorateTarget = (obj: any) => {
    if (!obj) return obj
    const prorated: any = {}
    for (const [k, v] of Object.entries(obj)) {
      prorated[k] = typeof v === "number" ? Math.round(v * rangeFactor) : v
    }
    return prorated
  }

  const userPerformances: UserPerformance[] = (() => {
    const seen = new Set<string>()
    const result: UserPerformance[] = []
    for (const [uid, u] of Object.entries(data.userActivityMap || {}) as any[]) {
      if (userTargetMap[uid] || branchId === "all") {
        result.push({ id: uid, name: u.name, metrics: buildConsumableUserMetrics(u.data, prorateTarget(userTargetMap[uid] || {})) })
        seen.add(uid)
      }
    }
    for (const [uid] of Object.entries(data.userTargetMap || {})) {
      if (!seen.has(uid)) {
        result.push({ id: uid, name: data.userActivityMap?.[uid]?.name || userTargetMap[uid]._name || "User", metrics: buildConsumableUserMetrics({}, prorateTarget(userTargetMap[uid])) })
        seen.add(uid)
      }
    }
    return result
  })()

  const comparisonChartData = userPerformances.map((up) => {
    const phoneCallsMetric = up.metrics.find((m) => m.id === "phoneCalls")
    const userActs = data.userActivityMap?.[up.id]?.data || {}
    const totalQuotationQty = userActs.quotationQty || 0
    return {
      name: up.name,
      Calls: phoneCallsMetric?.achieved || 0,
      "Quotation Qty": totalQuotationQty,
    }
  })

  return (
    <div className="space-y-4">
      {!hasTarget && branchId !== "all" && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
          No target set for this branch/period. KPIs show achieved counts without target comparison. Set a target in the Target tab.
        </div>
      )}
      <div className="text-xs text-slate-400 mb-2">{userPerformances.length} {"user" + (userPerformances.length !== 1 ? "s" : "")}{branchId === "all" ? " in this period" : " with targets in this period"}</div>

      <div className="flex gap-2 flex-wrap">
        {([{ key: "all", label: "All metrics" }, { key: "activity", label: "Activity" }, { key: "financial", label: "Financial" }] as const).map((tab) => (
          <button key={tab.key} onClick={() => { setActiveMetricTab(tab.key); setSelectedMetric(null) }}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
              activeMetricTab === tab.key
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {visibleMetrics.map(m => (
          <KpiCard key={m.id} metric={m} selected={selectedMetric === m.id} onClick={() => setSelectedMetric(selectedMetric === m.id ? null : m.id)} />
        ))}
      </div>

      {selected && <DetailPanel metric={selected} userPerformances={userPerformances} />}

      {comparisonChartData.length > 0 && (
        <div className="space-y-4 border-t border-slate-200 pt-6 mt-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Calls vs Quotation Quantity</h2>
          </div>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Team Member</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Calls</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Quotation Qty</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Ratio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {comparisonChartData.map((row) => {
                    const ratio = row.Calls > 0 ? Math.round((row["Quotation Qty"] / row.Calls) * 100) : null
                    return (
                      <tr key={row.name} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">{row.name}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1.5 font-bold text-blue-600">
                            <Phone className="h-3.5 w-3.5" />
                            {row.Calls}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1.5 font-bold text-teal-600">
                            <Package className="h-3.5 w-3.5" />
                            {row["Quotation Qty"]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={`px-2 py-0.5 text-xs font-bold border-none ${
                            ratio === null ? "bg-slate-100 text-slate-500" :
                            ratio >= 100 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                          }`}>
                            {ratio === null ? "N/A" : `${ratio}%`}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {userPerformances.length > 0 && (
        <div className="space-y-5 border-t border-slate-200 pt-6 mt-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-md shadow-slate-200">
              <Target className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Individual performance</h2>
          </div>
          <div className="space-y-5">
            {userPerformances.map((user) => (
              <UserPerformanceCard key={user.id} user={user} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ========== DETAILS TAB ========== */

function DetailsTabContent({ subTab }: { subTab: SubTab }) {
  const [calls, setCalls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCall, setSelectedCall] = useState<any>(null)
  const [visits, setVisits] = useState<any[]>([])
  const [loadingVisits, setLoadingVisits] = useState(false)
  const [selectedVisit, setSelectedVisit] = useState<any>(null)
  const [serviceView, setServiceView] = useState<"menu" | "phone-calls" | "quotations" | "visits">("menu")
  const [nonServiceView, setNonServiceView] = useState<"menu" | "phone-calls" | "visits" | "quotations">("menu")
  const [branchUserNames, setBranchUserNames] = useState<string[]>([])
  const [branchUserIds, setBranchUserIds] = useState<string[]>([])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [callType, setCallType] = useState("")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [users, setUsers] = useState<{ _id: string; name: string }[]>([])

  const branchRoles = ["branch_manager", "branch_manager_juniors", "branch_service", "branch_service_juniors", "branch_sales", "branch_sales_juniors", "branch_consumable", "branch_consumable_juniors", "branch_accounts", "branch_accounts_juniors"]

  const fetchBranchUsers = async () => {
    try {
      const res = await axios.get("/api/users", { withCredentials: true })
      const branchUsers = (res.data.users || []).filter((u: any) => branchRoles.includes(u.role))
      setBranchUserNames(branchUsers.map((u: any) => u.name))
      setBranchUserIds(branchUsers.map((u: any) => u._id))
    } catch (err) { console.error(err) }
  }

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/api/users", { withCredentials: true })
      const branchUsers = (res.data.users || []).filter((u: any) => branchRoles.includes(u.role))
      setUsers(branchUsers.map((u: any) => ({ _id: u._id, name: u.name })))
    } catch (err) { console.error(err) }
  }

  useEffect(() => {
    fetchUsers()
    if (subTab === "service") fetchBranchUsers()
    setNonServiceView("menu")
  }, [subTab])

  useEffect(() => {
    fetchCalls()
    if (subTab === "sales") fetchVisits()
  }, [subTab, startDate, endDate, callType, selectedUserId])

  const fetchCalls = async () => {
    setLoading(true)
    try {
      let endpoint = "/api/frontdesk-calls"
      if (subTab === "sales") endpoint = "/api/branch-sales-phone-calls"
      else if (subTab === "service") endpoint = "/api/branch-service-phone-calls"
      else if (subTab === "consumable") endpoint = "/api/branch-consumable-phone-calls"
      const params = new URLSearchParams()
      if (startDate) params.set("startDate", startDate)
      if (endDate) params.set("endDate", endDate)
      if (callType) params.set("type", callType)
      if (selectedUserId) params.set("userId", selectedUserId)
      const qs = params.toString()
      const res = await axios.get(qs ? `${endpoint}?${qs}` : endpoint, { withCredentials: true })
      setCalls(res.data.calls || [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const fetchVisits = async () => {
    setLoadingVisits(true)
    try {
      const vParams = new URLSearchParams()
      if (startDate) vParams.set("startDate", startDate)
      if (endDate) vParams.set("endDate", endDate)
      if (selectedUserId) vParams.set("userId", selectedUserId)
      const vQs = vParams.toString()
      const res = await axios.get(vQs ? `/api/branch-sales-activity?${vQs}` : "/api/branch-sales-activity", { withCredentials: true })
      const activities = res.data.activities || []
      const allVisits: any[] = []
      for (const activity of activities) {
        for (const visit of (activity.visits || [])) {
          allVisits.push({
            ...visit,
            _id: visit._id || `${activity._id}-${allVisits.length}`,
            activityDate: activity.activityDate,
            userName: activity.userId?.name || "N/A",
          })
        }
      }
      setVisits(allVisits)
    } catch (err) { console.error(err) } finally { setLoadingVisits(false) }
  }

  const clearFilters = () => {
    setStartDate("")
    setEndDate("")
    setCallType("")
    setSelectedUserId("")
  }

  return (
    <div className="space-y-4">
      {((subTab === "service" && serviceView === "phone-calls") || (subTab !== "service" && (nonServiceView === "phone-calls" || nonServiceView === "visits"))) && (
        <div className="flex flex-wrap gap-3 items-end bg-white p-3 rounded-lg border border-slate-200">
          <div className="space-y-1">
            <Label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Start Date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-sm h-9" />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">End Date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-sm h-9" />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Type</Label>
            <select
              value={callType}
              onChange={(e) => setCallType(e.target.value)}
              className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="">All Types</option>
              <option value="cold">Cold</option>
              <option value="follow-up">Follow Up</option>
            </select>
          </div>
          {users.length > 0 && (
            <div className="space-y-1">
              <Label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">User</Label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="">All Users</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}
          <Button type="button" variant="outline" size="sm" onClick={clearFilters} className="h-9">
            <X className="w-3.5 h-3.5 mr-1" /> Clear
          </Button>
        </div>
      )}
      {subTab === "service" ? (
        <>
          {serviceView === "menu" && (
            <div className="grid gap-4 md:grid-cols-3">
              <button onClick={() => setServiceView("phone-calls")} className="text-left">
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-200 h-full">
                  <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                    <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center">
                      <Phone className="w-7 h-7 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Phone Calls</h3>
                    <p className="text-sm text-slate-500">View service phone calls</p>
                  </CardContent>
                </Card>
              </button>
              <button onClick={() => setServiceView("quotations")} className="text-left">
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-200 h-full">
                  <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                    <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center">
                      <FileText className="w-7 h-7 text-amber-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Quotation List</h3>
                    <p className="text-sm text-slate-500">View all branch quotations</p>
                  </CardContent>
                </Card>
              </button>
              <button onClick={() => setServiceView("visits")} className="text-left">
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-200 h-full">
                  <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                    <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center">
                      <List className="w-7 h-7 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Assigned Visits List</h3>
                    <p className="text-sm text-slate-500">View all service calls/cases</p>
                  </CardContent>
                </Card>
              </button>
            </div>
          )}

          {serviceView === "phone-calls" && (
            <div>
              <button onClick={() => setServiceView("menu")} className="text-sm text-purple-600 hover:text-purple-700 mb-4 flex items-center gap-1">
                <ChevronRight className="w-4 h-4 rotate-180" /> Back to Service
              </button>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Phone Calls</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div> :
                   calls.length === 0 ? <p className="text-slate-500 text-center py-8">No records found for current month</p> : (
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Company</th>
                            <th className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                            <th className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Product</th>
                            <th className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Outcome</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {calls.map((call: any) => (
                            <tr key={call._id} onClick={() => setSelectedCall(call)} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                              <td className="px-3 py-2 text-xs text-slate-700">{call.date}</td>
                              <td className="px-3 py-2 text-xs font-semibold text-slate-900">{call.companyName}</td>
                              <td className="px-3 py-2 text-xs text-slate-600">{call.contactPersonName}</td>
                              <td className="px-3 py-2 text-xs text-slate-600">{call.product || "-"}</td>
                              <td className="px-3 py-2 text-xs text-slate-600">{call.outcomeFromCall ? call.outcomeFromCall.slice(0, 40) + (call.outcomeFromCall.length > 40 ? "..." : "") : "-"}</td>
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

          {serviceView === "quotations" && (
            <div>
              <button onClick={() => setServiceView("menu")} className="text-sm text-purple-600 hover:text-purple-700 mb-4 flex items-center gap-1">
                <ChevronRight className="w-4 h-4 rotate-180" /> Back to Service
              </button>
              <ManageQuotationJunior engineerFilter={branchUserNames} category="service" />
            </div>
          )}

          {serviceView === "visits" && (
            <div>
              <button onClick={() => setServiceView("menu")} className="text-sm text-purple-600 hover:text-purple-700 mb-4 flex items-center gap-1">
                <ChevronRight className="w-4 h-4 rotate-180" /> Back to Service
              </button>
              <ServiceTaskList refreshKey={0} assignedToUserIds={branchUserIds} />
            </div>
          )}
        </>
      ) : (
        <>
          {nonServiceView === "menu" && (
            <div className="grid gap-4 md:grid-cols-3">
              <button onClick={() => setNonServiceView("phone-calls")} className="text-left">
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-200 h-full">
                  <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                    <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center">
                      <Phone className="w-7 h-7 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Phone Calls</h3>
                    <p className="text-sm text-slate-500">View {subTab} phone calls</p>
                  </CardContent>
                </Card>
              </button>
              {subTab === "sales" && (
                <button onClick={() => setNonServiceView("visits")} className="text-left">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-emerald-200 h-full">
                    <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                      <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center">
                        <List className="w-7 h-7 text-emerald-600" />
                      </div>
                      <h3 className="font-semibold text-slate-900">Visit List</h3>
                      <p className="text-sm text-slate-500">View sales visits</p>
                    </CardContent>
                  </Card>
                </button>
              )}
              <button onClick={() => setNonServiceView("quotations")} className="text-left">
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-amber-200 h-full">
                  <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                    <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center">
                      <FileText className="w-7 h-7 text-amber-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Quotation List</h3>
                    <p className="text-sm text-slate-500">View all {subTab} quotations</p>
                  </CardContent>
                </Card>
              </button>
            </div>
          )}

          {nonServiceView === "phone-calls" && (
            <div>
              <button onClick={() => setNonServiceView("menu")} className="text-sm text-purple-600 hover:text-purple-700 mb-4 flex items-center gap-1">
                <ChevronRight className="w-4 h-4 rotate-180" /> Back to {subTab === "sales" ? "Sales" : "Consumable"}
              </button>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Phone Call List</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div> :
                   calls.length === 0 ? <p className="text-slate-500 text-center py-8">No records found for current month</p> : (
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
                          {calls.map((call: any) => (
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
                </CardContent>
              </Card>
            </div>
          )}

          {nonServiceView === "visits" && subTab === "sales" && (
            <div>
              <button onClick={() => setNonServiceView("menu")} className="text-sm text-emerald-600 hover:text-emerald-700 mb-4 flex items-center gap-1">
                <ChevronRight className="w-4 h-4 rotate-180" /> Back to Sales
              </button>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Visit List</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingVisits ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div> :
                   visits.length === 0 ? <p className="text-slate-500 text-center py-8">No visit records found</p> : (
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                            <th className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                            <th className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Purpose</th>
                            <th className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Outcome</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {visits.map((visit: any) => (
                            <tr key={visit._id} onClick={() => setSelectedVisit(visit)} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                              <td className="px-3 py-2 text-xs text-slate-700">{new Date(visit.activityDate).toLocaleDateString()}</td>
                              <td className="px-3 py-2 text-xs font-semibold text-slate-900">{visit.customerName || "N/A"}</td>
                              <td className="px-3 py-2 text-xs text-slate-600">{visit.contactPersonName || "N/A"}</td>
                              <td className="px-3 py-2 text-xs">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                                  {visit.primaryPurpose || "N/A"}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-xs text-slate-600">{visit.outcome || "N/A"}</td>
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

          {nonServiceView === "quotations" && (
            <div>
              <button onClick={() => setNonServiceView("menu")} className="text-sm text-amber-600 hover:text-amber-700 mb-4 flex items-center gap-1">
                <ChevronRight className="w-4 h-4 rotate-180" /> Back to {subTab === "sales" ? "Sales" : "Consumable"}
              </button>
              {subTab === "sales" && <ManageQuotationJunior showAll category="sales" />}
              {subTab === "consumable" && <ManageQuotationJunior showAll category="consumable" />}
            </div>
          )}
        </>
      )}

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
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Outgoing Call Type</p>
                <p className="text-slate-900">{selectedCall.outgoingCallType || "-"}</p>
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
                    <p className="text-slate-900">{selectedCall.leadFound ? "Yes" : "No"}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog open={!!selectedVisit} onClose={() => setSelectedVisit(null)} title="Visit Details">
        {selectedVisit && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Date</p>
                <p className="text-slate-900">{new Date(selectedVisit.activityDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Customer Name</p>
                <p className="text-slate-900">{selectedVisit.customerName || "-"}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Contact Person</p>
                <p className="text-slate-900">{selectedVisit.contactPersonName || "-"}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Contact Phone</p>
                <p className="text-slate-900">{selectedVisit.contactPersonPhone || "-"}</p>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Purpose</p>
                <p className="text-slate-900">{selectedVisit.primaryPurpose || "-"}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Products Discussed</p>
                <p className="text-slate-900">{(selectedVisit.productsDiscussed || []).join(", ") || "-"}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Outcome</p>
                <p className="text-slate-900">{selectedVisit.outcome || "-"}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Next Action Required</p>
                <p className="text-slate-900">{selectedVisit.nextActionRequired || "-"}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Next Action Date</p>
                <p className="text-slate-900">{selectedVisit.nextActionDate ? new Date(selectedVisit.nextActionDate).toLocaleDateString() : "-"}</p>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
