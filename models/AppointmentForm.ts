import mongoose, { Schema, Document } from "mongoose"

export interface IAppointmentForm extends Document {
  _id: mongoose.Types.ObjectId
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
  submittedBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const AppointmentFormSchema = new Schema<IAppointmentForm>(
  {
    customerName: { type: String, default: "" },
    industry: { type: String, default: "" },
    industryOther: { type: String, default: "" },
    customerSize: { type: String, default: "" },
    customerHeadOffice: { type: String, default: "" },
    iomAccountOwner: { type: String, default: "" },
    accountOwnerDesignation: { type: String, default: "" },
    relationshipStartYear: { type: String, default: "" },
    proposedAttendees: { type: String, default: "" },
    decisionMaker: { type: String, default: "" },
    influencers: { type: String, default: "" },
    priorRelationship: { type: String, default: "" },
    priorRelationshipOther: { type: String, default: "" },
    totalRevenue: { type: String, default: "" },
    productsSupplied: { type: [String], default: [] },
    productsSuppliedOther: { type: String, default: "" },
    contractType: { type: [String], default: [] },
    totalBusinessValue: { type: String, default: "" },
    currentYearBusiness: { type: String, default: "" },
    currentOutstanding: { type: String, default: "" },
    overdueAmount: { type: String, default: "" },
    paymentCycle: { type: String, default: "" },
    creditRisk: { type: String, default: "" },
    creditRiskOther: { type: String, default: "" },
    installedBase: { type: String, default: "" },
    serviceStatus: { type: String, default: "" },
    openServiceIssues: { type: String, default: "" },
    escalations: { type: String, default: "" },
    escalationsOther: { type: String, default: "" },
    meetingPurpose: { type: [String], default: [] },
    expectedOpportunityValue: { type: String, default: "" },
    keyNewSolutions: { type: String, default: "" },
    competingVendors: { type: String, default: "" },
    threatLevel: { type: String, default: "" },
    riskFactors: { type: String, default: "" },
    keyTalkingPoints: { type: String, default: "" },
    supportRequired: { type: String, default: "" },
    expectedOutcome: { type: String, default: "" },
    informationVerified: { type: String, default: "" },
    declaration: { type: Boolean, default: false },
    submittedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
)

if (mongoose.models.AppointmentForm) {
  delete mongoose.models.AppointmentForm
}

export const AppointmentForm = mongoose.model<IAppointmentForm>("AppointmentForm", AppointmentFormSchema)