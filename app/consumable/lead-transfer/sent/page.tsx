"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/store/authStore"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Loader2, ArrowUpRight } from "lucide-react"

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
  createdAt: string
}

export default function SentLeadsPage() {
  const { user } = useAuthStore()
  const [leads, setLeads] = useState<LeadData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await fetch(`/api/lead-transfers?type=sent&userId=${user?._id}`, {
          credentials: "include",
        })
        const data = await res.json()
        if (data.success) {
          setLeads(data.data)
        }
      } catch (error) {
        console.error("Error fetching leads:", error)
      } finally {
        setLoading(false)
      }
    }
    if (user?._id) {
      fetchLeads()
    }
  }, [user?._id])

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

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Sent Leads</h1>
        <p className="text-slate-500">Leads you have transferred to other sales persons</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : leads.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-slate-500">No sent leads yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => (
            <Card key={lead._id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ArrowUpRight className="w-5 h-5" />
                      {lead.companyName}
                    </CardTitle>
                    <CardDescription>
                      To: {lead.toSalesPersonName} | Date: {new Date(lead.date).toLocaleDateString()}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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