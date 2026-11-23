import mongoose, { Schema } from "mongoose";

export type FinalSelectionStatus =
  | "pending"
  | "President"
  | "Vice President"
  | "Executive"
  | "Executive Member";

export interface Phase3ParliamentDocument {
  student_id: string;
  pre_parliament_40: number;
  parliament_score_60: number;
  total_score_100: number;
  final_selection_status: FinalSelectionStatus;
  created_at: Date;
}

const phase3ParliamentSchema = new Schema<Phase3ParliamentDocument>(
  {
    student_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    pre_parliament_40: {
      type: Number,
      default: 0,
      min: 0,
      max: 40,
    },

    parliament_score_60: {
      type: Number,
      default: 0,
      min: 0,
      max: 60,
    },

    total_score_100: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    final_selection_status: {
      type: String,
      enum: [
        "pending",
        "President",
        "Vice President",
        "Executive",
        "Executive Member",
      ],
      default: "pending",
      required: true,
    },

    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "phase3_parliament",
    versionKey: false,
  }
);

/**
 * Calculate the final score from the two evaluation scores.
 * Original PHP uses a generated database column for this.
 */
phase3ParliamentSchema.pre("validate", function () {
  this.total_score_100 =
    this.pre_parliament_40 + this.parliament_score_60;
});

export const Phase3Parliament =
  mongoose.models.Phase3Parliament ||
  mongoose.model<Phase3ParliamentDocument>(
    "Phase3Parliament",
    phase3ParliamentSchema
  );