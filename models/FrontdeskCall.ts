import mongoose, { Document, Schema } from "mongoose"

export interface IFrontdeskCall extends Document {
  callType: "incoming" | "outgoing" | "visit"
  date: string
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date

  // Incoming call fields
  customerName?: string
  contactNumber?: string
  inquiryType?: "Product" | "Consumable" | "Service"
  productType?: string
  consumableType?: string
  serviceType?: string
  issue?: string
  callTransferTo?: mongoose.Types.ObjectId
  priority?: "Normal" | "Urgent"

  // Outgoing call fields
  companyName?: string
  contactPersonName?: string
  contactPersonPhone?: string
  product?: string
  causeForCall?: string
  outcomeFromCall?: string
  isLeadSearch?: boolean
  leadFound?: string
  outgoingCallType?: "Sales" | "Support"
  feedbackType?: "Good" | "Average" | "Poor"

  // Office visit fields
  visitorName?: string
  fromLocation?: string
  toLocation?: string
  purpose?: string
  phoneNumber?: string
  inTime?: Date
  outTime?: Date
}

const FrontdeskCallSchema = new Schema<IFrontdeskCall>(
  {
    callType: {
      type: String,
      enum: ["incoming", "outgoing", "visit"],
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Incoming call fields
    customerName: {
      type: String,
    },
    contactNumber: {
      type: String,
    },
    inquiryType: {
      type: String,
      enum: ["Product", "Consumable", "Service"],
    },
    productType: {
      type: String,
    },
    consumableType: {
      type: String,
    },
    serviceType: {
      type: String,
    },
    issue: {
      type: String,
    },
    callTransferTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    priority: {
      type: String,
      enum: ["Normal", "Urgent"],
      default: "Normal",
    },

    // Outgoing call fields
    companyName: {
      type: String,
    },
    contactPersonName: {
      type: String,
    },
    contactPersonPhone: {
      type: String,
    },
    product: {
      type: String,
    },
    causeForCall: {
      type: String,
    },
    outcomeFromCall: {
      type: String,
    },
    isLeadSearch: {
      type: Boolean,
      default: false,
    },
    leadFound: {
      type: String,
    },
    outgoingCallType: {
      type: String,
      enum: ["Sales", "Support"],
    },
    feedbackType: {
      type: String,
      enum: ["Good", "Average", "Poor"],
    },

    // Office visit fields
    visitorName: {
      type: String,
    },
    fromLocation: {
      type: String,
    },
    toLocation: {
      type: String,
    },
    purpose: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    inTime: {
      type: Date,
    },
    outTime: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

export const FrontdeskCall = mongoose.models.FrontdeskCall || mongoose.model<IFrontdeskCall>("FrontdeskCall", FrontdeskCallSchema)