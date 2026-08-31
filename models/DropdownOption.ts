import mongoose, { Schema, Document } from "mongoose"

export type DropdownKind = "product_category" | "product_type" | "model_name" | "department" | "option" | "sla" | "customer_category" | "call_type" | "company_category" | "quotation_type" | "designation" | "problem"

export interface IDropdownOption extends Document {
  _id: mongoose.Types.ObjectId
  kind: DropdownKind
  label: string
  parent: string
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const DropdownOptionSchema = new Schema<IDropdownOption>(
  {
    kind: {
      type: String,
      enum: ["product_category", "product_type", "model_name", "department", "option", "sla", "customer_category", "call_type", "company_category", "quotation_type", "designation", "problem"],
      required: true,
    },
    label: { type: String, required: true },
    parent: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  {
    timestamps: true,
    collection: "dropdownoptions",
  }
)

DropdownOptionSchema.index({ kind: 1, label: 1, parent: 1 }, { unique: true })

delete mongoose.models.DropdownOption

export const DropdownOption =
  mongoose.models.DropdownOption || mongoose.model<IDropdownOption>("DropdownOption", DropdownOptionSchema)
