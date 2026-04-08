"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import axios from "axios"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Clock, CheckCircle } from "lucide-react"

interface Form {
  _id: string
  title: string
  description: string
  status: "draft" | "published"
  createdAt: string
  deadline: string | null
}

interface UserResponse {
  _id: string
  formId: Form
  submittedAt: string
}

export default function UserFormsListPage() {
  const [forms, setForms] = useState<Form[]>([])
  const [responses, setResponses] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchData()
  }, [])
  
  const fetchData = async () => {
    try {
      const [formsRes, responsesRes] = await Promise.all([
        axios.get("/api/forms", { withCredentials: true }),
        axios.get("/api/responses", { withCredentials: true }),
      ])
      setForms(formsRes.data.forms || [])
      setResponses(responsesRes.data.responses || [])
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }
  
  const submittedFormIds = new Set(responses.map(r => r.formId?._id))
  
  const isOverdue = (deadline: string | null) => {
    if (!deadline) return false
    return new Date(deadline) < new Date()
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Forms</h1>
        <p className="text-gray-500">View and fill out your assigned forms</p>
      </div>
      
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : forms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No forms assigned to you yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {forms.filter(f => !submittedFormIds.has(f._id)).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  Pending Forms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {forms.filter(f => !submittedFormIds.has(f._id)).map((form) => (
                    <div
                      key={form._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <h3 className="font-medium text-gray-900">{form.title}</h3>
                        <p className="text-sm text-gray-500">{form.description || "No description"}</p>
                        {form.deadline && isOverdue(form.deadline) && (
                          <Badge variant="destructive" className="mt-1">Overdue</Badge>
                        )}
                        {form.deadline && !isOverdue(form.deadline) && (
                          <p className="text-xs text-gray-500 mt-1">
                            Due: {new Date(form.deadline).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Link href={`/user/forms/${form._id}`}>
                        <Button>Fill Form</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {forms.filter(f => submittedFormIds.has(f._id)).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Completed Forms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {forms.filter(f => submittedFormIds.has(f._id)).map((form) => (
                    <div
                      key={form._id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-green-50"
                    >
                      <div>
                        <h3 className="font-medium text-gray-900">{form.title}</h3>
                        <p className="text-sm text-gray-500">Submitted</p>
                      </div>
                      <Badge variant="success">Completed</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}