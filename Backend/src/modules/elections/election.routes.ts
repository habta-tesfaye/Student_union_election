import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";

import {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  updateScheduleStatus,
  removeSchedule,
} from "./election.controller.js";

const router = Router();

// All election schedule routes require authentication.
router.use(authenticate);

// Admin and director manage election schedules.
router.use(authorize("admin", "director"));

// Get all schedules.
router.get("/", getAllSchedules);

// Get one schedule by ID.
router.get("/:id", getScheduleById);

// Create a schedule.
router.post("/", createSchedule);

// Update a schedule.
router.patch("/:id", updateSchedule);

// Activate or deactivate a schedule.
router.patch("/:id/status", updateScheduleStatus);

// Delete a schedule.
router.delete("/:id", removeSchedule);

export default router;