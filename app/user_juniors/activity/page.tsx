"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { 
  Phone, 
  Calendar, 
  Users, 
  Mail, 
  CheckCircle, 
  Plus, 
  Trash2, 
  Package, 
  Target, 
  DollarSign, 
  ListTodo,
  FileText,
  TrendingUp,
  Clock,
  Briefcase,
  AlertCircle
} from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { cn } from "@/lib/utils"

interface User {
  _id: string
  name: string
  email: string
}

interface Visit {
  customerName: string
  primaryPurpose: string
  productsDiscussed: string[]
  outcome: string
  nextActionRequired: string
  nextActionDate: string
}

const PRODUCT_OPTIONS = ["MFP / Printer", "MDS", "Barcode", "POS", "IT / Infrastructure", "AMC / Consumables", "Paper Shredder", "Duplicator", "Solutions", "Others"]
const PURPOSE_OPTIONS = ["Opportunity Advancement", "Opportunity Creation", "Relationship & Account Management", "Commercial / Control", "N/A"]
const OUTCOME_OPTIONS = ["Advanced / Positive", "Neutral – Follow up required", "Delayed", "Lost / Negative", "N/A"]

export default function UserJuniorsActivityPage() {
  const { user } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedUser, setSelectedUser] = useState("")
  const [coldCallsMade, setColdCallsMade] = useState(0)
  const [followUpCallsMade, setFollowUpCallsMade] = useState(0)
  const [newAppointmentsFixed, setNewAppointmentsFixed] = useState(0)
  const [customerVisitsCompleted, setCustomerVisitsCompleted] = useState(0)
  const [salesEmailsSent, setSalesEmailsSent] = useState(0)
  
  const [primaryProductFocus, setPrimaryProductFocus] = useState("")
  const [secondaryProductFocus, setSecondaryProductFocus] = useState<string[]>([])
  const [visits, setVisits] = useState<Visit[]>([])
  const [quotationsIssuedToday, setQuotationsIssuedToday] = useState(0)
  const [ordersClosedToday, setOrdersClosedToday] = useState(0)
  const [orderValueMfp, setOrderValueMfp] = useState(0)
  const [orderValueMps, setOrderValueMps] = useState(0)
  const [orderValueBarcodePrinters, setOrderValueBarcodePrinters] = useState(0)
  const [orderValuePaperShredder, setOrderValuePaperShredder] = useState(0)
  const [orderValueDuplicator, setOrderValueDuplicator] = useState(0)
  const [orderValueBarcodeScanner, setOrderValueBarcodeScanner] = useState(0)
  const [orderValueSolutions, setOrderValueSolutions] = useState(0)
  const [orderValueTender, setOrderValueTender] = useState(0)
  const [billsClosedToday, setBillsClosedToday] = useState(0)
  const [billValueMfp, setBillValueMfp] = useState(0)
  const [billValueMps, setBillValueMps] = useState(0)
  const [billValueBarcodePrinters, setBillValueBarcodePrinters] = useState(0)
  const [billValuePaperShredder, setBillValuePaperShredder] = useState(0)
  const [billValueDuplicator, setBillValueDuplicator] = useState(0)
  const [billValueBarcodeScanner, setBillValueBarcodeScanner] = useState(0)
  const [billValueSolutions, setBillValueSolutions] = useState(0)
  const [billValueTender, setBillValueTender] = useState(0)
  const [tomorrowPlan, setTomorrowPlan] = useState("")

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/api/static-form/users", { withCredentials: true })
      setUsers(res.data.users || [])
      if (user) {
        setSelectedUser(user._id)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }

  const handleAddVisit = () => {
    setVisits([...visits, {
      customerName: "",
      primaryPurpose: "N/A",
      productsDiscussed: [],
      outcome: "N/A",
      nextActionRequired: "",
      nextActionDate: ""
    }])
  }

  const handleRemoveVisit = (index: number) => {
    const newVisits = [...visits]
    newVisits.splice(index, 1)
    setVisits(newVisits)
  }

  const handleVisitChange = (index: number, field: keyof Visit, value: any) => {
    const newVisits = [...visits]
    newVisits[index] = { ...newVisits[index], [field]: value }
    setVisits(newVisits)
  }

  const handleProductToggle = (product: string, isSecondary: boolean) => {
    if (isSecondary) {
      setSecondaryProductFocus(prev => 
        prev.includes(product) ? prev.filter(p => p !== product) : [...prev, product]
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      await axios.post("/api/static-form/activity", {
        activityDate,
        userId: selectedUser,
        coldCallsMade,
        followUpCallsMade,
        newAppointmentsFixed,
        customerVisitsCompleted,
        salesEmailsSent,
        primaryProductFocus,
        secondaryProductFocus,
        visits,
        quotationsIssuedToday,
        ordersClosedToday,
        orderValueMfp,
        orderValueMps,
        orderValueBarcodePrinters,
        orderValuePaperShredder,
        orderValueDuplicator,
        orderValueBarcodeScanner,
        orderValueSolutions,
        orderValueTender,
        billsClosedToday,
        billValueMfp,
        billValueMps,
        billValueBarcodePrinters,
        billValuePaperShredder,
        billValueDuplicator,
        billValueBarcodeScanner,
        billValueSolutions,
        billValueTender,
        tomorrowPlan,
      }, { withCredentials: true })

      setSuccess(true)
      setColdCallsMade(0)
      setFollowUpCallsMade(0)
      setNewAppointmentsFixed(0)
      setCustomerVisitsCompleted(0)
      setSalesEmailsSent(0)
      setPrimaryProductFocus("")
      setSecondaryProductFocus([])
      setVisits([])
      setQuotationsIssuedToday(0)
      setOrdersClosedToday(0)
      setOrderValueMfp(0)
      setOrderValueMps(0)
      setOrderValueBarcodePrinters(0)
      setOrderValuePaperShredder(0)
      setOrderValueDuplicator(0)
      setOrderValueBarcodeScanner(0)
      setOrderValueSolutions(0)
      setOrderValueTender(0)
      setBillsClosedToday(0)
      setBillValueMfp(0)
      setBillValueMps(0)
      setBillValueBarcodePrinters(0)
      setBillValuePaperShredder(0)
      setBillValueDuplicator(0)
      setBillValueBarcodeScanner(0)
      setBillValueSolutions(0)
      setBillValueTender(0)
      setTomorrowPlan("")
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error: any) {
      setError(error.response?.data?.error || "Failed to submit activity")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-orange-600" />
            Daily Activity Log
          </h1>
          <p className="text-slate-500 mt-1">Track and record your daily sales accomplishments and plans.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          <Clock className="h-4 w-4" />
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {success && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <Card className="border-emerald-200 bg-emerald-50 shadow-sm border-l-4 border-l-emerald-500">
            <CardContent className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-emerald-800">
                <div className="bg-emerald-100 p-2 rounded-full">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold">Submission Successful</p>
                  <p className="text-sm text-emerald-700 opacity-90">Your daily activity has been recorded. Great job today!</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSuccess(false)}
                className="text-emerald-700 hover:bg-emerald-100"
              >
                Dismiss
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <Card className="border-red-200 bg-red-50 shadow-sm border-l-4 border-l-red-500">
            <CardContent className="py-4 flex items-center gap-3 text-red-800">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-semibold">Action Required</p>
                <p className="text-sm text-red-700 opacity-90">{error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <section>
          <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
              <FileText className="h-4 w-4" />
            </div>
            <h2>Information Details</h2>
          </div>
          <Card className="border-slate-200 shadow-sm overflow-hidden border-t-2 border-t-orange-500">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label htmlFor="activityDate" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    Report Date
                  </Label>
                  <div className="relative group transition-all">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                    <Input
                      id="activityDate"
                      type="date"
                      value={activityDate}
                      onChange={(e) => setActivityDate(e.target.value)}
                      className="pl-10 h-11 border-slate-200 focus:border-orange-500 transition-all shadow-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    Sales Executive
                  </Label>
                  <div className="relative group transition-all">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-orange-500 transition-colors z-10" />
                    <Select
                      id="user"
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      options={users.map((u) => ({ value: u._id, label: u.name }))}
                      className="pl-10 h-11 border-slate-200 focus:border-orange-500 transition-all shadow-none"
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
            <h2>Key Performance Indicators</h2>
          </div>
          <Card className="border-slate-200 shadow-sm border-t-2 border-t-emerald-500">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {[
                  { id: "coldCalls", label: "Cold Calls", icon: Phone, color: "text-blue-500", bgColor: "bg-blue-50", value: coldCallsMade, setter: setColdCallsMade },
                  { id: "followUpCalls", label: "Follow-ups", icon: Phone, color: "text-amber-500", bgColor: "bg-amber-50", value: followUpCallsMade, setter: setFollowUpCallsMade },
                  { id: "appointments", label: "Appointments", icon: Calendar, color: "text-emerald-500", bgColor: "bg-emerald-50", value: newAppointmentsFixed, setter: setNewAppointmentsFixed },
                  { id: "visitsCount", label: "Visits", icon: Users, color: "text-purple-500", bgColor: "bg-purple-50", value: customerVisitsCompleted, setter: setCustomerVisitsCompleted },
                  { id: "emails", label: "Sales Emails", icon: Mail, color: "text-rose-500", bgColor: "bg-rose-50", value: salesEmailsSent, setter: setSalesEmailsSent },
                ].map((item) => (
                  <div key={item.id} className="space-y-3 group">
                    <div className={cn("p-3 rounded-xl border border-slate-100 transition-all group-focus-within:border-orange-200 group-focus-within:shadow-md", item.bgColor)}>
                      <Label htmlFor={item.id} className="text-[10px] font-bold text-slate-600 uppercase mb-2 flex items-center gap-1.5 tracking-tight">
                        <item.icon className={cn("h-3.5 w-3.5", item.color)} />
                        {item.label}
                      </Label>
                      <Input
                        id={item.id}
                        type="number"
                        min="0"
                        value={item.value}
                        onChange={(e) => item.setter(parseInt(e.target.value) || 0)}
                        className="h-8 border-none bg-transparent focus-visible:ring-0 text-lg font-bold p-0 shadow-none text-slate-800 w-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Target className="h-4 w-4" />
            </div>
            <h2>Strategic Focus</h2>
          </div>
          <Card className="border-slate-200 shadow-sm border-t-2 border-t-indigo-500">
            <CardContent className="p-6 space-y-8">
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    Primary Product Focus Today
                  </Label>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Required &bull; Choose One</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {PRODUCT_OPTIONS.map((option) => (
                    <label 
                      key={option} 
                      className={cn(
                        "cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all",
                        primaryProductFocus === option 
                          ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm" 
                          : "bg-white border-slate-100 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      <input
                        type="radio"
                        className="hidden"
                        name="primaryProduct"
                        checked={primaryProductFocus === option}
                        onChange={() => setPrimaryProductFocus(option)}
                      />
                      <span className="text-sm font-medium">{option}</span>
                      {primaryProductFocus === option && <CheckCircle className="h-4 w-4 animate-in zoom-in-50" />}
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    Secondary Products Promoted
                  </Label>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Multi-Select</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {PRODUCT_OPTIONS.map((option) => (
                    <div 
                      key={option} 
                      onClick={() => handleProductToggle(option, true)}
                      className={cn(
                        "cursor-pointer flex items-center space-x-3 p-3 rounded-lg border transition-all select-none",
                        secondaryProductFocus.includes(option)
                          ? "bg-slate-50 border-slate-400 text-slate-900 shadow-sm"
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      <Checkbox
                        id={`secondary-${option}`}
                        checked={secondaryProductFocus.includes(option)}
                        className="pointer-events-none"
                      />
                      <Label className="text-sm font-medium cursor-pointer leading-none">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                <Users className="h-4 w-4" />
              </div>
              <h2>Customer Interaction Records</h2>
            </div>
            <Button 
              type="button" 
              onClick={handleAddVisit}
              variant="outline"
              size="sm"
              className="group border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
            >
              <Plus className="h-4 w-4 mr-1 group-hover:rotate-90 transition-transform" /> 
              Log New Visit
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {visits.map((visit, index) => (
              <Card key={index} className="border-slate-200 shadow-sm relative overflow-hidden transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-2">
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full h-8 w-8"
                  onClick={() => handleRemoveVisit(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                
                <CardHeader className="bg-slate-50/50 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-[10px] font-bold">
                      {index + 1}
                    </span>
                    <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wide">Visit Information</CardTitle>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase">Customer / Company Name</Label>
                      <div className="relative group">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                        <Input 
                          value={visit.customerName}
                          onChange={(e) => handleVisitChange(index, "customerName", e.target.value)}
                          placeholder="e.g. Acme Corporation"
                          className="pl-10 border-slate-200 focus:border-purple-500 transition-all shadow-none h-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase">Primary Purpose</Label>
                      <Select
                        value={visit.primaryPurpose}
                        onChange={(e) => handleVisitChange(index, "primaryPurpose", e.target.value)}
                        options={PURPOSE_OPTIONS.map(o => ({ value: o, label: o }))}
                        className="border-slate-200 focus:border-purple-500 transition-all shadow-none h-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <Label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5" />
                      Solutions Discussed
                    </Label>
                    <div className="flex flex-wrap gap-x-6 gap-y-3">
                      {[...PRODUCT_OPTIONS, "N/A"].map((option) => (
                        <div key={option} className="flex items-center space-x-2 group">
                          <Checkbox
                            id={`visit-${index}-${option}`}
                            checked={visit.productsDiscussed.includes(option)}
                            onCheckedChange={(checked) => {
                              const current = visit.productsDiscussed
                              const next = checked 
                                ? [...current, option]
                                : current.filter(p => p !== option)
                              handleVisitChange(index, "productsDiscussed", next)
                            }}
                          />
                          <Label htmlFor={`visit-${index}-${option}`} className="text-sm font-medium text-slate-600 cursor-pointer group-hover:text-slate-900 transition-colors">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase">Outcome</Label>
                      <Select
                        value={visit.outcome}
                        onChange={(e) => handleVisitChange(index, "outcome", e.target.value)}
                        options={OUTCOME_OPTIONS.map(o => ({ value: o, label: o }))}
                        className="border-slate-200 focus:border-purple-500 transition-all shadow-none h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase">Next Action Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                          type="date"
                          value={visit.nextActionDate}
                          onChange={(e) => handleVisitChange(index, "nextActionDate", e.target.value)}
                          className="pl-10 border-slate-200 focus:border-purple-500 transition-all shadow-none h-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label className="text-xs font-bold text-slate-500 uppercase">Next Action Required</Label>
                      <Input 
                        value={visit.nextActionRequired}
                        onChange={(e) => handleVisitChange(index, "nextActionRequired", e.target.value)}
                        placeholder="Define the specific next steps clearly..."
                        className="border-slate-200 focus:border-purple-500 transition-all shadow-none h-10"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {visits.length === 0 && (
              <div 
                onClick={handleAddVisit}
                className="flex flex-col items-center justify-center py-12 px-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer group"
              >
                <div className="bg-white p-4 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                  <Users className="h-8 w-8 text-slate-300 group-hover:text-purple-400 transition-colors" />
                </div>
                <p className="font-semibold text-slate-600">No visits recorded today</p>
                <p className="text-sm mt-1">Click to add customer meeting details.</p>
                <Button variant="ghost" size="sm" className="mt-4 text-purple-600 hover:bg-purple-50">
                  <Plus className="h-4 w-4 mr-1" /> Add Record
                </Button>
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
            <h2>Commercial Impact</h2>
          </div>
          <Card className="border-slate-200 shadow-sm border-t-2 border-t-emerald-500">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="quotations" className="text-sm font-semibold text-slate-700 uppercase tracking-wider block">
                    Total Quotations Issued Today
                  </Label>
                  <div className="relative group transition-all">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold group-focus-within:text-emerald-500 transition-colors">৳</span>
                    <Input
                      id="quotations"
                      type="number"
                      min="0"
                      value={quotationsIssuedToday}
                      onChange={(e) => setQuotationsIssuedToday(parseInt(e.target.value) || 0)}
                      className="pl-8 h-12 text-lg font-bold border-slate-200 focus:border-emerald-500 transition-all shadow-none bg-slate-50/30"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 italic">Enter the cumulative value in BDT</p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="orders" className="text-sm font-semibold text-slate-700 uppercase tracking-wider block">
                    Total Orders Closed Today
                  </Label>
                  <div className="relative group transition-all">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold group-focus-within:text-emerald-500 transition-colors">৳</span>
                    <Input
                      id="orders"
                      type="number"
                      min="0"
                      readOnly
                      value={ordersClosedToday}
                      onChange={(e) => setOrdersClosedToday(parseInt(e.target.value) || 0)}
                      className="pl-8 h-12 text-lg font-bold border-slate-200 focus:border-emerald-500 transition-all shadow-none bg-slate-50/30"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 italic">Enter the cumulative value in BDT</p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="bills" className="text-sm font-semibold text-slate-700 uppercase tracking-wider block">
                    Total Bills Closed Today
                  </Label>
                  <div className="relative group transition-all">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold group-focus-within:text-amber-500 transition-colors">৳</span>
                    <Input
                      id="bills"
                      type="number"
                      min="0"
                      readOnly
                      value={billsClosedToday}
                      onChange={(e) => setBillsClosedToday(parseInt(e.target.value) || 0)}
                      className="pl-8 h-12 text-lg font-bold border-slate-200 focus:border-amber-500 transition-all shadow-none bg-slate-50/30"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 italic">Enter the cumulative value in BDT</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Package className="h-4 w-4 text-emerald-600" />
                  Order Value Breakdown by Product
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[
                    { key: "orderValueMfp", label: "MFP", setter: setOrderValueMfp, value: orderValueMfp },
                    { key: "orderValueMps", label: "MPS", setter: setOrderValueMps, value: orderValueMps },
                    { key: "orderValueBarcodePrinters", label: "Barcode Printers", setter: setOrderValueBarcodePrinters, value: orderValueBarcodePrinters },
                    { key: "orderValuePaperShredder", label: "Paper Shredder", setter: setOrderValuePaperShredder, value: orderValuePaperShredder },
                    { key: "orderValueDuplicator", label: "Duplicator", setter: setOrderValueDuplicator, value: orderValueDuplicator },
                    { key: "orderValueBarcodeScanner", label: "Barcode Scanner / POS", setter: setOrderValueBarcodeScanner, value: orderValueBarcodeScanner },
                    { key: "orderValueSolutions", label: "Solutions", setter: setOrderValueSolutions, value: orderValueSolutions },
                    { key: "orderValueTender", label: "Tender", setter: setOrderValueTender, value: orderValueTender },
                  ].map((item) => (
                    <div key={item.key} className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.label}</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">৳</span>
                        <Input
                          type="number"
                          min="0"
                          value={item.value}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0
                            item.setter(val)
                            const sum = (item.key === "orderValueMfp" ? val : orderValueMfp) +
                              (item.key === "orderValueMps" ? val : orderValueMps) +
                              (item.key === "orderValueBarcodePrinters" ? val : orderValueBarcodePrinters) +
                              (item.key === "orderValuePaperShredder" ? val : orderValuePaperShredder) +
                              (item.key === "orderValueDuplicator" ? val : orderValueDuplicator) +
                              (item.key === "orderValueBarcodeScanner" ? val : orderValueBarcodeScanner) +
                              (item.key === "orderValueSolutions" ? val : orderValueSolutions) +
                              (item.key === "orderValueTender" ? val : orderValueTender)
                            setOrdersClosedToday(sum)
                          }}
                          className="pl-8 h-10 text-sm font-semibold border-slate-200 focus:border-emerald-500 transition-all shadow-none bg-slate-50/30"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Package className="h-4 w-4 text-amber-600" />
                  Bill Value Breakdown by Product
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[
                    { key: "billValueMfp", label: "MFP", setter: setBillValueMfp, value: billValueMfp },
                    { key: "billValueMps", label: "MPS", setter: setBillValueMps, value: billValueMps },
                    { key: "billValueBarcodePrinters", label: "Barcode Printers", setter: setBillValueBarcodePrinters, value: billValueBarcodePrinters },
                    { key: "billValuePaperShredder", label: "Paper Shredder", setter: setBillValuePaperShredder, value: billValuePaperShredder },
                    { key: "billValueDuplicator", label: "Duplicator", setter: setBillValueDuplicator, value: billValueDuplicator },
                    { key: "billValueBarcodeScanner", label: "Barcode Scanner / POS", setter: setBillValueBarcodeScanner, value: billValueBarcodeScanner },
                    { key: "billValueSolutions", label: "Solutions", setter: setBillValueSolutions, value: billValueSolutions },
                    { key: "billValueTender", label: "Tender", setter: setBillValueTender, value: billValueTender },
                  ].map((item) => (
                    <div key={item.key} className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.label}</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">৳</span>
                        <Input
                          type="number"
                          min="0"
                          value={item.value}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0
                            item.setter(val)
                            const sum = (item.key === "billValueMfp" ? val : billValueMfp) +
                              (item.key === "billValueMps" ? val : billValueMps) +
                              (item.key === "billValueBarcodePrinters" ? val : billValueBarcodePrinters) +
                              (item.key === "billValuePaperShredder" ? val : billValuePaperShredder) +
                              (item.key === "billValueDuplicator" ? val : billValueDuplicator) +
                              (item.key === "billValueBarcodeScanner" ? val : billValueBarcodeScanner) +
                              (item.key === "billValueSolutions" ? val : billValueSolutions) +
                              (item.key === "billValueTender" ? val : billValueTender)
                            setBillsClosedToday(sum)
                          }}
                          className="pl-8 h-10 text-sm font-semibold border-slate-200 focus:border-amber-500 transition-all shadow-none bg-slate-50/30"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
              <ListTodo className="h-4 w-4" />
            </div>
            <h2>Tomorrow&apos;s Strategy</h2>
          </div>
          <Card className="border-slate-200 shadow-sm border-t-2 border-t-orange-500">
            <CardContent className="p-6">
              <div className="space-y-3">
                <Label htmlFor="tomorrowPlan" className="text-sm font-semibold text-slate-700 uppercase tracking-wider block">
                  Action Plan for Next Business Day
                </Label>
                <div className="relative">
                  <Textarea
                    id="tomorrowPlan"
                    value={tomorrowPlan}
                    onChange={(e) => setTomorrowPlan(e.target.value)}
                    placeholder="Briefly outline your key objectives, priority calls, and scheduled meetings for tomorrow..."
                    className="min-h-[150px] border-slate-200 focus:border-orange-500 transition-all shadow-none text-base leading-relaxed p-4 bg-slate-50/30"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="pt-6 flex flex-col md:flex-row items-center gap-4 justify-between border-t border-slate-200">
          <p className="text-sm text-slate-500 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-slate-400" />
            Please review all entries before final submission.
          </p>
          <Button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto min-w-[200px] bg-slate-900 hover:bg-black text-white px-8 py-6 text-lg font-bold h-auto shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : (
              "Submit Daily Report"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
