import mongoose, { Schema, Document } from "mongoose"

export interface ISalesTarget extends Document {
  _id: mongoose.Types.ObjectId
  targetType: "department" | "branch" | "salesman"
  targetId: string
  targetName: string
  month: number
  year: number
  amountBDT: number
  setByUserId: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const SalesTargetSchema = new Schema<ISalesTarget>(
  {
    targetType: { 
      type: String, 
      enum: ["department", "branch", "salesman"], 
      required: true 
    },
    targetId: { type: String, required: true },
    targetName: { type: String, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    amountBDT: { type: Number, required: true, min: 0 },
    setByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  {
    timestamps: true,
  }
)

SalesTargetSchema.index({ targetType: 1, targetId: 1, month: 1, year: 1 }, { unique: true })

if (mongoose.models.SalesTarget) {
  delete mongoose.models.SalesTarget
}

export const SalesTarget = mongoose.model<ISalesTarget>("SalesTarget", SalesTargetSchema)