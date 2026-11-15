
import mongoose, { Schema } from "mongoose";

/**
 * Vote document structure.
 * Each student can vote only once in the entire election system.
 */
export interface VoteDocument {
  student_id: string;
  candidate_id: string;
  department: string;
  year_section: string;
  voted_at: Date;
}

const voteSchema = new Schema<VoteDocument>(
  {
    student_id: {
      type: String,
      required: [true, "Student ID is required."],
      trim: true,
    },

    candidate_id: {
      type: String,
      required: [true, "Candidate ID is required."],
      trim: true,
    },

    department: {
      type: String,
      required: [true, "Department is required."],
      trim: true,
    },

    year_section: {
      type: String,
      required: [true, "Year section is required."],
      trim: true,
    },

    voted_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "votes",
    versionKey: false,
  }
);

// One student can vote only once in the entire system.
voteSchema.index({ student_id: 1 }, { unique: true });

export const Vote =
  mongoose.models.Vote ||
  mongoose.model<VoteDocument>("Vote", voteSchema);
