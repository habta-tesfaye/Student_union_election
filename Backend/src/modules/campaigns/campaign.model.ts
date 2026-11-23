import mongoose, { Schema } from "mongoose";

export type CampaignStatus = "pending" | "approved" | "rejected";

export interface CampaignDocument {
  studentId: string;
  campaignTitle: string;
  motto: string;
  manifestoDetailed: string;
  status: CampaignStatus;
  rejectionReason?: string | null;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const campaignSchema = new Schema<CampaignDocument>(
  {
    studentId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    campaignTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    motto: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },

    manifestoDetailed: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      required: true,
      index: true,
    },

    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    reviewedBy: {
      type: String,
      trim: true,
    },

    reviewedAt: {
      type: Date,
    },
  },
  {
    collection: "candidate_campaigns",
    timestamps: true,
    versionKey: false,
  }
);

campaignSchema.index({ status: 1, createdAt: 1 });

export const Campaign =
  mongoose.models.Campaign ||
  mongoose.model<CampaignDocument>("Campaign", campaignSchema);