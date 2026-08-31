import mongoose, { Schema, Document } from "mongoose"

export interface ITrainingAssignment extends Document {
  _id: mongoose.Types.ObjectId
  trainingId: mongoose.Types.ObjectId
  assignedTo: mongoose.Types.ObjectId
  assignedBy: mongoose.Types.ObjectId
  priority: "high" | "medium" | "low"
  status: "pending" | "in_progress" | "completed"
  assignedAt: Date
  startedAt: Date | null
  completedAt: Date | null
  notes: string
  brandName: string
  productName: string
  month: string
}

const TrainingAssignmentSchema = new Schema<ITrainingAssignment>(
  {
    trainingId: { type: Schema.Types.ObjectId, ref: "Training", required: true, index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    priority: { type: String, enum: ["high", "medium", "low"], default: "medium", index: true },
    status: { type: String, enum: ["pending", "in_progress", "completed"], default: "pending", index: true },
    assignedAt: { type: Date, default: Date.now },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    notes: { type: String, default: "" },
    brandName: { type: String, default: "" },
    productName: { type: String, default: "" },
    month: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
)

TrainingAssignmentSchema.index({ assignedTo: 1, status: 1 })
TrainingAssignmentSchema.index({ assignedBy: 1 })

export const TrainingAssignment = mongoose.models.TrainingAssignment || mongoose.model<ITrainingAssignment>("TrainingAssignment", TrainingAssignmentSchema)