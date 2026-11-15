import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";

import {
  createFeedbackController,
  getMyFeedbackController,
  getAllFeedbackController,
  replyToFeedbackController,
  markFeedbackSatisfiedController,
  markFeedbackNotSatisfiedController,
  deleteFeedbackController,
} from "./feedback.controller.js";

const router = Router();

// All feedback routes require authentication.
router.use(authenticate);

// Student routes
router.post(
  "/",
  authorize("student"),
  createFeedbackController
);

router.get(
  "/mine",
  authorize("student"),
  getMyFeedbackController
);

router.patch(
  "/:feedbackId/satisfaction",
  authorize("student"),
  markFeedbackSatisfiedController
);

router.patch(
  "/:feedbackId/reopen",
  authorize("student"),
  markFeedbackNotSatisfiedController
);

// Director routes
router.get(
  "/",
  authorize("director"),
  getAllFeedbackController
);

router.patch(
  "/:feedbackId/reply",
  authorize("director"),
  replyToFeedbackController
);

router.delete(
  "/:feedbackId",
  authorize("director"),
  deleteFeedbackController
);

export default router;