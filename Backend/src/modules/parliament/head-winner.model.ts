import mongoose, { Schema } from "mongoose";

/**
 * Matches the original PHP parliament_members table.
 * This is separate from the phase3_parliament scoring collection.
 */
export interface HeadWinnerDocument {
  student_id: string;
  status: "active";
}

const headWinnerSchema = new Schema<HeadWinnerDocument>(
  {
    student_id: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["active"],
      default: "active",
      required: true,
    },
  },
  {
    collection: "parliament_members",
    versionKey: false,
  }
);

export const HeadWinner =
  mongoose.models.HeadWinner ||
  mongoose.model<HeadWinnerDocument>(
    "HeadWinner",
    headWinnerSchema
  );
