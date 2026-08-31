"use client"

import { useEffect, useState, useMemo, ElementType } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Phone,
  Calendar,
  Users,
  Mail,
  Banknote,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useAuthStore } from "@/store/authStore"

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  _id: string
  name: string
  email: string
  role?: string
}

interface KpiTarget {
  _id: string
  userId: User
  month: number
  year: number
  coldCallsMade: number
  followUpCallsMade: number
  newAppointmentsFixed: number
  customerVisitsCompleted: number
  salesEmailsSent: number
  ordersClosedTodayValue: number
  quotationsIssuedTodayValue: number
  orderValueMfp: number
  orderValueMps: number
  orderValueBarcodePrinters: number
  orderValuePaperShredder: number
  orderValueDuplicator: number
  orderValueBarcodeScanner: number
  orderValueSolutions: number
  orderValueTender: number
  billsClosedTodayValue: number
  billValueMfp: number
  billValueMps: number
  billValueBarcodePrinters: number
  billValuePaperShredder: number
  billValueDuplicator: number
  billValueBarcodeScanner: number
  billValueSolutions: number
  billValueTender: number
}

interface Activity {
  activityDate: string
  userId: User
  coldCallsMade: number
  followUpCallsMade: number
  newAppointmentsFixed: number
  customerVisitsCompleted: number
  salesEmailsSent: number
  ordersClosedToday: number
  quotationsIssuedToday: number
  orderValueMfp: number
  orderValueMps: number
  orderValueBarcodePrinters: number
  orderValuePaperShredder: number
  orderValueDuplicator: number
  orderValueBarcodeScanner: number
  orderValueSolutions: number
  orderValueTender: number
  billsClosedToday: number
  billValueMfp: number
  billValueMps: number
  billValueBarcodePrinters: number
  billValuePaperShredder: number
  billValueDuplicator: number
  billValueBarcodeScanner: number
  billValueSolutions: number
  billValueTender: number
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

const BREAKDOWN_COLORS = [
  "#378ADD",
  "#7F77DD",
  "#D4537E",
  "#1D9E75",
  "#BA7517",
  "#E24B4A",
  "#185FA5",
]

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
  if (pct >= 100)
    return { background: "#e8f9f0", color: "#0d6e40" }
  if (pct >= 70)
    return { background: "#fef3e2", color: "#9a5b00" }
  return { background: "#fdeaea", color: "#9a1f1f" }
}

const fmtValue = (v: number, isVal: boolean) => {
  if (!isVal) return v.toLocaleString()
  return "৳" + v.toLocaleString()
}

// ─── Radial Ring SVG ──────────────────────────────────────────────────────────

function RadialRing({
  pct,
  size = 52,
  stroke = 5,
  showLabel = false,
}: {
  pct: number
  size?: number
  stroke?: number
  showLabel?: boolean
}) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = Math.min(pct, 100) / 100 * circ
  const color = ringColor(pct)
  const cx = size / 2
  const cy = size / 2

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ flexShrink: 0 }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={stroke}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dasharray 0.5s ease" }}
      />
      {showLabel && (
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="11"
          fontWeight="600"
          fill={color}
        >
          {pct}%
        </text>
      )}
    </svg>
  )
}

// ─── Trend Icon ───────────────────────────────────────────────────────────────

