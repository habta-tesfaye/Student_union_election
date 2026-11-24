
import mongoose, { Schema } from "mongoose";

/**
 * Nomination statuses based on the original PHP workflow.
 */
export type NominationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "final_candidate"
  | "withdrawn";

/**
 * Nomination document structure.
 */
export interface NominationDocument {
  nominatorStudentId: string;
  nomineeStudentId: string;
  department: string;
  yearSection: string;
  status: NominationStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  responseAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const nominationSchema = new Schema<NominationDocument>(
  {
    nominatorStudentId: {
      type: String,
      required: [true, "Nominator student ID is required."],
      trim: true,
    },

    nomineeStudentId: {
      type: String,
      required: [true, "Nominee student ID is required."],
      trim: true,
    },

    department: {
      type: String,
      required: [true, "Department is required."],
      trim: true,
    },

    yearSection: {
      type: String,
      required: [true, "Year section is required."],
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "final_candidate",
        "withdrawn",
      ],
      default: "pending",
      required: true,
    },

    reviewedBy: {
      type: String,
      trim: true,
    },

    reviewedAt: {
      type: Date,
    },

    responseAt: {
      type: Date,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "nominations",
    versionKey: false,
  }
);

// Prevent a student from being nominated more than once.
nominationSchema.index(
  { nomineeStudentId: 1 },
  { unique: true }
);

// Create the model only once.
export const Nomination =
  mongoose.models.Nomination ||
  mongoose.model<NominationDocument>("Nomination", nominationSchema);
