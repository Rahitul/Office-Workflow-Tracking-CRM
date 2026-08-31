import mongoose, { Schema, Document } from "mongoose"

export interface IConsumableActivity extends Document {
  _id: mongoose.Types.ObjectId
  activityDate: Date
  userId: mongoose.Types.ObjectId
  calls: number
  visits: number
  quotation: number
  quotationQty: number
  orders: number
  orderQty: number
  orderValueBlackAndWhite: number
  orderValueColor: number
  orderValueDuplicatorInk: number
  orderValueDuplicatorMaster: number
  orderValueMps: number
  bill: number
  billQty: number
  billValueBlackAndWhite: number
  billValueColor: number
  billValueDuplicatorInk: number
  billValueDuplicatorMaster: number
  billValueMps: number
  submittedAt: Date
}

const ConsumableActivitySchema = new Schema<IConsumableActivity>(
  {
    activityDate: { type: Date, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    calls: { type: Number, required: true, default: 0 },
    visits: { type: Number, required: true, default: 0 },
    quotation: { type: Number, required: true, default: 0 },
    quotationQty: { type: Number, required: true, default: 0 },
    orders: { type: Number, required: true, default: 0 },
    orderQty: { type: Number, required: true, default: 0 },
    orderValueBlackAndWhite: { type: Number, required: true, default: 0 },
    orderValueColor: { type: Number, required: true, default: 0 },
    orderValueDuplicatorInk: { type: Number, required: true, default: 0 },
    orderValueDuplicatorMaster: { type: Number, required: true, default: 0 },
    orderValueMps: { type: Number, required: true, default: 0 },
    bill: { type: Number, required: true, default: 0 },
    billQty: { type: Number, required: true, default: 0 },
    billValueBlackAndWhite: { type: Number, required: true, default: 0 },
    billValueColor: { type: Number, required: true, default: 0 },
    billValueDuplicatorInk: { type: Number, required: true, default: 0 },
    billValueDuplicatorMaster: { type: Number, required: true, default: 0 },
    billValueMps: { type: Number, required: true, default: 0 },
    submittedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    strict: true,
  }
)

ConsumableActivitySchema.index({ activityDate: 1, userId: 1 })

if (mongoose.models.ConsumableActivity) {
  delete mongoose.models.ConsumableActivity
}

export const ConsumableActivity = mongoose.model<IConsumableActivity>("ConsumableActivity", ConsumableActivitySchema)
