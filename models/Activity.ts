import mongoose, { Schema, Document } from "mongoose"

export interface IVisit {
  customerName: string
  primaryPurpose: "Opportunity Advancement" | "Opportunity Creation" | "Relationship & Account Management" | "Commercial / Control" | "N/A"
  productsDiscussed: string[]
  outcome: "Advanced / Positive" | "Neutral – Follow up required" | "Delayed" | "Lost / Negative" | "N/A"
  nextActionRequired: string
  nextActionDate: Date | null
}

export interface IActivity extends Document {
  _id: mongoose.Types.ObjectId
  activityDate: Date
  userId: mongoose.Types.ObjectId
  coldCallsMade: number
  followUpCallsMade: number
  newAppointmentsFixed: number
  customerVisitsCompleted: number
  salesEmailsSent: number
  primaryProductFocus: string
  secondaryProductFocus: string[]
  visits: IVisit[]
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

const VisitSchema = new Schema<IVisit>({
  customerName: { type: String, required: true },
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
  nextActionRequired: { type: String, required: true },
  nextActionDate: { type: Date, default: null },
})

const ActivitySchema = new Schema<IActivity>(
  {
    activityDate: { type: Date, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    coldCallsMade: { type: Number, required: true, default: 0 },
    followUpCallsMade: { type: Number, required: true, default: 0 },
    newAppointmentsFixed: { type: Number, required: true, default: 0 },
    customerVisitsCompleted: { type: Number, required: true, default: 0 },
    salesEmailsSent: { type: Number, required: true, default: 0 },
    primaryProductFocus: { type: String, default: "" },
    secondaryProductFocus: { type: [String], default: [] },
    visits: { type: [VisitSchema], default: [] },
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
    // Add this to ensure fields not in schema (if any) are not filtered but we explicitly defined them
    strict: true 
  }
)

ActivitySchema.index({ activityDate: 1, userId: 1 })

// Use a unique name if model is stuck in cache or delete it first
if (mongoose.models.Activity) {
  delete mongoose.models.Activity
}

export const Activity = mongoose.model<IActivity>("Activity", ActivitySchema)
