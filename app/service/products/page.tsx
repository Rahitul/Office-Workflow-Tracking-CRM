"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Package, Plus, Trash2, Pencil } from "lucide-react"
import axios from "axios"

interface Company {
  _id: string
  name: string
}

interface Product {
  _id: string
  companyId: { _id: string; name: string } | string
  name: string
  description: string
  isProtected: boolean
  createdAt: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: "", companyId: "" })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [productsRes, companiesRes] = await Promise.all([
        axios.get("/api/products", { withCredentials: true }),
        axios.get("/api/companies", { withCredentials: true }),
      ])
      setProducts(productsRes.data.products || [])
      setCompanies(companiesRes.data.companies || [])
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.companyId) return

    setSubmitting(true)
    try {
      await axios.post("/api/products", formData, { withCredentials: true })
      setFormData({ name: "", companyId: "" })
      setShowForm(false)
      fetchData()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      alert(err.response?.data?.error || "Failed to create product")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return
    try {
      await axios.delete(`/api/products/${id}`, { withCredentials: true })
      setProducts(products.filter(p => p._id !== id))
    } catch (error: any) {
      console.error("Failed to delete product:", error)
      alert(error.response?.data?.error || "Failed to delete product")
    }
  }

  const startEdit = (product: Product) => {
    setEditingId(product._id)
    setEditName(product.name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName("")
  }

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return
    setSubmitting(true)
    try {
      await axios.put(`/api/products/${id}`, { name: editName }, { withCredentials: true })
      setProducts(products.map(p => p._id === id ? { ...p, name: editName } : p))
      setEditingId(null)
      setEditName("")
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to update product")
    } finally {
      setSubmitting(false)
    }
  }

  const getCompanyName = (companyId: Product["companyId"]) => {
    if (typeof companyId === "object") return companyId?.name || "Unknown"
    return companies.find(c => c._id === companyId)?.name || "Unknown"
  }

  const filteredProducts = products.filter(p => {
    const nameMatch = p.name.toLowerCase().includes(search.toLowerCase())
    const brandMatch = getCompanyName(p.companyId).toLowerCase().includes(search.toLowerCase())
    return nameMatch || brandMatch
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
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-500">Manage products under brands</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-teal-600 hover:bg-teal-700">
          <Plus size={18} className="mr-2" />
          Add Product
        </Button>
      </div>

      {showForm && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Add New Product</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="companyId">Brand</Label>
                <select
                  id="companyId"
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                >
                  <option value="">Select a brand</option>
                  {companies.map((company) => (
                    <option key={company._id} value={company._id}>{company.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., MFP, Barcode Printer"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting} className="bg-teal-600 hover:bg-teal-700">
                  {submitting ? "Creating..." : "Create Product"}
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
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle>All Products</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No products yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredProducts.map((product) => (
                <div key={product._id} className="p-4 flex items-center justify-between">
                  {editingId === product._id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-9 max-w-xs"
                        onKeyDown={(e) => e.key === "Enter" && saveEdit(product._id)}
                      />
                      <Button size="sm" onClick={() => saveEdit(product._id)} disabled={submitting} className="bg-teal-600">
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="font-medium text-slate-900">{product.name}</p>
                        <p className="text-sm text-slate-500">{getCompanyName(product.companyId)}</p>
                      </div>
                      <div className="flex gap-2">
                        {!product.isProtected && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => startEdit(product)}>
                              <Pencil size={16} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50"
                              onClick={() => handleDelete(product._id)}
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