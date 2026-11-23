
import type { Request, Response } from "express";

import { staffService } from "./staff.service.js";

import {
  createStaffSchema,
  updateStaffSchema,
} from "./staff.validation.js";

import type {
  CreateStaffInput,
  UpdateStaffInput,
} from "./staff.validation.js";

/**
 * Get staff ID from request parameters.
 */
function getStaffId(req: Request): string {
  const staffId = req.params.staffId;

  return Array.isArray(staffId)
    ? staffId[0] ?? ""
    : staffId ?? "";
}

/**
 * Register a staff member.
 * POST /api/staff
 */
async function createStaff(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const validation = createStaffSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid staff information.",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const staff = await staffService.createStaff(
      validation.data as CreateStaffInput
    );

    res.status(201).json({
      success: true,
      message: "Staff member registered successfully.",
      data: { staff },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "A staff member with this ID already exists."
    ) {
      res.status(409).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error("Create staff error:", error);

    res.status(500).json({
      success: false,
      message: "An unexpected error occurred while registering staff.",
    });
  }
}

/**
 * Retrieve all staff members.
 * GET /api/staff
 */
async function getAllStaff(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const staff = await staffService.getAllStaff();

    res.status(200).json({
      success: true,
      message: "Staff members retrieved successfully.",
      data: {
        staff,
        count: staff.length,
      },
    });
  } catch (error) {
    console.error("Get staff error:", error);

    res.status(500).json({
      success: false,
      message: "An unexpected error occurred while retrieving staff.",
    });
  }
}

/**
 * Retrieve one staff member.
 * GET /api/staff/:staffId
 */
async function getStaffById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const staffId = getStaffId(req);

    if (!staffId) {
      res.status(400).json({
        success: false,
        message: "Staff ID is required.",
      });
      return;
    }

    const staff = await staffService.getStaffById(staffId);

    if (!staff) {
      res.status(404).json({
        success: false,
        message: "Staff member not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Staff member retrieved successfully.",
      data: { staff },
    });
  } catch (error) {
    console.error("Get staff error:", error);

    res.status(500).json({
      success: false,
      message: "An unexpected error occurred while retrieving staff.",
    });
  }
}

/**
 * Update staff information.
 * PATCH /api/staff/:staffId
 */
async function updateStaff(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const staffId = getStaffId(req);

    if (!staffId) {
      res.status(400).json({
        success: false,
        message: "Staff ID is required.",
      });
      return;
    }

    const validation = updateStaffSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid staff information.",
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

    const staff = await staffService.updateStaff(
      staffId,
      validation.data as UpdateStaffInput
    );

    res.status(200).json({
      success: true,
      message: "Staff member updated successfully.",
      data: { staff },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Staff member not found."
    ) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (
      error instanceof Error &&
      error.message ===
        "Cannot change the role of the last administrator."
    ) {
      res.status(409).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error("Update staff error:", error);

    res.status(500).json({
      success: false,
      message: "An unexpected error occurred while updating staff.",
    });
  }
}

/**
 * Delete a staff account.
 * DELETE /api/staff/:staffId
 */
async function deleteStaff(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const staffId = getStaffId(req);

    if (!staffId) {
      res.status(400).json({
        success: false,
        message: "Staff ID is required.",
      });
      return;
    }

    const result = await staffService.deleteStaff(staffId);

    res.status(200).json({
      success: true,
      message: "Staff account deleted successfully.",
      data: result,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Staff member not found."
    ) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (
      error instanceof Error &&
      error.message === "Cannot delete the last administrator."
    ) {
      res.status(409).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error("Delete staff error:", error);

    res.status(500).json({
      success: false,
      message: "An unexpected error occurred while deleting staff.",
    });
  }
}

export const staffController = {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
};
