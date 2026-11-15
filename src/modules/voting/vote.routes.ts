
import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";

import { castVote } from "./vote.controller.js";

const router = Router();

// All voting routes require authentication.
router.use(authenticate);

// Only authenticated students can cast votes.
router.post("/", authorize("student"), castVote);

export default router;
