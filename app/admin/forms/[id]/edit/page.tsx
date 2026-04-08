"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import axios from "axios"
import { v4 as uuidv4 } from "uuid"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { FieldType, FormField } from "@/types"
import { Plus, Trash2, GripVertical, Save, Send, X, ArrowLeft } from "lucide-react"

const FIELD_TYPES: { type: FieldType; label: string; icon: string }[] = [
  { type: "text", label: "Text", icon: "Aa" },
  { type: "textarea", label: "Textarea", icon: "¶" },
  { type: "number", label: "Number", icon: "#" },
  { type: "date", label: "Date", icon: "📅" },
  { type: "email", label: "Email", icon: "@" },
  { type: "dropdown", label: "Dropdown", icon: "▼" },
  { type: "radio", label: "Radio", icon: "○" },
  { type: "checkbox", label: "Checkbox", icon: "☑" },
  { type: "rating", label: "Rating", icon: "★" },
]

function OptionsEditor({ 
  options, 
  onChange 
}: { 
  options: string[] | undefined, 
  onChange: (options: string[]) => void 
}) {
  const [newOption, setNewOption] = useState("")
  
  const handleAdd = () => {
    if (newOption.trim()) {
      onChange([...(options || []), newOption.trim()])
      setNewOption("")
    }
  }
  
  const handleRemove = (index: number) => {
    onChange((options || []).filter((_, i) => i !== index))
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAdd()
    }
  }
  
  return (
    <div className="space-y-2">
      <Label>Options</Label>
      <div className="flex gap-2">
        <Input
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type an option and press Enter"
        />
        <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
          <Plus size={16} />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {(options || []).map((opt, index) => (
          <div
            key={index}
            className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-sm"
          >
            <span>{opt}</span>
            <button
              type="button"
              className="text-gray-400 hover:text-red-500"
              onClick={() => handleRemove(index)}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      {(options || []).length === 0 && (
        <p className="text-xs text-gray-500">Add at least one option</p>
      )}
    </div>
  )
}

export default function EditFormPage() {
  const router = useRouter()
  const params = useParams()
  const formId = params.id as string
  
  const [title, setTitle] = useState("")
  const [originalTitle, setOriginalTitle] = useState("")
  const [description, setDescription] = useState("")
  const [fields, setFields] = useState<FormField[]>([])
  const [status, setStatus] = useState<"draft" | "published">("draft")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showFieldTypeMenu, setShowFieldTypeMenu] = useState(false)
  const [error, setError] = useState("")
  
  useEffect(() => {
    fetchForm()
  }, [formId])
  
  const fetchForm = async () => {
    try {
      const response = await axios.get(`/api/forms/${formId}`, { withCredentials: true })
      const form = response.data.form
      setTitle(form.title)
      setOriginalTitle(form.title)
      setDescription(form.description || "")
      setFields(form.fields || [])
      setStatus(form.status)
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load form")
    } finally {
      setLoading(false)
    }
  }
  
  const addField = (type: FieldType) => {
    const newField: FormField = {
      fieldId: uuidv4(),
      type,
      label: `New ${type} field`,
      placeholder: "",
      required: false,
      order: fields.length,
      options: type === "dropdown" || type === "radio" || type === "checkbox" 
        ? ["Option 1"] 
        : undefined,
    }
    setFields([...fields, newField])
    setShowFieldTypeMenu(false)
  }
  
  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => 
      f.fieldId === fieldId ? { ...f, ...updates } : f
    ))
  }
  
  const removeField = (fieldId: string) => {
    setFields(fields.filter(f => f.fieldId !== fieldId))
  }
  
  const handleSave = async (newStatus?: "draft" | "published") => {
    if (!title.trim()) {
      setError("Title is required")
      return
    }
    if (fields.length === 0) {
      setError("At least one field is required")
      return
    }
    
    const isRepublishing = newStatus === "published" && status === "published"
    const hasRenamed = title.trim() !== originalTitle.trim()
    
    if (isRepublishing && !hasRenamed) {
      setError("Please rename the form to create a new version")
      return
    }
    
    setSaving(true)
    setError("")
    try {
      if (isRepublishing && hasRenamed) {
        const response = await axios.post("/api/forms", {
          title,
          description,
          status: "published",
          fields: fields.map((f, i) => ({ ...f, order: i })),
        }, { withCredentials: true })
      } else {
        await axios.put(`/api/forms/${formId}`, {
          title,
          description,
          status: newStatus || status,
          fields: fields.map((f, i) => ({ ...f, order: i })),
        }, { withCredentials: true })
        
        if (newStatus === "published" && status === "draft") {
          await axios.patch(`/api/forms/${formId}/publish`, {}, { withCredentials: true })
        }
      }
      
      router.push("/admin/forms")
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save form")
    } finally {
      setSaving(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading form...</div>
      </div>
    )
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/forms")}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Form</h1>
            <p className="text-gray-500">Modify your form</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/admin/forms")}>
            Cancel
          </Button>
          <Button 
            variant="outline"
            onClick={() => handleSave("draft")}
            disabled={saving}
          >
            <Save size={18} className="mr-2" />
            Save Draft
          </Button>
          <Button 
            onClick={() => handleSave("published")}
            disabled={saving || fields.length === 0}
          >
            <Send size={18} className="mr-2" />
            {status === "draft" ? "Publish" : "Update & Publish"}
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="p-4 text-red-600 bg-red-50 rounded-lg">{error}</div>
      )}
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Form Details</CardTitle>
            <Badge variant={status === "published" ? "success" : "secondary"}>
              {status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter form title"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter form description"
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Form Fields</CardTitle>
          <div className="relative">
            <Button 
              type="button"
              variant="outline"
              onClick={() => setShowFieldTypeMenu(!showFieldTypeMenu)}
            >
              <Plus size={18} className="mr-2" />
              Add Field
            </Button>
            {showFieldTypeMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-10">
                {FIELD_TYPES.map((field) => (
                  <button
                    key={field.type}
                    type="button"
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                    onClick={() => addField(field.type)}
                  >
                    <span className="mr-2">{field.icon}</span>
                    {field.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No fields added yet</p>
              <p className="text-sm">Click "Add Field" to start building your form</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.fieldId}
                  className="p-4 border rounded-lg bg-white"
                >
                  <div className="flex items-start gap-4">
                    <div className="cursor-move text-gray-400 mt-2">
                      <GripVertical size={20} />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{field.type}</Badge>
                        <span className="text-sm text-gray-500">Field {index + 1}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Label *</Label>
                          <Input
                            value={field.label}
                            onChange={(e) => updateField(field.fieldId, { label: e.target.value })}
                            placeholder="Field label"
                          />
                        </div>
                        <div>
                          <Label>Placeholder</Label>
                          <Input
                            value={field.placeholder}
                            onChange={(e) => updateField(field.fieldId, { placeholder: e.target.value })}
                            placeholder="Placeholder text"
                          />
                        </div>
                      </div>
                      
                      {(field.type === "dropdown" || field.type === "radio" || field.type === "checkbox") && (
                        <OptionsEditor
                          options={field.options}
                          onChange={(options) => updateField(field.fieldId, { options })}
                        />
                      )}
                      
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={field.required}
                          onChange={(e) => updateField(field.fieldId, { required: e.target.checked })}
                          label="Required"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => removeField(field.fieldId)}
                    >
                      <Trash2 size={20} />
                    </button>
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