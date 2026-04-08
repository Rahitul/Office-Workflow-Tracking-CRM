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