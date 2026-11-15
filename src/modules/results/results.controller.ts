import type { Request, Response } from "express";
import { StudentAccount } from "../auth/auth.model.js";
import {
  getClassElectionResults,
  getParliamentResults,
} from "./results.service.js";

/**
 * GET /api/results/class
 */
export async function getClassResults(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    let department: string | undefined;
    let yearSection: string | undefined;

    if (req.user.role === "student") {
      if (!req.user.studentId) {
        res.status(403).json({
          success: false,
          message: "Student account information is missing.",
        });
        return;
      }

      const student = await StudentAccount.findOne({
        studentId: req.user.studentId,
      })
        .select("department yearSection")
        .lean();

      if (!student) {
        res.status(404).json({
          success: false,
          message: "Student profile not found.",
        });
        return;
      }

      department = student.department;
      yearSection = student.yearSection;
    } else {
      department = req.user.department;

      if (typeof req.query.section === "string") {
        yearSection = req.query.section.trim();
      }
    }

    if (!department?.trim()) {
      res.status(400).json({
        success: false,
        message: "Department is not configured.",
      });
      return;
    }

    const results = await getClassElectionResults(
      department,
      yearSection
    );

    res.status(200).json({
      success: true,
      message: "Class election results retrieved successfully.",
      data: results,
    });
  } catch (error) {
    console.error("Get class results error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve class election results.",
    });
  }
}

/**
 * GET /api/results/parliament
 */
export async function getParliamentElectionResults(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const results = await getParliamentResults();

    res.status(200).json({
      success: true,
      message: results.message,
      data: results,
    });
  } catch (error) {
    console.error("Get parliament results error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve parliament results.",
    });
  }
}