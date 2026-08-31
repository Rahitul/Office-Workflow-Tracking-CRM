import mongoose, { Schema, Document } from "mongoose"

export interface IBranchSalesVisit {
  customerName: string
  contactPersonName: string
  contactPersonPhone: string
  primaryPurpose: "Opportunity Advancement" | "Opportunity Creation" | "Relationship & Account Management" | "Commercial / Control" | "N/A"
  productsDiscussed: string[]
  outcome: "Advanced / Positive" | "Neutral – Follow up required" | "Delayed" | "Lost / Negative" | "N/A"
  nextActionRequired: string
  nextActionDate: Date | null
}

export interface IBranchSalesActivity extends Document {
  _id: mongoose.Types.ObjectId
  activityDate: Date
  userId: mongoose.Types.ObjectId
  newAppointmentsFixed: number
  customerVisitsCompleted: number
  salesEmailsSent: number
  primaryProductFocus: string
  secondaryProductFocus: string[]
  visits: IBranchSalesVisit[]
  quotationsIssuedToday: number
  ordersClosedToday: number
  orderValueMfp: number
  orderValueMps: number
  orderValueBarcodePrinters: number
  orderValuePaperShredder: number
  orderValueDuplicator: number
  orderValueBarcodeScanner: number
  orderValueSolutions: number
  orderValueTender: number
  billsClosedToday: number
  billValueMfp: number
  billValueMps: number
  billValueBarcodePrinters: number
  billValuePaperShredder: number
  billValueDuplicator: number
  billValueBarcodeScanner: number
  billValueSolutions: number
  billValueTender: number
  tomorrowPlan: string
  submittedAt: Date
}

const BranchSalesVisitSchema = new Schema<IBranchSalesVisit>({
  customerName: { type: String, default: "" },
  contactPersonName: { type: String, default: "" },
  contactPersonPhone: { type: String, default: "" },
  primaryPurpose: {
    type: String,
    enum: ["Opportunity Advancement", "Opportunity Creation", "Relationship & Account Management", "Commercial / Control", "N/A"],
    required: true,
  },
  productsDiscussed: { type: [String], default: [] },
  outcome: {
    type: String,
    enum: ["Advanced / Positive", "Neutral – Follow up required", "Delayed", "Lost / Negative", "N/A"],
    required: true,
  },
  nextActionRequired: { type: String, default: "" },
  nextActionDate: { type: Date, default: null },
})

const BranchSalesActivitySchema = new Schema<IBranchSalesActivity>(
  {
    activityDate: { type: Date, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    newAppointmentsFixed: { type: Number, required: true, default: 0 },
    customerVisitsCompleted: { type: Number, required: true, default: 0 },
    salesEmailsSent: { type: Number, required: true, default: 0 },
    primaryProductFocus: { type: String, default: "" },
    secondaryProductFocus: { type: [String], default: [] },
    visits: { type: [BranchSalesVisitSchema], default: [] },
    quotationsIssuedToday: { type: Number, default: 0 },
    ordersClosedToday: { type: Number, default: 0 },
    orderValueMfp: { type: Number, default: 0 },
    orderValueMps: { type: Number, default: 0 },
    orderValueBarcodePrinters: { type: Number, default: 0 },
    orderValuePaperShredder: { type: Number, default: 0 },
    orderValueDuplicator: { type: Number, default: 0 },
    orderValueBarcodeScanner: { type: Number, default: 0 },
    orderValueSolutions: { type: Number, default: 0 },
    orderValueTender: { type: Number, default: 0 },
    billsClosedToday: { type: Number, default: 0 },
    billValueMfp: { type: Number, default: 0 },
    billValueMps: { type: Number, default: 0 },
    billValueBarcodePrinters: { type: Number, default: 0 },
    billValuePaperShredder: { type: Number, default: 0 },
    billValueDuplicator: { type: Number, default: 0 },
    billValueBarcodeScanner: { type: Number, default: 0 },
    billValueSolutions: { type: Number, default: 0 },
    billValueTender: { type: Number, default: 0 },
    tomorrowPlan: { type: String, default: "" },
    submittedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    strict: true,
  }
)

BranchSalesActivitySchema.index({ activityDate: 1, userId: 1 })

if (mongoose.models.BranchSalesActivity) {
  delete mongoose.models.BranchSalesActivity
}

export const BranchSalesActivity = mongoose.model<IBranchSalesActivity>("BranchSalesActivity", BranchSalesActivitySchema)
