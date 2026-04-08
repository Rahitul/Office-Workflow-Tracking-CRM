import mongoose, { Schema, Document } from "mongoose"

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "dropdown"
  | "checkbox"
  | "radio"
  | "rating"
  | "email"

export interface IFormField {
  fieldId: string
  type: FieldType
  label: string
  placeholder: string
  required: boolean
  order: number
  options?: string[]
}

export interface IForm extends Document {
  _id: mongoose.Types.ObjectId
  title: string
  description: string
  createdBy: mongoose.Types.ObjectId
  status: "draft" | "published"
  assignedTo: mongoose.Types.ObjectId[]
  allowResubmission: boolean
  deadline: Date | null
  fields: IFormField[]
  createdAt: Date
  updatedAt: Date
}

const FormFieldSchema = new Schema<IFormField>(
  {
    fieldId: { type: String, required: true },
    type: {
      type: String,
      enum: ["text", "textarea", "number", "date", "dropdown", "checkbox", "radio", "rating", "email"],
      required: true,
    },
    label: { type: String, required: true },
    placeholder: { type: String, default: "" },
    required: { type: Boolean, default: false },
    order: { type: Number, required: true },
    options: { type: [String], default: [] },
  },
  { _id: false }
)

const FormSchema = new Schema<IForm>(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: ["draft", "published"], default: "draft", index: true },
    assignedTo: { type: [Schema.Types.ObjectId], ref: "User", default: [], index: true },
    allowResubmission: { type: Boolean, default: false },
    deadline: { type: Date, default: null },
    fields: { type: [FormFieldSchema], default: [] },
  },
  {
    timestamps: true,
  }
)

export const Form = mongoose.models.Form || mongoose.model<IForm>("Form", FormSchema)