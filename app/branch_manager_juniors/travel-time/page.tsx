"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Clock, Plus, Pencil, Trash2, X, Search } from "lucide-react"
import axios from "axios"

interface TravelTimeEntry {
  _id: string
  fromLocation: string
  toLocation: string
  vehicleType: string
  hours: number
  minutes: number
  segments?: { vehicleType: string; hours: number; minutes: number }[]
  createdAt: string
}

const vehicleTypeOptions = ["Bus", "Bike", "Rickshaw", "Car", "Foot"]

function normalizeLocation(str: string): string {
  return str.trim().replace(/\s+/g, " ")
}

export default function TravelTimePage() {
  const [entries, setEntries] = useState<TravelTimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [searchFrom, setSearchFrom] = useState("")
  const [searchTo, setSearchTo] = useState("")

  const [fromLocation, setFromLocation] = useState("")
  const [toLocation, setToLocation] = useState("")
  const [segments, setSegments] = useState<{ vehicleType: string; hours: string; minutes: string }[]>([{ vehicleType: "Bus", hours: "", minutes: "" }])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFrom, setEditFrom] = useState("")
  const [editTo, setEditTo] = useState("")
  const [editSegments, setEditSegments] = useState<{ vehicleType: string; hours: string; minutes: string }[]>([])

  const [fromDropdownOpen, setFromDropdownOpen] = useState(false)
  const [toDropdownOpen, setToDropdownOpen] = useState(false)
  const [editFromDropdownOpen, setEditFromDropdownOpen] = useState(false)
  const [editToDropdownOpen, setEditToDropdownOpen] = useState(false)

  const fromRef = useRef<HTMLDivElement>(null)
  const toRef = useRef<HTMLDivElement>(null)
  const editFromRef = useRef<HTMLDivElement>(null)
  const editToRef = useRef<HTMLDivElement>(null)

  const uniqueLocations = useMemo(() => {
    const set = new Set<string>()
    entries.forEach((e) => { set.add(e.fromLocation); set.add(e.toLocation) })
    return Array.from(set).sort()
  }, [entries])

  const computeTotalMinutes = (segs: { vehicleType: string; hours: string; minutes: string }[]) => {
    return segs.reduce((sum, seg) => sum + (Number(seg.hours) || 0) * 60 + (Number(seg.minutes) || 0), 0)
  }

  const formatTotal = (segs: { vehicleType: string; hours: string; minutes: string }[]) => {
    const total = computeTotalMinutes(segs)
    const h = Math.floor(total / 60)
    const m = total % 60
    if (h === 0 && m === 0) return "0m"
    if (h === 0) return `${m}m`
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
  }

  const filteredEntries = entries.filter(e =>
    e.fromLocation.toLowerCase().includes(searchFrom.toLowerCase()) &&
    e.toLocation.toLowerCase().includes(searchTo.toLowerCase())
  )

  useEffect(() => {
    fetchEntries()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fromRef.current && !fromRef.current.contains(e.target as Node)) setFromDropdownOpen(false)
      if (toRef.current && !toRef.current.contains(e.target as Node)) setToDropdownOpen(false)
      if (editFromRef.current && !editFromRef.current.contains(e.target as Node)) setEditFromDropdownOpen(false)
      if (editToRef.current && !editToRef.current.contains(e.target as Node)) setEditToDropdownOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchEntries = async () => {
    try {
      const response = await axios.get("/api/travel-times", { withCredentials: true })
      setEntries(response.data.travelTimes || [])
    } catch (error) {
      console.error("Failed to fetch travel times:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fromLocation.trim() || !toLocation.trim()) return
    if (segments.length === 0 || segments.every(s => !s.hours && !s.minutes)) return
    setSubmitting(true)
    try {
      await axios.post("/api/travel-times", {
        fromLocation: normalizeLocation(fromLocation),
        toLocation: normalizeLocation(toLocation),
        segments: segments.map(seg => ({ vehicleType: seg.vehicleType, hours: Number(seg.hours) || 0, minutes: Number(seg.minutes) || 0 })),
      }, { withCredentials: true })
      setFromLocation("")
      setToLocation("")
      setSegments([{ vehicleType: "Bus", hours: "", minutes: "" }])
      setShowForm(false)
      fetchEntries()
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to create travel time")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this travel time?")) return
    try {
      await axios.delete(`/api/travel-times/${id}`, { withCredentials: true })
      setEntries(entries.filter(e => e._id !== id))
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to delete travel time")
    }
  }

  const startEdit = (entry: TravelTimeEntry) => {
    setEditingId(entry._id)
    setEditFrom(entry.fromLocation)
    setEditTo(entry.toLocation)
    if (entry.segments && entry.segments.length > 0) {
      setEditSegments(entry.segments.map(seg => ({ vehicleType: seg.vehicleType, hours: String(seg.hours), minutes: String(seg.minutes) })))
    } else {
      setEditSegments([{ vehicleType: entry.vehicleType || "Bus", hours: String(entry.hours), minutes: String(entry.minutes) }])
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditFrom("")
    setEditTo("")
    setEditSegments([])
  }

  const saveEdit = async (id: string) => {
    if (!editFrom.trim() || !editTo.trim()) return
    if (editSegments.length === 0 || editSegments.every(s => !s.hours && !s.minutes)) return
    setSubmitting(true)
    try {
      await axios.put(`/api/travel-times/${id}`, {
        fromLocation: normalizeLocation(editFrom),
        toLocation: normalizeLocation(editTo),
        segments: editSegments.map(seg => ({ vehicleType: seg.vehicleType, hours: Number(seg.hours) || 0, minutes: Number(seg.minutes) || 0 })),
      }, { withCredentials: true })
      setEditingId(null)
      setEditFrom("")
      setEditTo("")
      setEditSegments([])
      fetchEntries()
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to update travel time")
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Travel Time</h1>
          <p className="text-slate-500">Set travel time between locations</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-teal-600 hover:bg-teal-700">
          <Plus size={18} className="mr-2" />
          Add Travel Time
        </Button>
      </div>

      {showForm && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Add Travel Time</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div ref={fromRef} className="relative">
                  <Label htmlFor="fromLocation">From Location</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="fromLocation"
                      value={fromLocation}
                      onChange={(e) => { setFromLocation(e.target.value); setFromDropdownOpen(true) }}
                      onFocus={() => setFromDropdownOpen(true)}
                      placeholder="e.g., Uttara"
                      className="pl-9"
                      required
                    />
                  </div>
                  {fromDropdownOpen && fromLocation.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {uniqueLocations.filter((l) => l.toLowerCase().includes(fromLocation.toLowerCase())).length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">Type to add new location</div>
                      ) : (
                        uniqueLocations.filter((l) => l.toLowerCase().includes(fromLocation.toLowerCase())).map((loc) => (
                          <button key={loc} type="button" onMouseDown={() => { setFromLocation(loc); setFromDropdownOpen(false) }} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors text-gray-900">{loc}</button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <div ref={toRef} className="relative">
                  <Label htmlFor="toLocation">To Location</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="toLocation"
                      value={toLocation}
                      onChange={(e) => { setToLocation(e.target.value); setToDropdownOpen(true) }}
                      onFocus={() => setToDropdownOpen(true)}
                      placeholder="e.g., Dhanmondi"
                      className="pl-9"
                      required
                    />
                  </div>
                  {toDropdownOpen && toLocation.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {uniqueLocations.filter((l) => l.toLowerCase().includes(toLocation.toLowerCase())).length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">Type to add new location</div>
                      ) : (
                        uniqueLocations.filter((l) => l.toLowerCase().includes(toLocation.toLowerCase())).map((loc) => (
                          <button key={loc} type="button" onMouseDown={() => { setToLocation(loc); setToDropdownOpen(false) }} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors text-gray-900">{loc}</button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Route Segments</Label>
                  <button type="button" onClick={() => setSegments([...segments, { vehicleType: "Bus", hours: "", minutes: "" }])} className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1">
                    <Plus size={14} /> Add Segment
                  </button>
                </div>
                <div className="space-y-2">
                  {segments.map((seg, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-5">{idx + 1}.</span>
                      <select
                        value={seg.vehicleType}
                        onChange={(e) => {
                          const updated = [...segments]
                          updated[idx] = { ...updated[idx], vehicleType: e.target.value }
                          setSegments(updated)
                        }}
                        className="h-9 px-2 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        {vehicleTypeOptions.map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        min="0"
                        value={seg.hours}
                        onChange={(e) => {
                          const updated = [...segments]
                          updated[idx] = { ...updated[idx], hours: e.target.value }
                          setSegments(updated)
                        }}
                        className="h-9 w-20"
                        placeholder="h"
                      />
                      <span className="text-xs text-slate-400">h</span>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={seg.minutes}
                        onChange={(e) => {
                          const updated = [...segments]
                          updated[idx] = { ...updated[idx], minutes: e.target.value }
                          setSegments(updated)
                        }}
                        className="h-9 w-20"
                        placeholder="m"
                      />
                      <span className="text-xs text-slate-400">m</span>
                      {segments.length > 1 && (
                        <button type="button" onClick={() => setSegments(segments.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-slate-500">Total:</span>
                    <span className="text-sm font-medium text-teal-700">{formatTotal(segments)}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting} className="bg-teal-600 hover:bg-teal-700">
                  {submitting ? "Creating..." : "Create"}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setSegments([{ vehicleType: "Bus", hours: "", minutes: "" }]) }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Search from location..."
          value={searchFrom}
          onChange={(e) => setSearchFrom(e.target.value)}
          className="max-w-xs"
        />
        <Input
          placeholder="Search to location..."
          value={searchTo}
          onChange={(e) => setSearchTo(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle>All Travel Times</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredEntries.length === 0 ? (
            <div className="py-12 text-center">
              <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No travel times yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredEntries.map((entry) => (
                <div key={entry._id} className="p-4 flex items-center justify-between">
                  {editingId === entry._id ? (
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <div ref={editFromRef} className="relative">
                          <Input
                            value={editFrom}
                            onChange={(e) => { setEditFrom(e.target.value); setEditFromDropdownOpen(true) }}
                            onFocus={() => setEditFromDropdownOpen(true)}
                            className="h-9 w-40"
                            placeholder="From"
                          />
                          {editFromDropdownOpen && editFrom.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                              {uniqueLocations.filter((l) => l.toLowerCase().includes(editFrom.toLowerCase())).length === 0 ? (
                                <div className="px-3 py-2 text-sm text-gray-500">No matches</div>
                              ) : (
                                uniqueLocations.filter((l) => l.toLowerCase().includes(editFrom.toLowerCase())).map((loc) => (
                                  <button key={loc} type="button" onMouseDown={() => { setEditFrom(loc); setEditFromDropdownOpen(false) }} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors text-gray-900">{loc}</button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                        <span className="text-slate-400">&rarr;</span>
                        <div ref={editToRef} className="relative">
                          <Input
                            value={editTo}
                            onChange={(e) => { setEditTo(e.target.value); setEditToDropdownOpen(true) }}
                            onFocus={() => setEditToDropdownOpen(true)}
                            className="h-9 w-40"
                            placeholder="To"
                          />
                          {editToDropdownOpen && editTo.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                              {uniqueLocations.filter((l) => l.toLowerCase().includes(editTo.toLowerCase())).length === 0 ? (
                                <div className="px-3 py-2 text-sm text-gray-500">No matches</div>
                              ) : (
                                uniqueLocations.filter((l) => l.toLowerCase().includes(editTo.toLowerCase())).map((loc) => (
                                  <button key={loc} type="button" onMouseDown={() => { setEditTo(loc); setEditToDropdownOpen(false) }} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors text-gray-900">{loc}</button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                        <Button size="sm" onClick={() => saveEdit(entry._id)} disabled={submitting} className="bg-teal-600">
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          Cancel
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {editSegments.map((seg, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 w-5">{idx + 1}.</span>
                            <select
                              value={seg.vehicleType}
                              onChange={(e) => {
                                const updated = [...editSegments]
                                updated[idx] = { ...updated[idx], vehicleType: e.target.value }
                                setEditSegments(updated)
                              }}
                              className="h-8 px-2 rounded-md border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                              {vehicleTypeOptions.map((v) => (
                                <option key={v} value={v}>{v}</option>
                              ))}
                            </select>
                            <Input
                              type="number"
                              min="0"
                              value={seg.hours}
                              onChange={(e) => {
                                const updated = [...editSegments]
                                updated[idx] = { ...updated[idx], hours: e.target.value }
                                setEditSegments(updated)
                              }}
                              className="h-8 w-16 text-xs"
                              placeholder="h"
                            />
                            <span className="text-xs text-slate-400">h</span>
                            <Input
                              type="number"
                              min="0"
                              max="59"
                              value={seg.minutes}
                              onChange={(e) => {
                                const updated = [...editSegments]
                                updated[idx] = { ...updated[idx], minutes: e.target.value }
                                setEditSegments(updated)
                              }}
                              className="h-8 w-16 text-xs"
                              placeholder="m"
                            />
                            <span className="text-xs text-slate-400">m</span>
                            {editSegments.length > 1 && (
                              <button type="button" onClick={() => setEditSegments(editSegments.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600">
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button type="button" onClick={() => setEditSegments([...editSegments, { vehicleType: "Bus", hours: "", minutes: "" }])} className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1">
                          <Plus size={12} /> Add Segment
                        </button>
                        <p className="text-xs text-slate-500">Total: <span className="font-medium text-teal-700">{formatTotal(editSegments)}</span></p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900">
                          {entry.fromLocation} &rarr; {entry.toLocation}
                        </p>
                        {entry.segments && entry.segments.length > 0 ? (
                          <div className="mt-1 space-y-0.5">
                            {entry.segments.map((seg, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                                <span className="text-slate-400 w-4">{idx + 1}.</span>
                                <span className="font-medium">{seg.vehicleType}</span>
                                <span className="text-teal-600">{seg.hours > 0 && `${seg.hours}h `}{seg.minutes}m</span>
                                {idx < entry.segments!.length - 1 && <span className="text-slate-300">→</span>}
                              </div>
                            ))}
                            <p className="text-xs text-slate-400 pt-0.5">Total: {entry.hours > 0 && `${entry.hours}h`}{entry.minutes}m</p>
                          </div>
                        ) : (
                          <p className="text-sm text-teal-600">
                            {entry.vehicleType || "Bus"} &bull; {entry.hours > 0 && `${entry.hours}h `}{entry.minutes}m
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => startEdit(entry)}>
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50"
                          onClick={() => handleDelete(entry._id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
