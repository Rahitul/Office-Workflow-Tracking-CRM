import mongoose, { Schema, Document } from "mongoose"

export type LeadStatus = "Pending" | "Accepted" | "Working" | "Rejected" | "Lost" | "Successfully Closed"

export interface ILeadTransfer extends Document {
  _id: mongoose.Types.ObjectId
  date: Date
  employeeName: string
  productDetails: string
  description: string
  fromConcern: "IOM" | "PPS"
  toConcern: "IOM" | "PPS"
  toSalesPerson: mongoose.Types.ObjectId
  toSalesPersonName: string
  companyName: string
  companyPhone: string
  companyAddress: string
  previouslyQuoted: "YES" | "NO"
  notes?: string
  remarks?: string
  status: LeadStatus
  fromUser: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const LeadTransferSchema = new Schema<ILeadTransfer>(
  {
    date: { type: Date, required: true },
    employeeName: { type: String, required: true },
    productDetails: { type: String, required: true },
    description: { type: String, required: true },
    fromConcern: { type: String, enum: ["IOM", "PPS"], required: true },
    toConcern: { type: String, enum: ["IOM", "PPS"], required: true },
    toSalesPerson: { type: Schema.Types.ObjectId, ref: "User", required: true },
    toSalesPersonName: { type: String, required: true },
    companyName: { type: String, required: true },
    companyPhone: { type: String, required: true },
    companyAddress: { type: String, required: true },
    previouslyQuoted: { type: String, enum: ["YES", "NO"], required: true },
    notes: { type: String },
    remarks: { type: String },
    status: { type: String, enum: ["Pending", "Accepted", "Working", "Rejected", "Lost", "Successfully Closed"], default: "Pending" },
    fromUser: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
)

export const LeadTransfer = mongoose.models.LeadTransfer || mongoose.model<ILeadTransfer>("LeadTransfer", LeadTransferSchema)