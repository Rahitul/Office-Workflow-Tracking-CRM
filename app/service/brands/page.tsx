"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, Plus, Trash2, Pencil } from "lucide-react"
import axios from "axios"

interface Brand {
  _id: string
  name: string
  description: string
  isProtected: boolean
  createdAt: string
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: "", description: "" })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState("")

  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    try {
      const response = await axios.get("/api/companies", { withCredentials: true })
      setBrands(response.data.companies || [])
    } catch (error) {
      console.error("Failed to fetch brands:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setSubmitting(true)
    try {
      await axios.post("/api/companies", formData, { withCredentials: true })
      setFormData({ name: "", description: "" })
      setShowForm(false)
      fetchBrands()
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to create brand")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this brand?")) return
    try {
      await axios.delete(`/api/companies/${id}`, { withCredentials: true })
      setBrands(brands.filter(c => c._id !== id))
    } catch (error: any) {
      console.error("Failed to delete brand:", error)
      alert(error.response?.data?.error || "Failed to delete brand")
    }
  }

  const startEdit = (brand: Brand) => {
    setEditingId(brand._id)
    setEditName(brand.name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName("")
  }

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return
    setSubmitting(true)
    try {
      await axios.put(`/api/companies/${id}`, { name: editName }, { withCredentials: true })
      setBrands(brands.map(c => c._id === id ? { ...c, name: editName } : c))
      setEditingId(null)
      setEditName("")
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to update brand")
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
          <h1 className="text-2xl font-bold text-slate-900">Brands</h1>
          <p className="text-slate-500">Manage partner brands</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-teal-600 hover:bg-teal-700">
          <Plus size={18} className="mr-2" />
          Add Brand
        </Button>
      </div>

      {showForm && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Add New Brand</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Brand Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Toshiba, Zebra"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting} className="bg-teal-600 hover:bg-teal-700">
                  {submitting ? "Creating..." : "Create Brand"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="mb-4">
          <Input
            placeholder="Search brands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle>All Brands</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredBrands.length === 0 ? (
            <div className="py-12 text-center">
              <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No brands yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredBrands.map((brand) => (
                <div key={brand._id} className="p-4 flex items-center justify-between">
                  {editingId === brand._id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-9 max-w-xs"
                        onKeyDown={(e) => e.key === "Enter" && saveEdit(brand._id)}
                      />
                      <Button size="sm" onClick={() => saveEdit(brand._id)} disabled={submitting} className="bg-teal-600">
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="font-medium text-slate-900">{brand.name}</p>
                      </div>
                      <div className="flex gap-2">
                        {!brand.isProtected && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => startEdit(brand)}>
                              <Pencil size={16} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50"
                              onClick={() => handleDelete(brand._id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </>
                        )}
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