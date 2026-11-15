
import mongoose, { Schema } from "mongoose";

/**
 * Phase 1 examination record.
 *
 * Stores the examination result and evaluation
 * information for a student.
 */
export interface Phase1ExamDocument {
  studentId: string;
  examScore: number;
  maxScore: number;
  status: "pending" | "passed" | "failed";
  evaluatedBy?: string;
  evaluatedAt?: Date;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const phase1ExamSchema = new Schema<Phase1ExamDocument>(
  {
    studentId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },

    examScore: {
      type: Number,
      required: true,
      min: 0,
    },

    maxScore: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: ["pending", "passed", "failed"],
      default: "pending",
      required: true,
    },

    evaluatedBy: {
      type: String,
      trim: true,
    },

    evaluatedAt: {
      type: Date,
    },

    remarks: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    collection: "phase1_exams",
    timestamps: true,
    versionKey: false,
  }
);

// Prevent examination scores from exceeding the maximum score.
phase1ExamSchema.pre("validate", function () {
  if (this.examScore > this.maxScore) {
    this.invalidate(
      "examScore",
      "Exam score cannot exceed the maximum score."
    );
  }
});

export const Phase1Exam =
  mongoose.models.Phase1Exam ||
  mongoose.model<Phase1ExamDocument>(
    "Phase1Exam",
    phase1ExamSchema
  );
