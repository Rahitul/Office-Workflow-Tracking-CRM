import mongoose, { Schema, Document } from "mongoose"

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  email: string
  passwordHash: string
  role: "admin" | "user" | "accounts"
  resetPasswordToken?: string
  resetPasswordExpires?: Date
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "user", "accounts"], default: "user" },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  {
    timestamps: true,
  }
)

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema)