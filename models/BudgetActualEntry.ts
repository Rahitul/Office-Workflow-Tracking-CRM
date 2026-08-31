import mongoose, { Schema, Document } from "mongoose"

export interface IBudgetActualEntry extends Document {
  _id: mongoose.Types.ObjectId
  budgetActualId: mongoose.Types.ObjectId
  field: string
  month: number
  year: number
  entryDate: string
  actualAmount: number
  notes: string
  setByUserId: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const BudgetActualEntrySchema = new Schema<IBudgetActualEntry>(
  {
    budgetActualId: { type: Schema.Types.ObjectId, ref: "BudgetActual", required: true, index: true },
    field: { type: String, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    entryDate: { type: String, required: true },
    actualAmount: { type: Number, required: true, min: 0 },
    notes: { type: String, default: "" },
    setByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  {
    timestamps: true,
  }
)

if (mongoose.models.BudgetActualEntry) {
  delete mongoose.models.BudgetActualEntry
}

export const BudgetActualEntry = mongoose.model<IBudgetActualEntry>("BudgetActualEntry", BudgetActualEntrySchema)