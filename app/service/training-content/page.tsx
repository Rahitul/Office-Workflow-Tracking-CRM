"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GraduationCap, Plus, Trash2, Pencil } from "lucide-react"
import axios from "axios"

interface Company {
  _id: string
  name: string
}

interface Product {
  _id: string
  name: string
  companyId: { _id: string; name: string } | string
}

interface Training {
  _id: string
  productId: { _id: string; name: string; companyId: { _id: string; name: string } } | string
  title: string
  description: string
  content: string
  duration: string
  createdAt: string
}

export default function TrainingsPage() {
  const [trainings, setTrainings] = useState<Training[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ title: "", productId: "" })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [trainingsRes, companiesRes, productsRes] = await Promise.all([
        axios.get("/api/trainings", { withCredentials: true }),
        axios.get("/api/companies", { withCredentials: true }),
        axios.get("/api/products", { withCredentials: true }),
      ])
      setTrainings(trainingsRes.data.trainings || [])
      setCompanies(companiesRes.data.companies || [])
      setProducts(productsRes.data.products || [])
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.productId) return

    setSubmitting(true)
    try {
      await axios.post("/api/trainings", formData, { withCredentials: true })
      setFormData({ title: "", productId: "" })
      setShowForm(false)
      fetchData()
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to create training")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this training?")) return
    try {
      await axios.delete(`/api/trainings/${id}`, { withCredentials: true })
      setTrainings(trainings.filter(t => t._id !== id))
    } catch (error: any) {
      console.error("Failed to delete training:", error)
      alert(error.response?.data?.error || "Failed to delete training")
    }
  }

  const startEdit = (training: Training) => {
    setEditingId(training._id)
    setEditTitle(training.title)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle("")
  }

  const saveEdit = async (id: string) => {
    if (!editTitle.trim()) return
    setSubmitting(true)
    try {
      await axios.put(`/api/trainings/${id}`, { title: editTitle }, { withCredentials: true })
      setTrainings(trainings.map(t => t._id === id ? { ...t, title: editTitle } : t))
      setEditingId(null)
      setEditTitle("")
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to update training")
    } finally {
      setSubmitting(false)
    }
  }

  const getProductName = (productId: Training["productId"]) => {
    if (typeof productId === "object") return productId?.name || "Unknown"
    return products.find(p => p._id === productId)?.name || "Unknown"
  }

  const getBrandName = (productId: Training["productId"]) => {
    if (typeof productId === "object" && productId.companyId) {
      const brandId = typeof productId.companyId === "object" ? productId.companyId._id : productId.companyId
      return companies.find(c => c._id === brandId)?.name || "Unknown"
    }
    const product = products.find(p => p._id === productId)
    if (!product) return "Unknown"
    const brand = companies.find(c => c._id === product.companyId)
    return brand?.name || "Unknown"
  }

  const filteredTrainings = trainings.filter(t => {
    const titleMatch = t.title.toLowerCase().includes(search.toLowerCase())
    const productMatch = getProductName(t.productId).toLowerCase().includes(search.toLowerCase())
    const brandMatch = getBrandName(t.productId).toLowerCase().includes(search.toLowerCase())
    return titleMatch || productMatch || brandMatch
  })

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
          <h1 className="text-2xl font-bold text-slate-900">Trainings</h1>
          <p className="text-slate-500">Manage training content</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-teal-600 hover:bg-teal-700">
          <Plus size={18} className="mr-2" />
          Add Training
        </Button>
      </div>

      {showForm && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Add New Training</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="productId">Product</Label>
                <select
                  id="productId"
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                >
                  <option value="">Select a product</option>
                  {products.map((product) => {
                    const brandName = typeof product.companyId === "object" ? product.companyId.name : companies.find(c => c._id === product.companyId)?.name || ""
                    return (
                      <option key={product._id} value={product._id}>{product.name} - {brandName}</option>
                    )
                  })}
                </select>
              </div>
              <div>
                <Label htmlFor="title">Training Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Introduction to MFP"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting} className="bg-teal-600 hover:bg-teal-700">
                  {submitting ? "Creating..." : "Create Training"}
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
            placeholder="Search trainings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle>All Trainings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredTrainings.length === 0 ? (
            <div className="py-12 text-center">
              <GraduationCap className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No trainings yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredTrainings.map((training) => (
                <div key={training._id} className="p-4 flex items-center justify-between">
                  {editingId === training._id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="h-9 max-w-xs"
                        onKeyDown={(e) => e.key === "Enter" && saveEdit(training._id)}
                      />
                      <Button size="sm" onClick={() => saveEdit(training._id)} disabled={submitting} className="bg-teal-600">
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{training.title}</p>
                        <p className="text-sm text-slate-500">
                          {getBrandName(training.productId)} &bull; {getProductName(training.productId)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => startEdit(training)}>
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50"
                          onClick={() => handleDelete(training._id)}
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