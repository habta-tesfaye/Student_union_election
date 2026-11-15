import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";

import {
  getParliamentCandidates,
  submitParliamentScore,
  getParliamentResults,
} from "./parliament.controller.js";

const router = Router();

/**
 * Public Parliament results.
 * No login is required to view finalized results.
 */
router.get("/results", getParliamentResults);

/**
 * The remaining Parliament routes require authentication.
 */
router.use(authenticate);

/**
 * View Parliament candidates available for evaluation.
 * Only student accounts can access the evaluation portal.
 */
router.get(
  "/candidates",
  authorize("student"),
  getParliamentCandidates
);

/**
 * Submit a score for a Parliament candidate.
 * Only eligible student candidates can submit scores.
 */
router.post(
  "/vote",
  authorize("student"),
  submitParliamentScore
);

export default router;