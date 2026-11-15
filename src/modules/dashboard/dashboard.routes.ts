import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { getDashboard } from "./dashboard.controller.js";

const router = Router();

// All dashboard requests require authentication.
router.use(authenticate);

// Only the Director can access the original Director dashboard.
router.get(
  "/",
  authorize("director"),
  getDashboard
);

export default router;