"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Loader2, ArrowRightLeft, Filter, X } from "lucide-react"

type LeadStatus = "Pending" | "Accepted" | "Working" | "Rejected" | "Successfully Closed"

interface LeadData {
  _id: string
  date: string
  employeeName: string
  productDetails: string
  description: string
  fromConcern: string
  toConcern: string
  toSalesPersonName: string
  companyName: string
  companyPhone: string
  companyAddress: string
  previouslyQuoted: string
  notes?: string
  status: LeadStatus
  fromUser: {
    _id: string
    name: string
    email: string
  }
  toSalesPerson: {
    _id: string
    name: string
    email: string
  }
  createdAt: string
}

interface StatusCount {
  status: LeadStatus
  count: number
}

export default function AdminLeadTransferPage() {
  const [leads, setLeads] = useState<LeadData[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([])
  
  const [filters, setFilters] = useState({
    fromUserId: "",
    toSalesPersonId: "",
    fromConcern: "",
    toConcern: "",
    status: "",
    startDate: "",
    endDate: "",
  })

  const [users, setUsers] = useState<{_id: string, name: string}[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadsRes, usersRes] = await Promise.all([
          fetch("/api/lead-transfers", { credentials: "include" }),
          fetch("/api/users", { credentials: "include" })
        ])
        const leadsData = await leadsRes.json()
        const usersData = await usersRes.json()
        
        if (leadsData.success) {
          setLeads(leadsData.data)
          calculateStatusCounts(leadsData.data)
        }
        if (usersData.users) {
          setUsers(usersData.users)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const calculateStatusCounts = (data: LeadData[]) => {
    const counts: StatusCount[] = [
      { status: "Pending", count: 0 },
      { status: "Accepted", count: 0 },
      { status: "Working", count: 0 },
      { status: "Rejected", count: 0 },
      { status: "Successfully Closed", count: 0 },
    ]
    data.forEach((lead) => {
      const index = counts.findIndex((c) => c.status === lead.status)
      if (index !== -1) counts[index].count++
    })
    setStatusCounts(counts)
  }

  const filteredLeads = leads.filter((lead) => {
    if (filters.fromUserId && lead.fromUser?._id !== filters.fromUserId) return false
    if (filters.toSalesPersonId && lead.toSalesPerson?._id !== filters.toSalesPersonId) return false
    if (filters.fromConcern && lead.fromConcern !== filters.fromConcern) return false
    if (filters.toConcern && lead.toConcern !== filters.toConcern) return false
    if (filters.status && lead.status !== filters.status) return false
    if (filters.startDate && new Date(lead.date) < new Date(filters.startDate)) return false
    if (filters.endDate && new Date(lead.date) > new Date(filters.endDate)) return false
    return true
  })

  const clearFilters = () => {
    setFilters({
      fromUserId: "",
      toSalesPersonId: "",
      fromConcern: "",
      toConcern: "",
      status: "",
      startDate: "",
      endDate: "",
    })
  }

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Accepted":
        return "bg-blue-100 text-blue-800"
      case "Working":
        return "bg-purple-100 text-purple-800"
      case "Rejected":
        return "bg-red-100 text-red-800"
      case "Successfully Closed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusCount = (status: LeadStatus) => {
    const count = statusCounts.find((c) => c.status === status)
    return count?.count || 0
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lead Transfer</h1>
          <p className="text-slate-500">View all transferred leads</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {statusCounts.map((item) => (
          <Card 
            key={item.status}
            className={`cursor-pointer transition-all ${filters.status === item.status ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setFilters(prev => ({ ...prev, status: prev.status === item.status ? '' : item.status }))}
          >
            <CardContent className="py-4">
              <p className="text-sm text-slate-500">{item.status}</p>
              <p className="text-2xl font-bold">{item.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Filter Leads</span>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-500">Who Sent</label>
                <Select
                  options={[{ value: "", label: "All" }, ...users.map(u => ({ value: u._id, label: u.name }))]}
                  value={filters.fromUserId}
                  onChange={(e) => setFilters(prev => ({ ...prev, fromUserId: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">Who Transfer</label>
                <Select
                  options={[{ value: "", label: "All" }, ...users.map(u => ({ value: u._id, label: u.name }))]}
                  value={filters.toSalesPersonId}
                  onChange={(e) => setFilters(prev => ({ ...prev, toSalesPersonId: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">From Concern</label>
                <Select
                  options={[
                    { value: "", label: "All" },
                    { value: "IOM", label: "IOM" },
                    { value: "PPS", label: "PPS" },
                  ]}
                  value={filters.fromConcern}
                  onChange={(e) => setFilters(prev => ({ ...prev, fromConcern: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">To Concern</label>
                <Select
                  options={[
                    { value: "", label: "All" },
                    { value: "IOM", label: "IOM" },
                    { value: "PPS", label: "PPS" },
                  ]}
                  value={filters.toConcern}
                  onChange={(e) => setFilters(prev => ({ ...prev, toConcern: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">Status</label>
                <Select
                  options={[
                    { value: "", label: "All" },
                    { value: "Pending", label: "Pending" },
                    { value: "Accepted", label: "Accepted" },
                    { value: "Working", label: "Working" },
                    { value: "Rejected", label: "Rejected" },
                    { value: "Successfully Closed", label: "Successfully Closed" },
                  ]}
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">Start Date</label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">End Date</label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : filteredLeads.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-slate-500">No transferred leads found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLeads.map((lead) => (
            <Card key={lead._id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ArrowRightLeft className="w-5 h-5" />
                      {lead.companyName}
                    </CardTitle>
                    <CardDescription>
                      Transferred by: {lead.fromUser?.name} → To: {lead.toSalesPersonName} | Date: {new Date(lead.date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(lead.status)}`}
                  >
                    {lead.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Product Details</p>
                    <p className="text-slate-900">{lead.productDetails}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Description</p>
                    <p className="text-slate-900">{lead.description}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">From Concern</p>
                    <p className="text-slate-900">{lead.fromConcern}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">To Concern</p>
                    <p className="text-slate-900">{lead.toConcern}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Company Phone</p>
                    <p className="text-slate-900">{lead.companyPhone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Company Address</p>
                    <p className="text-slate-900">{lead.companyAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Previously Quoted</p>
                    <p className="text-slate-900">{lead.previouslyQuoted}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Employee Name</p>
                    <p className="text-slate-900">{lead.employeeName}</p>
                  </div>
                  {lead.notes && (
                    <div>
                      <p className="text-sm font-medium text-slate-500">Notes</p>
                      <p className="text-slate-900">{lead.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}