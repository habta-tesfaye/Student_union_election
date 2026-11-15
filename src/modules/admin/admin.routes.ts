
import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";

import {
  getAdminDashboard,
  getAdminLoginLogs,
} from "./admin.controller.js";

const router = Router();

// All Admin routes require authentication.
router.use(authenticate);

// Only administrators can access these endpoints.
router.use(authorize("admin"));

// Admin overview statistics.
router.get("/overview", getAdminDashboard);

// Latest 100 successful login records.
router.get("/login-logs", getAdminLoginLogs);

export default router;
