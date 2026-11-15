import type { Request, Response } from "express";
import {
  approveCampaign,
  createCampaign,
  getAllCampaigns,
  getCampaignById,
  getStudentCampaign,
  rejectCampaign,
} from "./campaign.service.js";
import {
  campaignIdSchema,
  createCampaignSchema,
  rejectCampaignSchema,
} from "./campaign.validation.js";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

// Student: Submit a campaign
export async function submitCampaign(req: Request, res: Response) {
  try {
    const validation = createCampaignSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid campaign information.",
        errors: validation.error.flatten(),
      });
    }

    const studentId = req.user?.studentId;

    if (!studentId) {
      return res.status(403).json({
        success: false,
        message: "Student account required.",
      });
    }

    const existingCampaign = await getStudentCampaign(studentId);

    if (existingCampaign) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted a campaign.",
      });
    }

    const campaign = await createCampaign({
      studentId,
      ...validation.data,
    });

    return res.status(201).json({
      success: true,
      message: "Campaign submitted successfully and is awaiting director approval.",
      data: campaign,
    });
  } catch (error) {
    const message = getErrorMessage(error);

    return res.status(message.includes("already submitted") ? 409 : 500).json({
      success: false,
      message,
    });
  }
}

// Director: View all campaigns, including rejected and approved
export async function getCampaigns(_req: Request, res: Response) {
  try {
    const campaigns = await getAllCampaigns();

    return res.status(200).json({
      success: true,
      count: campaigns.length,
      data: campaigns,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: getErrorMessage(error),
    });
  }
}

// Director: View one campaign
export async function getCampaignByIdController(
  req: Request,
  res: Response
) {
  try {
    const campaignId = Array.isArray(req.params.campaignId)
      ? req.params.campaignId[0]
      : req.params.campaignId;

    const validation = campaignIdSchema.safeParse(campaignId);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid campaign ID.",
      });
    }

    const campaign = await getCampaignById(validation.data);

    return res.status(200).json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    const message = getErrorMessage(error);

    return res.status(message === "Campaign not found." ? 404 : 500).json({
      success: false,
      message,
    });
  }
}

// Director: Approve a pending campaign
export async function approveCampaignController(
  req: Request,
  res: Response
) {
  try {
    const campaignId = Array.isArray(req.params.campaignId)
      ? req.params.campaignId[0]
      : req.params.campaignId;

    const validation = campaignIdSchema.safeParse(campaignId);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid campaign ID.",
      });
    }

    const directorId = req.user?.staffId;

    if (!directorId) {
      return res.status(403).json({
        success: false,
        message: "Director account required.",
      });
    }

    const campaign = await approveCampaign(
      validation.data,
      directorId
    );

    return res.status(200).json({
      success: true,
      message: "Campaign successfully approved.",
      data: campaign,
    });
  } catch (error) {
    const message = getErrorMessage(error);

    const statusCode =
      message === "Campaign not found." ? 404 :
      message.includes("Only pending") ? 409 :
      message.includes("Invalid campaign ID") ? 400 : 500;

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
}

// Director: Reject a pending campaign with a reason
export async function rejectCampaignController(
  req: Request,
  res: Response
) {
  try {
    const campaignId = Array.isArray(req.params.campaignId)
      ? req.params.campaignId[0]
      : req.params.campaignId;

    const idValidation = campaignIdSchema.safeParse(campaignId);

    if (!idValidation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid campaign ID.",
      });
    }

    const bodyValidation = rejectCampaignSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return res.status(400).json({
        success: false,
        message: "A valid rejection reason is required.",
        errors: bodyValidation.error.flatten(),
      });
    }

    const directorId = req.user?.staffId;

    if (!directorId) {
      return res.status(403).json({
        success: false,
        message: "Director account required.",
      });
    }

    const campaign = await rejectCampaign(
      idValidation.data,
      directorId,
      bodyValidation.data.rejectionReason
    );

    return res.status(200).json({
      success: true,
      message: "Campaign rejected with reason provided.",
      data: campaign,
    });
  } catch (error) {
    const message = getErrorMessage(error);

    const statusCode =
      message === "Campaign not found." ? 404 :
      message.includes("Only pending") ? 409 :
      message.includes("Invalid campaign ID") ? 400 : 500;

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
}