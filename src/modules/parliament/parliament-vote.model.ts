import mongoose, { Schema } from "mongoose";

/**
 * Parliament vote document.
 *
 * Matches the original PHP parliament_votes table.
 */
export interface ParliamentVoteDocument {
  voter_id: string;
  candidate_id: string;
  score_given: number;
  voted_at: Date;
}

const parliamentVoteSchema = new Schema<ParliamentVoteDocument>(
  {
    voter_id: {
      type: String,
      required: true,
      trim: true,
    },

    candidate_id: {
      type: String,
      required: true,
      trim: true,
    },

    score_given: {
      type: Number,
      required: true,
      min: 0,
      max: 60,
    },

    voted_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "parliament_votes",
    versionKey: false,
  }
);

/**
 * One voter can score each candidate only once.
 * A voter may score other candidates separately.
 */
parliamentVoteSchema.index(
  { voter_id: 1, candidate_id: 1 },
  { unique: true }
);

export const ParliamentVote =
  mongoose.models.ParliamentVote ||
  mongoose.model<ParliamentVoteDocument>(
    "ParliamentVote",
    parliamentVoteSchema
  );