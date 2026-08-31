import mongoose, { Schema, Document } from "mongoose"

export interface IBranch extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  code: string
  address: string
  users: mongoose.Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const BranchSchema = new Schema<IBranch>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    address: { type: String, default: "" },
    users: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
  }
)

export const Branch = mongoose.models.Branch || mongoose.model<IBranch>("Branch", BranchSchema)
