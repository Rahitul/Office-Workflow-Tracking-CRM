"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import axios from "axios"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup } from "@/components/ui/radio"
import { Badge } from "@/components/ui/badge"
import { FormField, Answer } from "@/types"
import { ArrowLeft, FileText, CheckCircle, Loader2, AlertCircle } from "lucide-react"

export default function FillFormPage() {
  const router = useRouter()
  const params = useParams()
  const formId = params.id as string
  
  const [form, setForm] = useState<any>(null)
  const [answers, setAnswers] = useState<Record<string, string | number | string[]>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [startTime] = useState(Date.now())
  
  useEffect(() => {
    fetchForm()
  }, [formId])
  
  const fetchForm = async () => {
    try {
      const response = await axios.get(`/api/forms/${formId}`, { withCredentials: true })
      setForm(response.data.form)
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load form")
    } finally {
      setLoading(false)
    }
  }
  
  const handleChange = (fieldId: string, value: string | number | string[]) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }))
  }
  
  const handleCheckboxChange = (fieldId: string, option: string, checked: boolean) => {
    setAnswers(prev => {
      const current = (prev[fieldId] as string[]) || []
      if (checked) {
        return { ...prev, [fieldId]: [...current, option] }
      } else {
        return { ...prev, [fieldId]: current.filter((o: string) => o !== option) }
      }
    })
  }
  
  const validateForm = (): boolean => {
    if (!form?.fields) return true
    
    for (const field of form.fields) {
      if (field.required) {
        const value = answers[field.fieldId]
        if (!value || (Array.isArray(value) && value.length === 0)) {
          setError(`Please fill in: ${field.label}`)
          return false
        }
      }
    }
    return true
  }
  
  const handleSubmit = async () => {
    if (!validateForm()) return
    
    setSubmitting(true)
    setError("")
    
    try {
      const formattedAnswers: Answer[] = form.fields.map((field: FormField) => ({
        fieldId: field.fieldId,
        label: field.label,
        value: answers[field.fieldId] || "",
      }))
      
      await axios.post("/api/responses", {
        formId,
        startTime,
        answers: formattedAnswers,
      }, { withCredentials: true })
      
      setSubmitted(true)
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to submit response")
    } finally {
      setSubmitting(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }
  
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <Card className="w-full max-w-md border-0 shadow-xl bg-white">
          <CardContent className="py-12 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Form Submitted!</h2>
            <p className="text-slate-500 mb-6">Thank you for your response.</p>
            <Button onClick={() => router.push("/user/dashboard")} className="bg-emerald-600 hover:bg-emerald-700">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (!form) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="max-w-md border-slate-200">
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-red-600">{error || "Form not found"}</p>
            <Button variant="outline" onClick={() => router.push("/user/dashboard")} className="mt-4">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/user/dashboard")} className="hover:bg-slate-100">
          <ArrowLeft size={20} className="text-slate-600" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{form.title}</h1>
          {form.description && <p className="text-slate-500 mt-1">{form.description}</p>}
        </div>
      </div>
      
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6 space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          {form.fields?.map((field: FormField, index: number) => (
            <div key={field.fieldId} className="space-y-2">
              <Label className="text-slate-700 font-medium">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              
              {field.type === "text" && (
                <Input
                  type="text"
                  placeholder={field.placeholder}
                  value={(answers[field.fieldId] as string) || ""}
                  onChange={(e) => handleChange(field.fieldId, e.target.value)}
                  className="h-11 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              )}
              
              {field.type === "textarea" && (
                <Textarea
                  placeholder={field.placeholder}
                  value={(answers[field.fieldId] as string) || ""}
                  onChange={(e) => handleChange(field.fieldId, e.target.value)}
                  className="border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                  rows={3}
                />
              )}
              
              {field.type === "number" && (
                <Input
                  type="number"
                  placeholder={field.placeholder}
                  value={(answers[field.fieldId] as string) || ""}
                  onChange={(e) => handleChange(field.fieldId, e.target.value)}
                  className="h-11 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              )}
              
              {field.type === "email" && (
                <Input
                  type="email"
                  placeholder={field.placeholder}
                  value={(answers[field.fieldId] as string) || ""}
                  onChange={(e) => handleChange(field.fieldId, e.target.value)}
                  className="h-11 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              )}
              
              {field.type === "date" && (
                <Input
                  type="date"
                  value={(answers[field.fieldId] as string) || ""}
                  onChange={(e) => handleChange(field.fieldId, e.target.value)}
                  className="h-11 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              )}
              
              {field.type === "dropdown" && (
                <select
                  className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={(answers[field.fieldId] as string) || ""}
                  onChange={(e) => handleChange(field.fieldId, e.target.value)}
                >
                  <option value="">Select an option</option>
                  {field.options?.map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}
              
              {field.type === "radio" && (
                <RadioGroup
                  name={field.fieldId}
                  options={field.options?.map((opt: string) => ({ value: opt, label: opt })) || []}
                  value={(answers[field.fieldId] as string) || ""}
                  onChange={(value: string) => handleChange(field.fieldId, value)}
                  className="mt-2"
                />
              )}
              
              {field.type === "checkbox" && (
                <div className="space-y-2 mt-2">
                  {field.options?.map((opt: string) => (
                    <Checkbox
                      key={opt}
                      checked={((answers[field.fieldId] as string[]) || []).includes(opt)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCheckboxChange(field.fieldId, opt, e.target.checked)}
                      label={opt}
                    />
                  ))}
                </div>
              )}
              
              {field.type === "rating" && (
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const currentRating = answers[field.fieldId] as number
                    const isSelected = currentRating >= star
                    return (
                      <button
                        key={star}
                        type="button"
                        className={`w-12 h-12 rounded-full border-2 transition-all ${
                          isSelected
                            ? "bg-yellow-400 border-yellow-400 scale-110"
                            : "border-slate-200 hover:border-yellow-400 hover:bg-yellow-50"
                        }`}
                        onClick={() => handleChange(field.fieldId, star)}
                      >
                        <span className={`font-semibold ${isSelected ? "text-white" : "text-slate-400"}`}>
                          {star}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
          
          <Button
            className="w-full h-12 text-base font-medium bg-emerald-600 hover:bg-emerald-700"
            size="lg"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}