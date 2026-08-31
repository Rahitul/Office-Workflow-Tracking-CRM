import mongoose, { Schema, Document } from "mongoose"

export interface IDailyCollectionEntry extends Document {
  _id: mongoose.Types.ObjectId
  collectionTargetId: mongoose.Types.ObjectId
  targetType: "department" | "branch" | "salesman" | "company"
  targetId: string
  targetName: string
  month: number
  year: number
  entryDate: string
  amountBDT: number
  notes: string
  enteredByUserId: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const DailyCollectionEntrySchema = new Schema<IDailyCollectionEntry>(
  {
    collectionTargetId: { type: Schema.Types.ObjectId, ref: "CollectionTarget", required: true, index: true },
    targetType: { 
      type: String, 
      enum: ["department", "branch", "salesman", "company"], 
      required: true 
    },
    targetId: { type: String, required: true },
    targetName: { type: String, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    entryDate: { type: String, required: true },
    amountBDT: { type: Number, required: true, min: 0 },
    notes: { type: String, default: "" },
    enteredByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  {
    timestamps: true,
  }
)

DailyCollectionEntrySchema.index({ targetId: 1, entryDate: 1 }, { unique: true })

if (mongoose.models.DailyCollectionEntry) {
  delete mongoose.models.DailyCollectionEntry
}

export const DailyCollectionEntry = mongoose.model<IDailyCollectionEntry>("DailyCollectionEntry", DailyCollectionEntrySchema)