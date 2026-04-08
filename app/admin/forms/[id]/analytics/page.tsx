"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { useParams } from "next/navigation"
import axios from "axios"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, Clock, BarChart3, FileText } from "lucide-react"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface ResponseData {
  _id: string
  userId: { _id: string; name: string; email: string }
  submittedAt: string
  completionTimeSeconds: number
  answers: { fieldId: string; label: string; value: string | number | string[] }[]
}

interface FieldData {
  fieldId: string
  label: string
  type: string
  aggregation: Record<string, number>
}

interface FormData {
  _id: string
  title: string
  fields: { fieldId: string; label: string; type: string }[]
}

interface UserOption {
  _id: string
  name: string
  email: string
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]

function UserSelect({ 
  users, 
  selectedUserId, 
  onSelect 
}: { 
  users: UserOption[], 
  selectedUserId: string, 
  onSelect: (id: string) => void 
}) {
  const [search, setSearch] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  
  const filteredUsers = useMemo(() => {
    if (!search) return users
    const s = search.toLowerCase()
    return users.filter(u => 
      u.name.toLowerCase().includes(s) || 
      u.email.toLowerCase().includes(s)
    )
  }, [users, search])
  
  const selectedUser = selectedUserId ? users.find(u => u._id === selectedUserId) : null
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])
  
  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          placeholder={selectedUser ? `${selectedUser.name} (${selectedUser.email})` : "Filter by user..."}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          className="w-64 h-10 px-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {selectedUserId && !search && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            onClick={() => {
              onSelect("")
              setSearch("")
            }}
          >
            ×
          </button>
        )}
      </div>
      
      {isOpen && filteredUsers.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredUsers.map((user) => (
            <button
              key={user._id}
              type="button"
              className="w-full px-4 py-3 text-left hover:bg-slate-50 flex flex-col border-b border-slate-100 last:border-0"
              onClick={() => {
                onSelect(user._id)
                setSearch("")
                setIsOpen(false)
              }}
            >
              <span className="font-medium text-slate-900">{user.name}</span>
              <span className="text-sm text-slate-500">{user.email}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AnalyticsPage() {
  const params = useParams()
  const formId = params.id as string
  
  const [form, setForm] = useState<FormData | null>(null)
  const [responses, setResponses] = useState<ResponseData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  
  useEffect(() => {
    fetchData()
  }, [formId])
  
  const fetchData = async () => {
    try {
      const [formRes, responsesRes] = await Promise.all([
        axios.get(`/api/forms/${formId}`, { withCredentials: true }),
        axios.get(`/api/responses/form/${formId}`, { withCredentials: true }),
      ])
      setForm(formRes.data.form)
      setResponses(responsesRes.data.responses || [])
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }
  
  const getUniqueUsers = (): UserOption[] => {
    const userMap = new Map<string, UserOption>()
    responses.forEach(r => {
      if (r.userId?._id) {
        userMap.set(r.userId._id, r.userId)
      }
    })
    return Array.from(userMap.values())
  }
  
  const filteredResponses = useMemo(() => {
    if (!selectedUserId) return responses
    return responses.filter(r => r.userId?._id === selectedUserId)
  }, [responses, selectedUserId])
  
  const analytics = useMemo(() => {
    const totalResponses = filteredResponses.length
    
    if (totalResponses === 0) return null
    
    const avgCompletionTime = filteredResponses.reduce((sum, r) => sum + r.completionTimeSeconds, 0) / totalResponses
    
    const fieldAggregations: FieldData[] = form?.fields.map((field) => {
      const aggregation: Record<string, number> = {}
      
      filteredResponses.forEach((response) => {
        const answer = response.answers.find(a => a.fieldId === field.fieldId)
        if (answer) {
          const value = answer.value
          if (Array.isArray(value)) {
            value.forEach((v) => {
              aggregation[v] = (aggregation[v] || 0) + 1
            })
          } else if (value !== undefined && value !== null) {
            const key = String(value)
            aggregation[key] = (aggregation[key] || 0) + 1
          }
        }
      })
      
      return {
        fieldId: field.fieldId,
        label: field.label,
        type: field.type,
        aggregation,
      }
    }) || []
    
    return {
      formId,
      totalResponses,
      completionRate: 0,
      avgCompletionTime: Math.round(avgCompletionTime),
      fields: fieldAggregations,
    }
  }, [filteredResponses, form])
  
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }
  
  const renderChart = (field: FieldData) => {
    const data = Object.entries(field.aggregation).map(([name, value]) => ({
      name,
      value,
    }))
    
    const chartType = field.type === "rating" || field.type === "checkbox" || field.type === "dropdown" || field.type === "radio"
      ? "pie"
      : field.type === "number"
      ? "bar"
      : "bar"
    
    if (data.length === 0 || data.every(d => d.value === 0)) {
      return <p className="text-slate-400 text-sm">No data yet</p>
    }
    
    if (chartType === "pie") {
      return (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )
    }
    
    return (
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    )
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }
  
  const uniqueUsers = getUniqueUsers()
  const selectedUser = selectedUserId ? uniqueUsers.find(u => u._id === selectedUserId) : null
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="hover:bg-slate-100">
            <ArrowLeft size={20} className="text-slate-600" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
            <p className="text-slate-500">
              {selectedUserId 
                ? `Filtered by: ${selectedUser?.name || "Unknown"}`
                : `${responses.length} total responses`
              }
            </p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <UserSelect
            users={uniqueUsers}
            selectedUserId={selectedUserId}
            onSelect={setSelectedUserId}
          />
        </div>
      </div>
      
      {selectedUser && (
        <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{selectedUser.name}</p>
                  <p className="text-sm text-slate-500">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 text-right">
                <div>
                  <p className="text-sm text-slate-500">Responses</p>
                  <p className="text-lg font-bold text-slate-900">{filteredResponses.length}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Avg Time</p>
                  <p className="text-lg font-bold text-slate-900">{analytics ? formatTime(analytics.avgCompletionTime) : "-"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {!analytics || analytics.totalResponses === 0 ? (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-slate-500">
              {selectedUserId 
                ? "No responses from this user yet"
                : "No responses have been submitted yet"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{analytics.totalResponses}</p>
                    <p className="text-sm text-slate-500">Total Responses</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{selectedUserId ? 1 : uniqueUsers.length}</p>
                    <p className="text-sm text-slate-500">Unique Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{formatTime(analytics.avgCompletionTime)}</p>
                    <p className="text-sm text-slate-500">Avg. Completion Time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analytics.fields.map((field) => (
              <Card key={field.fieldId} className="border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="mb-4">
                    <h3 className="font-semibold text-slate-900">{field.label}</h3>
                    <Badge className="mt-1 bg-slate-100 text-slate-600 border-slate-200">{field.type}</Badge>
                  </div>
                  {renderChart(field)}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}