function TrendIcon({ pct }: { pct: number }) {
  if (pct >= 100)
    return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
  if (pct >= 70)
    return <Minus className="h-3.5 w-3.5 text-amber-500" />
  return <TrendingDown className="h-3.5 w-3.5 text-red-500" />
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  metric,
  selected,
  onClick,
}: {
  metric: KpiMetric
  selected: boolean
  onClick: () => void
}) {
  const pct = calcPct(metric.achieved, metric.target)
  const color = ringColor(pct)
  const Icon = metric.icon

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left bg-white rounded-2xl border transition-all duration-200 p-4 group
        ${selected
          ? "border-slate-900 ring-2 ring-slate-900/10 shadow-lg"
          : "border-slate-200 hover:border-slate-400 hover:shadow-md"
        }
      `}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-slate-100 transition-colors">
          <Icon className="h-4 w-4 text-slate-600" />
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={badgeStyle(pct)}
        >
          {pct}%
        </span>
      </div>

      {/* Ring + percentage */}
      <div className="flex items-center gap-3 mb-3">
        <RadialRing pct={pct} size={48} stroke={5} />
        <div className="min-w-0">
          <p
            className="text-lg font-black leading-none"
            style={{ color }}
          >
            {pct}%
          </p>
          <p className="text-xs text-slate-500 mt-1 truncate font-medium">
            {metric.name}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between border-t border-slate-100 pt-2.5 mt-1">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Achieved
          </p>
          <p className="text-xs font-bold text-slate-800 mt-0.5">
            {fmtValue(metric.achieved, metric.isValue)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Target
          </p>
          <p className="text-xs font-bold text-slate-800 mt-0.5">
            {fmtValue(metric.target, metric.isValue)}
          </p>
        </div>
      </div>
    </button>
  )
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  metric,
  userPerformances,
}: {
  metric: KpiMetric
  userPerformances: UserPerformance[]
}) {
  const pct = calcPct(metric.achieved, metric.target)
  const color = ringColor(pct)
  const gap = metric.target - metric.achieved
  const Icon = metric.icon

  const usersForMetric = userPerformances.map((u) => {
    const m = u.metrics.find((x) => x.id === metric.id)
    return m
      ? {
          id: u.id,
          name: u.name,
          achieved: m.achieved,
          target: m.target,
          pct: calcPct(m.achieved, m.target),
        }
      : null
  }).filter(Boolean) as { id: string; name: string; achieved: number; target: number; pct: number }[]

  const maxBreakdown = metric.productBreakdown
    ? Math.max(...metric.productBreakdown.map((b) => b.value))
    : 0

  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 space-y-6 mt-2">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
            <Icon className="h-5 w-5 text-slate-700" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{metric.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {metric.group === "financial"
                ? "Value in BDT"
                : "Activity count"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TrendIcon pct={pct} />
          <span
            className="text-sm font-bold px-3 py-1 rounded-full"
            style={badgeStyle(pct)}
          >
            {pct}% achieved
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Achieved", value: metric.achieved, highlight: color },
          { label: "Target", value: metric.target, highlight: undefined },
          {
            label: gap > 0 ? "Remaining" : "Over target",
            value: Math.abs(gap),
            highlight: gap > 0 ? "#E24B4A" : "#1D9E75",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-slate-200 p-3.5"
          >
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {s.label}
            </p>
            <p
              className="text-xl font-black"
              style={{ color: s.highlight ?? "#1e293b" }}
            >
              {fmtValue(s.value, metric.isValue)}
            </p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs font-medium text-slate-500 mb-1.5">
          <span>Progress toward target</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(pct, 100)}%`,
              background: color,
            }}
          />
        </div>
      </div>

      {/* Product breakdown */}
      {metric.productBreakdown && metric.productBreakdown.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
            Product breakdown
          </p>
          <div className="space-y-2.5">
            {metric.productBreakdown.map((b, i) => {
              const bpct = calcPct(b.value, b.target)
              const barW = Math.min(bpct, 100)
              return (
                <div key={b.name} className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: BREAKDOWN_COLORS[i % BREAKDOWN_COLORS.length] }}
                  />
                  <p className="text-xs text-slate-600 w-32 flex-shrink-0 font-medium">
                    {b.name}
                  </p>
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${barW}%`,
                        background: BREAKDOWN_COLORS[i % BREAKDOWN_COLORS.length],
                      }}
                    />
                  </div>
                  <p className="text-xs font-bold text-slate-800 min-w-[52px] text-right">
                    {fmtValue(b.value, metric.isValue)}
                  </p>
                  <p
                    className="text-[10px] font-bold min-w-[32px] text-right"
                    style={{ color: ringColor(bpct) }}
                  >
                    {bpct}%
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Team breakdown */}
      {usersForMetric.length > 0 && (
        <div className="border-t border-slate-200 pt-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
            Team performance
          </p>
          <div className="space-y-3">
            {usersForMetric.map((u) => {
              const initials = u.name
                .split(" ")
                .map((x: string) => x[0])
                .join("")
                .slice(0, 2)
              const uColor = ringColor(u.pct)
              return (
                <div key={u.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {initials}
                  </div>
                  <p className="text-sm font-medium text-slate-800 w-28 flex-shrink-0 truncate">
                    {u.name}
                  </p>
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(u.pct, 100)}%`,
                        background: uColor,
                      }}
                    />
                  </div>
                  <p
                    className="text-xs font-bold min-w-[36px] text-right"
                    style={{ color: uColor }}
                  >
                    {u.pct}%
                  </p>
                  <p className="text-xs text-slate-500 min-w-[60px] text-right">
                    {fmtValue(u.achieved, metric.isValue)}
                  </p>
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
    user.metrics.reduce((sum, m) => sum + calcPct(m.achieved, m.target), 0) /
      user.metrics.length
  )

  const initials = user.name
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)

  const selectedMetric = user.metrics.find((m) => m.id === selectedMetricId)

  return (
    <Card className="border-slate-200 shadow-lg rounded-3xl overflow-hidden border-l-[5px] border-l-indigo-600">
      {/* Header */}
      <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm">
            {initials}
          </div>
          <div>
            <p className="text-white font-bold">{user.name}</p>
            <p className="text-indigo-300/60 text-[10px] font-bold uppercase tracking-widest">
              Individual performance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <RadialRing pct={overallPct} size={32} stroke={3} />
            <span
              className="text-sm font-bold"
              style={{ color: ringColor(overallPct) }}
            >
              {overallPct}% avg
            </span>
          </div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Summary row (always visible) */}
      <div className="px-6 py-4 flex flex-wrap gap-2 border-b border-slate-100">
        {user.metrics.map((m) => {
          const p = calcPct(m.achieved, m.target)
          return (
            <button
              key={m.id}
              onClick={() => {
                setExpanded(true)
                setSelectedMetricId((prev) => (prev === m.id ? null : m.id))
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedMetricId === m.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>{m.name}</span>
              <span
                className="text-[10px] font-black"
                style={{ color: selectedMetricId === m.id ? "white" : ringColor(p) }}
              >
                {p}%
              </span>
            </button>
          )
        })}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <CardContent className="p-6">
          {selectedMetric ? (
            <DetailPanel metric={selectedMetric} userPerformances={[]} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {user.metrics.map((m) => (
                <KpiCard
                  key={m.id}
                  metric={m}
                  selected={false}
                  onClick={() => setSelectedMetricId(m.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function KpiDashboardPage() {
  const router = useRouter()
  const { logout } = useAuthStore()

  const [users, setUsers] = useState<User[]>([])
  const [targets, setTargets] = useState<KpiTarget[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedUser, setSelectedUser] = useState("all")
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth().toString()
  )
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  )
  const [dateRange, setDateRange] = useState({ start: "", end: "" })

  // Team overview state
  const [activeTab, setActiveTab] = useState<"all" | "activity" | "financial">(
    "all"
  )
  const [selectedMetricId, setSelectedMetricId] = useState<string>("or")

  const currentYear = new Date().getFullYear()
  const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(
    (y) => ({ value: y.toString(), label: y.toString() })
  )

  const hasDateRange = dateRange.start && dateRange.end

  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [targetsRes, activitiesRes, usersRes] = await Promise.all([
          axios.get("/api/kpi-targets", { withCredentials: true }),
          axios.get("/api/static-form/activity", { withCredentials: true }),
          axios.get("/api/static-form/users", { withCredentials: true }),
        ])
        setTargets(targetsRes.data.targets || [])
        setActivities(activitiesRes.data.activities || [])
        setUsers((usersRes.data.users || []).filter((u: User) => u.role === "user" || u.role === "user_juniors"))
      } catch (err) {
        console.error("Failed to fetch KPI data:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const clearDateRange = () => setDateRange({ start: "", end: "" })

  // ── Date range factor ──────────────────────────────────────────────────────

  const rangeFactor = useMemo(() => {
    if (!hasDateRange) return 1
    const start = new Date(dateRange.start)
    const end = new Date(dateRange.end)
    const diff =
      Math.ceil(
        Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1
    return diff / 30
  }, [dateRange, hasDateRange])

  // ── Filter activities ──────────────────────────────────────────────────────

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

  // ── Build metric for a set of activities + a target ───────────────────────

  const buildMetrics = (
    acts: Activity[],
    t: KpiTarget,
    factor: number
  ): KpiMetric[] => {
    const sum = <K extends keyof Activity>(key: K) =>
      acts.reduce((s, a) => s + ((a[key] as number) || 0), 0)

    const orderAchieved =
      sum("orderValueMfp") +
      sum("orderValueMps") +
      sum("orderValueBarcodePrinters") +
      sum("orderValuePaperShredder") +
      sum("orderValueDuplicator") +
      sum("orderValueBarcodeScanner") +
      sum("orderValueSolutions") +
      sum("orderValueTender")

    const orderTarget =
      ((t.orderValueMfp || 0) +
        (t.orderValueMps || 0) +
        (t.orderValueBarcodePrinters || 0) +
        (t.orderValuePaperShredder || 0) +
        (t.orderValueDuplicator || 0) +
        (t.orderValueBarcodeScanner || 0) +
        (t.orderValueSolutions || 0) +
        (t.orderValueTender || 0)) *
      factor

    const billAchieved =
      sum("billValueMfp") +
      sum("billValueMps") +
      sum("billValueBarcodePrinters") +
      sum("billValuePaperShredder") +
      sum("billValueDuplicator") +
      sum("billValueBarcodeScanner") +
      sum("billValueSolutions") +
      sum("billValueTender")

    const billTarget =
      ((t.billValueMfp || 0) +
        (t.billValueMps || 0) +
        (t.billValueBarcodePrinters || 0) +
        (t.billValuePaperShredder || 0) +
        (t.billValueDuplicator || 0) +
        (t.billValueBarcodeScanner || 0) +
        (t.billValueSolutions || 0) +
        (t.billValueTender || 0)) *
      factor

    return [
      {
        id: "cc",
        name: "Cold calls",
        icon: Phone,
        group: "activity",
        achieved: sum("coldCallsMade"),
        target: Math.round(t.coldCallsMade * factor),
        isValue: false,
      },
      {
        id: "fu",
        name: "Follow-up calls",
        icon: Phone,
        group: "activity",
        achieved: sum("followUpCallsMade"),
        target: Math.round(t.followUpCallsMade * factor),
        isValue: false,
      },
      {
        id: "ap",
        name: "Appointments",
        icon: Calendar,
        group: "activity",
        achieved: sum("newAppointmentsFixed"),
        target: Math.round(t.newAppointmentsFixed * factor),
        isValue: false,
      },
      {
        id: "vi",
        name: "Visits",
        icon: Users,
        group: "activity",
        achieved: sum("customerVisitsCompleted"),
        target: Math.round(t.customerVisitsCompleted * factor),
        isValue: false,
      },
      {
        id: "em",
        name: "Emails",
        icon: Mail,
        group: "activity",
        achieved: sum("salesEmailsSent"),
        target: Math.round(t.salesEmailsSent * factor),
        isValue: false,
      },
      {
        id: "or",
        name: "Orders",
        icon: Banknote,
        group: "financial",
        achieved: orderAchieved,
        target: Math.round(orderTarget),
        isValue: true,
        productBreakdown: [
          { name: "MFP", value: sum("orderValueMfp"), target: Math.round((t.orderValueMfp || 0) * factor) },
          { name: "MPS", value: sum("orderValueMps"), target: Math.round((t.orderValueMps || 0) * factor) },
          { name: "Barcode printers", value: sum("orderValueBarcodePrinters"), target: Math.round((t.orderValueBarcodePrinters || 0) * factor) },
          { name: "Paper shredder", value: sum("orderValuePaperShredder"), target: Math.round((t.orderValuePaperShredder || 0) * factor) },
          { name: "Duplicator", value: sum("orderValueDuplicator"), target: Math.round((t.orderValueDuplicator || 0) * factor) },
          { name: "Scanner / POS", value: sum("orderValueBarcodeScanner"), target: Math.round((t.orderValueBarcodeScanner || 0) * factor) },
          { name: "Solutions", value: sum("orderValueSolutions"), target: Math.round((t.orderValueSolutions || 0) * factor) },
          { name: "Tender", value: sum("orderValueTender"), target: Math.round((t.orderValueTender || 0) * factor) },
        ],
      },
      {
        id: "qu",
        name: "Quotations",
        icon: Banknote,
        group: "financial",
        achieved: sum("quotationsIssuedToday"),
        target: Math.round(t.quotationsIssuedTodayValue * factor),
        isValue: true,
      },
      {
        id: "bi",
        name: "Bills",
        icon: Banknote,
        group: "financial",
        achieved: billAchieved,
        target: Math.round(billTarget),
        isValue: true,
        productBreakdown: [
          { name: "MFP", value: sum("billValueMfp"), target: Math.round((t.billValueMfp || 0) * factor) },
          { name: "MPS", value: sum("billValueMps"), target: Math.round((t.billValueMps || 0) * factor) },
          { name: "Barcode printers", value: sum("billValueBarcodePrinters"), target: Math.round((t.billValueBarcodePrinters || 0) * factor) },
          { name: "Paper shredder", value: sum("billValuePaperShredder"), target: Math.round((t.billValuePaperShredder || 0) * factor) },
          { name: "Duplicator", value: sum("billValueDuplicator"), target: Math.round((t.billValueDuplicator || 0) * factor) },
          { name: "Scanner / POS", value: sum("billValueBarcodeScanner"), target: Math.round((t.billValueBarcodeScanner || 0) * factor) },
          { name: "Solutions", value: sum("billValueSolutions"), target: Math.round((t.billValueSolutions || 0) * factor) },
          { name: "Tender", value: sum("billValueTender"), target: Math.round((t.billValueTender || 0) * factor) },
        ],
      },
    ]
  }

  // ── Derive team & per-user data ────────────────────────────────────────────

  const { teamMetrics, userPerformances } = useMemo(() => {
    const month = parseInt(selectedMonth)
    const year = parseInt(selectedYear)

    const relevantTargets =
      selectedUser === "all"
        ? targets.filter((t) => t.month === month && t.year === year)
        : targets.filter(
            (t) =>
              t.userId._id === selectedUser &&
              t.month === month &&
              t.year === year
          )

    // Aggregate a synthetic "all team" target for team overview
    const aggregateTarget: KpiTarget = relevantTargets.reduce<KpiTarget>(
      (acc, t) => ({
        ...acc,
        coldCallsMade: acc.coldCallsMade + t.coldCallsMade,
        followUpCallsMade: acc.followUpCallsMade + t.followUpCallsMade,
        newAppointmentsFixed: acc.newAppointmentsFixed + t.newAppointmentsFixed,
        customerVisitsCompleted:
          acc.customerVisitsCompleted + t.customerVisitsCompleted,
        salesEmailsSent: acc.salesEmailsSent + t.salesEmailsSent,
        ordersClosedTodayValue:
          acc.ordersClosedTodayValue + t.ordersClosedTodayValue,
        quotationsIssuedTodayValue:
          acc.quotationsIssuedTodayValue + t.quotationsIssuedTodayValue,
        orderValueMfp: acc.orderValueMfp + (t.orderValueMfp || 0),
        orderValueMps: acc.orderValueMps + (t.orderValueMps || 0),
        orderValueBarcodePrinters:
          acc.orderValueBarcodePrinters + (t.orderValueBarcodePrinters || 0),
        orderValuePaperShredder:
          acc.orderValuePaperShredder + (t.orderValuePaperShredder || 0),
        orderValueDuplicator:
          acc.orderValueDuplicator + (t.orderValueDuplicator || 0),
        orderValueBarcodeScanner:
          acc.orderValueBarcodeScanner + (t.orderValueBarcodeScanner || 0),
        orderValueSolutions:
          acc.orderValueSolutions + (t.orderValueSolutions || 0),
        orderValueTender: acc.orderValueTender + (t.orderValueTender || 0),
        billsClosedTodayValue:
          acc.billsClosedTodayValue + (t.billsClosedTodayValue || 0),
        billValueMfp: acc.billValueMfp + (t.billValueMfp || 0),
        billValueMps: acc.billValueMps + (t.billValueMps || 0),
        billValueBarcodePrinters:
          acc.billValueBarcodePrinters + (t.billValueBarcodePrinters || 0),
        billValuePaperShredder:
          acc.billValuePaperShredder + (t.billValuePaperShredder || 0),
        billValueDuplicator:
          acc.billValueDuplicator + (t.billValueDuplicator || 0),
        billValueBarcodeScanner:
          acc.billValueBarcodeScanner + (t.billValueBarcodeScanner || 0),
        billValueSolutions:
          acc.billValueSolutions + (t.billValueSolutions || 0),
        billValueTender: acc.billValueTender + (t.billValueTender || 0),
      }),
      {
        _id: "",
        userId: { _id: "all", name: "Team", email: "" },
        month,
        year,
        coldCallsMade: 0,
        followUpCallsMade: 0,
        newAppointmentsFixed: 0,
        customerVisitsCompleted: 0,
        salesEmailsSent: 0,
        ordersClosedTodayValue: 0,
        quotationsIssuedTodayValue: 0,
        orderValueMfp: 0,
        orderValueMps: 0,
        orderValueBarcodePrinters: 0,
        orderValuePaperShredder: 0,
        orderValueDuplicator: 0,
        orderValueBarcodeScanner: 0,
        orderValueSolutions: 0,
        orderValueTender: 0,
        billsClosedTodayValue: 0,
        billValueMfp: 0,
        billValueMps: 0,
        billValueBarcodePrinters: 0,
        billValuePaperShredder: 0,
        billValueDuplicator: 0,
        billValueBarcodeScanner: 0,
        billValueSolutions: 0,
        billValueTender: 0,
      }
    )

    const teamActivities =
      selectedUser === "all"
        ? filteredActivities
        : filteredActivities.filter((a) => a.userId?._id === selectedUser)

    const teamMetrics = buildMetrics(teamActivities, aggregateTarget, rangeFactor)

    const userPerformances: UserPerformance[] = relevantTargets.map((t) => {
      const userActs = filteredActivities.filter(
        (a) => a.userId?._id === t.userId._id
      )
      return {
        id: t.userId._id,
        name: t.userId.name,
        metrics: buildMetrics(userActs, t, rangeFactor),
      }
    })

    return { teamMetrics, userPerformances }
  }, [targets, filteredActivities, selectedUser, selectedMonth, selectedYear, rangeFactor])

  // ── Derived UI state ───────────────────────────────────────────────────────

  const visibleMetrics = teamMetrics.filter(
    (m) => activeTab === "all" || m.group === activeTab
  )

  const selectedMetric =
    teamMetrics.find((m) => m.id === selectedMetricId) ?? teamMetrics[0]

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 pb-16 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-8 pt-2">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            KPI Performance Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            Real-time tracking of team productivity against monthly benchmarks
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 px-4 py-1.5 font-semibold text-sm">
            <TrendingUp className="w-4 h-4 mr-2" />
            Live analysis
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-500 hover:text-slate-800"
          >
            Logout
          </Button>
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
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
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Team member
              </Label>
              <Select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                options={[
                  { value: "all", label: "Entire team" },
                  ...users.map((u) => ({ value: u._id, label: u.name })),
                ]}
                className="bg-slate-50 border-slate-200 h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Month
              </Label>
              <Select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                options={MONTHS}
                className="bg-slate-50 border-slate-200 h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Year
              </Label>
              <Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                options={YEARS}
                className="bg-slate-50 border-slate-200 h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Start date
              </Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange((p) => ({ ...p, start: e.target.value }))
                }
                className="bg-slate-50 border-slate-200 h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                End date
              </Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange((p) => ({ ...p, end: e.target.value }))
                  }
                  className="bg-slate-50 border-slate-200 h-10 flex-1"
                />
                {hasDateRange && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearDateRange}
                    className="h-10 w-10 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <X size={16} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {userPerformances.length === 0 ? (
        <Card className="py-24 text-center border-dashed border-2 border-slate-200 bg-slate-50/50 rounded-2xl">
          <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
            <Target className="h-12 w-12 text-slate-300" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            No KPI targets found
          </h2>
          <p className="text-slate-500 max-w-sm mx-auto mb-8">
            No performance data matches your current filter selection. Start by
            setting targets for your team.
          </p>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-12 rounded-xl shadow-lg shadow-indigo-100 font-bold"
            onClick={() => (window.location.href = "/admin/kpi")}
          >
            Configure KPI targets
          </Button>
        </Card>
      ) : (
        <div className="space-y-10">

          {/* ── Team Overview ──────────────────────────────────────────────── */}
          <section className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
                <Users className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                {selectedUser === "all"
                  ? "Team overview"
                  : `${userPerformances[0]?.name ?? ""} — overview`}
              </h2>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
              {(
                [
                  { key: "all", label: "All metrics" },
                  { key: "activity", label: "Activity" },
                  { key: "financial", label: "Financial" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                    activeTab === tab.key
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {visibleMetrics.map((metric) => (
                <KpiCard
                  key={metric.id}
                  metric={metric}
                  selected={selectedMetricId === metric.id}
                  onClick={() =>
                    setSelectedMetricId((prev) =>
                      prev === metric.id ? metric.id : metric.id
                    )
                  }
                />
              ))}
            </div>

            {/* Detail Panel */}
            {selectedMetric && (
              <DetailPanel
                metric={selectedMetric}
                userPerformances={userPerformances}
              />
            )}
          </section>

          {/* ── Individual User Cards ─────────────────────────────────────── */}
          {userPerformances.length > 0 && (
            <section className="space-y-5 border-t border-slate-200 pt-8">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-md shadow-slate-200">
                  <Target className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  Individual performance
                </h2>
              </div>
              <div className="space-y-5">
                {userPerformances.map((user) => (
                  <UserPerformanceCard key={user.id} user={user} />
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  )
}
