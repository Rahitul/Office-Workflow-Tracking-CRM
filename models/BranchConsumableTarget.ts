import mongoose, { Schema, Document } from "mongoose"

export interface IBranchConsumableTarget extends Document {
  _id: mongoose.Types.ObjectId
  branchId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  month: number
  year: number
  callsTarget: number
  visitsTarget: number
  quotationTarget: number
  orderAmountTarget: number
  orderValueBlackAndWhite: number
  orderValueColor: number
  orderValueDuplicatorInk: number
  orderValueDuplicatorMaster: number
  orderValueMps: number
  billAmountTarget: number
  billValueBlackAndWhite: number
  billValueColor: number
  billValueDuplicatorInk: number
  billValueDuplicatorMaster: number
  billValueMps: number
  createdAt: Date
  updatedAt: Date
}

const BranchConsumableTargetSchema = new Schema<IBranchConsumableTarget>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    callsTarget: { type: Number, required: true, default: 0 },
    visitsTarget: { type: Number, required: true, default: 0 },
    quotationTarget: { type: Number, required: true, default: 0 },
    orderAmountTarget: { type: Number, required: true, default: 0 },
    orderValueBlackAndWhite: { type: Number, required: true, default: 0 },
    orderValueColor: { type: Number, required: true, default: 0 },
    orderValueDuplicatorInk: { type: Number, required: true, default: 0 },
    orderValueDuplicatorMaster: { type: Number, required: true, default: 0 },
    orderValueMps: { type: Number, required: true, default: 0 },
    billAmountTarget: { type: Number, required: true, default: 0 },
    billValueBlackAndWhite: { type: Number, required: true, default: 0 },
    billValueColor: { type: Number, required: true, default: 0 },
    billValueDuplicatorInk: { type: Number, required: true, default: 0 },
    billValueDuplicatorMaster: { type: Number, required: true, default: 0 },
    billValueMps: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: true,
  }
)

BranchConsumableTargetSchema.index({ branchId: 1, userId: 1, month: 1, year: 1 }, { unique: true })

if (mongoose.models.BranchConsumableTarget) {
  delete mongoose.models.BranchConsumableTarget
}

export const BranchConsumableTarget = mongoose.model<IBranchConsumableTarget>("BranchConsumableTarget", BranchConsumableTargetSchema)
