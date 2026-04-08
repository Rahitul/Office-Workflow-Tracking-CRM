"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { v4 as uuidv4 } from "uuid"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { FieldType, FormField } from "@/types"
import { Plus, Trash2, GripVertical, Save, Send, X, ArrowLeft, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

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
      <Label className="text-slate-700">Options</Label>
      <div className="flex gap-2">
        <Input
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type an option and press Enter"
          className="border-slate-200 focus:border-blue-500"
        />
        <Button type="button" variant="outline" size="sm" onClick={handleAdd} className="border-slate-200">
          <Plus size={16} />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {(options || []).map((opt, index) => (
          <div
            key={index}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-full text-sm"
          >
            <span className="text-slate-700">{opt}</span>
            <button
              type="button"
              className="text-slate-400 hover:text-red-500 transition-colors"
              onClick={() => handleRemove(index)}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      {(options || []).length === 0 && (
        <p className="text-xs text-amber-600">Add at least one option</p>
      )}
    </div>
  )
}

export default function NewFormPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [fields, setFields] = useState<FormField[]>([])
  const [loading, setLoading] = useState(false)
  const [showFieldTypeMenu, setShowFieldTypeMenu] = useState(false)
  const [error, setError] = useState("")
  
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
  
  const handleSave = async (status: "draft" | "published") => {
    if (!title.trim()) {
      setError("Title is required")
      return
    }
    if (fields.length === 0) {
      setError("At least one field is required")
      return
    }
    
    setLoading(true)
    setError("")
    try {
      await axios.post("/api/forms", {
        title,
        description,
        status,
        fields: fields.map((f, i) => ({ ...f, order: i })),
      }, { withCredentials: true })
      router.push("/admin/forms")
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save form")
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/forms")} className="hover:bg-slate-100">
            <ArrowLeft size={20} className="text-slate-600" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Create New Form</h1>
            <p className="text-slate-500">Build your form by adding fields</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/admin/forms")} className="border-slate-200">
            Cancel
          </Button>
          <Button 
            variant="outline"
            onClick={() => handleSave("draft")}
            disabled={loading}
            className="border-slate-200 hover:bg-slate-50"
          >
            <Save size={18} className="mr-2" />
            Save Draft
          </Button>
          <Button 
            onClick={() => handleSave("published")}
            disabled={loading || fields.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send size={18} className="mr-2" />
            Publish
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}
      
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6 space-y-5">
          <div>
            <Label htmlFor="title" className="text-slate-700 font-medium">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter form title"
              className="mt-1.5 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <Label htmlFor="description" className="text-slate-700 font-medium">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter form description (optional)"
              className="mt-1.5 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Form Fields</h2>
          <div className="relative">
            <Button 
              type="button"
              variant="outline"
              onClick={() => setShowFieldTypeMenu(!showFieldTypeMenu)}
              className="border-slate-200 hover:bg-slate-50"
            >
              <Plus size={18} className="mr-2" />
              Add Field
            </Button>
            {showFieldTypeMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                {FIELD_TYPES.map((field) => (
                  <button
                    key={field.type}
                    type="button"
                    className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 flex items-center gap-3 border-b border-slate-100 last:border-0"
                    onClick={() => addField(field.type)}
                  >
                    <span className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-600">{field.icon}</span>
                    <span className="text-slate-700">{field.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <CardContent className="p-4">
          {fields.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-500 mb-2">No fields added yet</p>
              <p className="text-sm text-slate-400">Click "Add Field" to start building your form</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.fieldId}
                  className="p-4 border border-slate-200 rounded-lg bg-white hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="cursor-move text-slate-300 mt-2 hover:text-slate-400">
                      <GripVertical size={20} />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-slate-100 text-slate-700 border-slate-200">{field.type}</Badge>
                        <span className="text-xs text-slate-400">Field {index + 1}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-slate-700 text-sm">Label *</Label>
                          <Input
                            value={field.label}
                            onChange={(e) => updateField(field.fieldId, { label: e.target.value })}
                            placeholder="Field label"
                            className="mt-1 border-slate-200 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-700 text-sm">Placeholder</Label>
                          <Input
                            value={field.placeholder}
                            onChange={(e) => updateField(field.fieldId, { placeholder: e.target.value })}
                            placeholder="Placeholder text"
                            className="mt-1 border-slate-200 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      
                      {(field.type === "dropdown" || field.type === "radio" || field.type === "checkbox") && (
                        <OptionsEditor
                          options={field.options}
                          onChange={(options) => updateField(field.fieldId, { options })}
                        />
                      )}
                      
                      <div className="flex items-center gap-4 pt-2">
                        <Checkbox
                          checked={field.required}
                          onChange={(e) => updateField(field.fieldId, { required: e.target.checked })}
                          label="Required"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="text-slate-400 hover:text-red-500 transition-colors mt-2"
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