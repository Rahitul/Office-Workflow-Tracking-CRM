import mongoose, { Schema, Document } from "mongoose"

export interface IBillTarget extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  month: number
  year: number
  targetAmount: number
  setByUserId: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const BillTargetSchema = new Schema<IBillTarget>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    month: { type: Number, min: 1, max: 12 },
    year: { type: Number },
    targetAmount: { type: Number, required: true, default: 0 },
    setByUserId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
)

BillTargetSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true })

if (mongoose.models.BillTarget) {
  delete mongoose.models.BillTarget
}

export const BillTarget = mongoose.model<IBillTarget>("BillTarget", BillTargetSchema)
