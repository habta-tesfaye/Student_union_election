import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import {
  getClassResults,
  getParliamentElectionResults,
} from "./results.controller.js";

const router = Router();

// All results endpoints require authentication.
router.use(authenticate);

// Class election results for the user's department/section.
router.get("/class", getClassResults);

// Parliament election results.
router.get("/parliament", getParliamentElectionResults);

export default router;