import mongoose, { Schema, Document } from "mongoose"

export interface IFilterDate extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  from: string
  to: string
  department: string
}

const FilterDateSchema = new Schema<IFilterDate>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    from: { type: String, default: "" },
    to: { type: String, default: "" },
    department: { type: String, default: "" },
  },
  { timestamps: true }
)

FilterDateSchema.index({ userId: 1 }, { unique: true })

delete mongoose.models.FilterDate

export const FilterDate =
  mongoose.models.FilterDate || mongoose.model<IFilterDate>("FilterDate", FilterDateSchema)
