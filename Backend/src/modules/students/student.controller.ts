import type { Request, Response } from "express";

import { studentImportService } from "./student-import.service.js";
import { studentService } from "./student.service.js";

import {
  createStudentSchema,
  updateStudentSchema,
} from "./student.validation.js";

/**
 * Get student ID from request parameters.
 */
function getStudentId(req: Request): string {
  const studentId = req.params.studentId;

  return Array.isArray(studentId)
    ? studentId[0] ?? ""
    : studentId ?? "";
}

/**
 * Import students from a CSV file.
 * Only authorized Registrar users can access this function.
 */
async function importStudents(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "Please select a CSV file.",
      });
      return;
    }

    const fileContent = req.file.buffer.toString("utf-8");

    const result =
      await studentImportService.importStudentsFromCsv(fileContent);

    res.status(200).json({
      success: true,
      message: "Student CSV import completed.",
      data: result,
    });
  } catch (error) {
    console.error("Student CSV import error:", error);

    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "An unexpected error occurred during CSV import.",
    });
  }
}

/**
 * Register one student.
 */
async function createStudent(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const validation = createStudentSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid student information.",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const student = await studentService.createStudent(validation.data);

    res.status(201).json({
      success: true,
      message: "Student registered successfully.",
      data: { student },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "A student with this ID already exists."
    ) {
      res.status(409).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error("Create student error:", error);

    res.status(500).json({
      success: false,
      message: "An unexpected error occurred while registering the student.",
    });
  }
}

/**
 * Retrieve all students.
 */
async function getAllStudents(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const students = await studentService.getAllStudents();

    res.status(200).json({
      success: true,
      message: "Students retrieved successfully.",
      data: {
        students,
        count: students.length,
      },
    });
  } catch (error) {
    console.error("Get students error:", error);

    res.status(500).json({
      success: false,
      message: "An unexpected error occurred while retrieving students.",
    });
  }
}

/**
 * Retrieve classmates of the authenticated student.
 */
async function getMyClassmates(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const studentId = req.user?.studentId;

    if (req.user?.role !== "student" || !studentId) {
      res.status(403).json({
        success: false,
        message: "Only authenticated students can retrieve their class list.",
      });
      return;
    }

    const students = await studentService.getMyClassmates(studentId);

    res.status(200).json({
      success: true,
      message: "Your class list was retrieved successfully.",
      data: {
        students,
        count: students.length,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Student account not found.") {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (
        error.message ===
        "Your student account is missing its department or year/section."
      ) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }
    }

    console.error("Get classmates error:", error);

    res.status(500).json({
      success: false,
      message: "An unexpected error occurred while retrieving your class list.",
    });
  }
}

/**
 * Retrieve students in the authenticated Department Head's department.
 */
async function getStudentsByDepartment(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const department = req.user?.department;

    if (req.user?.role !== "head" || !department) {
      res.status(403).json({
        success: false,
        message:
          "Only Department Heads with an assigned department can retrieve this student list.",
      });
      return;
    }

    const students =
      await studentService.getStudentsByDepartment(department);

    res.status(200).json({
      success: true,
      message: "Department students retrieved successfully.",
      data: {
        students,
        count: students.length,
      },
    });
  } catch (error) {
    console.error("Get department students error:", error);

    res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while retrieving department students.",
    });
  }
}

/**
 * Retrieve one student by student ID.
 */
async function getStudentById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const studentId = getStudentId(req);

    if (!studentId) {
      res.status(400).json({
        success: false,
        message: "Student ID is required.",
      });
      return;
    }

    const student = await studentService.getStudentById(studentId);

    if (!student) {
      res.status(404).json({
        success: false,
        message: "Student not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Student retrieved successfully.",
      data: { student },
    });
  } catch (error) {
    console.error("Get student error:", error);

    res.status(500).json({
      success: false,
      message: "An unexpected error occurred while retrieving the student.",
    });
  }
}

/**
 * Update student information.
 */
async function updateStudent(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const studentId = getStudentId(req);

    if (!studentId) {
      res.status(400).json({
        success: false,
        message: "Student ID is required.",
      });
      return;
    }

    const validation = updateStudentSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid student information.",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    if (Object.keys(validation.data).length === 0) {
      res.status(400).json({
        success: false,
        message: "Provide at least one field to update.",
      });
      return;
    }

    const student = await studentService.updateStudent(
      studentId,
      validation.data
    );

    res.status(200).json({
      success: true,
      message: "Student updated successfully.",
      data: { student },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Student not found."
    ) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error("Update student error:", error);

    res.status(500).json({
      success: false,
      message: "An unexpected error occurred while updating the student.",
    });
  }
}

/**
 * Delete a student account.
 */
async function deleteStudent(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const studentId = getStudentId(req);

    if (!studentId) {
      res.status(400).json({
        success: false,
        message: "Student ID is required.",
      });
      return;
    }

    const result = await studentService.deleteStudent(studentId);

    res.status(200).json({
      success: true,
      message: "Student deleted successfully.",
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Student not found.") {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (
        error.message ===
        "Cannot delete this student because an election application exists."
      ) {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }
    }

    console.error("Delete student error:", error);

    res.status(500).json({
      success: false,
      message: "An unexpected error occurred while deleting the student.",
    });
  }
}

/**
 * Export student controller functions.
 */
export const studentController = {
  createStudent,
  getAllStudents,
  getMyClassmates,
  getStudentsByDepartment,
  getStudentById,
  updateStudent,
  deleteStudent,
  importStudents,
};