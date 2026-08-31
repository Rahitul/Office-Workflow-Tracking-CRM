"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Clock, Plus, Pencil, Trash2 } from "lucide-react"
import axios from "axios"

interface TravelTimeEntry {
  _id: string
  fromLocation: string
  toLocation: string
  vehicleType: string
  hours: number
  minutes: number
  createdAt: string
}

const vehicleTypeOptions = ["Bus", "Bike", "Rickshaw", "Car", "Foot"]

export default function TravelTimePage() {
  const [entries, setEntries] = useState<TravelTimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ fromLocation: "", toLocation: "", vehicleType: "Bus", hours: "", minutes: "" })
  const [submitting, setSubmitting] = useState(false)
  const [searchFrom, setSearchFrom] = useState("")
  const [searchTo, setSearchTo] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFrom, setEditFrom] = useState("")
  const [editTo, setEditTo] = useState("")
  const [editVehicleType, setEditVehicleType] = useState("Bus")
  const [editHours, setEditHours] = useState("")
  const [editMinutes, setEditMinutes] = useState("")

  const filteredEntries = entries.filter(e =>
    e.fromLocation.toLowerCase().includes(searchFrom.toLowerCase()) &&
    e.toLocation.toLowerCase().includes(searchTo.toLowerCase())
  )

  useEffect(() => {
    fetchEntries()
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
    if (!formData.fromLocation.trim() || !formData.toLocation.trim()) return
    setSubmitting(true)
    try {
      await axios.post("/api/travel-times", formData, { withCredentials: true })
      setFormData({ fromLocation: "", toLocation: "", vehicleType: "Bus", hours: "", minutes: "" })
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
    setEditVehicleType(entry.vehicleType || "Bus")
    setEditHours(String(entry.hours))
    setEditMinutes(String(entry.minutes))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditFrom("")
    setEditTo("")
    setEditVehicleType("Bus")
    setEditHours("")
    setEditMinutes("")
  }

  const saveEdit = async (id: string) => {
    if (!editFrom.trim() || !editTo.trim()) return
    setSubmitting(true)
    try {
      await axios.put(`/api/travel-times/${id}`, { fromLocation: editFrom, toLocation: editTo, vehicleType: editVehicleType, hours: editHours, minutes: editMinutes }, { withCredentials: true })
      setEntries(entries.map(e => e._id === id ? { ...e, fromLocation: editFrom, toLocation: editTo, vehicleType: editVehicleType, hours: Number(editHours), minutes: Number(editMinutes) } : e))
      setEditingId(null)
      setEditFrom("")
      setEditTo("")
      setEditVehicleType("Bus")
      setEditHours("")
      setEditMinutes("")
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
              <div>
                <Label htmlFor="fromLocation">From Location</Label>
                <Input
                  id="fromLocation"
                  value={formData.fromLocation}
                  onChange={(e) => setFormData({ ...formData, fromLocation: e.target.value })}
                  placeholder="e.g., Dhaka"
                  required
                />
              </div>
              <div>
                <Label htmlFor="toLocation">To Location</Label>
                <Input
                  id="toLocation"
                  value={formData.toLocation}
                  onChange={(e) => setFormData({ ...formData, toLocation: e.target.value })}
                  placeholder="e.g., Chittagong"
                  required
                />
              </div>
              <div>
                <Label htmlFor="vehicleType">Vehicle Type</Label>
                <select
                  id="vehicleType"
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {vehicleTypeOptions.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hours">Hours</Label>
                  <Input
                    id="hours"
                    type="number"
                    min="0"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="minutes">Minutes</Label>
                  <Input
                    id="minutes"
                    type="number"
                    min="0"
                    max="59"
                    value={formData.minutes}
                    onChange={(e) => setFormData({ ...formData, minutes: e.target.value })}
                    placeholder="0"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting} className="bg-teal-600 hover:bg-teal-700">
                  {submitting ? "Creating..." : "Create"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
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
                    <div className="flex items-center gap-2 flex-1 flex-wrap">
                      <Input
                        value={editFrom}
                        onChange={(e) => setEditFrom(e.target.value)}
                        className="h-9 w-40"
                        placeholder="From"
                        onKeyDown={(e) => e.key === "Enter" && saveEdit(entry._id)}
                      />
                      <span className="text-slate-400">&rarr;</span>
                      <Input
                        value={editTo}
                        onChange={(e) => setEditTo(e.target.value)}
                        className="h-9 w-40"
                        placeholder="To"
                        onKeyDown={(e) => e.key === "Enter" && saveEdit(entry._id)}
                      />
                      <select
                        value={editVehicleType}
                        onChange={(e) => setEditVehicleType(e.target.value)}
                        className="h-9 px-2 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        {vehicleTypeOptions.map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        min="0"
                        value={editHours}
                        onChange={(e) => setEditHours(e.target.value)}
                        className="h-9 w-20"
                        placeholder="h"
                        onKeyDown={(e) => e.key === "Enter" && saveEdit(entry._id)}
                      />
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={editMinutes}
                        onChange={(e) => setEditMinutes(e.target.value)}
                        className="h-9 w-20"
                        placeholder="m"
                        onKeyDown={(e) => e.key === "Enter" && saveEdit(entry._id)}
                      />
                      <Button size="sm" onClick={() => saveEdit(entry._id)} disabled={submitting} className="bg-teal-600">
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="font-medium text-slate-900">
                          {entry.fromLocation} &rarr; {entry.toLocation}
                        </p>
                        <p className="text-sm text-teal-600">
                          {entry.vehicleType || "Bus"} &bull; {entry.hours > 0 && `${entry.hours}h `}{entry.minutes}m
                        </p>
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
