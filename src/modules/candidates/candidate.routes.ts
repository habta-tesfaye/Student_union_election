import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";

import {
  getAllCandidates,
  getCandidateByStudentId,
} from "./candidate.controller.js";

const router = Router();

// All candidate routes require authentication.
router.use(authenticate);

// Students view candidates in their own department and section.
router.get(
  "/",
  authorize("student"),
  getAllCandidates
);

// Department Heads and administrators can view a candidate.
router.get(
  "/:studentId",
  authorize("head", "admin"),
  getCandidateByStudentId
);

export default router;