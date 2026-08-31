import mongoose, { Schema, Document } from "mongoose"

export type UserRole = "admin" | "user" | "accounts" | "service" | "esbd" | "marketing" | "consumable" | "logistics" | "esbd_juniors" | "accounts_juniors" | "consumable_juniors" | "service_juniors" | "marketing_juniors" | "user_juniors" | "logistics_juniors" | "frontdesk" | "branch_manager" | "branch_manager_juniors" | "branch_service" | "branch_service_juniors" | "branch_sales" | "branch_sales_juniors" | "branch_consumable" | "branch_consumable_juniors" | "branch_accounts" | "branch_accounts_juniors"

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  email: string
  passwordHash: string
  role: UserRole
  branch?: mongoose.Types.ObjectId
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
    role: { type: String, enum: ["admin", "user", "accounts", "service", "esbd", "marketing", "consumable", "logistics", "esbd_juniors", "accounts_juniors", "consumable_juniors", "service_juniors", "marketing_juniors", "user_juniors", "logistics_juniors", "frontdesk", "branch_manager", "branch_manager_juniors", "branch_service", "branch_service_juniors", "branch_sales", "branch_sales_juniors", "branch_consumable", "branch_consumable_juniors", "branch_accounts", "branch_accounts_juniors"], default: "user" },
    branch: { type: Schema.Types.ObjectId, ref: "Branch" },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  {
    timestamps: true,
  }
)

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema)