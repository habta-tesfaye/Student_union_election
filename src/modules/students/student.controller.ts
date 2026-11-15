
import type { Request, Response } from "express";

import { studentService } from "./student.service.js";

import {
  createStudentSchema,
  updateStudentSchema,
} from "./student.validation.js";

function getStudentId(req: Request): string {
  const studentId = req.params.studentId;

  return Array.isArray(studentId)
    ? studentId[0] ?? ""
    : studentId ?? "";
}

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

export const studentController = {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
};
