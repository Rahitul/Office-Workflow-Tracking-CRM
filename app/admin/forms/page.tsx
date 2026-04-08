"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import axios from "axios"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, BarChart3, Edit, Trash2, List, ClipboardList } from "lucide-react"

interface Form {
  _id: string
  title: string
  description: string
  status: "draft" | "published"
  assignedTo: string[]
  createdAt: string
  deadline: string | null
}

export default function FormsListPage() {
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchForms()
  }, [])
  
  const fetchForms = async () => {
    try {
      const response = await axios.get("/api/forms", { withCredentials: true })
      setForms(response.data.forms || [])
    } catch (error) {
      console.error("Failed to fetch forms:", error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this form?")) return
    try {
      await axios.delete(`/api/forms/${id}`, { withCredentials: true })
      setForms(forms.filter(f => f._id !== id))
    } catch (error) {
      console.error("Failed to delete form:", error)
    }
  }
  
  const handlePublish = async (id: string) => {
    try {
      await axios.patch(`/api/forms/${id}/publish`, {}, { withCredentials: true })
      fetchForms()
    } catch (error) {
      console.error("Failed to publish form:", error)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Forms</h1>
          <p className="text-slate-500">Manage your forms</p>
        </div>
        <Link href="/admin/forms/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus size={18} className="mr-2" />
            Create Form
          </Button>
        </Link>
      </div>
      
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          {forms.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-500 mb-4">No forms yet</p>
              <Link href="/admin/forms/new">
                <Button variant="outline" className="border-slate-200">Create your first form</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {forms.map((form) => (
                <div
                  key={form._id}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-900 truncate">{form.title}</h3>
                    <p className="text-sm text-slate-500 truncate">{form.description || "No description"}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge className={form.status === "published" 
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                        : "bg-amber-100 text-amber-700 border-amber-200"
                      }>
                        {form.status}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {new Date(form.createdAt).toLocaleDateString()}
                      </span>
                      {form.deadline && (
                        <span className="text-xs text-slate-400">
                          Due: {new Date(form.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {form.status === "draft" && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                        onClick={() => handlePublish(form._id)}
                      >
                        Publish
                      </Button>
                    )}
                    <Link href={`/admin/forms/${form._id}/edit`}>
                      <Button variant="outline" size="sm" className="border-slate-200">
                        <Edit size={16} />
                      </Button>
                    </Link>
                    {form.status === "published" && (
                      <>
                        <Link href={`/admin/forms/${form._id}/responses`}>
                          <Button variant="outline" size="sm" className="border-slate-200" title="Responses">
                            <List size={16} />
                          </Button>
                        </Link>
                        <Link href={`/admin/forms/${form._id}/analytics`}>
                          <Button variant="outline" size="sm" className="border-slate-200" title="Analytics">
                            <BarChart3 size={16} />
                          </Button>
                        </Link>
                      </>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-slate-200 text-red-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50"
                      onClick={() => handleDelete(form._id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}