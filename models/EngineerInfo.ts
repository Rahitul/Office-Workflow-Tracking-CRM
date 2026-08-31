import mongoose, { Schema, Document } from "mongoose"

export interface IEngineerInfo extends Document {
  _id: mongoose.Types.ObjectId
  engineerId: mongoose.Types.ObjectId
  designation: string
  department: string
  nationalId: string
  mobileNumber: string
  altMobileNumber: string
  presentAddress: string
  permanentAddress: string
  joiningDate?: Date
  bloodGroup: string
  image: string
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const EngineerInfoSchema = new Schema<IEngineerInfo>(
  {
    engineerId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    designation: { type: String, required: true },
    department: { type: String, default: "" },
    nationalId: { type: String, default: "" },
    mobileNumber: { type: String, required: true },
    altMobileNumber: { type: String, default: "" },
    presentAddress: { type: String, default: "" },
    permanentAddress: { type: String, default: "" },
    joiningDate: { type: Date },
    bloodGroup: { type: String, default: "" },
    image: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
    collection: "engineerinfos",
  }
)

delete mongoose.models.EngineerInfo

export const EngineerInfo =
  mongoose.models.EngineerInfo || mongoose.model<IEngineerInfo>("EngineerInfo", EngineerInfoSchema)
