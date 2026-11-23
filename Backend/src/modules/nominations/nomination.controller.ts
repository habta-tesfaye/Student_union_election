
import mongoose from "mongoose";
import { unlink } from "node:fs/promises";
import type { Request, Response } from "express";

import {
  createNomination,
  getNominationsByDepartment,
  reviewNomination as processNominationReview,
  acceptNomination,
  declineNomination,
} from "./nomination.service.js";

/**
 * Get a required string from request parameters.
 */
function getParam(value: string | string[] | undefined): string | null {
  const result = Array.isArray(value) ? value[0] : value;
  return result?.trim() || null;
}

/**
 * Remove an uploaded candidate photo if the request fails.
 */
async function removeUploadedPhoto(req: Request): Promise<void> {
  if (!req.file) return;

  try {
    await unlink(req.file.path);
  } catch (error) {
    console.error("Failed to remove uploaded candidate photo:", error);
  }
}

/**
 * Student submits a nomination.
 * POST /api/nominations
 */
export async function submitNomination(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user?.studentId) {
      res.status(403).json({
        success: false,
        message: "Only students can submit nominations.",
      });
      return;
    }

    const nomineeStudentId =
      typeof req.body.nomineeStudentId === "string"
        ? req.body.nomineeStudentId.trim()
        : "";

    if (!nomineeStudentId) {
      res.status(400).json({
        success: false,
        message: "Nominee student ID is required.",
      });
      return;
    }

    const nomination = await createNomination(
      req.user.studentId,
      nomineeStudentId
    );

    res.status(201).json({
      success: true,
      message: "Nomination submitted successfully.",
      data: { nomination },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to submit nomination.";

    const conflictMessages = [
      "You have already submitted your one allowed nomination.",
      "This student has already been nominated by someone else.",
      "This section already has the maximum of three nominees.",
    ];

    const status = conflictMessages.includes(message)
      ? 409
      : message.includes("not found")
        ? 404
        : message.includes("required") ||
            message.includes("cannot") ||
            message.includes("must") ||
            message.includes("closed")
          ? 400
          : 500;

    res.status(status).json({
      success: false,
      message,
    });
  }
}

/**
 * Department Head views nominations from their own department.
 * GET /api/nominations
 */
export async function getDepartmentNominations(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user?.department) {
      res.status(400).json({
        success: false,
        message: "Your department is not assigned to your staff account.",
      });
      return;
    }

    const nominations = await getNominationsByDepartment(
      req.user.department
    );

    res.status(200).json({
      success: true,
      message: "Department nominations retrieved successfully.",
      data: { nominations },
    });
  } catch (error) {
    console.error("Get department nominations error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve department nominations.",
    });
  }
}

/**
 * Department Head approves or rejects a nomination.
 * PATCH /api/nominations/:nominationId/review
 */
export async function reviewNomination(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user?.staffId || !req.user.department) {
      res.status(403).json({
        success: false,
        message: "Department Head account information is required.",
      });
      return;
    }

    const nominationId = getParam(req.params.nominationId);

    if (!nominationId || !mongoose.Types.ObjectId.isValid(nominationId)) {
      res.status(400).json({
        success: false,
        message: "A valid nomination ID is required.",
      });
      return;
    }

    const action = req.body.action;

    if (action !== "approve" && action !== "reject") {
      res.status(400).json({
        success: false,
        message: "Action must be either approve or reject.",
      });
      return;
    }

    const nomination = await processNominationReview(
      nominationId,
      req.user.department,
      req.user.staffId,
      action
    );

    res.status(200).json({
      success: true,
      message: `Nomination ${action === "approve" ? "approved" : "rejected"} successfully.`,
      data: { nomination },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to review nomination.";

    const status =
      message === "Nomination not found."
        ? 404
        : message.includes("another department")
          ? 403
          : message.includes("already been reviewed")
            ? 409
            : 500;

    res.status(status).json({
      success: false,
      message,
    });
  }
}

/**
 * Nominated student accepts or declines an approved nomination.
 * POST /api/nominations/:nominationId/response
 */
export async function respondToNomination(
  req: Request,
  res: Response
): Promise<void> {
  let photoSaved = false;

  try {
    if (!req.user?.studentId) {
      await removeUploadedPhoto(req);

      res.status(403).json({
        success: false,
        message: "Only students can respond to nominations.",
      });
      return;
    }

    const nominationId = getParam(req.params.nominationId);

    if (!nominationId || !mongoose.Types.ObjectId.isValid(nominationId)) {
      await removeUploadedPhoto(req);

      res.status(400).json({
        success: false,
        message: "A valid nomination ID is required.",
      });
      return;
    }

    const action = req.body.action;

    if (action === "accept") {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "Candidate photo is required to accept nomination.",
        });
        return;
      }

      // Store only the filename in MongoDB, matching the original PHP system.
      const photo = req.file.filename;

      const result = await acceptNomination(
        nominationId,
        req.user.studentId,
        photo
      );

      photoSaved = true;

      res.status(200).json({
        success: true,
        message: "Nomination accepted. You are now an official candidate.",
        data: result,
      });
      return;
    }

    if (action === "decline") {
      await removeUploadedPhoto(req);

      const nomination = await declineNomination(
        nominationId,
        req.user.studentId
      );

      res.status(200).json({
        success: true,
        message: "Nomination declined successfully.",
        data: { nomination },
      });
      return;
    }

    await removeUploadedPhoto(req);

    res.status(400).json({
      success: false,
      message: "Action must be either accept or decline.",
    });
  } catch (error) {
    if (!photoSaved) {
      await removeUploadedPhoto(req);
    }

    const message =
      error instanceof Error
        ? error.message
        : "Failed to respond to nomination.";

    const status =
      message === "Nomination not found."
        ? 404
        : message.includes("only respond to your own")
          ? 403
          : message.includes("already") ||
              message.includes("Only an approved")
            ? 409
            : message.includes("required")
              ? 400
              : 500;

    res.status(status).json({
      success: false,
      message,
    });
  }
}
