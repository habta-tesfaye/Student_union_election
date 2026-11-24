
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

router.use(authenticate);

// Students, Admin and Director can view schedules.
router.get("/", authorize("student", "admin", "director"), getAllSchedules);

router.get(
  "/:id",
  authorize("student", "admin", "director"),
  getScheduleById
);

// Only Admin and Director can manage schedules.
router.post("/", authorize("admin", "director"), createSchedule);

router.patch("/:id", authorize("admin", "director"), updateSchedule);

router.patch(
  "/:id/status",
  authorize("admin", "director"),
  updateScheduleStatus
);

router.delete("/:id", authorize("admin", "director"), removeSchedule);

export default router;
