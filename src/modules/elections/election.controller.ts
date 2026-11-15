import type { Request, Response } from "express";

import {
  createElectionSchedule,
  getAllElectionSchedules,
  getElectionScheduleById,
  updateElectionSchedule,
  updateElectionScheduleStatus,
  deleteElectionSchedule,
} from "./election.service.js";

import {
  createElectionScheduleSchema,
  updateElectionScheduleSchema,
  electionScheduleIdSchema,
} from "./election.validation.js";

// Get all election schedules.
export async function getAllSchedules(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const schedules = await getAllElectionSchedules();

    res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules,
    });
  } catch (error) {
    console.error("Get election schedules error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve election schedules.",
    });
  }
}

// Get one election schedule.
export async function getScheduleById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const validation = electionScheduleIdSchema.safeParse(req.params);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid election schedule ID.",
        errors: validation.error.flatten(),
      });
      return;
    }

    const schedule = await getElectionScheduleById(validation.data.id);

    if (!schedule) {
      res.status(404).json({
        success: false,
        message: "Election schedule not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error("Get election schedule error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve election schedule.",
    });
  }
}

// Create a new election schedule.
export async function createSchedule(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const validation = createElectionScheduleSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid election schedule information.",
        errors: validation.error.flatten(),
      });
      return;
    }

    const schedule = await createElectionSchedule(validation.data);

    res.status(201).json({
      success: true,
      message: "New election schedule created successfully.",
      data: schedule,
    });
  } catch (error) {
    console.error("Create election schedule error:", error);

    res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create election schedule.",
    });
  }
}

// Update an existing election schedule.
export async function updateSchedule(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const idValidation = electionScheduleIdSchema.safeParse(req.params);

    if (!idValidation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid election schedule ID.",
      });
      return;
    }

    const bodyValidation = updateElectionScheduleSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid election schedule information.",
        errors: bodyValidation.error.flatten(),
      });
      return;
    }

    const schedule = await updateElectionSchedule(
      idValidation.data.id,
      bodyValidation.data
    );

    res.status(200).json({
      success: true,
      message: "Election schedule updated successfully.",
      data: schedule,
    });
  } catch (error) {
    console.error("Update election schedule error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to update election schedule.";

    res.status(message === "Election schedule not found." ? 404 : 400).json({
      success: false,
      message,
    });
  }
}

// Activate or deactivate a schedule.
export async function updateScheduleStatus(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const idValidation = electionScheduleIdSchema.safeParse(req.params);

    if (!idValidation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid election schedule ID.",
      });
      return;
    }

    if (
      typeof req.body.is_active !== "boolean" ||
      Object.keys(req.body).length !== 1
    ) {
      res.status(400).json({
        success: false,
        message: "Provide is_active as true or false.",
      });
      return;
    }

    const schedule = await updateElectionScheduleStatus(
      idValidation.data.id,
      req.body.is_active
    );

    res.status(200).json({
      success: true,
      message: req.body.is_active
        ? "Election schedule activated successfully."
        : "Election schedule deactivated successfully.",
      data: schedule,
    });
  } catch (error) {
    console.error("Update election schedule status error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to update election schedule status.";

    res.status(message === "Election schedule not found." ? 404 : 400).json({
      success: false,
      message,
    });
  }
}

// Delete an election schedule.
export async function removeSchedule(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const validation = electionScheduleIdSchema.safeParse(req.params);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid election schedule ID.",
      });
      return;
    }

    await deleteElectionSchedule(validation.data.id);

    res.status(200).json({
      success: true,
      message: "Election schedule deleted successfully.",
    });
  } catch (error) {
    console.error("Delete election schedule error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to delete election schedule.";

    res.status(message === "Election schedule not found." ? 404 : 400).json({
      success: false,
      message,
    });
  }
}