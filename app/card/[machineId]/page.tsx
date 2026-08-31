"use client"

import { useEffect, useState, Suspense } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { History, ShieldCheck } from "lucide-react"

interface CardMachine {
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[#1B2A4A] font-medium text-sm mb-1">{label}</label>
      <div className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 min-h-[38px]">{children}</div>
    </div>
  )
}

function CustomerCardContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const machineId = Array.isArray(params.machineId) ? params.machineId[0] : params.machineId
  const token = searchParams.get("token") || ""
  const missing = !machineId || !token

  const [machine, setMachine] = useState<CardMachine | null>(null)
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(!missing)
  const [invalid, setInvalid] = useState(missing)

  useEffect(() => {
    if (missing) return
    fetch(`/api/card/${machineId}?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.machine) {
          setMachine(data.machine)
          setRecords(data.records || [])
          setInvalid(false)
        } else {
          setInvalid(true)
        }
      })
      .catch(() => setInvalid(true))
      .finally(() => setLoading(false))
  }, [machineId, token, missing])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (invalid || !machine) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center">
        <ShieldCheck className="w-14 h-14 mx-auto mb-4 text-slate-300" />
        <h1 className="text-xl font-bold text-slate-900">Invalid Link</h1>
        <p className="mt-2 text-slate-500">This service card link is not valid or has been regenerated. Please contact your service provider for a new link.</p>
      </div>
    )
  }

  const billDateObj = machine.billDate ? new Date(machine.billDate) : null
  const warrantyExpiredObj = machine.warrantyExpired ? new Date(machine.warrantyExpired) : null
  const totalWarrantyDays = billDateObj && warrantyExpiredObj ? dayDiff(billDateObj, warrantyExpiredObj) : null
  const remainingWarrantyDays = warrantyExpiredObj ? dayDiff(new Date(), warrantyExpiredObj) : null
  const isWarrantyActive = remainingWarrantyDays !== null && remainingWarrantyDays >= 0

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Your Service Card</h1>
          <p className="text-slate-500">{machine.customerName} · Card ID: {machine.machineId || "No ID"}</p>
        </div>

        <div className="bg-[#FDF0E6] rounded-xl border border-[#E8D5B5] p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3">
              <Field label="Customer ID">{machine.machineId || "—"}</Field>
            </div>
            <div className="md:col-span-3">
              <Field label="Group Name">{machine.customerGroup || "—"}</Field>
            </div>
            <div className="md:col-span-3">
              <Field label="Department">{machine.department || "—"}</Field>
            </div>
            <div className="md:col-span-3">
              <Field label="Product Category">{machine.productCategory || "—"}</Field>
            </div>

            <div className="md:col-span-4">
              <Field label="Customer Name">{machine.customerName}</Field>
            </div>
            <div className="md:col-span-4">
              <Field label="Bill No">{machine.billNumber || "—"}</Field>
            </div>
            <div className="md:col-span-4">
              <Field label="Bill Date">{machine.billDate ? new Date(machine.billDate).toLocaleDateString() : "—"}</Field>
            </div>

            <div className="md:col-span-6">
              <Field label="Location">{machine.location || "—"}</Field>
            </div>
            <div className="md:col-span-6">
              <Field label="Address">{machine.address || "—"}</Field>
            </div>

            <div className="md:col-span-3">
              <Field label="Brand">{machine.brandName || "—"}</Field>
            </div>
            <div className="md:col-span-3">
              <Field label="Model">{machine.modelName || "—"}</Field>
            </div>
            <div className="md:col-span-3">
              <Field label="Serial No">{machine.serialNumber || "—"}</Field>
            </div>
            <div className="md:col-span-3">
              <Field label="SLA">{machine.sla || "—"}</Field>
            </div>

            <div className="md:col-span-3">
              <Field label="Contact Person">{machine.contactPerson || "—"}</Field>
            </div>
            <div className="md:col-span-3">
              <Field label="Mobile">{machine.contactNumber || "—"}</Field>
            </div>
            <div className="md:col-span-3">
              <Field label="Email">{machine.email || "—"}</Field>
            </div>
            <div className="md:col-span-3">
              <Field label="Warranty Expired">{machine.warrantyExpired ? new Date(machine.warrantyExpired).toLocaleDateString() : "—"}</Field>
            </div>

            <div className="md:col-span-3">
              <Field label="Option">{machine.option || "—"}</Field>
            </div>
            <div className="md:col-span-9">
              <Field label="Note">{machine.notes || "—"}</Field>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-[#E8D5B5]">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Warranty Period</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Bill Date">{billDateObj ? billDateObj.toLocaleDateString() : "—"}</Field>
              <Field label="Warranty Expired">{warrantyExpiredObj ? warrantyExpiredObj.toLocaleDateString() : "—"}</Field>
              <Field label="Total Warranty">{totalWarrantyDays !== null ? formatPeriod(totalWarrantyDays) : "—"}</Field>
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
          {records.length === 0 ? (
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
                  {records.map((record: any) => (
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
      </div>
    </div>
  )
}

export default function CustomerCardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <CustomerCardContent />
    </Suspense>
  )
}
