import mongoose, { Schema, Document } from "mongoose"

export interface IBranchConsumablePhoneCall extends Document {
  userId: mongoose.Types.ObjectId
  type: "cold" | "follow-up"
  date: string
  companyName: string
  contactPersonName: string
  contactPersonPhone: string
  product: string
  causeForCall: string
  outcomeFromCall: string
  isLeadSearch: boolean
  leadFound: string
  outgoingCallType: "Sales" | "Support"
  feedbackType: "" | "Good" | "Average" | "Poor"
  createdAt: Date
  updatedAt: Date
}

const BranchConsumablePhoneCallSchema = new Schema<IBranchConsumablePhoneCall>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["cold", "follow-up"], required: true, index: true },
    date: { type: String, required: true },
    companyName: { type: String, required: true },
    contactPersonName: { type: String, required: true },
    contactPersonPhone: { type: String, required: true },
    product: { type: String, default: "" },
    causeForCall: { type: String, default: "" },
    outcomeFromCall: { type: String, default: "" },
    isLeadSearch: { type: Boolean, default: false },
    leadFound: { type: String, default: "" },
    outgoingCallType: { type: String, enum: ["Sales", "Support"], required: true },
    feedbackType: { type: String, enum: ["", "Good", "Average", "Poor"], default: "" },
  },
  { timestamps: true }
)

BranchConsumablePhoneCallSchema.index({ userId: 1, date: -1, type: 1 })

if (mongoose.models.BranchConsumablePhoneCall) {
  delete mongoose.models.BranchConsumablePhoneCall
}

export const BranchConsumablePhoneCall = mongoose.model<IBranchConsumablePhoneCall>("BranchConsumablePhoneCall", BranchConsumablePhoneCallSchema)
