import mongoose, { Schema, Document } from "mongoose"

export interface IChecklist extends Document {
  _id: mongoose.Types.ObjectId
  taskId: mongoose.Types.ObjectId
  date: Date
  customerName: string
  serialNumber: string
  mfpStatus: "completed" | "estimate needed" | "not completed"
  partsNeededToCheck?: string
  seniorEngineerRequired?: string
  partsProblem?: string
  remarks: string
  image: string
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const ChecklistSchema = new Schema<IChecklist>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "ServiceTask", required: true, index: true },
    date: { type: Date, required: true },
    customerName: { type: String, required: true },
    serialNumber: { type: String, required: true },
    mfpStatus: {
      type: String,
      enum: ["completed", "estimate needed", "not completed"],
      required: true,
    },
    partsNeededToCheck: { type: String },
    seniorEngineerRequired: { type: String },
    partsProblem: { type: String },
    remarks: { type: String, default: "" },
    image: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
)

export const Checklist =
  mongoose.models.Checklist || mongoose.model<IChecklist>("Checklist", ChecklistSchema)
