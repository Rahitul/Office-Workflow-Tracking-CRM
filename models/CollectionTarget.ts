import mongoose, { Schema, Document } from "mongoose"

export interface ICollectionTarget extends Document {
  _id: mongoose.Types.ObjectId
  targetType: "department" | "branch" | "salesman" | "company"
  targetId: string
  targetName: string
  month: number
  year: number
  amountBDT: number
  setByUserId: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const CollectionTargetSchema = new Schema<ICollectionTarget>(
  {
    targetType: { 
      type: String, 
      enum: ["department", "branch", "salesman", "company"], 
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

CollectionTargetSchema.index({ targetType: 1, targetId: 1, month: 1, year: 1 }, { unique: true })

if (mongoose.models.CollectionTarget) {
  delete mongoose.models.CollectionTarget
}

export const CollectionTarget = mongoose.model<ICollectionTarget>("CollectionTarget", CollectionTargetSchema)