import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";

import {
  setDisciplineStatusController,
  getAllDisciplineRecordsController,
  getDisciplineByStudentIdController,
} from "./discipline.controller.js";

const router = Router();

// All discipline routes require authentication.
router.use(authenticate);

// Director manages student discipline records.
router.post(
  "/",
  authorize("director"),
  setDisciplineStatusController
);

router.get(
  "/",
  authorize("director"),
  getAllDisciplineRecordsController
);

router.get(
  "/:studentId",
  authorize("director"),
  getDisciplineByStudentIdController
);

export default router;