import mongoose, { Schema } from "mongoose";

export interface Phase2EvaluationDocument {
  studentId: string;

  certScore: number;
  proposalScore: number;
  interviewScore: number;
  totalScore: number;

  selectionStatus: string;

  evaluatedBy?: string;
  evaluatedAt?: Date;
  remarks?: string;

  createdAt: Date;
  updatedAt: Date;
}

const phase2EvaluationSchema =
  new Schema<Phase2EvaluationDocument>(
    {
      studentId: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        index: true,
      },

      certScore: {
        type: Number,
        required: true,
        min: 0,
        max: 5,
      },

      proposalScore: {
        type: Number,
        required: true,
        min: 0,
        max: 15,
      },

      interviewScore: {
        type: Number,
        required: true,
        min: 0,
        max: 10,
      },

      totalScore: {
        type: Number,
        required: true,
        min: 0,
        max: 30,
      },

      selectionStatus: {
        type: String,
        required: true,
        trim: true,
        default: "pending",
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
      collection: "phase2_evaluations",
      timestamps: true,
      versionKey: false,
    }
  );

// Calculate the Phase 2 total automatically.
phase2EvaluationSchema.pre("validate", function () {
  this.totalScore =
    this.certScore +
    this.proposalScore +
    this.interviewScore;
});

export const Phase2Evaluation =
  mongoose.models.Phase2Evaluation ||
  mongoose.model<Phase2EvaluationDocument>(
    "Phase2Evaluation",
    phase2EvaluationSchema
  );