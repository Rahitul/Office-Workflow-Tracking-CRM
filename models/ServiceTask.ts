import mongoose, { Schema, Document } from "mongoose"

export type ServiceTaskStatus =
  | "Queued"
  | "Assigned"
  | "Acknowledge"
  | "Travel Started"
  | "Checked In"
  | "Checklist Submitted"
  | "Completed"
  | "Cancelled"

export interface IServiceTask extends Document {
  _id: mongoose.Types.ObjectId
  taskId: string
  callRecordDate: Date
  customerName: string
  customerGroup: string
  deviceModel: string
  productCategory: string
  productType: string
  customerCategory: string
  department: string
  problem: string
  location: string
  callType: string
  contactPerson: string
  contactNumber: string
  assignedEngineer?: mongoose.Types.ObjectId
  receivedBy?: mongoose.Types.ObjectId
  status: ServiceTaskStatus
  priority: number
  fromLocation: string
  toLocation: string
  vehicleType: string
  gapAssignedToAcknowledge: string
  gapAcknowledgeToTravelStarted: string
  gapTravelStartedToCheckedIn: string
  gapCheckedInToChecklistSubmitted: string
  gapChecklistSubmittedToCompleted: string
  acknowledgedAt?: Date
  acknowledgedLat?: number
  acknowledgedLng?: number
  travelStartedAt?: Date
  travelStartedLat?: number
  travelStartedLng?: number
  checkedInAt?: Date
  checkedInLat?: number
  checkedInLng?: number
  checklistSubmittedAt?: Date
  checklistSubmittedLat?: number
  checklistSubmittedLng?: number
  completedAt?: Date
  completedLat?: number
  completedLng?: number
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const ServiceTaskSchema = new Schema<IServiceTask>(
  {
    taskId: { type: String, required: true, unique: true, index: true },
    callRecordDate: { type: Date, required: true },
    customerName: { type: String, required: true },
    customerGroup: { type: String, default: "Not a group of company" },
    deviceModel: { type: String, required: true },
    productCategory: { type: String, default: "" },
    productType: { type: String, default: "" },
    customerCategory: { type: String, required: true },
    department: { type: String, default: "" },
    problem: { type: String, required: true },
    location: { type: String, required: true },
    callType: { type: String, required: true },
    contactPerson: { type: String, required: true },
    contactNumber: { type: String, required: true },
    assignedEngineer: { type: Schema.Types.ObjectId, ref: "User" },
    receivedBy: { type: Schema.Types.ObjectId, ref: "User" },
    priority: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Queued", "Assigned", "Acknowledge", "Travel Started", "Checked In", "Checklist Submitted", "Completed", "Cancelled"],
      default: "Queued",
    },
    fromLocation: { type: String, default: "" },
    toLocation: { type: String, default: "" },
    vehicleType: { type: String, default: "Bus" },
    gapAssignedToAcknowledge: { type: String, default: "" },
    gapAcknowledgeToTravelStarted: { type: String, default: "" },
    gapTravelStartedToCheckedIn: { type: String, default: "" },
    gapCheckedInToChecklistSubmitted: { type: String, default: "" },
    gapChecklistSubmittedToCompleted: { type: String, default: "" },
    acknowledgedAt: { type: Date },
    acknowledgedLat: { type: Number },
    acknowledgedLng: { type: Number },
    travelStartedAt: { type: Date },
    travelStartedLat: { type: Number },
    travelStartedLng: { type: Number },
    checkedInAt: { type: Date },
    checkedInLat: { type: Number },
    checkedInLng: { type: Number },
    checklistSubmittedAt: { type: Date },
    checklistSubmittedLat: { type: Number },
    checklistSubmittedLng: { type: Number },
    completedAt: { type: Date },
    completedLat: { type: Number },
    completedLng: { type: Number },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
)

export const ServiceTask =
  mongoose.models.ServiceTask || mongoose.model<IServiceTask>("ServiceTask", ServiceTaskSchema)
