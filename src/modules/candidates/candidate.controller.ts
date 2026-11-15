import type { Request, Response } from "express";

import { StudentAccount } from "../auth/auth.model.js";

import {
  getCandidatesBySection,
  getCandidateByStudentId as findCandidateByStudentId,
} from "./candidate.service.js";

/**
 * Safely get student ID from request parameters.
 */
function getStudentId(req: Request): string | null {
  const param = req.params.studentId;
  const studentId = Array.isArray(param) ? param[0] : param;

  return studentId?.trim() || null;
}

/**
 * Get official candidates belonging to the logged-in
 * student's department and year section.
 */
export async function getAllCandidates(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user?.studentId) {
      res.status(403).json({
        success: false,
        message: "Student account information is required.",
      });
      return;
    }

    const student = await StudentAccount.findOne({
      studentId: req.user.studentId,
    }).select("department yearSection");

    if (!student) {
      res.status(404).json({
        success: false,
        message: "Student account not found.",
      });
      return;
    }

    if (!student.department || !student.yearSection) {
      res.status(400).json({
        success: false,
        message: "Your department and year section must be set.",
      });
      return;
    }

    const candidates = await getCandidatesBySection(
      student.department,
      student.yearSection
    );

    res.status(200).json({
      success: true,
      message: "Candidates retrieved successfully.",
      data: { candidates },
    });
  } catch (error) {
    console.error("Get candidates error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve candidates.",
    });
  }
}

/**
 * Get one official candidate using the student's ID.
 */
export async function getCandidateByStudentId(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const studentId = getStudentId(req);

    if (!studentId) {
      res.status(400).json({
        success: false,
        message: "A valid student ID is required.",
      });
      return;
    }

    const candidate = await findCandidateByStudentId(studentId);

    if (!candidate) {
      res.status(404).json({
        success: false,
        message: "Candidate not found.",
      });
      return;
    }

    if (!candidate.student) {
      res.status(404).json({
        success: false,
        message: "Candidate student information not found.",
      });
      return;
    }

    if (
      req.user?.role === "head" &&
      candidate.student.department !== req.user.department
    ) {
      res.status(403).json({
        success: false,
        message: "You cannot access candidates from another department.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Candidate retrieved successfully.",
      data: { candidate },
    });
  } catch (error) {
    console.error("Get candidate error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve candidate.",
    });
  }
}