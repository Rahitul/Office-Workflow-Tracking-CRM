"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Phone,
  Calendar,
  CheckCircle,
  DollarSign,
  Package,
  FileText,
  TrendingUp,
  Clock,
  AlertCircle,
  Users,
  ShoppingCart,
  Receipt,
  Footprints,
  List,
  Loader2,
  Search,
} from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { cn } from "@/lib/utils"

export default function ConsumableActivityPage() {
  const { user } = useAuthStore()
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedUser, setSelectedUser] = useState("")
  const [calls, setCalls] = useState(0)
  const [visits, setVisits] = useState(0)
  const [quotation, setQuotation] = useState(0)
  const [quotationQty, setQuotationQty] = useState(0)
  const [orderQty, setOrderQty] = useState(0)
  const [billQty, setBillQty] = useState(0)
  const [orderValueBlackAndWhite, setOrderValueBlackAndWhite] = useState(0)
  const [orderValueColor, setOrderValueColor] = useState(0)
  const [orderValueDuplicatorInk, setOrderValueDuplicatorInk] = useState(0)
  const [orderValueDuplicatorMaster, setOrderValueDuplicatorMaster] = useState(0)
  const [orderValueMps, setOrderValueMps] = useState(0)
  const [billValueBlackAndWhite, setBillValueBlackAndWhite] = useState(0)
  const [billValueColor, setBillValueColor] = useState(0)
  const [billValueDuplicatorInk, setBillValueDuplicatorInk] = useState(0)
  const [billValueDuplicatorMaster, setBillValueDuplicatorMaster] = useState(0)
  const [billValueMps, setBillValueMps] = useState(0)

  const totalOrderValue = orderValueBlackAndWhite + orderValueColor + orderValueDuplicatorInk + orderValueDuplicatorMaster + orderValueMps
  const totalBillValue = billValueBlackAndWhite + billValueColor + billValueDuplicatorInk + billValueDuplicatorMaster + billValueMps

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<"form" | "list">("form")
  const [activities, setActivities] = useState<any[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [filterStartDate, setFilterStartDate] = useState("")
  const [filterEndDate, setFilterEndDate] = useState("")

  useEffect(() => {
    if (user) {
      setSelectedUser(user._id)
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      await axios.post("/api/consumable-activity", {
        activityDate,
        userId: selectedUser,
        calls,
        visits,
        quotation,
        quotationQty,
        orderQty,
        billQty,
        orderValueBlackAndWhite,
        orderValueColor,
        orderValueDuplicatorInk,
        orderValueDuplicatorMaster,
        orderValueMps,
        billValueBlackAndWhite,
        billValueColor,
        billValueDuplicatorInk,
        billValueDuplicatorMaster,
        billValueMps,
      }, { withCredentials: true })

      setSuccess(true)
      setCalls(0)
      setVisits(0)
      setQuotation(0)
      setQuotationQty(0)
      setOrderQty(0)
      setBillQty(0)
      setOrderValueBlackAndWhite(0)
      setOrderValueColor(0)
      setOrderValueDuplicatorInk(0)
      setOrderValueDuplicatorMaster(0)
      setOrderValueMps(0)
      setBillValueBlackAndWhite(0)
      setBillValueColor(0)
      setBillValueDuplicatorInk(0)
      setBillValueDuplicatorMaster(0)
      setBillValueMps(0)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (error: any) {
      setError(error.response?.data?.error || "Failed to submit activity")
    } finally {
      setLoading(false)
    }
  }

  const fetchActivities = async () => {
    try {
      setListLoading(true)
      const params = new URLSearchParams()
      params.append("userId", selectedUser)
      if (filterStartDate) params.append("startDate", filterStartDate)
      if (filterEndDate) params.append("endDate", filterEndDate)
      const res = await axios.get(`/api/consumable-activity?${params.toString()}`, { withCredentials: true })
      setActivities(res.data.activities)
    } catch (err) {
      console.error("Failed to fetch activities")
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === "list" && selectedUser) {
      fetchActivities()
    }
  }, [activeTab, selectedUser])

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-orange-600" />
            Daily Activity
          </h1>
          <p className="text-slate-500 mt-1">Record your daily sales activities and performance.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          <Clock className="h-4 w-4" />
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      <nav className="flex gap-1 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("form")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
            activeTab === "form"
              ? "border-orange-600 text-orange-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          )}
        >
          <FileText className="w-4 h-4" />
          Form
        </button>
        <button
          onClick={() => setActiveTab("list")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
            activeTab === "list"
              ? "border-orange-600 text-orange-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          )}
        >
          <List className="w-4 h-4" />
          List
        </button>
      </nav>

      {activeTab === "form" && (
        <>
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
                  <p className="text-sm text-emerald-700 opacity-90">Your daily activity has been recorded.</p>
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
                    Date
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
                    Name
                  </Label>
                  <div className="relative group transition-all">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors z-10" />
                    <Input
                      id="user"
                      type="text"
                      value={user?.name || ""}
                      className="pl-10 h-11 border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
              <TrendingUp className="h-4 w-4" />
            </div>
            <h2>Activity Details</h2>
          </div>
          <Card className="border-slate-200 shadow-sm overflow-hidden border-t-2 border-t-orange-500">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                  { id: "calls", label: "Calls", icon: Phone, color: "text-violet-600", bgColor: "bg-violet-50", value: calls, setter: setCalls },
                  { id: "visits", label: "Visits", icon: Footprints, color: "text-indigo-600", bgColor: "bg-indigo-50", value: visits, setter: setVisits },
                  { id: "quotation", label: "Quotation", icon: DollarSign, color: "text-cyan-600", bgColor: "bg-cyan-50", value: quotation, setter: setQuotation },
                  { id: "quotationQty", label: "Quotation Qty", icon: Package, color: "text-teal-600", bgColor: "bg-teal-50", value: quotationQty, setter: setQuotationQty },
                  { id: "orderQty", label: "Orders Qty", icon: ShoppingCart, color: "text-green-600", bgColor: "bg-green-50", value: orderQty, setter: setOrderQty },
                  { id: "billQty", label: "Bill Qty", icon: Receipt, color: "text-orange-600", bgColor: "bg-orange-50", value: billQty, setter: setBillQty },
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
                        className="h-9 text-sm font-semibold border-slate-200 focus:border-orange-500 transition-all shadow-none bg-white/80"
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
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
            <h2>Commercial Impact</h2>
          </div>
          <Card className="border-slate-200 shadow-sm overflow-hidden border-t-2 border-t-emerald-500">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wider block">
                    Total Orders Value
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                    <Input
                      type="number"
                      min="0"
                      readOnly
                      value={totalOrderValue}
                      className="pl-8 h-12 text-lg font-bold border-emerald-200 bg-emerald-50/30 text-emerald-700 cursor-not-allowed"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wider block">
                    Total Bills Value
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                    <Input
                      type="number"
                      min="0"
                      readOnly
                      value={totalBillValue}
                      className="pl-8 h-12 text-lg font-bold border-amber-200 bg-amber-50/30 text-amber-700 cursor-not-allowed"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Package className="h-4 w-4 text-emerald-600" />
                  Order Value Breakdown by Product
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { key: "orderValueBlackAndWhite", label: "Black & White", setter: setOrderValueBlackAndWhite, value: orderValueBlackAndWhite },
                    { key: "orderValueColor", label: "Color", setter: setOrderValueColor, value: orderValueColor },
                    { key: "orderValueDuplicatorInk", label: "Duplicator Ink", setter: setOrderValueDuplicatorInk, value: orderValueDuplicatorInk },
                    { key: "orderValueDuplicatorMaster", label: "Duplicator Master", setter: setOrderValueDuplicatorMaster, value: orderValueDuplicatorMaster },
                    { key: "orderValueMps", label: "MPS", setter: setOrderValueMps, value: orderValueMps },
                  ].map((item) => (
                    <div key={item.key} className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.label}</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">৳</span>
                        <Input
                          type="number"
                          min="0"
                          value={item.value}
                          onChange={(e) => item.setter(parseInt(e.target.value) || 0)}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { key: "billValueBlackAndWhite", label: "Black & White", setter: setBillValueBlackAndWhite, value: billValueBlackAndWhite },
                    { key: "billValueColor", label: "Color", setter: setBillValueColor, value: billValueColor },
                    { key: "billValueDuplicatorInk", label: "Duplicator Ink", setter: setBillValueDuplicatorInk, value: billValueDuplicatorInk },
                    { key: "billValueDuplicatorMaster", label: "Duplicator Master", setter: setBillValueDuplicatorMaster, value: billValueDuplicatorMaster },
                    { key: "billValueMps", label: "MPS", setter: setBillValueMps, value: billValueMps },
                  ].map((item) => (
                    <div key={item.key} className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.label}</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">৳</span>
                        <Input
                          type="number"
                          min="0"
                          value={item.value}
                          onChange={(e) => item.setter(parseInt(e.target.value) || 0)}
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

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg shadow-orange-200 transition-all font-semibold text-base rounded-xl"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Submitting...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>Submit Daily Activity</span>
            </div>
          )}
        </Button>
      </form>
        </>
      )}

      {activeTab === "list" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">From Date</Label>
              <Input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">To Date</Label>
              <Input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="h-9" />
            </div>
            <Button onClick={fetchActivities} size="sm" className="h-9 bg-orange-500 hover:bg-orange-600 text-white">
              <Search className="w-4 h-4 mr-1" /> Filter
            </Button>
          </div>
          {listLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
          ) : activities.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-slate-500">
                No activity records found.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">Calls</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">Visits</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">Quotation</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">Orders Qty</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">Bill Qty</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">Order Value</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">Bill Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((activity) => {
                      const totalOV = activity.orderValueBlackAndWhite + activity.orderValueColor + activity.orderValueDuplicatorInk + activity.orderValueDuplicatorMaster + activity.orderValueMps
                      const totalBV = activity.billValueBlackAndWhite + activity.billValueColor + activity.billValueDuplicatorInk + activity.billValueDuplicatorMaster + activity.billValueMps
                      return (
                        <tr key={activity._id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium whitespace-nowrap">{new Date(activity.activityDate).toLocaleDateString("en-GB")}</td>
                          <td className="py-3 px-4 text-right">{activity.calls}</td>
                          <td className="py-3 px-4 text-right">{activity.visits}</td>
                          <td className="py-3 px-4 text-right">{activity.quotation}</td>
                          <td className="py-3 px-4 text-right">{activity.orderQty}</td>
                          <td className="py-3 px-4 text-right">{activity.billQty}</td>
                          <td className="py-3 px-4 text-right font-medium">৳{totalOV.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right font-medium">৳{totalBV.toLocaleString()}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
