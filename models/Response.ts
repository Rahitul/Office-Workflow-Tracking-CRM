import mongoose, { Schema, Document } from "mongoose"

export interface IAnswer {
  fieldId: string
  label: string
  value: string | number | string[]
}

export interface IResponse extends Document {
  _id: mongoose.Types.ObjectId
  formId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  submittedAt: Date
  completionTimeSeconds: number
  answers: IAnswer[]
}

const AnswerSchema = new Schema<IAnswer>(
  {
    fieldId: { type: String, required: true },
    label: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
)

const ResponseSchema = new Schema<IResponse>(
  {
    formId: { type: Schema.Types.ObjectId, ref: "Form", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    submittedAt: { type: Date, default: Date.now, index: true },
    completionTimeSeconds: { type: Number, default: 0 },
    answers: { type: [AnswerSchema], default: [] },
  },
  {
    timestamps: true,
  }
)

ResponseSchema.index({ formId: 1, userId: 1 })

export const Response = mongoose.models.Response || mongoose.model<IResponse>("Response", ResponseSchema)