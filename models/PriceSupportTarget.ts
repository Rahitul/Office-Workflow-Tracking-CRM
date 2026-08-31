import mongoose, { Schema, Document } from "mongoose"

export interface IPriceSupportTarget extends Document {
  _id: mongoose.Types.ObjectId
  projectClientName: string
  month: number
  year: number
  amountBDT: number
  gpMargin: number
  executiveName: string
  setByUserId: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const PriceSupportTargetSchema = new Schema<IPriceSupportTarget>(
  {
    projectClientName: { type: String, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    amountBDT: { type: Number, required: true, min: 0 },
    gpMargin: { type: Number, required: true, min: 0 },
    executiveName: { type: String, required: true },
    setByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  {
    timestamps: true,
  }
)

PriceSupportTargetSchema.index({ projectClientName: 1, month: 1, year: 1 }, { unique: true })

if (mongoose.models.PriceSupportTarget) {
  delete mongoose.models.PriceSupportTarget
}

export const PriceSupportTarget = mongoose.model<IPriceSupportTarget>("PriceSupportTarget", PriceSupportTargetSchema)