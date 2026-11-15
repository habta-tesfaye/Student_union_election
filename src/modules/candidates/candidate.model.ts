
import mongoose, { Schema } from "mongoose";

/**
 * Candidate document structure.
 * Based on the original PHP candidates table.
 */
export interface CandidateDocument {
  studentId: string;
  photo: string;
  totalVotes: number;
  manualWinner: boolean;
  createdAt: Date;
}

const candidateSchema = new Schema<CandidateDocument>(
  {
    studentId: {
      type: String,
      required: [true, "Student ID is required."],
      unique: true,
      trim: true,
    },

    photo: {
      type: String,
      required: [true, "Candidate photo is required."],
      trim: true,
    },

    totalVotes: {
      type: Number,
      default: 0,
      min: 0,
    },

    manualWinner: {
      type: Boolean,
      default: false,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "candidates",
    versionKey: false,
  }
);

// Create the model only once.
export const Candidate =
  mongoose.models.Candidate ||
  mongoose.model<CandidateDocument>("Candidate", candidateSchema);
