import type { Request, Response } from "express";

import { applicationService } from "./application.service.js";
import { createApplicationSchema } from "./application.validation.js";

/**
 * Submit a new Phase 1 application.
 * Only authenticated candidates are allowed.
 */
async function createApplication(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (
      !req.user ||
      req.user.accountType !== "student" ||
      req.user.role !== "candidate" ||
      !req.user.studentId
    ) {
      res.status(403).json({
        success: false,
        message: "Only authenticated candidates can submit applications.",
      });
      return;
    }

    const validationResult = createApplicationSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: "Invalid application information.",
        errors: validationResult.error.flatten().fieldErrors,
      });
      return;
    }

    const application = await applicationService.createApplication(
      req.user.studentId,
      validationResult.data
    );

    res.status(201).json({
      success: true,
      message: "Your leadership vision has been successfully submitted.",
      data: {
        application,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    // Parliament membership restriction.
    if (
      message ===
      "You are not authorized to submit an application because you are not a Parliament member."
    ) {
      res.status(403).json({ success: false, message });
      return;
    }

    // Discipline restriction.
    if (
      message ===
      "You are not eligible to apply because your discipline status is Disciplined."
    ) {
      res.status(403).json({ success: false, message });
      return;
    }

    // Duplicate application.
    if (message === "You have already submitted an application.") {
      res.status(409).json({ success: false, message });
      return;
    }

    // Schedule is not configured.
    if (
      message ===
      "The application submission schedule has not been set."
    ) {
      res.status(503).json({ success: false, message });
      return;
    }

    // Schedule is inactive or outside its submission period.
    if (
      message === "Application submission is currently disabled." ||
      message === "Application submission has not started yet." ||
      message === "The application submission period has closed."
    ) {
      res.status(403).json({ success: false, message });
      return;
    }

    console.error("Create application error:", error);

    res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while submitting your application.",
    });
  }
}

/**
 * Get the authenticated student's or candidate's own application.
 */
async function getMyApplication(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (
      !req.user ||
      req.user.accountType !== "student" ||
      !["student", "candidate"].includes(req.user.role) ||
      !req.user.studentId
    ) {
      res.status(403).json({
        success: false,
        message:
          "Only authenticated students and candidates can view their own applications.",
      });
      return;
    }

    const application = await applicationService.getStudentApplication(
      req.user.studentId
    );

    if (!application) {
      res.status(404).json({
        success: false,
        message: "You have not submitted an election application yet.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Your application was retrieved successfully.",
      data: {
        application,
      },
    });
  } catch (error) {
    console.error("Get application error:", error);

    res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while retrieving your application.",
    });
  }
}

export const applicationController = {
  createApplication,
  getMyApplication,
};