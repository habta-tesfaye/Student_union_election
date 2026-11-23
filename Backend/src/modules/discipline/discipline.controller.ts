import type { Request, Response } from "express";

import {
  createDisciplineSchema,
  disciplineIdSchema,
} from "./discipline.validation.js";

import {
  setDisciplineStatus,
  getAllDisciplineRecords,
  getDisciplineByStudentId,
} from "./discipline.service.js";

// Handle service and validation errors consistently.
function handleError(res: Response, error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "An unexpected error occurred.";

  if (message === "Student not found.") {
    return res.status(404).json({
      success: false,
      message,
    });
  }

  if (
    message.includes("required") ||
    message.includes("characters") ||
    message.includes("Invalid")
  ) {
    return res.status(400).json({
      success: false,
      message,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
}

// 1. Create or update a student's discipline status.
export async function setDisciplineStatusController(
  req: Request,
  res: Response
) {
  try {
    const validation = createDisciplineSchema.safeParse({
      studentId: req.body.studentId,
      status: req.body.status,
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid discipline information.",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const discipline = await setDisciplineStatus(
      validation.data.studentId,
      validation.data.status
    );

    return res.status(200).json({
      success: true,
      message: "Student discipline status saved successfully.",
      data: {
        discipline,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
}

// 2. Retrieve all discipline records.
export async function getAllDisciplineRecordsController(
  _req: Request,
  res: Response
) {
  try {
    const disciplineRecords = await getAllDisciplineRecords();

    return res.status(200).json({
      success: true,
      data: {
        disciplineRecords,
        count: disciplineRecords.length,
      },
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve discipline records.",
    });
  }
}

// 3. Retrieve one student's discipline record.
export async function getDisciplineByStudentIdController(
  req: Request,
  res: Response
) {
  try {
    const validation = disciplineIdSchema.safeParse(
      req.params.studentId
    );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID.",
      });
    }

    const discipline = await getDisciplineByStudentId(
      validation.data
    );

    if (!discipline) {
      return res.status(404).json({
        success: false,
        message: "Discipline record not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        discipline,
      },
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve discipline record.",
    });
  }
}