import mongoose, { Schema } from "mongoose";

export type FeedbackType =
  | "exam_10"
  | "evaluation_40"
  | "vote_result";

export type FeedbackStatus =
  | "pending"
  | "replied";

export type FeedbackSatisfaction =
  | "pending"
  | "satisfied"
  | "not_satisfied";

export interface FeedbackDocument {
  studentId: string;
  feedbackType: FeedbackType;
  message: string;
  reply: string | null;
  replyBy: string | null;
  status: FeedbackStatus;
  isClosed: boolean;
  feedbackCount: number;
  satisfaction: FeedbackSatisfaction;
  repliedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<FeedbackDocument>(
  {
    studentId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
      index: true,
    },

    feedbackType: {
      type: String,
      enum: ["exam_10", "evaluation_40", "vote_result"],
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },

    reply: {
      type: String,
      default: null,
      maxlength: 10000,
    },

    replyBy: {
      type: String,
      default: null,
      maxlength: 50,
    },

    status: {
      type: String,
      enum: ["pending", "replied"],
      default: "pending",
      index: true,
    },

    isClosed: {
      type: Boolean,
      default: false,
      index: true,
    },

    feedbackCount: {
      type: Number,
      default: 1,
      min: 1,
    },

    satisfaction: {
      type: String,
      enum: ["pending", "satisfied", "not_satisfied"],
      default: "pending",
      index: true,
    },

    repliedAt: {
      type: Date,
      default: null,
    },
  },
  {
    collection: "feedback",
    timestamps: true,
    versionKey: false,
  }
);

// Efficiently retrieve a student's feedback history.
feedbackSchema.index({
  studentId: 1,
  createdAt: -1,
});

// Efficiently enforce the maximum of three open
// feedback requests per student and category.
feedbackSchema.index({
  studentId: 1,
  feedbackType: 1,
  isClosed: 1,
});

export const Feedback =
  mongoose.models.Feedback ||
  mongoose.model<FeedbackDocument>(
    "Feedback",
    feedbackSchema
  );