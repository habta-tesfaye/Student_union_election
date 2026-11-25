
import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";

import {
  getPhase1Exams,
  getPhase1ExamByStudentId,
  createPhase1Exam,
  updatePhase1Exam,
  getTop16Winners,
  finalizeTop16Winners,
  getPhase2Evaluations,
  getPhase2EvaluationByStudentId,
  createPhase2Evaluation,
  updatePhase2Evaluation,
  getMyPhase2Evaluation,
} from "./examination.controller.js";

const router = Router();

// All examination endpoints require authentication.
router.use(authenticate);

// Candidate can view only their own Phase 2 evaluation.
router.get(
  "/phase2/me",
  authorize("candidate"),
  getMyPhase2Evaluation
);

// Phase 1 examination management.
router.get(
  "/phase1",
  authorize("admin", "director", "registrar"),
  getPhase1Exams
);

// Top 16 winners management (Director only).
// Keep these routes before /phase1/:studentId.
router.get(
  "/phase1/top16",
  authorize("director"),
  getTop16Winners
);

router.post(
  "/phase1/top16/finalize",
  authorize("director"),
  finalizeTop16Winners
);

router.get(
  "/phase1/:studentId",
  authorize("admin", "director", "registrar", "head"),
  getPhase1ExamByStudentId
);

router.post(
  "/phase1",
  authorize("admin", "director", "registrar"),
  createPhase1Exam
);

router.patch(
  "/phase1/:studentId",
  authorize("admin", "director", "registrar"),
  updatePhase1Exam
);

// Phase 2 evaluation management.
router.get(
  "/phase2",
  authorize("admin", "director", "registrar"),
  getPhase2Evaluations
);

router.get(
  "/phase2/:studentId",
  authorize("admin", "director", "registrar", "head"),
  getPhase2EvaluationByStudentId
);

router.post(
  "/phase2",
  authorize("admin", "director", "registrar"),
  createPhase2Evaluation
);

router.patch(
  "/phase2/:studentId",
  authorize("admin", "director", "registrar"),
  updatePhase2Evaluation
);

export default router;
