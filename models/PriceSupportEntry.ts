import mongoose, { Schema, Document } from "mongoose"

export interface IPriceSupportEntry extends Document {
  _id: mongoose.Types.ObjectId
  priceSupportTargetId: mongoose.Types.ObjectId
  projectClientName: string
  month: number
  year: number
  entryDate: string
  amountBDT: number
  gpMargin: number
  executiveName: string
  notes: string
  enteredByUserId: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const PriceSupportEntrySchema = new Schema<IPriceSupportEntry>(
  {
    priceSupportTargetId: { type: Schema.Types.ObjectId, ref: "PriceSupportTarget", required: false, index: true },
    projectClientName: { type: String, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    entryDate: { type: String, required: true },
    amountBDT: { type: Number, required: true, min: 0 },
    gpMargin: { type: Number, required: true, min: 0 },
    executiveName: { type: String, required: true },
    notes: { type: String, default: "" },
    enteredByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  {
    timestamps: true,
  }
)

PriceSupportEntrySchema.index({ projectClientName: 1, entryDate: 1 }, { unique: true })

if (mongoose.models.PriceSupportEntry) {
  delete mongoose.models.PriceSupportEntry
}

export const PriceSupportEntry = mongoose.model<IPriceSupportEntry>("PriceSupportEntry", PriceSupportEntrySchema)