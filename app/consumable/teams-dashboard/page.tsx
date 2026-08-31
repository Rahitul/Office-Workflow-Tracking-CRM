"use client"

import { useEffect, useState, useMemo, ElementType } from "react"
import axios from "axios"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Phone,
  Users,
  Banknote,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  ChevronDown,
  ChevronUp,
  Footprints,
  ShoppingCart,
  Receipt,
  BarChart3,
  Package,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  _id: string
  name: string
  email: string
  role?: string
}

interface ConsumableKpiTarget {
  _id: string
  userId: User
  month: number
  year: number
  callsTarget: number
  visitsTarget: number
  quotationTarget: number
  orderAmountTarget: number
  orderValueBlackAndWhite: number
  orderValueColor: number
  orderValueDuplicatorInk: number
  orderValueDuplicatorMaster: number
  orderValueMps: number
  billAmountTarget: number
  billValueBlackAndWhite: number
  billValueColor: number
  billValueDuplicatorInk: number
  billValueDuplicatorMaster: number
  billValueMps: number
}

interface ConsumableActivity {
  activityDate: string
  userId: User
  calls: number
  visits: number
  quotation: number
  quotationQty: number
  orderQty: number
  billQty: number
  orderValueBlackAndWhite: number
  orderValueColor: number
  orderValueDuplicatorInk: number
  orderValueDuplicatorMaster: number
  orderValueMps: number
  billValueBlackAndWhite: number
  billValueColor: number
  billValueDuplicatorInk: number
  billValueDuplicatorMaster: number
  billValueMps: number
}

interface KpiMetric {
  id: string
  name: string
  icon: ElementType
  group: "activity" | "financial"
  achieved: number
  target: number
  isValue: boolean
  productBreakdown?: { name: string; value: number; target: number }[]
}

