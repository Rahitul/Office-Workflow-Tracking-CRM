import mongoose, { Schema, Document } from "mongoose"

export interface IConsumableKpiTarget extends Document {
  _id: mongoose.Types.ObjectId
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

const ConsumableKpiTargetSchema = new Schema<IConsumableKpiTarget>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
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

ConsumableKpiTargetSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true })

if (mongoose.models.ConsumableKpiTarget) {
  delete mongoose.models.ConsumableKpiTarget
}

export const ConsumableKpiTarget = mongoose.model<IConsumableKpiTarget>("ConsumableKpiTarget", ConsumableKpiTargetSchema)
