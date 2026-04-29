import mongoose, { Schema, Document } from "mongoose"

export interface ICompany extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  description: string
  isProtected: boolean
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const CompanySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: "" },
    isProtected: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  {
    timestamps: true,
  }
)

export const Company = mongoose.models.Company || mongoose.model<ICompany>("Company", CompanySchema)