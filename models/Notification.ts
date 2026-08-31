import mongoose, { Schema, Document } from "mongoose"

export type NotificationType = "lead_transfer"

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId
  recipientUserId: mongoose.Types.ObjectId
  type: NotificationType
  title: string
  message: string
  relatedId?: mongoose.Types.ObjectId
  isRead: boolean
  createdAt: Date
  updatedAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["lead_transfer"], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedId: { type: Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
)

NotificationSchema.index({ recipientUserId: 1, isRead: 1, createdAt: -1 })

export const Notification = mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema)