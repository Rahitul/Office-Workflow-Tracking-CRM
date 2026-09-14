import mongoose, { Schema, Document } from "mongoose"

export interface IBreakRecord extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  completedTaskId: mongoose.Types.ObjectId
  breakNumber: number
  startedAt: Date
  endedAt?: Date
  durationSeconds?: number
  date: string
  createdAt: Date
  updatedAt: Date
}

const BreakRecordSchema = new Schema<IBreakRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    completedTaskId: { type: Schema.Types.ObjectId, ref: "ServiceTask", required: true },
    breakNumber: { type: Number, required: true },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date },
    durationSeconds: { type: Number },
    date: { type: String, required: true },
  },
  {
    timestamps: true,
  }
)

BreakRecordSchema.index({ userId: 1, completedTaskId: 1, breakNumber: 1 }, { unique: true })
BreakRecordSchema.index({ userId: 1, date: 1 })
BreakRecordSchema.index({ userId: 1, endedAt: 1 })

delete mongoose.models.BreakRecord

export const BreakRecord =
  mongoose.models.BreakRecord || mongoose.model<IBreakRecord>("BreakRecord", BreakRecordSchema)
