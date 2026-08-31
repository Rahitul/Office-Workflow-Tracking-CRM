import mongoose, { Schema, Document } from "mongoose"

export interface IMachine extends Document {
  _id: mongoose.Types.ObjectId
  machineId: string
  customerName: string
  customerGroup: string
  location: string
  contactPerson: string
  contactNumber: string
  email: string
  address: string
  department: string
  brandName: string
  modelName: string
  serialNumber: string
  productCategory: string
  productType: string
  option: string
  sla: string
  billNumber: string
  billDate: Date
  warrantyExpired: Date
  warrantyNotified: boolean
  notes: string
  customerShareToken: string
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const MachineSchema = new Schema<IMachine>(
  {
    machineId: { type: String, default: "" },
    customerName: { type: String, required: true },
    customerGroup: { type: String, default: "" },
    location: { type: String, default: "" },
    contactPerson: { type: String, default: "" },
    contactNumber: { type: String, default: "" },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    department: { type: String, default: "" },
    brandName: { type: String, default: "" },
    modelName: { type: String, default: "" },
    serialNumber: { type: String, default: "" },
    productCategory: { type: String, default: "" },
    productType: { type: String, default: "" },
    option: { type: String, default: "" },
    sla: { type: String, default: "" },
    billNumber: { type: String, default: "" },
    billDate: { type: Date },
    warrantyExpired: { type: Date },
    warrantyNotified: { type: Boolean, default: false },
    notes: { type: String, default: "" },
    customerShareToken: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  {
    timestamps: true,
  }
)

MachineSchema.index({ customerName: 1 })
MachineSchema.index({ department: 1 })
MachineSchema.index({ modelName: 1 })
MachineSchema.index({ option: 1 })
MachineSchema.index({ sla: 1 })

export const Machine =
  mongoose.models.Machine || mongoose.model<IMachine>("Machine", MachineSchema)
