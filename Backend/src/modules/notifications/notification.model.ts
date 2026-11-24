import mongoose, { Schema } from "mongoose";

export type NotificationRecipientType = "student" | "staff";

export type NotificationType =
  | "nomination"
  | "campaign"
  | "election"
  | "voting"
  | "result"
  | "notice"
  | "general"
  | "winner_submission";

export interface NotificationDocument {
  recipientId: string;
  recipientType: NotificationRecipientType;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  relatedId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    recipientId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    recipientType: {
      type: String,
      enum: ["student", "staff"],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    type: {
      type: String,
      enum: [
        "nomination",
        "campaign",
        "election",
        "voting",
        "result",
        "notice",
        "general",
        "winner_submission",
      ],
      default: "general",
      required: true,
    },

    isRead: {
      type: Boolean,
      default: false,
      required: true,
    },

    relatedId: {
      type: String,
      trim: true,
    },
  },
  {
    collection: "notifications",
    timestamps: true,
    versionKey: false,
  }
);

notificationSchema.index({
  recipientId: 1,
  recipientType: 1,
  isRead: 1,
  createdAt: -1,
});

export const Notification =
  mongoose.models.Notification ||
  mongoose.model<NotificationDocument>(
    "Notification",
    notificationSchema
  );