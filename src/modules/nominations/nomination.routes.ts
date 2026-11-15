
import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { uploadCandidatePhoto } from "../../middlewares/upload-candidate-photo.js";

import {
  submitNomination,
  getDepartmentNominations,
  reviewNomination,
  respondToNomination,
} from "./nomination.controller.js";

const router = Router();

// All nomination routes require authentication.
router.use(authenticate);

// Students can submit nominations.
router.post(
  "/",
  authorize("student"),
  submitNomination
);

// Department Heads can view nominations from their department.
router.get(
  "/",
  authorize("head"),
  getDepartmentNominations
);

// Department Heads can approve or reject nominations.
router.patch(
  "/:nominationId/review",
  authorize("head"),
  reviewNomination
);

// Nominated students can accept or decline their own nominations.
router.post(
  "/:nominationId/response",
  authorize("student"),
  uploadCandidatePhoto,
  respondToNomination
);

export default router;
