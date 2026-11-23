import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";

import {
  submitCampaign,
  getCampaigns,
  getCampaignByIdController,
  approveCampaignController,
  rejectCampaignController,
} from "./campaign.controller.js";

const router = Router();

// All campaign routes require authentication
router.use(authenticate);

// Student: Submit a campaign
router.post(
  "/",
  authorize("student"),
  submitCampaign
);

// Director: View all campaigns, including approved and rejected
router.get(
  "/",
  authorize("director"),
  getCampaigns
);

// Director: View one campaign
router.get(
  "/:campaignId",
  authorize("director"),
  getCampaignByIdController
);

// Director: Approve a pending campaign
router.patch(
  "/:campaignId/approve",
  authorize("director"),
  approveCampaignController
);

// Director: Reject a pending campaign with a reason
router.patch(
  "/:campaignId/reject",
  authorize("director"),
  rejectCampaignController
);

export default router;