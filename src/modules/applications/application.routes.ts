import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";

import { applicationController } from "./application.controller.js";

const router = Router();

/**
 * Submit a new student election application.
 * Only authenticated students can submit applications.
 */
router.post(
  "/",
  authenticate,
  authorize("student"),
  applicationController.createApplication
);

/**
 * Get the authenticated student's own application.
 * Only authenticated students can access this endpoint.
 */
router.get(
  "/me",
  authenticate,
  authorize("student"),
  applicationController.getMyApplication
);

export default router;