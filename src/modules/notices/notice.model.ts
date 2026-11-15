import mongoose, { Schema } from "mongoose";

export type NoticeTargetRole =
  | "all"
  | "head"
  | "candidate"
  | "registrar"
  | "student";

export interface NoticeDocument {
  title: string;
  message: string;
  targetRole: NoticeTargetRole;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const noticeSchema = new Schema<NoticeDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },

    targetRole: {
      type: String,
      enum: ["all", "head", "candidate", "registrar", "student"],
      required: true,
      default: "all",
      index: true,
    },

    createdBy: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
      index: true,
    },
  },
  {
    collection: "notices",
    timestamps: true,
    versionKey: false,
  }
);

// Efficient retrieval of notices ordered by publication date.
noticeSchema.index({ targetRole: 1, createdAt: -1 });
noticeSchema.index({ createdBy: 1, createdAt: -1 });

export const Notice =
  mongoose.models.Notice ||
  mongoose.model<NoticeDocument>("Notice", noticeSchema);