
import { Router } from "express";

import { staffController } from "./staff.controller.js";

import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";

const router = Router();

/**
 * All staff management routes require authentication.
 */
router.use(authenticate);

/**
 * Register a staff member.
 * Only administrators can register staff.
 */
router.post(
  "/",
  authorize("admin"),
  staffController.createStaff
);

/**
 * Retrieve all staff members.
 * Only administrators and heads can view staff.
 */
router.get(
  "/",
  authorize("admin", "head"),
  staffController.getAllStaff
);

/**
 * Retrieve one staff member.
 */
router.get(
  "/:staffId",
  authorize("admin", "head"),
  staffController.getStaffById
);

/**
 * Update staff information.
 * Only administrators can update staff.
 */
router.patch(
  "/:staffId",
  authorize("admin"),
  staffController.updateStaff
);

/**
 * Delete a staff account.
 * Only administrators can delete staff.
 */
router.delete(
  "/:staffId",
  authorize("admin"),
  staffController.deleteStaff
);

export default router;
