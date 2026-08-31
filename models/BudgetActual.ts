import mongoose, { Schema, Document } from "mongoose"

export interface IBudgetActual extends Document {
  _id: mongoose.Types.ObjectId
  field: string
  month: number
  year: number
  budgetAmount: number
  setByUserId: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const BudgetActualSchema = new Schema<IBudgetActual>(
  {
    field: { 
      type: String, 
      required: true 
    },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    budgetAmount: { type: Number, required: true, min: 0 },
    setByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  {
    timestamps: true,
  }
)

BudgetActualSchema.index({ field: 1, month: 1, year: 1 }, { unique: true })

if (mongoose.models.BudgetActual) {
  delete mongoose.models.BudgetActual
}

export const BudgetActual = mongoose.model<IBudgetActual>("BudgetActual", BudgetActualSchema)