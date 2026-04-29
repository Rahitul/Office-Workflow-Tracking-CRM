import mongoose, { Schema, Document } from "mongoose"

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId
  companyId: mongoose.Types.ObjectId
  name: string
  description: string
  isProtected: boolean
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const ProductSchema = new Schema<IProduct>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    isProtected: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  {
    timestamps: true,
  }
)

ProductSchema.index({ companyId: 1, name: 1 }, { unique: true })

export const Product = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema)