import mongoose, { Schema } from "mongoose";

export type ChatAccountType = "student" | "staff" | "bot";

export interface ChatMessageDocument {
  senderId: string;
  senderType: ChatAccountType;

  receiverId: string;
  receiverType: ChatAccountType;

  message: string;

  isRead: boolean;
  readAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<ChatMessageDocument>(
  {
    senderId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
      index: true,
    },

    senderType: {
      type: String,
      required: true,
      enum: ["student", "staff", "bot"],
    },

    receiverId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
      index: true,
    },

    receiverType: {
      type: String,
      required: true,
      enum: ["student", "staff", "bot"],
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    collection: "chat_messages",
    timestamps: true,
    versionKey: false,
  }
);

// Efficiently retrieve conversations between two accounts.
chatMessageSchema.index({
  senderId: 1,
  receiverId: 1,
  createdAt: -1,
});

chatMessageSchema.index({
  receiverId: 1,
  senderId: 1,
  createdAt: -1,
});

// Efficiently retrieve unread messages.
chatMessageSchema.index({
  receiverId: 1,
  receiverType: 1,
  isRead: 1,
});

export const ChatMessage =
  mongoose.models.ChatMessage ||
  mongoose.model<ChatMessageDocument>(
    "ChatMessage",
    chatMessageSchema
  );