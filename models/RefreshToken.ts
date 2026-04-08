import mongoose, { Schema, Document } from "mongoose"

export interface IRefreshToken extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  token: string
  expiresAt: Date
  createdAt: Date
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  {
    timestamps: true,
  }
)

RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const RefreshToken =
  mongoose.models.RefreshToken || mongoose.model<IRefreshToken>("RefreshToken", RefreshTokenSchema)