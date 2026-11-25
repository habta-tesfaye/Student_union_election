import type { Request, Response } from "express";
import { StudentAccount } from "../auth/auth.model.js";
import {
  getClassElectionResults,
  getParliamentResults,
  getHeadWinnerReview,
} from "./results.service.js";
import {
  finalizeParliamentRoles,
  resetParliamentRoles,
} from "./results.service.js";

import {
  previewHeadWinners,
  submitHeadWinners,
} from "./head-winner-submission.service.js";
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
/**
 * GET /api/results/head-winners
 * Head-only preview of male and female winners by section.
 */
export async function getHeadWinnersPreview(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user || req.user.role !== "head") {
      res.status(403).json({
        success: false,
        message: "Only Department Heads can preview finalized winners.",
      });
      return;
    }

    const department = req.user.department?.trim();

    if (!department) {
      res.status(400).json({
        success: false,
        message: "Department is not configured.",
      });
      return;
    }

    const data = await previewHeadWinners(department);

    res.status(200).json({
      success: true,
      message: "Department winners preview retrieved successfully.",
      data,
    });
  } catch (error) {
    console.error("Get Head winners preview error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve department winners preview.",
    });
  }
}

/**
 * POST /api/results/head-winners/submit
 * Head-only finalization and submission to Parliament.
 */
export async function submitHeadWinnersToSSD(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user || req.user.role !== "head") {
      res.status(403).json({
        success: false,
        message: "Only Department Heads can submit finalized winners.",
      });
      return;
    }

    const department = req.user.department?.trim();

    if (!department) {
      res.status(400).json({
        success: false,
        message: "Department is not configured.",
      });
      return;
    }

    const headName = [
      req.user.firstName,
      req.user.middleName,
      req.user.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    const data = await submitHeadWinners(department, headName);

    res.status(200).json({
      success: true,
      message: data.message,
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to submit department winners.";

    if (message === "Winner submission is closed at this time.") {
      res.status(403).json({
        success: false,
        message,
      });
      return;
    }

    console.error("Submit Head winners error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to submit department winners.",
    });
  }
}/**
 * GET /api/results/head-winners/review
 * Director-only view of active winners submitted by Department Heads.
 */
export async function getDirectorHeadWinnerReview(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user || req.user.role !== "director") {
      res.status(403).json({
        success: false,
        message: "Only the Director can review submitted winners.",
      });
      return;
    }

    const data = await getHeadWinnerReview();

    res.status(200).json({
      success: true,
      message: "Submitted winners retrieved successfully.",
      data,
    });
  } catch (error) {
    console.error("Director Head winners review error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve submitted winners.",
    });
  }
}
/**
 * POST /api/results/parliament/finalize
 * Director-only finalization of Parliament roles.
 */
export async function finalizeParliamentElection(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user || req.user.role !== "director") {
    res.status(403).json({
      success: false,
      message: "Only the Director can finalize Parliament results.",
    });
    return;
  }

  try {
    const data = await finalizeParliamentRoles();

    res.status(200).json({
      success: true,
      message: data.message,
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to finalize Parliament results.";

    res.status(400).json({
      success: false,
      message,
    });
  }
}

/**
 * POST /api/results/parliament/reset
 * Director-only reset of assigned Parliament roles.
 */
export async function resetParliamentElection(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user || req.user.role !== "director") {
    res.status(403).json({
      success: false,
      message: "Only the Director can reset Parliament results.",
    });
    return;
  }

  try {
    const data = await resetParliamentRoles();

    res.status(200).json({
      success: true,
      message: data.message,
      data,
    });
  } catch (error) {
    console.error("Reset Parliament roles error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to reset Parliament roles.",
    });
  }
}