import { Router } from "express";

import { studentController } from "./student.controller.js";

import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";

const router = Router();

/**
 * All student management routes require authentication.
 */
router.use(authenticate);

/**
 * Create a new student.
 * Only admin and registrar can register students.
 */
router.post(
  "/",
  authorize("admin", "registrar"),
  studentController.createStudent
);

/**
 * Get all students.
 * Only admin and registrar can view the student list.
 */
router.get(
  "/",
  authorize("admin", "registrar"),
  studentController.getAllStudents
);

/**
 * Get one student by student ID.
 */
router.get(
  "/:studentId",
  authorize("admin", "registrar"),
  studentController.getStudentById
);

/**
 * Update student information.
 */
router.patch(
  "/:studentId",
  authorize("admin", "registrar"),
  studentController.updateStudent
);

/**
 * Delete a student account.
 */
router.delete(
  "/:studentId",
  authorize("admin"),
  studentController.deleteStudent
);

export default router;