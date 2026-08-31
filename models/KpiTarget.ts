import mongoose, { Schema, Document } from "mongoose"

export interface IKpiTarget extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  month: number
  year: number
  coldCallsMade: number
  followUpCallsMade: number
  newAppointmentsFixed: number
  customerVisitsCompleted: number
  salesEmailsSent: number
  ordersClosedTodayValue: number
  quotationsIssuedTodayValue: number
  orderValueMfp: number
  orderValueMps: number
  orderValueBarcodePrinters: number
  orderValuePaperShredder: number
  orderValueDuplicator: number
  orderValueBarcodeScanner: number
  orderValueSolutions: number
  orderValueTender: number
  billsClosedTodayValue: number
  billValueMfp: number
  billValueMps: number
  billValueBarcodePrinters: number
  billValuePaperShredder: number
  billValueDuplicator: number
  billValueBarcodeScanner: number
  billValueSolutions: number
  billValueTender: number
  createdAt: Date
  updatedAt: Date
}

const KpiTargetSchema = new Schema<IKpiTarget>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    coldCallsMade: { type: Number, required: true, default: 0 },
    followUpCallsMade: { type: Number, required: true, default: 0 },
    newAppointmentsFixed: { type: Number, required: true, default: 0 },
    customerVisitsCompleted: { type: Number, required: true, default: 0 },
    salesEmailsSent: { type: Number, required: true, default: 0 },
    ordersClosedTodayValue: { type: Number, required: true, default: 0 },
    quotationsIssuedTodayValue: { type: Number, required: true, default: 0 },
    orderValueMfp: { type: Number, required: true, default: 0 },
    orderValueMps: { type: Number, required: true, default: 0 },
    orderValueBarcodePrinters: { type: Number, required: true, default: 0 },
    orderValuePaperShredder: { type: Number, required: true, default: 0 },
    orderValueDuplicator: { type: Number, required: true, default: 0 },
    orderValueBarcodeScanner: { type: Number, required: true, default: 0 },
    orderValueSolutions: { type: Number, required: true, default: 0 },
    orderValueTender: { type: Number, required: true, default: 0 },
    billsClosedTodayValue: { type: Number, required: true, default: 0 },
    billValueMfp: { type: Number, required: true, default: 0 },
    billValueMps: { type: Number, required: true, default: 0 },
    billValueBarcodePrinters: { type: Number, required: true, default: 0 },
    billValuePaperShredder: { type: Number, required: true, default: 0 },
    billValueDuplicator: { type: Number, required: true, default: 0 },
    billValueBarcodeScanner: { type: Number, required: true, default: 0 },
    billValueSolutions: { type: Number, required: true, default: 0 },
    billValueTender: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: true,
  }
)

KpiTargetSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true })

if (mongoose.models.KpiTarget) {
  delete mongoose.models.KpiTarget
}

export const KpiTarget = mongoose.model<IKpiTarget>("KpiTarget", KpiTargetSchema)