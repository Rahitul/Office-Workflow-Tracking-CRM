import mongoose, { Schema, Document } from "mongoose"

export interface IAppointment extends Document {
  _id: mongoose.Types.ObjectId
  customerName: string
  companyName: string
  designation: string
  location: string
  date: Date
  time: string
  endTime: string
  visitPurpose: string
  isCompleted: boolean
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
  isRequested: boolean
  requestedBy: mongoose.Types.ObjectId
  status: "pending" | "approved" | "rejected"
  formData: mongoose.Types.ObjectId
  createdByRole: "admin" | "user"
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    customerName: { type: String, required: true },
    companyName: { type: String, required: true },
    designation: { type: String, required: true },
    location: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    endTime: { type: String, default: "" },
    visitPurpose: { type: String, required: true },
    isCompleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isRequested: { type: Boolean, default: false },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    formData: { type: Schema.Types.ObjectId, ref: "AppointmentForm", default: null },
    createdByRole: { type: String, enum: ["admin", "user"], default: "user" },
  },
  {
    timestamps: true,
  }
)

AppointmentSchema.index({ date: 1 })
AppointmentSchema.index({ isCompleted: 1 })

if (mongoose.models.Appointment) {
  delete mongoose.models.Appointment
}

export const Appointment = mongoose.model<IAppointment>("Appointment", AppointmentSchema)
