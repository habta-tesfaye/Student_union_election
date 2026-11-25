import { Router } from "express";
import {
  finalizeParliamentElection,
  resetParliamentElection,
} from "./results.controller.js";
import { authenticate } from "../../middlewares/authenticate.js";
import {
  getClassResults,
  getParliamentElectionResults,
  getHeadWinnersPreview,
  submitHeadWinnersToSSD,
  getDirectorHeadWinnerReview,
} from "./results.controller.js";
const router = Router();

// All results endpoints require authentication.
router.use(authenticate);
router.post("/parliament/finalize", finalizeParliamentElection);
router.post("/parliament/reset", resetParliamentElection);
// Class election results for the user's department/section.
router.get("/class", getClassResults);

// Parliament election results.
router.get("/parliament", getParliamentElectionResults);
// Head-only finalized class-winner workflow.
router.get("/head-winners", getHeadWinnersPreview);
// Director-only review of submitted winners.
router.get("/head-winners/review", getDirectorHeadWinnerReview);
router.post("/head-winners/submit", submitHeadWinnersToSSD);

export default router;