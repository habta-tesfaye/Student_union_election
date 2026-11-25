import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { applicationController } from "./application.controller.js";

const router = Router();

// Submit Phase 1 application: candidates only.
router.post(
  "/",
  authenticate,
  authorize("candidate"),
  applicationController.createApplication
);

// View own application: students and candidates.
router.get(
  "/me",
  authenticate,
  authorize("student", "candidate"),
  applicationController.getMyApplication
);

export default router;