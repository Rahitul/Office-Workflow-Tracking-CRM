import mongoose, { Schema, Document } from "mongoose"

export interface ITraining extends Document {
  _id: mongoose.Types.ObjectId
  productId: mongoose.Types.ObjectId
  title: string
  description: string
  content: string
  duration: string
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const TrainingSchema = new Schema<ITraining>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    content: { type: String, default: "" },
    duration: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  {
    timestamps: true,
  }
)

export const Training = mongoose.models.Training || mongoose.model<ITraining>("Training", TrainingSchema)