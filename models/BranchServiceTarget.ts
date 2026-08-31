import mongoose, { Schema, Document } from "mongoose"

export interface IBranchServiceTarget extends Document {
  _id: mongoose.Types.ObjectId
  branchId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  month: number
  year: number
  phoneCallsTarget: number
  quotationsTarget: number
  ordersTarget: number
  billsTarget: number
  createdAt: Date
  updatedAt: Date
}

const BranchServiceTargetSchema = new Schema<IBranchServiceTarget>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    phoneCallsTarget: { type: Number, required: true, default: 0 },
    quotationsTarget: { type: Number, required: true, default: 0 },
    ordersTarget: { type: Number, required: true, default: 0 },
    billsTarget: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: true,
  }
)

BranchServiceTargetSchema.index({ branchId: 1, userId: 1, month: 1, year: 1 }, { unique: true })

if (mongoose.models.BranchServiceTarget) {
  delete mongoose.models.BranchServiceTarget
}

export const BranchServiceTarget = mongoose.model<IBranchServiceTarget>("BranchServiceTarget", BranchServiceTargetSchema)
