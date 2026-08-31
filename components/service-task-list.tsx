"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import dynamic from "next/dynamic"

const LocationMap = dynamic(() => import("@/components/location-map"), {
  ssr: false,
  loading: () => <div className="h-60 w-full rounded-lg border border-slate-200 bg-slate-50 animate-pulse" />,
})
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { ClipboardList, Loader2, CheckCircle2, Clock, FileText, MapPin, Map as MapIcon, Search, X, ArrowLeftRight, Ban, GripVertical, ChevronDown, Flag } from "lucide-react"
import { Dialog } from "@/components/ui/dialog"

import ChecklistForm from "@/components/checklist-form"
import { cn } from "@/lib/utils"

export interface TaskData {
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
  assignedEngineer: { _id: string; name: string; email: string }
  receivedBy: { _id: string; name: string; email: string }
  priority: number
  status: string
  gapAssignedToAcknowledge: string
  gapAcknowledgeToTravelStarted: string
  gapTravelStartedToCheckedIn: string
  gapCheckedInToChecklistSubmitted: string
  gapChecklistSubmittedToCompleted: string
  acknowledgedAt?: string
  acknowledgedLat?: number
  acknowledgedLng?: number
  travelStartedAt?: string
  travelStartedLat?: number
  travelStartedLng?: number
  checkedInAt?: string
  checkedInLat?: number
  checkedInLng?: number
  checklistSubmittedAt?: string
  checklistSubmittedLat?: number
  checklistSubmittedLng?: number
  completedAt?: string
  completedLat?: number
  completedLng?: number
  createdBy: { _id: string; name: string; email: string }
  createdAt: string
  updatedAt: string
}

const statusColors: Record<string, string> = {
  "Assigned": "bg-blue-100 text-blue-800",
  "Acknowledge": "bg-purple-100 text-purple-800",
  "Travel Started": "bg-yellow-100 text-yellow-800",
  "Checked In": "bg-orange-100 text-orange-800",
  "Checklist Submitted": "bg-indigo-100 text-indigo-800",
  "Completed": "bg-green-100 text-green-800",
  "Cancelled": "bg-red-100 text-red-800",
}

export const gapPairs: { from: string; to: string; field: string; fromTs: string; toTs: string }[] = [
  { from: "Assigned", to: "Acknowledge", field: "gapAssignedToAcknowledge", fromTs: "createdAt", toTs: "acknowledgedAt" },
  { from: "Acknowledge", to: "Travel Started", field: "gapAcknowledgeToTravelStarted", fromTs: "acknowledgedAt", toTs: "travelStartedAt" },
  { from: "Travel Started", to: "Checked In", field: "gapTravelStartedToCheckedIn", fromTs: "travelStartedAt", toTs: "checkedInAt" },
  { from: "Checked In", to: "Checklist Submitted", field: "gapCheckedInToChecklistSubmitted", fromTs: "checkedInAt", toTs: "checklistSubmittedAt" },
  { from: "Checklist Submitted", to: "Completed", field: "gapChecklistSubmittedToCompleted", fromTs: "checklistSubmittedAt", toTs: "completedAt" },
]

const statusOrder = ["Assigned", "Acknowledge", "Travel Started", "Checked In", "Checklist Submitted", "Completed"]

export function getMinutesGap(gap: string): number {
  if (!gap) return 0
  let total = 0
  const hMatch = gap.match(/(\d+)\s*hour/)
  const mMatch = gap.match(/(\d+)\s*minutes?/)
  if (hMatch) total += parseInt(hMatch[1]) * 60
  if (mMatch) total += parseInt(mMatch[1])
  return total
}