interface UserPerformance {
  id: string
  name: string
  metrics: KpiMetric[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

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

const BREAKDOWN_COLORS = ["#378ADD", "#7F77DD", "#D4537E", "#1D9E75"]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const calcPct = (achieved: number, target: number) => {
  if (target === 0) return achieved > 0 ? 100 : 0
  return Math.round((achieved / target) * 100)
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

// ─── Radial Ring ──────────────────────────────────────────────────────────────

function RadialRing({ pct, size = 52, stroke = 5, showLabel = false }: { pct: number; size?: number; stroke?: number; showLabel?: boolean }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = Math.min(pct, 100) / 100 * circ
  const color = ringColor(pct)
  const cx = size / 2
  const cy = size / 2

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dasharray 0.5s ease" }}
      />
      {showLabel && (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="600" fill={color}>{pct}%</text>
      )}
    </svg>
  )
}

// ─── Trend Icon ───────────────────────────────────────────────────────────────

function TrendIcon({ pct }: { pct: number }) {
  if (pct >= 100) return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
  if (pct >= 70) return <Minus className="h-3.5 w-3.5 text-amber-500" />
  return <TrendingDown className="h-3.5 w-3.5 text-red-500" />
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ metric, selected, onClick }: { metric: KpiMetric; selected: boolean; onClick: () => void }) {
  const pct = calcPct(metric.achieved, metric.target)
  const color = ringColor(pct)
  const Icon = metric.icon

  return (
    <button onClick={onClick}
      className={`w-full text-left bg-white rounded-2xl border transition-all duration-200 p-4 group ${
        selected ? "border-slate-900 ring-2 ring-slate-900/10 shadow-lg" : "border-slate-200 hover:border-slate-400 hover:shadow-md"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-slate-100 transition-colors">
          <Icon className="h-4 w-4 text-slate-600" />
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={badgeStyle(pct)}>{pct}%</span>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <RadialRing pct={pct} size={48} stroke={5} />
        <div className="min-w-0">
          <p className="text-lg font-black leading-none" style={{ color }}>{pct}%</p>
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

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({ metric, userPerformances }: { metric: KpiMetric; userPerformances: UserPerformance[] }) {
  const pct = calcPct(metric.achieved, metric.target)
  const color = ringColor(pct)
  const gap = metric.target - metric.achieved
  const Icon = metric.icon

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
            <p className="text-xs text-slate-500 mt-0.5">{metric.group === "financial" ? "Value in BDT" : "Activity count"}</p>
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
                  <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{initials}</div>
                  <p className="text-sm font-medium text-slate-800 w-28 flex-shrink-0 truncate">{u.name}</p>
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(u.pct, 100)}%`, background: uColor }} />
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

// ─── User Performance Card ────────────────────────────────────────────────────

function UserPerformanceCard({ user }: { user: UserPerformance }) {
  const [expanded, setExpanded] = useState(false)
  const [selectedMetricId, setSelectedMetricId] = useState<string | null>(null)

  const overallPct = Math.round(
    user.metrics.reduce((sum, m) => sum + calcPct(m.achieved, m.target), 0) / user.metrics.length
  )

  const initials = user.name.split(" ").map((x) => x[0]).join("").slice(0, 2)
  const selectedMetric = user.metrics.find((m) => m.id === selectedMetricId)

  return (
    <Card className="border-slate-200 shadow-lg rounded-3xl overflow-hidden border-l-[5px] border-l-orange-600">
      <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-300 font-bold text-sm">{initials}</div>
          <div>
            <p className="text-white font-bold">{user.name}</p>
            <p className="text-orange-300/60 text-[10px] font-bold uppercase tracking-widest">Individual performance</p>
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
            <button key={m.id} onClick={() => { setExpanded(true); setSelectedMetricId((prev) => (prev === m.id ? null : m.id)) }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedMetricId === m.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ConsumableTeamsDashboardPage() {
  const [juniors, setJuniors] = useState<User[]>([])
  const [targets, setTargets] = useState<ConsumableKpiTarget[]>([])
  const [activities, setActivities] = useState<ConsumableActivity[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedUser, setSelectedUser] = useState("all")
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString())
  const [selectedYear, setSelectedYear] = useState(currentYear.toString())
  const [dateRange, setDateRange] = useState({ start: "", end: "" })
  const [activeMetricTab, setActiveMetricTab] = useState<"all" | "activity" | "financial">("all")
  const [selectedMetricId, setSelectedMetricId] = useState<string>("ca")

  const hasDateRange = dateRange.start && dateRange.end

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [usersRes, targetsRes, activitiesRes] = await Promise.all([
          axios.get("/api/static-form/users", { withCredentials: true }),
          axios.get("/api/consumable-kpi-targets", { withCredentials: true }),
          axios.get("/api/consumable-activity", { withCredentials: true }),
        ])
        const allUsers: User[] = usersRes.data.users || []
        setJuniors(allUsers.filter((u) => u.role === "consumable_juniors"))
        setTargets(targetsRes.data.targets || [])
        setActivities(activitiesRes.data.activities || [])
      } catch (err) {
        console.error("Failed to fetch teams data:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const clearDateRange = () => setDateRange({ start: "", end: "" })

  const rangeFactor = useMemo(() => {
    if (!hasDateRange) return 1
    const start = new Date(dateRange.start)
    const end = new Date(dateRange.end)
    const diff = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return diff / 30
  }, [dateRange, hasDateRange])

  const filteredActivities = useMemo(() => {
    const month = parseInt(selectedMonth)
    const year = parseInt(selectedYear)
    let acts = activities.filter((a) => {
      const d = new Date(a.activityDate)
      return d.getMonth() + 1 === month && d.getFullYear() === year
    })
    if (hasDateRange) {
      const start = new Date(dateRange.start)
      const end = new Date(dateRange.end)
      end.setHours(23, 59, 59, 999)
      acts = acts.filter((a) => {
        const d = new Date(a.activityDate)
        return d >= start && d <= end
      })
    }
    return acts
  }, [activities, selectedMonth, selectedYear, dateRange, hasDateRange])

  const buildMetrics = (acts: ConsumableActivity[], t: ConsumableKpiTarget, factor: number): KpiMetric[] => {
    const sum = <K extends keyof ConsumableActivity>(key: K) =>
      acts.reduce((s, a) => s + ((a[key] as number) || 0), 0)

    const sumOrderValues =
      sum("orderValueBlackAndWhite") + sum("orderValueColor") +
      sum("orderValueDuplicatorInk") + sum("orderValueDuplicatorMaster") + sum("orderValueMps")

    const orderTarget =
      ((t.orderValueBlackAndWhite || 0) + (t.orderValueColor || 0) +
        (t.orderValueDuplicatorInk || 0) + (t.orderValueDuplicatorMaster || 0) +
        (t.orderValueMps || 0)) * factor

    const sumBillValues =
      sum("billValueBlackAndWhite") + sum("billValueColor") +
      sum("billValueDuplicatorInk") + sum("billValueDuplicatorMaster") + sum("billValueMps")

    const billTarget =
      ((t.billValueBlackAndWhite || 0) + (t.billValueColor || 0) +
        (t.billValueDuplicatorInk || 0) + (t.billValueDuplicatorMaster || 0) +
        (t.billValueMps || 0)) * factor

    return [
      { id: "ca", name: "Calls", icon: Phone, group: "activity", achieved: sum("calls"), target: Math.round((t.callsTarget || 0) * factor), isValue: false },
      { id: "vi", name: "Visits", icon: Footprints, group: "activity", achieved: sum("visits"), target: Math.round((t.visitsTarget || 0) * factor), isValue: false },
      { id: "qu", name: "Quotation", icon: Banknote, group: "financial", achieved: sum("quotation"), target: Math.round((t.quotationTarget || 0) * factor), isValue: true },
      {
        id: "or", name: "Order Amount", icon: ShoppingCart, group: "financial",
        achieved: Math.round(sumOrderValues), target: Math.round(orderTarget), isValue: true,
        productBreakdown: [
          { name: "Black & White", value: sum("orderValueBlackAndWhite"), target: Math.round((t.orderValueBlackAndWhite || 0) * factor) },
          { name: "Color", value: sum("orderValueColor"), target: Math.round((t.orderValueColor || 0) * factor) },
          { name: "Duplicator Ink", value: sum("orderValueDuplicatorInk"), target: Math.round((t.orderValueDuplicatorInk || 0) * factor) },
          { name: "Duplicator Master", value: sum("orderValueDuplicatorMaster"), target: Math.round((t.orderValueDuplicatorMaster || 0) * factor) },
          { name: "MPS", value: sum("orderValueMps"), target: Math.round((t.orderValueMps || 0) * factor) },
        ],
      },
      {
        id: "bi", name: "Bill Amount", icon: Receipt, group: "financial",
        achieved: Math.round(sumBillValues), target: Math.round(billTarget), isValue: true,
        productBreakdown: [
          { name: "Black & White", value: sum("billValueBlackAndWhite"), target: Math.round((t.billValueBlackAndWhite || 0) * factor) },
          { name: "Color", value: sum("billValueColor"), target: Math.round((t.billValueColor || 0) * factor) },
          { name: "Duplicator Ink", value: sum("billValueDuplicatorInk"), target: Math.round((t.billValueDuplicatorInk || 0) * factor) },
          { name: "Duplicator Master", value: sum("billValueDuplicatorMaster"), target: Math.round((t.billValueDuplicatorMaster || 0) * factor) },
          { name: "MPS", value: sum("billValueMps"), target: Math.round((t.billValueMps || 0) * factor) },
        ],
      },
    ]
  }

  const { teamMetrics, userPerformances } = useMemo(() => {
    const month = parseInt(selectedMonth)
    const year = parseInt(selectedYear)

    const juniorIds = juniors.map((j) => j._id)

    const relevantTargets = targets.filter((t) => {
      const userMatch = selectedUser === "all" ? juniorIds.includes(t.userId._id) : t.userId._id === selectedUser
      return userMatch && t.month === month && t.year === year
    })

    const aggregateTarget: ConsumableKpiTarget = relevantTargets.reduce<ConsumableKpiTarget>(
      (acc, t) => ({
        ...acc,
        callsTarget: acc.callsTarget + t.callsTarget,
        visitsTarget: acc.visitsTarget + (t.visitsTarget || 0),
        quotationTarget: acc.quotationTarget + t.quotationTarget,
        orderAmountTarget: acc.orderAmountTarget + t.orderAmountTarget,
        orderValueBlackAndWhite: acc.orderValueBlackAndWhite + (t.orderValueBlackAndWhite || 0),
        orderValueColor: acc.orderValueColor + (t.orderValueColor || 0),
        orderValueDuplicatorInk: acc.orderValueDuplicatorInk + (t.orderValueDuplicatorInk || 0),
        orderValueDuplicatorMaster: acc.orderValueDuplicatorMaster + (t.orderValueDuplicatorMaster || 0),
        orderValueMps: acc.orderValueMps + (t.orderValueMps || 0),
        billAmountTarget: acc.billAmountTarget + t.billAmountTarget,
        billValueBlackAndWhite: acc.billValueBlackAndWhite + (t.billValueBlackAndWhite || 0),
        billValueColor: acc.billValueColor + (t.billValueColor || 0),
        billValueDuplicatorInk: acc.billValueDuplicatorInk + (t.billValueDuplicatorInk || 0),
        billValueDuplicatorMaster: acc.billValueDuplicatorMaster + (t.billValueDuplicatorMaster || 0),
        billValueMps: acc.billValueMps + (t.billValueMps || 0),
      }),
      {
        _id: "", userId: { _id: "all", name: "Team", email: "" }, month, year,
        callsTarget: 0, visitsTarget: 0, quotationTarget: 0, orderAmountTarget: 0,
        orderValueBlackAndWhite: 0, orderValueColor: 0, orderValueDuplicatorInk: 0, orderValueDuplicatorMaster: 0, orderValueMps: 0,
        billAmountTarget: 0, billValueBlackAndWhite: 0, billValueColor: 0, billValueDuplicatorInk: 0, billValueDuplicatorMaster: 0, billValueMps: 0,
      }
    )

    const teamMetrics = buildMetrics(filteredActivities, aggregateTarget, rangeFactor)

    const userPerformances: UserPerformance[] = relevantTargets.map((t) => {
      const userActs = filteredActivities.filter((a) => a.userId?._id === t.userId._id)
      return { id: t.userId._id, name: t.userId.name, metrics: buildMetrics(userActs, t, rangeFactor) }
    })

    return { teamMetrics, userPerformances }
  }, [targets, filteredActivities, selectedUser, selectedMonth, selectedYear, rangeFactor, juniors])

  const visibleMetrics = teamMetrics.filter((m) => activeMetricTab === "all" || m.group === activeMetricTab)
  const selectedMetric = teamMetrics.find((m) => m.id === selectedMetricId) ?? teamMetrics[0]

  // ── Calls vs Quotation Quantity Comparison ─────────────────────────────────
  const comparisonChartData = useMemo(() => {
    return userPerformances.map((up) => {
      const callsMetric = up.metrics.find((m) => m.id === "ca")
      const userActs = filteredActivities.filter((a) => a.userId?._id === up.id)
      const totalQuotationQty = userActs.reduce((s, a) => s + (a.quotationQty || 0), 0)
      return {
        name: up.name,
        Calls: callsMetric?.achieved || 0,
        "Quotation Qty": totalQuotationQty,
      }
    })
  }, [userPerformances, filteredActivities])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-16 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-8 pt-2">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Teams Dashboard</h1>
          <p className="text-slate-500 mt-1">Track your juniors team performance against monthly benchmarks</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-orange-50 text-orange-700 border-orange-100 px-4 py-1.5 font-semibold text-sm">
            <Users className="w-4 h-4 mr-2" />
            {juniors.length} Team Members
          </Badge>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm bg-white">
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-2.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Users className="w-3 h-3" />
            Dashboard filters
          </p>
        </div>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Team member</Label>
              <Select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}
                options={[{ value: "all", label: "Entire team" }, ...juniors.map((u) => ({ value: u._id, label: u.name }))]}
                className="bg-slate-50 border-slate-200 h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Month</Label>
              <Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} options={MONTHS} className="bg-slate-50 border-slate-200 h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Year</Label>
              <Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} options={YEARS} className="bg-slate-50 border-slate-200 h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Start date</Label>
              <Input type="date" value={dateRange.start} onChange={(e) => setDateRange((p) => ({ ...p, start: e.target.value }))} className="bg-slate-50 border-slate-200 h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wide">End date</Label>
              <div className="flex gap-2">
                <Input type="date" value={dateRange.end} onChange={(e) => setDateRange((p) => ({ ...p, end: e.target.value }))} className="bg-slate-50 border-slate-200 h-10 flex-1" />
                {hasDateRange && (
                  <Button variant="ghost" size="icon" onClick={clearDateRange} className="h-10 w-10 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                    <X size={16} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {userPerformances.length === 0 ? (
        <Card className="py-24 text-center border-dashed border-2 border-slate-200 bg-slate-50/50 rounded-2xl">
          <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
            <Target className="h-12 w-12 text-slate-300" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">No KPI targets found</h2>
          <p className="text-slate-500 max-w-sm mx-auto mb-8">
            No performance data matches your current filter selection. Start by setting targets for your juniors team.
          </p>
          <Button className="bg-orange-600 hover:bg-orange-700 text-white px-8 h-12 rounded-xl shadow-lg shadow-orange-100 font-bold"
            onClick={() => (window.location.href = "/admin/consumable-dashboard")}
          >
            Configure KPI targets
          </Button>
        </Card>
      ) : (
        <div className="space-y-10">
          <section className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-orange-600 flex items-center justify-center shadow-md shadow-orange-200">
                <Users className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                {selectedUser === "all" ? "Team overview" : `${userPerformances[0]?.name ?? ""} — overview`}
              </h2>
            </div>

            <div className="flex gap-2 flex-wrap">
              {([{ key: "all", label: "All metrics" }, { key: "activity", label: "Activity" }, { key: "financial", label: "Financial" }] as const).map((tab) => (
                <button key={tab.key} onClick={() => setActiveMetricTab(tab.key)}
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

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {visibleMetrics.map((metric) => (
                <KpiCard key={metric.id} metric={metric}
                  selected={selectedMetricId === metric.id}
                  onClick={() => setSelectedMetricId((prev) => (prev === metric.id ? metric.id : metric.id))}
                />
              ))}
            </div>

            {selectedMetric && (
              <DetailPanel metric={selectedMetric} userPerformances={userPerformances} />
            )}
          </section>

          {comparisonChartData.length > 0 && (
            <section className="space-y-5 border-t border-slate-200 pt-8">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Calls vs Quotation Quantity</h2>
              </div>
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100">
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
                </CardContent>
              </Card>
            </section>
          )}

          {selectedUser === "all" && userPerformances.length > 0 && (
            <section className="space-y-5 border-t border-slate-200 pt-8">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-md shadow-slate-200">
                  <Target className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Individual performance</h2>
              </div>
              <div className="space-y-5">
                {userPerformances.map((u) => (
                  <UserPerformanceCard key={u.id} user={u} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
