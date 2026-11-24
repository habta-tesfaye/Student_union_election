import mongoose from "mongoose";
import { Campaign } from "./campaign.model.js";
import type { CampaignStatus } from "./campaign.model.js";

export interface CreateCampaignInput {
  studentId: string;
  campaignTitle: string;
  motto: string;
  manifestoDetailed: string;
}

export async function createCampaign(input: CreateCampaignInput) {
  const existingCampaign = await Campaign.findOne({
    studentId: input.studentId,
  });

  if (existingCampaign) {
    throw new Error("This student has already submitted a campaign.");
  }

  return Campaign.create({
    studentId: input.studentId,
    campaignTitle: input.campaignTitle,
    motto: input.motto,
    manifestoDetailed: input.manifestoDetailed,
    status: "pending",
    rejectionReason: null,
  });
}

export async function getAllCampaigns() {
  const statusOrder: Record<CampaignStatus, number> = {
    pending: 0,
    rejected: 1,
    approved: 2,
  };

  const campaigns = await Campaign.find()
    .sort({ createdAt: 1 })
    .lean();
return campaigns.sort(
  (a, b) =>
    statusOrder[a.status as CampaignStatus] -
    statusOrder[b.status as CampaignStatus]
);
}

export async function getCampaignById(campaignId: string) {
  if (!mongoose.isValidObjectId(campaignId)) {
    throw new Error("Invalid campaign ID.");
  }

  const campaign = await Campaign.findById(campaignId).lean();

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  return campaign;
}

export async function approveCampaign(
  campaignId: string,
  directorId: string
) {
  if (!mongoose.isValidObjectId(campaignId)) {
    throw new Error("Invalid campaign ID.");
  }

  const campaign = await Campaign.findOneAndUpdate(
    {
      _id: campaignId,
      status: "pending",
    },
    {
      $set: {
        status: "approved",
        rejectionReason: null,
        reviewedBy: directorId,
        reviewedAt: new Date(),
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).lean();

  if (!campaign) {
    const existing = await Campaign.exists({ _id: campaignId });

    if (!existing) {
      throw new Error("Campaign not found.");
    }

    throw new Error("Only pending campaigns can be approved.");
  }

  return campaign;
}

export async function rejectCampaign(
  campaignId: string,
  directorId: string,
  rejectionReason: string
) {
  if (!mongoose.isValidObjectId(campaignId)) {
    throw new Error("Invalid campaign ID.");
  }

  const reason = rejectionReason.trim();

  if (!reason) {
    throw new Error("A rejection reason is required.");
  }

  if (reason.length > 2000) {
    throw new Error("Rejection reason cannot exceed 2000 characters.");
  }

  const campaign = await Campaign.findOneAndUpdate(
    {
      _id: campaignId,
      status: "pending",
    },
    {
      $set: {
        status: "rejected",
        rejectionReason: reason,
        reviewedBy: directorId,
        reviewedAt: new Date(),
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).lean();

  if (!campaign) {
    const existing = await Campaign.exists({ _id: campaignId });

    if (!existing) {
      throw new Error("Campaign not found.");
    }

    throw new Error("Only pending campaigns can be rejected.");
  }

  return campaign;
}

export async function getStudentCampaign(studentId: string) {
  return Campaign.findOne({ studentId }).lean();
}