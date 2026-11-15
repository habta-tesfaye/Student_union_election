import mongoose, { Schema } from "mongoose";

import type {
  SSDStatus,
  ApplicationSelectionStatus,
} from "./application.types.js";

export interface ApplicationDocument {
  studentId: string;
  motivationText: string;

  // Phase 1 examination score (maximum 10).
  examScore10?: number;
  examStatus: "pending" | "passed" | "failed";
  examEvaluatedBy?: string;
  examEvaluatedAt?: Date;
  examRemarks?: string;

  ssdStatus: SSDStatus;
  selectionStatus: ApplicationSelectionStatus;

  appliedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<ApplicationDocument>(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    motivationText: {
      type: String,
      required: true,
      trim: true,
    },

    examScore10: {
      type: Number,
      min: 0,
      max: 10,
    },

    examStatus: {
      type: String,
      enum: ["pending", "passed", "failed"],
      default: "pending",
      required: true,
    },

    examEvaluatedBy: {
      type: String,
      trim: true,
    },

    examEvaluatedAt: {
      type: Date,
    },

    examRemarks: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    ssdStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      required: true,
    },

    selectionStatus: {
      type: String,
      enum: ["pending", "selected_16", "disqualified"],
      default: "pending",
      required: true,
    },

    appliedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "phase1_exam",
  }
);

export const Application =
  mongoose.models.Application ||
  mongoose.model<ApplicationDocument>(
    "Application",
    applicationSchema
  );