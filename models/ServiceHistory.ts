import mongoose, { Schema, Document } from "mongoose"

export interface IServiceHistory extends Document {
  _id: mongoose.Types.ObjectId
  machineId: mongoose.Types.ObjectId
  callDate: Date
  problem: string
  solution: string
  ewTaka: string
  bwMeterReading: number
  colorMeterReading: number
  printerHeadLife: number
  copyBW: number
  printBW: number
  scan: number
  total: number
  attendTime: Date
  endTime: Date
  userComments: string
  engineerId: mongoose.Types.ObjectId
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const ServiceHistorySchema = new Schema<IServiceHistory>(
  {
    machineId: { type: Schema.Types.ObjectId, ref: "Machine", required: true, index: true },
    callDate: { type: Date, required: true },
    problem: { type: String, default: "" },
    solution: { type: String, default: "" },
    ewTaka: { type: String, default: "Not Applicable" },
    bwMeterReading: { type: Number, default: 0 },
    colorMeterReading: { type: Number, default: 0 },
    printerHeadLife: { type: Number, default: 0 },
    copyBW: { type: Number, default: 0 },
    printBW: { type: Number, default: 0 },
    scan: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    attendTime: { type: Date },
    endTime: { type: Date },
    userComments: { type: String, default: "" },
    engineerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  {
    timestamps: true,
  }
)

export const ServiceHistory =
  mongoose.models.ServiceHistory || mongoose.model<IServiceHistory>("ServiceHistory", ServiceHistorySchema)
