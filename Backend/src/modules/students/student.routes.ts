import { Router } from "express";
import multer from "multer";

import { studentController } from "./student.controller.js";

import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    const isCsv =
      file.originalname.toLowerCase().endsWith(".csv") &&
      (
        file.mimetype === "text/csv" ||
        file.mimetype === "application/vnd.ms-excel" ||
        file.mimetype === "application/csv" ||
        file.mimetype === "application/octet-stream"
      );

    if (!isCsv) {
      callback(new Error("Only CSV files are allowed."));
      return;
    }

    callback(null, true);
  },
});

/**
 * All student management routes require authentication.
 */
router.use(authenticate);

/**
 * Retrieve the authenticated student's classmates.
 */
router.get(
  "/my-class",
  authorize("student"),
  studentController.getMyClassmates
);

/**
 * Retrieve all students in the authenticated Department Head's department.
 * Keep this route before "/:studentId".
 */
router.get(
  "/department",
  authorize("head"),
  studentController.getStudentsByDepartment
);

/**
 * Import students from a CSV file.
 * Only the Registrar can perform CSV imports.
 */
router.post(
  "/import",
  authorize("registrar"),
  upload.single("file"),
  studentController.importStudents
);

/**
 * Register a student.
 */
router.post(
  "/",
  authorize("admin", "registrar"),
  studentController.createStudent
);

/**
 * Retrieve all students.
 */
router.get(
  "/",
  authorize("admin", "registrar"),
  studentController.getAllStudents
);

/**
 * Retrieve one student.
 */
router.get(
  "/:studentId",
  authorize("admin", "registrar"),
  studentController.getStudentById
);

/**
 * Update a student.
 */
router.patch(
  "/:studentId",
  authorize("admin", "registrar"),
  studentController.updateStudent
);

/**
 * Delete a student.
 * Only admin can delete.
 */
router.delete(
  "/:studentId",
  authorize("admin"),
  studentController.deleteStudent
);

export default router;