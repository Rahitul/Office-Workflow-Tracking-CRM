"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { useParams } from "next/navigation"
import axios from "axios"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, Users, Clock, FileText } from "lucide-react"

interface ResponseData {
  _id: string
  formId: string
  userId: { _id: string; name: string; email: string }
  submittedAt: string
  completionTimeSeconds: number
  answers: { fieldId: string; label: string; value: string | number | string[] }[]
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

function UserFilter({ 
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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder={selectedUser ? `${selectedUser.name} (${selectedUser.email})` : "Filter by user..."}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          className="w-64 h-10 pl-10 pr-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

export default function FormResponsesPage() {
  const params = useParams()
  const formId = params.id as string
  
  const [form, setForm] = useState<FormData | null>(null)
  const [responses, setResponses] = useState<ResponseData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
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
  
  const filteredResponses = responses.filter(response => {
    const matchesSearch = !searchTerm || 
      response.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      response.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      response.answers.some(a => String(a.value).toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesUser = !selectedUserId || response.userId?._id === selectedUserId
    
    return matchesSearch && matchesUser
  })
  
  const getUniqueUsers = (): UserOption[] => {
    const userMap = new Map<string, UserOption>()
    responses.forEach(r => {
      if (r.userId?._id) {
        userMap.set(r.userId._id, r.userId)
      }
    })
    return Array.from(userMap.values())
  }
  
  const formatValue = (value: string | number | string[]) => {
    if (Array.isArray(value)) return value.join(", ")
    return String(value)
  }
  
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }
  
  const getUserStats = (userId: string) => {
    const userResponses = responses.filter(r => r.userId?._id === userId)
    return {
      total: userResponses.length,
      lastSubmit: userResponses[0]?.submittedAt ? new Date(userResponses[0].submittedAt).toLocaleString() : "-",
      avgTime: userResponses.length > 0 
        ? formatTime(userResponses.reduce((sum, r) => sum + r.completionTimeSeconds, 0) / userResponses.length)
        : "-"
    }
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
  const userStats = selectedUserId ? getUserStats(selectedUserId) : null
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="hover:bg-slate-100">
            <ArrowLeft size={20} className="text-slate-600" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{form?.title}</h1>
            <p className="text-slate-500">{filteredResponses.length} of {responses.length} responses</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{responses.length}</p>
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
                <p className="text-2xl font-bold text-slate-900">{uniqueUsers.length}</p>
                <p className="text-sm text-slate-500">Unique Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {selectedUserId && userStats && (
          <>
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{userStats.total}</p>
                    <p className="text-sm text-slate-500">User Responses</p>
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
                    <p className="text-2xl font-bold text-slate-900">{userStats.avgTime}</p>
                    <p className="text-sm text-slate-500">Avg Time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
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
              <div className="text-right">
                <p className="text-sm text-slate-500">Last submission</p>
                <p className="text-sm font-medium text-slate-700">{userStats?.lastSubmit}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card className="border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <h2 className="font-semibold text-slate-900">Responses</h2>
          <div className="flex gap-3">
            <UserFilter
              users={uniqueUsers}
              selectedUserId={selectedUserId}
              onSelect={setSelectedUserId}
            />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search responses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48 h-10 pl-10 pr-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        <CardContent className="p-0">
          {filteredResponses.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-500">No responses found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">User</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Submitted</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Time</th>
                    {form?.fields?.map((field) => (
                      <th key={field.fieldId} className="text-left py-3 px-4 font-medium text-slate-600 max-w-48">
                        <span className="block truncate">{field.label}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredResponses.map((response) => (
                    <tr 
                      key={response._id} 
                      className={`border-b border-slate-100 hover:bg-slate-50 ${selectedUserId && response.userId?._id === selectedUserId ? "bg-blue-50" : ""}`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-medium text-slate-600">
                            {response.userId?.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{response.userId?.name || "Unknown"}</p>
                            <p className="text-xs text-slate-500">{response.userId?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(response.submittedAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <Badge className="bg-slate-100 text-slate-600 border-slate-200">
                          {formatTime(response.completionTimeSeconds)}
                        </Badge>
                      </td>
                      {form?.fields?.map((field) => {
                        const answer = response.answers.find(a => a.fieldId === field.fieldId)
                        return (
                          <td key={field.fieldId} className="py-3 px-4 text-slate-600 max-w-48">
                            <span className="block truncate" title={answer ? formatValue(answer.value) : ""}>
                              {answer ? formatValue(answer.value) : "-"}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}