function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const mins = Math.round(totalMinutes % 60)
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`
  if (hours > 0) return `${hours}h`
  return `${mins}m`
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

export function TaskCard({ task, userId, onStatusChange }: { task: TaskData; userId?: string; onStatusChange: () => void }) {
  const [updating, setUpdating] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState("")
  const [editingPriority, setEditingPriority] = useState(false)
  const [priorityValue, setPriorityValue] = useState(task.priority)
  const priorityRef = useRef<HTMLInputElement>(null)
  const [checklist, setChecklist] = useState<any>(null)
  const [checklistLoading, setChecklistLoading] = useState(false)
  const [showChecklistForm, setShowChecklistForm] = useState(false)
  const [showMapDialog, setShowMapDialog] = useState(false)
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [transferring, setTransferring] = useState(false)
  const [transferUsers, setTransferUsers] = useState<{ _id: string; name: string; email: string }[]>([])
  const [transferSearch, setTransferSearch] = useState("")
  const [transferSelectedId, setTransferSelectedId] = useState("")
  const [cancelling, setCancelling] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const healthColor = useMemo(() => {
    let totalScore = 0
    let count = 0
    for (const pair of gapPairs) {
      function taskTs(f: string): string | undefined {
        if (f === "createdAt") return task.createdAt
        if (f === "acknowledgedAt") return task.acknowledgedAt
        if (f === "travelStartedAt") return task.travelStartedAt
        if (f === "checkedInAt") return task.checkedInAt
        if (f === "checklistSubmittedAt") return task.checklistSubmittedAt
        if (f === "completedAt") return task.completedAt
        return undefined
      }
      function taskGap(f: string): string {
        if (f === "gapAssignedToAcknowledge") return task.gapAssignedToAcknowledge
        if (f === "gapAcknowledgeToTravelStarted") return task.gapAcknowledgeToTravelStarted
        if (f === "gapTravelStartedToCheckedIn") return task.gapTravelStartedToCheckedIn
        if (f === "gapCheckedInToChecklistSubmitted") return task.gapCheckedInToChecklistSubmitted
        if (f === "gapChecklistSubmittedToCompleted") return task.gapChecklistSubmittedToCompleted
        return ""
      }
      const fromTs = pair.fromTs === "createdAt" ? task.createdAt : taskTs(pair.fromTs)
      const toTs = taskTs(pair.toTs)
      if (!fromTs || !toTs) continue
      const actualMin = (new Date(toTs).getTime() - new Date(fromTs).getTime()) / 60000
      const estimatedMin = getMinutesGap(taskGap(pair.field))
      if (estimatedMin === 0) continue
      totalScore += actualMin <= estimatedMin ? 0 : actualMin <= estimatedMin + 30 ? 0.5 : 1
      count++
    }
    if (count === 0) return "rgb(148,163,184)"
    const score = totalScore / count
    const hue = 120 - score * 120
    return `hsl(${hue}, 90%, 40%)`
  }, [task])

  const handleTransferClick = useCallback(async () => {
    setShowTransferDialog(true)
    setTransferSearch("")
    setTransferSelectedId("")
    try {
      const res = await fetch("/api/users", { credentials: "include" })
      const data = await res.json()
      if (data.users) {
        setTransferUsers(data.users.filter((u: any) =>
          u.role === "service" || u.role === "service_juniors" || u.role === "esbd_juniors"
        ))
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }, [])

  const handleTransfer = async () => {
    if (!transferSelectedId) return
    setTransferring(true)
    try {
      const res = await fetch(`/api/service-tasks/${task._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedEngineer: transferSelectedId,
          status: "Assigned",
          resetTimestamps: true,
        }),
        credentials: "include",
      })
      const data = await res.json()
      if (data.success) {
        setShowTransferDialog(false)
        setTransferSelectedId("")
        setTransferSearch("")
        onStatusChange()
      } else {
        alert(data.error || "Failed to transfer call/case")
      }
    } catch (error) {
      console.error("Error transferring task:", error)
      alert("Failed to transfer call/case")
    } finally {
      setTransferring(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this call/case?")) return
    setCancelling(true)
    try {
      const res = await fetch(`/api/service-tasks/${task._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Cancelled" }),
        credentials: "include",
      })
      const data = await res.json()
      if (data.success) onStatusChange()
      else alert(data.error || "Failed to cancel call/case")
    } catch (error) {
      console.error("Error cancelling task:", error)
      alert("Failed to cancel call/case")
    } finally {
      setCancelling(false)
    }
  }

  useEffect(() => {
    const fetchChecklist = async () => {
      if (!["Checked In", "Checklist Submitted", "Completed"].includes(task.status)) return
      setChecklistLoading(true)
      try {
        const res = await fetch(`/api/checklists?taskId=${task._id}`, { credentials: "include" })
        const data = await res.json()
        if (data.success && data.data.length > 0) {
          setChecklist(data.data[0])
        }
      } catch (error) {
        console.error("Error fetching checklist:", error)
      } finally {
        setChecklistLoading(false)
      }
    }
    fetchChecklist()
  }, [task._id, task.status])

  const currentIdx = statusOrder.indexOf(task.status)
  const nextStatuses = currentIdx < statusOrder.length - 1 ? statusOrder.slice(currentIdx + 1) : []

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true)
    try {
      let lat: number | undefined
      let lng: number | undefined
      if (navigator.geolocation) {
        const geoPromise = new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 8000,
          })
          setTimeout(() => reject(new Error("Geolocation request timed out after 8s")), 8000)
        })
        try {
          const pos = await geoPromise
          lat = pos.coords.latitude
          lng = pos.coords.longitude
        } catch (geoError: any) {
          const msg = geoError.code === 1 ? "Location permission denied. Enable location in your browser settings."
            : geoError.code === 2 ? "Location unavailable. Ensure location services are enabled on your device."
            : `Could not get location: ${geoError.message}`
          console.warn("Geolocation:", msg)
          alert(msg + "\n\nStatus will still update without location.")
        }
      } else {
        alert("Geolocation is not supported in this browser. Status will update without location.")
      }

      const res = await fetch(`/api/service-tasks/${task._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, lat, lng }),
        credentials: "include",
      })
      const data = await res.json()
      if (data.success) {
        setSelectedStatus("")
        onStatusChange()
      } else {
        alert(data.error || "Failed to update status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
      alert("Failed to update status")
    } finally {
      setUpdating(false)
    }
  }

  useEffect(() => {
    if (editingPriority && priorityRef.current) priorityRef.current.focus()
  }, [editingPriority])

  const handlePrioritySave = async () => {
    const val = Math.max(0, Math.floor(priorityValue || 0))
    setPriorityValue(val)
    setEditingPriority(false)
    if (val === task.priority) return
    try {
      const res = await fetch(`/api/service-tasks/${task._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: val }),
        credentials: "include",
      })
      const data = await res.json()
      if (data.success) onStatusChange()
      else alert(data.error || "Failed to update priority")
    } catch (error) {
      console.error("Error updating priority:", error)
      alert("Failed to update priority")
    }
  }

  const isAssignedToMe = userId ? task.assignedEngineer?._id === userId : false

  const isLast = (idx: number) => idx === gapPairs.length - 1

  const mapPoints = useMemo(() => {
    const points: { lat: number; lng: number; status: string; timestamp: string }[] = []
    const entries: [string, string, string, string][] = [
      ["Acknowledge", "acknowledgedAt", "acknowledgedLat", "acknowledgedLng"],
      ["Travel Started", "travelStartedAt", "travelStartedLat", "travelStartedLng"],
      ["Checked In", "checkedInAt", "checkedInLat", "checkedInLng"],
      ["Checklist Submitted", "checklistSubmittedAt", "checklistSubmittedLat", "checklistSubmittedLng"],
      ["Completed", "completedAt", "completedLat", "completedLng"],
    ]
    for (const [status, tsField, latField, lngField] of entries) {
      const ts = (task as any)[tsField]
      const lat = (task as any)[latField]
      const lng = (task as any)[lngField]
      if (ts && lat !== undefined && lng !== undefined) {
        points.push({ lat, lng, status, timestamp: formatDateTime(ts) })
      }
    }
    return points
  }, [task])

  return (
    <Card>
      <div onClick={() => setExpanded(!expanded)} className="cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div className="flex items-start gap-2">
              <GripVertical className="w-4 h-4 mt-1 text-slate-300 cursor-grab active:cursor-grabbing shrink-0" />
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {task.customerName}
                  {task.priority > 0 && <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">#{task.priority}</span>}
                  <Flag style={{ color: healthColor }} fill="currentColor" className="w-4 h-4" />
                  <span className="text-sm font-normal text-slate-500">{task.callType}</span>
                  {task.department && <span className="text-sm font-normal text-slate-400">&middot; {task.department}</span>}
                </CardTitle>
                <CardDescription>{task.productCategory && task.productType ? `${task.productCategory} / ${task.productType} \u00B7 ${task.deviceModel}` : task.deviceModel}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", expanded && "rotate-180")} />
            </div>
          </div>
        </CardHeader>
      </div>
      {expanded && (
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <span className={cn("px-3 py-1 rounded-full text-sm font-medium", statusColors[task.status] || "bg-gray-100 text-gray-800")}>{task.status}</span>
          {task.priority > 0 && <span className="px-3 py-1 rounded-full text-sm font-bold bg-amber-100 text-amber-800">#{task.priority}</span>}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div><p className="text-slate-500 font-medium">Received by</p><p className="text-slate-900">{task.receivedBy?.name || "N/A"}</p></div>
              <div><p className="text-slate-500 font-medium">Assigned Engineer</p><p className="text-slate-900">{task.assignedEngineer?.name || "N/A"}</p></div>
              <div><p className="text-slate-500 font-medium">Product Category</p><p className="text-slate-900">{task.productCategory || "—"}</p></div>
              <div><p className="text-slate-500 font-medium">Product Type</p><p className="text-slate-900">{task.productType || "—"}</p></div>
              <div><p className="text-slate-500 font-medium">Department</p><p className="text-slate-900">{task.department || "—"}</p></div>
              <div><p className="text-slate-500 font-medium">Phone</p><p className="text-slate-900">{task.contactNumber}</p></div>
              <div><p className="text-slate-500 font-medium">Location</p><p className="text-slate-900 truncate" title={task.location}>{task.location}</p></div>
              <div><p className="text-slate-500 font-medium">Assigned At</p><p className="text-slate-900">{formatDateTime(task.createdAt)}</p></div>
            </div>
            <div><p className="text-slate-500 font-medium">Problem</p><p className="text-slate-900 truncate" title={task.problem}>{task.problem}</p></div>
            <div><p className="text-slate-500 font-medium">Call Type / Category</p><p className="text-slate-900">{task.callType} &middot; {task.customerCategory}</p></div>

            {isAssignedToMe && nextStatuses.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-slate-500 font-medium mb-2">Update Status</p>
                <div className="flex gap-2">
                  <Select
                    options={[{ value: "", label: "Select status..." }, ...nextStatuses.map((s) => ({ value: s, label: s }))]}
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  />
                  <Button
                    size="sm"
                    onClick={() => selectedStatus && handleStatusUpdate(selectedStatus)}
                    disabled={!selectedStatus || updating}
                  >
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update"}
                  </Button>
                </div>
                {isAssignedToMe && task.status === "Checked In" && !checklist && (
                  <Button size="sm" variant="outline" onClick={() => setShowChecklistForm(true)} className="mt-2 w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    Checklist Form
                  </Button>
                )}
              </div>
            )}

            {checklist && (
              <div className="pt-2 border-t">
                <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Checklist Details
                </p>
                <div className="text-sm space-y-1.5 bg-slate-50 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div><p className="text-slate-500 text-xs">Date</p><p className="text-slate-900 text-xs font-medium">{new Date(checklist.date).toLocaleDateString("en-GB")}</p></div>
                    <div><p className="text-slate-500 text-xs">Serial No.</p><p className="text-slate-900 text-xs font-medium">{checklist.serialNumber}</p></div>
                    <div><p className="text-slate-500 text-xs">Machine Status</p><p className="text-xs font-medium capitalize" style={{ color: checklist.mfpStatus === "completed" ? "#16a34a" : checklist.mfpStatus === "estimate needed" ? "#ca8a04" : "#dc2626" }}>{checklist.mfpStatus}</p></div>
                  </div>
                  {checklist.mfpStatus === "not completed" && (
                    <div className="border-t border-slate-200 pt-2 mt-2 space-y-1">
                      {checklist.partsNeededToCheck && <div><p className="text-slate-500 text-xs">Parts Needed</p><p className="text-slate-900 text-xs">{checklist.partsNeededToCheck}</p></div>}
                      {checklist.seniorEngineerRequired && <div><p className="text-slate-500 text-xs">Senior Engineer</p><p className="text-slate-900 text-xs">{checklist.seniorEngineerRequired}</p></div>}
                      {checklist.partsProblem && <div><p className="text-slate-500 text-xs">Parts Problem</p><p className="text-slate-900 text-xs">{checklist.partsProblem}</p></div>}
                    </div>
                  )}
                  {checklist.remarks && <div className="border-t border-slate-200 pt-2 mt-2"><p className="text-slate-500 text-xs">Remarks</p><p className="text-slate-900 text-xs">{checklist.remarks}</p></div>}
                  {checklist.image && (
                    <div className="border-t border-slate-200 pt-2 mt-2">
                      <p className="text-slate-500 text-xs mb-1">Picture</p>
                      <img src={checklist.image} alt="Checklist" className="h-32 w-auto rounded-lg object-cover border cursor-pointer" onClick={() => window.open(checklist.image)} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="border-l pl-6">
            <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Status Tracking
            </p>
            <div className="relative pl-8">
              {gapPairs.map((pair, idx) => {
                function taskTs(t: TaskData, f: string): string | undefined {
                  if (f === "createdAt") return t.createdAt
                  if (f === "acknowledgedAt") return t.acknowledgedAt
                  if (f === "travelStartedAt") return t.travelStartedAt
                  if (f === "checkedInAt") return t.checkedInAt
                  if (f === "checklistSubmittedAt") return t.checklistSubmittedAt
                  if (f === "completedAt") return t.completedAt
                  return undefined
                }
                function taskGap(t: TaskData, f: string): string {
                  if (f === "gapAssignedToAcknowledge") return t.gapAssignedToAcknowledge
                  if (f === "gapAcknowledgeToTravelStarted") return t.gapAcknowledgeToTravelStarted
                  if (f === "gapTravelStartedToCheckedIn") return t.gapTravelStartedToCheckedIn
                  if (f === "gapCheckedInToChecklistSubmitted") return t.gapCheckedInToChecklistSubmitted
                  if (f === "gapChecklistSubmittedToCompleted") return t.gapChecklistSubmittedToCompleted
                  return ""
                }
                const fromTs = pair.fromTs === "createdAt" ? task.createdAt : taskTs(task, pair.fromTs)
                const toTs = taskTs(task, pair.toTs)
                const fromDate = pair.fromTs === "createdAt" ? new Date(task.createdAt) : fromTs ? new Date(fromTs) : null
                const toDate = toTs ? new Date(toTs) : null
                const estimatedMin = getMinutesGap(taskGap(task, pair.field))

                let actualMin: number | null = null
                let gapColor = "bg-gray-200"
                let gapLabelText = ""

                if (fromDate && toDate && !isLast(idx)) {
                  actualMin = (toDate.getTime() - fromDate.getTime()) / 60000
                  if (actualMin <= estimatedMin) {
                    gapColor = "bg-green-500"
                    gapLabelText = `${formatDuration(actualMin)} \u2713 on time`
                  } else if (actualMin <= estimatedMin + 30) {
                    gapColor = "bg-yellow-500"
                    gapLabelText = `${formatDuration(actualMin)} \u26A0 slightly over`
                  } else {
                    gapColor = "bg-red-500"
                    gapLabelText = `${formatDuration(actualMin)} \u2716 over time`
                  }
                }

                return (
                  <div key={pair.field} className="relative">
                    {!isLast(idx) && (
                      <div className="absolute left-[8px] top-4 w-0.5 h-full bg-gray-200" />
                    )}
                    <div className="flex items-start gap-3 relative pb-5">
                      <div className="relative z-10 mt-1">
                        {toDate ? (
                          <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-green-500 flex items-center justify-center">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                        ) : fromDate ? (
                          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-blue-500 animate-pulse" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-gray-300 bg-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn("text-sm font-medium", toDate ? "text-green-700" : fromDate ? "text-blue-700" : "text-slate-400")}>
                            {pair.to}
                          </span>
                          {toDate && <span className="text-xs text-slate-500">{formatDateTime(toDate.toISOString())}</span>}
                        </div>
                        {!isLast(idx) && (
                          <div className="flex items-center gap-2 mt-1">
                            <Flag className={cn("w-4 h-4", toDate ? gapColor.replace("bg-", "text-") : fromDate ? "text-blue-400" : "text-slate-300")} fill="currentColor" />
                            <span className="text-xs text-slate-500">Est: {formatDuration(estimatedMin)}</span>
                            {actualMin !== null && (
                              <span className="text-xs font-medium text-slate-700">| {gapLabelText}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4">
              <Button size="sm" variant="outline" onClick={() => setShowMapDialog(true)} className="w-full">
                <MapIcon className="w-4 h-4 mr-2" />
                Show Status Map
              </Button>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" onClick={handleTransferClick} className="flex-1" disabled={cancelling}>
                <ArrowLeftRight className="w-4 h-4 mr-2" />
                Transfer
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel} className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300" disabled={cancelling}>
                {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4 mr-2" />}
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      )}
      {showMapDialog && (
        <Dialog open={showMapDialog} onClose={() => setShowMapDialog(false)} title={`Location History - #${task.taskId}`}>
          {mapPoints.length > 0 ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {mapPoints.map((p, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {i + 1}. {p.status} — {p.timestamp}
                  </span>
                ))}
              </div>
              <div className="h-[400px] w-full rounded-lg overflow-hidden border">
                <LocationMap points={mapPoints} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-500">No location data recorded yet.</p>
              <p className="text-sm text-slate-400 mt-1">Location is captured automatically when updating a call/case status with geolocation enabled.</p>
            </div>
          )}
        </Dialog>
      )}
      {showChecklistForm && (
        <ChecklistForm
          open={showChecklistForm}
          onClose={() => setShowChecklistForm(false)}
          taskId={task.taskId}
          customerName={task.customerName}
          serviceTaskId={task._id}
          onSuccess={() => {
            setShowChecklistForm(false)
            onStatusChange()
          }}
        />
      )}
      <Dialog open={showTransferDialog} onClose={() => setShowTransferDialog(false)} title={`Transfer Call/Case - #${task.taskId}`}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Select a new engineer to assign this call/case to. The status tracking will reset.</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input value={transferSearch} onChange={(e) => setTransferSearch(e.target.value)} placeholder="Search engineer..." className="pl-9" />
          </div>
          <div className="max-h-60 overflow-y-auto border rounded-lg divide-y">
            {transferUsers.filter((u) => u.name.toLowerCase().includes(transferSearch.toLowerCase())).length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-slate-500">No engineers found</div>
            ) : (
              transferUsers.filter((u) => u.name.toLowerCase().includes(transferSearch.toLowerCase())).map((u) => (
                <button
                  key={u._id}
                  type="button"
                  onClick={() => setTransferSelectedId(u._id)}
                  className={cn("w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center justify-between",
                    transferSelectedId === u._id ? "bg-blue-50 text-blue-700" : "text-gray-900"
                  )}
                >
                  <div>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-gray-500">{u.email}</div>
                  </div>
                  {transferSelectedId === u._id && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                </button>
              ))
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowTransferDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={handleTransfer} disabled={!transferSelectedId || transferring}>
              {transferring ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Transferring...</> : "Transfer"}
            </Button>
          </div>
        </div>
      </Dialog>
    </Card>
  )
}

export default function ServiceTaskList({ refreshKey, userId, assignedToUserIds }: { refreshKey: number; userId?: string; assignedToUserIds?: string[] }) {
  const [tasks, setTasks] = useState<TaskData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [callTypeFilter, setCallTypeFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [engineerSearch, setEngineerSearch] = useState("")
  const [engineerFilter, setEngineerFilter] = useState("")
  const [engineerDropdownOpen, setEngineerDropdownOpen] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const engineerRef = useRef<HTMLDivElement>(null)

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }
    const reordered = [...filteredTasks]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(dropIndex, 0, moved)
    const updates = reordered.map((task, i) => ({ id: task._id, newPriority: i + 1, oldPriority: task.priority })).filter((u) => u.newPriority !== u.oldPriority)
    await Promise.all(updates.map((u) => fetch(`/api/service-tasks/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority: u.newPriority, skipSwap: true }),
      credentials: "include",
    })))
    setDragIndex(null)
    setDragOverIndex(null)
    fetchTasks()
  }

  const handleDragEnd = () => {
    setDragIndex(null)
    setDragOverIndex(null)
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (engineerRef.current && !engineerRef.current.contains(e.target as Node)) setEngineerDropdownOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const uniqueEngineers = useMemo(() => {
    const map = new Map<string, { _id: string; name: string }>()
    tasks.forEach((t) => {
      if (t.assignedEngineer?._id) map.set(t.assignedEngineer._id, { _id: t.assignedEngineer._id, name: t.assignedEngineer.name })
    })
    return Array.from(map.values())
  }, [tasks])

  const filteredEngineers = uniqueEngineers.filter((e) =>
    e.name.toLowerCase().includes(engineerSearch.toLowerCase())
  )

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const query = userId ? `?createdBy=${userId}&assignedTo=${userId}` : ""
      const res = await fetch(`/api/service-tasks${query}`, { credentials: "include" })
      const data = await res.json()
      if (data.success) setTasks(data.data.sort((a: TaskData, b: TaskData) => (a.priority || 999) - (b.priority || 999)))
    } catch (error) {
      console.error("Error fetching tasks:", error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchTasks()
  }, [refreshKey, fetchTasks])

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (task.status === "Queued" || task.status === "Cancelled") return false
      const matchSearch = !search || task.customerName.toLowerCase().includes(search.toLowerCase()) || task.taskId.toLowerCase().includes(search.toLowerCase()) || task.deviceModel.toLowerCase().includes(search.toLowerCase()) || (task.productCategory || "").toLowerCase().includes(search.toLowerCase()) || (task.productType || "").toLowerCase().includes(search.toLowerCase())
      const matchStatus = !statusFilter || task.status === statusFilter
      const matchCallType = !callTypeFilter || task.callType === callTypeFilter
      const matchCategory = !categoryFilter || task.customerCategory === categoryFilter
      const taskDate = new Date(task.createdAt)
      const matchStart = !startDate || taskDate >= new Date(startDate)
      const matchEnd = !endDate || taskDate <= new Date(endDate + "T23:59:59")
      const matchEngineer = !engineerFilter || task.assignedEngineer?.name === engineerFilter
      const matchBranchUser = !assignedToUserIds || (task.assignedEngineer?._id && assignedToUserIds.includes(task.assignedEngineer._id))
      return matchSearch && matchStatus && matchCallType && matchCategory && matchStart && matchEnd && matchEngineer && matchBranchUser
    })
  }, [tasks, search, statusFilter, callTypeFilter, categoryFilter, startDate, endDate, engineerFilter, assignedToUserIds])

  const combinedHealth = useMemo(() => {
    let totalScore = 0
    let count = 0
    let onTime = 0
    let slightlyOver = 0
    let overTime = 0
    let noData = 0
    for (const task of filteredTasks) {
      let taskScore = 0
      let taskCount = 0
      for (const pair of gapPairs) {
        function taskTs(f: string): string | undefined {
          if (f === "createdAt") return task.createdAt
          if (f === "acknowledgedAt") return task.acknowledgedAt
          if (f === "travelStartedAt") return task.travelStartedAt
          if (f === "checkedInAt") return task.checkedInAt
          if (f === "checklistSubmittedAt") return task.checklistSubmittedAt
          if (f === "completedAt") return task.completedAt
          return undefined
        }
        function taskGap(f: string): string {
          if (f === "gapAssignedToAcknowledge") return task.gapAssignedToAcknowledge
          if (f === "gapAcknowledgeToTravelStarted") return task.gapAcknowledgeToTravelStarted
          if (f === "gapTravelStartedToCheckedIn") return task.gapTravelStartedToCheckedIn
          if (f === "gapCheckedInToChecklistSubmitted") return task.gapCheckedInToChecklistSubmitted
          if (f === "gapChecklistSubmittedToCompleted") return task.gapChecklistSubmittedToCompleted
          return ""
        }
        const fromTs = pair.fromTs === "createdAt" ? task.createdAt : taskTs(pair.fromTs)
        const toTs = taskTs(pair.toTs)
        if (!fromTs || !toTs) continue
        const actualMin = (new Date(toTs).getTime() - new Date(fromTs).getTime()) / 60000
        const estimatedMin = getMinutesGap(taskGap(pair.field))
        if (estimatedMin === 0) continue
        const gapScore = actualMin <= estimatedMin ? 0 : actualMin <= estimatedMin + 30 ? 0.5 : 1
        taskScore += gapScore
        taskCount++
      }
      if (taskCount === 0) { noData++; continue }
      const avg = taskScore / taskCount
      if (avg === 0) onTime++
      else if (avg <= 0.5) slightlyOver++
      else overTime++
      totalScore += avg
      count++
    }
    const hue = count === 0 ? 220 : 120 - (totalScore / count) * 120
    return {
      color: count === 0 ? "rgb(148,163,184)" : `hsl(${hue}, 90%, 40%)`,
      onTime, slightlyOver, overTime, noData, total: filteredTasks.length,
    }
  }, [filteredTasks])

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <Flag style={{ color: combinedHealth.color }} fill="currentColor" className="w-8 h-8 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800">Combined Status</p>
              <p className="text-sm font-semibold text-slate-700">
                {combinedHealth.total === 0 ? "No calls/cases" : (
                  <span>{combinedHealth.onTime} on-time &middot; {combinedHealth.slightlyOver} slightly over &middot; {combinedHealth.overTime} over time &middot; {combinedHealth.noData} no data</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by customer, call/case ID, or model..." className="pl-9" />
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={[
              { value: "", label: "All Statuses" },
              ...statusOrder.filter((s) => s !== "Queued").map((s) => ({ value: s, label: s })),
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div ref={engineerRef} className="relative w-full sm:w-48">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={engineerSearch}
              onChange={(e) => { setEngineerSearch(e.target.value); setEngineerDropdownOpen(true); if (engineerFilter) setEngineerFilter("") }}
              onFocus={() => setEngineerDropdownOpen(true)}
              placeholder={engineerFilter || "All Engineers"}
              className="pl-9 pr-9"
            />
            {engineerFilter && (
              <button type="button" onClick={() => { setEngineerFilter(""); setEngineerSearch("") }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {engineerDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              <button type="button" onClick={() => { setEngineerFilter(""); setEngineerSearch(""); setEngineerDropdownOpen(false) }} className={cn("w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors", !engineerFilter ? "bg-blue-50 text-blue-700" : "text-gray-900")}>All Engineers</button>
              {filteredEngineers.map((eng) => (
                <button key={eng._id} type="button" onClick={() => { setEngineerFilter(eng.name); setEngineerSearch(eng.name); setEngineerDropdownOpen(false) }} className={cn("w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors", engineerFilter === eng.name ? "bg-blue-50 text-blue-700" : "text-gray-900")}>{eng.name}</button>
              ))}
            </div>
          )}
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={[
              { value: "", label: "All Call Types" },
              { value: "Regular Service", label: "Regular Service" },
              { value: "Standby Support", label: "Standby Support" },
              { value: "Estimated Work", label: "Estimated Work" },
              { value: "Installation", label: "Installation" },
              { value: "Recheck", label: "Recheck" },
              { value: "Post Estimated Support", label: "Post Estimated Support" },
              { value: "Monthly", label: "Monthly" },
              { value: "Demo", label: "Demo" },
              { value: "Meeting", label: "Meeting" },
              { value: "Follow up call", label: "Follow up call" },
              { value: "Document Submission", label: "Document Submission" },
              { value: "Toner Delivery", label: "Toner Delivery" },
              { value: "Tour", label: "Tour" },
              { value: "Others", label: "Others" },
            ]}
            value={callTypeFilter}
            onChange={(e) => setCallTypeFilter(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={[
              { value: "", label: "All Categories" },
              { value: "Warranty", label: "Warranty" },
              { value: "AMC", label: "AMC" },
              { value: "Call Basis", label: "Call Basis" },
              { value: "Key Customer/Regular", label: "Key Customer/Regular" },
              { value: "Irregular", label: "Irregular" },
              { value: "New Comer", label: "New Comer" },
              { value: "Others", label: "Others" },
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
        <Card><CardContent className="py-16"><div className="text-center"><ClipboardList className="w-12 h-12 mx-auto text-slate-300 mb-3" /><p className="text-slate-500">No calls/cases match your filters</p></div></CardContent></Card>
      ) : (
        filteredTasks.map((task, index) => (
          <div
            key={task._id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={() => setDragOverIndex(null)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              dragIndex === index && "opacity-40",
              dragOverIndex === index && dragIndex !== index && "relative"
            )}
          >
            {dragOverIndex === index && dragIndex !== index && (
              <div className="absolute -top-1 left-0 right-0 z-10 flex justify-center pointer-events-none">
                <div className="w-full h-0.5 bg-blue-500 rounded-full" />
              </div>
            )}
            <TaskCard task={task} userId={userId} onStatusChange={fetchTasks} />
          </div>
        ))
      )}
    </div>
  )
}
