import mongoose, { Schema, Document } from "mongoose"

export interface ITravelTime extends Document {
  _id: mongoose.Types.ObjectId
  fromLocation: string
  toLocation: string
  vehicleType: string
  hours: number
  minutes: number
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const TravelTimeSchema = new Schema<ITravelTime>(
  {
    fromLocation: { type: String, required: true },
    toLocation: { type: String, required: true },
    vehicleType: { type: String, required: true, default: "Bus" },
    hours: { type: Number, required: true, min: 0 },
    minutes: { type: Number, required: true, min: 0, max: 59 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  {
    timestamps: true,
    collection: "traveltimes",
  }
)

export const TravelTime =
  mongoose.models.TravelTime || mongoose.model<ITravelTime>("TravelTime", TravelTimeSchema)
