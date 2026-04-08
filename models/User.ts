import mongoose, { Schema, Document } from "mongoose"

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  email: string
  passwordHash: string
  role: "admin" | "user"
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
  },
  {
    timestamps: true,
  }
)

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema)