"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, MapPin, Users, Building, Briefcase, FileText, Send, ChevronDown, ChevronUp } from "lucide-react"

const INDUSTRY_OPTIONS = [
  "Banking / Financial Services",
  "Government / PSU",
  "Manufacturing",
  "Telecom",
  "FMCG",
  "Education",
  "Logistics / Warehouse",
  "Others"
]

const CUSTOMER_SIZE_OPTIONS = ["Enterprise", "Medium", "Small"]

const PRIOR_RELATIONSHIP_OPTIONS = ["Yes", "No", "Others"]

const PAYMENT_CYCLE_OPTIONS = [
  "Within Credit Period",
  "1–30 days overdue",
  "31–60 days overdue",
  "60+ days overdue"
]

const CREDIT_RISK_OPTIONS = ["Yes", "No", "Others"]

const SERVICE_STATUS_OPTIONS = ["Satisfactory", "Minor Issues", "Repeated Complaints", "Critical Escalations"]

const ESCALATION_OPTIONS = ["Yes", "No", "Others"]

const MEETING_PURPOSE_OPTIONS = [
  "Relationship Strengthening",
  "Issue Resolution / Escalation",
  "Business Expansion",
  "New Solution Introduction",
  "Contract Renewal",
  "Competitive Threat",
  "Executive Courtesy Call"
]

const PRODUCT_OPTIONS = [
  "Toshiba MFP",
  "Managed Document Services (MDS)",
  "Auto ID / Barcode",
  "IT Infrastructure",
  "Fault Tolerant Server Solution",
  "Spare Parts / Consumables",
  "Others"
]

const CONTRACT_TYPE_OPTIONS = [
  "AMC",
  "MDS",
  "Transactional",
  "Project based",
  "No active contract"
]

const THREAT_LEVEL_OPTIONS = ["Low", "Medium", "High"]

const VERIFIED_OPTIONS = ["Yes", "No"]

interface FormData {
  customerName: string
  industry: string
  industryOther: string
  customerSize: string
  customerHeadOffice: string
  iomAccountOwner: string
  accountOwnerDesignation: string
  relationshipStartYear: string
  proposedAttendees: string
  decisionMaker: string
  influencers: string
  priorRelationship: string
  priorRelationshipOther: string
  totalRevenue: string
  productsSupplied: string[]
  productsSuppliedOther: string
  contractType: string[]
  totalBusinessValue: string
  currentYearBusiness: string
  currentOutstanding: string
  overdueAmount: string
  paymentCycle: string
  creditRisk: string
  creditRiskOther: string
  installedBase: string
  serviceStatus: string
  openServiceIssues: string
  escalations: string
  escalationsOther: string
  meetingPurpose: string[]
  expectedOpportunityValue: string
  keyNewSolutions: string
  competingVendors: string
  threatLevel: string
  riskFactors: string
  keyTalkingPoints: string
  supportRequired: string
  expectedOutcome: string
  informationVerified: string
  declaration: boolean
  requestedDate: string
  requestedTime: string
  requestedEndTime: string
  requestedLocation: string
}

const initialFormData: FormData = {
  customerName: "",
  industry: "",
  industryOther: "",
  customerSize: "",
  customerHeadOffice: "",
  iomAccountOwner: "",
  accountOwnerDesignation: "",
  relationshipStartYear: "",
  proposedAttendees: "",
  decisionMaker: "",
  influencers: "",
  priorRelationship: "",
  priorRelationshipOther: "",
  totalRevenue: "",
  productsSupplied: [],
  productsSuppliedOther: "",
  contractType: [],
  totalBusinessValue: "",
  currentYearBusiness: "",
  currentOutstanding: "",
  overdueAmount: "",
  paymentCycle: "",
  creditRisk: "",
  creditRiskOther: "",
  installedBase: "",
  serviceStatus: "",
  openServiceIssues: "",
  escalations: "",
  escalationsOther: "",
  meetingPurpose: [],
  expectedOpportunityValue: "",
  keyNewSolutions: "",
  competingVendors: "",
  threatLevel: "",
  riskFactors: "",
  keyTalkingPoints: "",
  supportRequired: "",
  expectedOutcome: "",
  informationVerified: "",
  declaration: false,
  requestedDate: "",
  requestedTime: "",
  requestedEndTime: "",
  requestedLocation: "",
}

export default function AppointmentRequestPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [expandedSection, setExpandedSection] = useState<number | null>(0)

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCheckboxChange = (field: keyof FormData, value: string, checked: boolean) => {
    const current = formData[field] as string[]
    if (checked) {
      handleChange(field, [...current, value])
    } else {
      handleChange(field, current.filter(item => item !== value))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.declaration) {
      setError("Please confirm the declaration before submitting")
      return
    }
    setLoading(true)
    setError("")

    try {
      await axios.post("/api/appointments/request", formData, { withCredentials: true })
      setSuccess(true)
      setTimeout(() => {
        router.push("/user/appointment-request/list")
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to submit appointment request")
    } finally {
      setLoading(false)
    }
  }

  const sections = [
    {
      title: "1. BASIC ACCOUNT INFORMATION",
      fields: [
        { label: "Customer / Organization Name", field: "customerName", type: "text", required: true },
        { label: "Industry / Business Type", field: "industry", type: "select", options: INDUSTRY_OPTIONS, required: true },
        { label: "Specify Industry", field: "industryOther", type: "text", show: formData.industry === "Others" },
        { label: "Customer Size", field: "customerSize", type: "select", options: CUSTOMER_SIZE_OPTIONS, required: true },
        { label: "Customer Head Office Location", field: "customerHeadOffice", type: "text", required: true },
        { label: "IOM Account Owner Name", field: "iomAccountOwner", type: "text", required: true },
        { label: "Account Owner Designation & Department", field: "accountOwnerDesignation", type: "text", required: true },
        { label: "Relationship Start Year with IOM", field: "relationshipStartYear", type: "text", required: true },
      ]
    },
    {
      title: "2. CUSTOMER TOP MANAGEMENT DETAILS",
      fields: [
        { label: "Proposed Customer Meeting Attendee(s)", field: "proposedAttendees", type: "text", required: true },
        { label: "Customer Decision Maker (Final Authority)", field: "decisionMaker", type: "text", required: true },
        { label: "Influencer(s) / User Head(s)", field: "influencers", type: "text" },
        { label: "Any Personal / Prior Relationship at CEO–CXO Level?", field: "priorRelationship", type: "select", options: PRIOR_RELATIONSHIP_OPTIONS, required: true },
        { label: "Specify Relationship", field: "priorRelationshipOther", type: "text", show: formData.priorRelationship === "Others" || formData.priorRelationship === "Yes" },
      ]
    },
    {
      title: "3. CURRENT BUSINESS WITH IOM",
      fields: [
        { label: "Total Revenue", field: "totalRevenue", type: "text", required: true },
        { 
          label: "Products / Solutions Currently Supplied by IOM", 
          field: "productsSupplied", 
          type: "checkbox", 
          options: PRODUCT_OPTIONS,
          showOther: formData.productsSupplied.includes("Others"),
          otherField: "productsSuppliedOther"
        },
        { 
          label: "Current Contract Type", 
          field: "contractType", 
          type: "checkbox", 
          options: CONTRACT_TYPE_OPTIONS 
        },
        { label: "Total Business Value with IOM (Last 3 Years)", field: "totalBusinessValue", type: "text", required: true },
        { label: "Current Year Business (YTD)", field: "currentYearBusiness", type: "text", required: true },
      ]
    },
    {
      title: "4. FINANCIAL & CREDIT STATUS (FROM ACCOUNTS)",
      fields: [
        { label: "Current Outstanding Amount (BDT)", field: "currentOutstanding", type: "text", required: true },
        { label: "Overdue Amount (If Any)", field: "overdueAmount", type: "text" },
        { label: "Average Payment Cycle", field: "paymentCycle", type: "radio", options: PAYMENT_CYCLE_OPTIONS, required: true },
        { label: "Any Credit / Payment Risk?", field: "creditRisk", type: "radio", options: CREDIT_RISK_OPTIONS, required: true },
        { label: "Specify Credit Risk", field: "creditRiskOther", type: "text", show: formData.creditRisk === "Yes" || formData.creditRisk === "Others" },
      ]
    },
    {
      title: "5. SERVICE & SUPPORT STATUS",
      fields: [
        { label: "Installed Base (Machines / Systems at Customer Site)", field: "installedBase", type: "text", required: true },
        { label: "Current Service Status", field: "serviceStatus", type: "radio", options: SERVICE_STATUS_OPTIONS, required: true },
        { label: "Open Service Issues (If Any)", field: "openServiceIssues", type: "textarea" },
        { label: "Escalations at Customer End?", field: "escalations", type: "radio", options: ESCALATION_OPTIONS, required: true },
        { label: "Specify Escalations", field: "escalationsOther", type: "text", show: formData.escalations === "Yes" || formData.escalations === "Others" },
      ]
    },
    {
      title: "6. STRATEGIC OPPORTUNITIES",
      fields: [
        { 
          label: "Primary Purpose of CEO / CXO Meeting", 
          field: "meetingPurpose", 
          type: "checkbox", 
          options: MEETING_PURPOSE_OPTIONS,
          required: true
        },
        { label: "Expected Business Opportunity Value (Next 12–24 Months)", field: "expectedOpportunityValue", type: "text", required: true },
        { label: "Key New Solutions to be Proposed", field: "keyNewSolutions", type: "textarea" },
      ]
    },
    {
      title: "7. COMPETITION & RISKS",
      fields: [
        { label: "Incumbent / Competing Vendors at Customer", field: "competingVendors", type: "text", placeholder: "eg: Ricoh, Sharp, Konica, Others" },
        { label: "Threat Level to IOM Business", field: "threatLevel", type: "radio", options: THREAT_LEVEL_OPTIONS, required: true },
        { label: "Risk Factors (Price / Service / Relationship / Grey Market etc.)", field: "riskFactors", type: "textarea" },
      ]
    },
    {
      title: "8. CEO PRE‑READ & EXPECTATION",
      fields: [
        { label: "Key Talking Points for CEO", field: "keyTalkingPoints", type: "textarea", required: true },
        { label: "What Support Is Required from IOM CEO?", field: "supportRequired", type: "textarea", required: true },
        { label: "Expected Outcome from This Meeting", field: "expectedOutcome", type: "textarea", required: true },
      ]
    },
    {
      title: "9. INTERNAL CONFIRMATION & DECLARATION",
      fields: [
        { label: "All Information Verified with Accounts & Service?", field: "informationVerified", type: "radio", options: VERIFIED_OPTIONS, required: true },
        { label: "Account Owner Declaration", field: "declaration", type: "declaration", required: true },
      ]
    },
  ]

  const baseInputClass = "w-full h-11 px-3 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"

  const renderField = (field: any, index: number) => {
    if (field.type === "text" || field.type === "date" || field.type === "time") {
      return (
        <Input
          type={field.type}
          value={formData[field.field as keyof FormData] as string}
          onChange={(e) => handleChange(field.field as keyof FormData, e.target.value)}
          placeholder={field.placeholder}
          className={baseInputClass}
          required={field.required}
        />
      )
    }

    if (field.type === "select") {
      return (
        <Select
          value={formData[field.field as keyof FormData] as string}
          onChange={(e) => handleChange(field.field as keyof FormData, e.target.value)}
          options={(field.options || []).map((o: string) => ({ value: o, label: o }))}
          className={baseInputClass}
          required={field.required}
        />
      )
    }

    if (field.type === "textarea") {
      return (
        <Textarea
          value={formData[field.field as keyof FormData] as string}
          onChange={(e) => handleChange(field.field as keyof FormData, e.target.value)}
          placeholder={field.placeholder}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm min-h-[100px]"
          required={field.required}
        />
      )
    }

    if (field.type === "radio") {
      return (
        <div className="flex flex-wrap gap-3">
          {(field.options || []).map((option: string) => (
            <label
              key={option}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                formData[field.field as keyof FormData] === option
                  ? "bg-blue-50 border-blue-500 text-blue-700"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              <input
                type="radio"
                name={field.field}
                value={option}
                checked={formData[field.field as keyof FormData] === option}
                onChange={(e) => handleChange(field.field as keyof FormData, e.target.value)}
                className="hidden"
              />
              <span className="text-sm font-medium">{option}</span>
            </label>
          ))}
        </div>
      )
    }

    if (field.type === "checkbox") {
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            {(field.options || []).map((option: string) => (
              <label
                key={option}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                  (formData[field.field as keyof FormData] as string[]).includes(option)
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={(formData[field.field as keyof FormData] as string[]).includes(option)}
                  onChange={(e) => handleCheckboxChange(field.field as keyof FormData, option, e.target.checked)}
                  className="hidden"
                />
                <span className="text-sm font-medium">{option}</span>
              </label>
            ))}
          </div>
          {field.showOther && (
            <Input
              type="text"
              value={formData[field.otherField as keyof FormData] as string}
              onChange={(e) => handleChange(field.otherField as keyof FormData, e.target.value)}
              placeholder="Please specify"
              className={baseInputClass}
            />
          )}
        </div>
      )
    }

    if (field.type === "declaration") {
      return (
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={formData.declaration}
            onCheckedChange={(checked) => handleChange("declaration", checked === true)}
          />
          <span className="text-sm text-slate-700">
            I confirm that the above information is accurate and verified with all internal stakeholders.
          </span>
        </label>
      )
    }

    return null
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointment Request</h1>
          <p className="text-slate-500 text-sm">Request an appointment with Managing Director or other employees</p>
        </div>
      </div>

      {success && (
        <Card className="border-emerald-200 bg-emerald-50 border-l-4 border-l-emerald-500">
          <CardContent className="py-4 flex items-center gap-3 text-emerald-800">
            <div className="bg-emerald-100 p-2 rounded-full">
              <FileText className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold">Request Submitted Successfully!</p>
              <p className="text-sm text-emerald-700">Redirecting to your appointment list...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50 border-l-4 border-l-red-500">
          <CardContent className="py-4 text-red-800 text-sm">{error}</CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {sections.map((section, sectionIndex) => (
          <Card key={sectionIndex} className="border-slate-200 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedSection(expandedSection === sectionIndex ? null : sectionIndex)}
              className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <span className="font-semibold text-slate-800">{section.title}</span>
              {expandedSection === sectionIndex ? (
                <ChevronUp className="w-5 h-5 text-slate-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-500" />
              )}
            </button>
            
            {expandedSection === sectionIndex && (
              <CardContent className="p-6 space-y-5">
                {section.fields.map((field: any, fieldIndex) => (
                  <div key={fieldIndex} className={field.show === false ? "hidden" : ""}>
                    <Label className="block text-sm font-medium text-slate-700 mb-2">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {renderField(field, fieldIndex)}
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        ))}

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Requested Appointment Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label className="block text-sm font-medium text-slate-700 mb-2">
                  Requested Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.requestedDate}
                  onChange={(e) => handleChange("requestedDate", e.target.value)}
                  className={baseInputClass}
                  required
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-slate-700 mb-2">
                  Start Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="time"
                  value={formData.requestedTime}
                  onChange={(e) => handleChange("requestedTime", e.target.value)}
                  className={baseInputClass}
                  required
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-slate-700 mb-2">
                  End Time
                </Label>
                <Input
                  type="time"
                  value={formData.requestedEndTime}
                  onChange={(e) => handleChange("requestedEndTime", e.target.value)}
                  className={baseInputClass}
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-slate-700 mb-2">
                  Location <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  value={formData.requestedLocation}
                  onChange={(e) => handleChange("requestedLocation", e.target.value)}
                  placeholder="Enter meeting location"
                  className={baseInputClass}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="px-6"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="px-8 bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Submitting...
              </div>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Request
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}