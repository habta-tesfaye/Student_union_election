import type { Request, Response } from "express";

import { applicationService } from "./application.service.js";
import { createApplicationSchema } from "./application.validation.js";

/**
 * Submit a new student election application.
 */
async function createApplication(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Make sure the user is logged in as a student.
    if (
      !req.user ||
      req.user.accountType !== "student" ||
      !req.user.studentId
    ) {
      res.status(403).json({
        success: false,
        message: "Only authenticated students can submit applications.",
      });
      return;
    }

    // Validate the information submitted by the student.
    const validationResult = createApplicationSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: "Invalid application information.",
        errors: validationResult.error.flatten().fieldErrors,
      });
      return;
    }

    // Save the application using the authenticated student's ID.
    const application = await applicationService.createApplication(
      req.user.studentId,
      validationResult.data
    );

    res.status(201).json({
      success: true,
      message: "Your election application was submitted successfully.",
      data: {
        application,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "";

    // Disciplined students cannot submit applications.
    if (
      message ===
      "You are not eligible to apply because your discipline status is Disciplined."
    ) {
      res.status(403).json({
        success: false,
        message,
      });
      return;
    }

    // Handle duplicate applications.
    if (message === "You have already submitted an application.") {
      res.status(409).json({
        success: false,
        message,
      });
      return;
    }

    // Handle unexpected errors.
    console.error("Create application error:", error);

    res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while submitting your application.",
    });
  }
}

/**
 * Get the authenticated student's own application.
 */
async function getMyApplication(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (
      !req.user ||
      req.user.accountType !== "student" ||
      !req.user.studentId
    ) {
      res.status(403).json({
        success: false,
        message: "Only authenticated students can view student applications.",
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

/**
 * Export application controller functions.
 */
export const applicationController = {
  createApplication,
  getMyApplication,
};