import type { Request, Response } from "express";

import {
  createNotice,
  getAllNotices,
  getMyDepartmentNotices,
  getNoticesForHead,
  getNoticesForStudent,
  updateNotice,
  deleteNotice,
  getRecentNoticeNotifications,
  dismissNoticeNotification,
} from "./notice.service.js";

import {
  createNoticeSchema,
  updateNoticeSchema,
  noticeIdSchema,
} from "./notice.validation.js";

import type { AuthenticatedUser } from "../auth/auth.types.js";

/**
 * Get the authenticated user.
 */
function getAuthenticatedUser(
  req: Request
): AuthenticatedUser | undefined {
  return req.user;
}

/**
 * Get a route parameter safely.
 */
function getIdParam(req: Request, name: string): string {
  const value = req.params[name];

  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

/**
 * Map service errors to HTTP status codes.
 */
function getErrorStatus(error: unknown): number {
  const message =
    error instanceof Error ? error.message : "";

  if (
    message.includes("not found") ||
    message.includes("not own")
  ) {
    return 404;
  }

  if (
    message.includes("not allowed") ||
    message.includes("Only Heads") ||
    message.includes("Only") ||
    message.includes("not authorized")
  ) {
    return 403;
  }

  if (
    message.includes("Invalid notice ID") ||
    message.includes("required") ||
    message.includes("was not found")
  ) {
    return 400;
  }

  return 500;
}

/**
 * Create a notice.
 * Director can select the audience.
 * Head can publish to their own department students.
 */
export async function createNoticeController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = getAuthenticatedUser(req);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    const validation = createNoticeSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid notice information.",
        errors: validation.error.flatten(),
      });
      return;
    }

    const notice = await createNotice(user, validation.data);

    res.status(201).json({
      success: true,
      message: "Notice created successfully.",
      data: notice,
    });
  } catch (error) {
    console.error("Create notice error:", error);

    res.status(getErrorStatus(error)).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create notice.",
    });
  }
}

/**
 * Get all notices.
 * Intended for Director.
 */
export async function getAllNoticesController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = getAuthenticatedUser(req);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    if (user.role !== "director") {
      res.status(403).json({
        success: false,
        message: "Only the Director can view all notices.",
      });
      return;
    }

    const notices = await getAllNotices();

    res.status(200).json({
      success: true,
      count: notices.length,
      data: notices,
    });
  } catch (error) {
    console.error("Get all notices error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve notices.",
    });
  }
}

/**
 * Get notices created by the logged-in Head.
 */
export async function getMyDepartmentNoticesController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = getAuthenticatedUser(req);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    const notices = await getMyDepartmentNotices(user);

    res.status(200).json({
      success: true,
      count: notices.length,
      data: notices,
    });
  } catch (error) {
    console.error("Get department notices error:", error);

    res.status(getErrorStatus(error)).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to retrieve department notices.",
    });
  }
}

/**
 * Get notices from the Director for a Head.
 */
export async function getNoticesForHeadController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = getAuthenticatedUser(req);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    const notices = await getNoticesForHead(user);

    res.status(200).json({
      success: true,
      count: notices.length,
      data: notices,
    });
  } catch (error) {
    console.error("Get Head notices error:", error);

    res.status(getErrorStatus(error)).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to retrieve Director notices.",
    });
  }
}

/**
 * Get notices visible to the logged-in student.
 */
export async function getNoticesForStudentController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = getAuthenticatedUser(req);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    const notices = await getNoticesForStudent(user);

    res.status(200).json({
      success: true,
      count: notices.length,
      data: notices,
    });
  } catch (error) {
    console.error("Get student notices error:", error);

    res.status(getErrorStatus(error)).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to retrieve student notices.",
    });
  }
}

/**
 * Update a notice.
 * Director can update notices.
 * Head can update only their own notices.
 */
export async function updateNoticeController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = getAuthenticatedUser(req);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    const noticeId = getIdParam(req, "noticeId");

    const idValidation = noticeIdSchema.safeParse(noticeId);

    if (!idValidation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid notice ID.",
      });
      return;
    }

    const validation = updateNoticeSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid notice update information.",
        errors: validation.error.flatten(),
      });
      return;
    }

    const notice = await updateNotice(
      user,
      noticeId,
      validation.data
    );

    res.status(200).json({
      success: true,
      message: "Notice updated successfully.",
      data: notice,
    });
  } catch (error) {
    console.error("Update notice error:", error);

    res.status(getErrorStatus(error)).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update notice.",
    });
  }
}

/**
 * Delete a notice.
 */
export async function deleteNoticeController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = getAuthenticatedUser(req);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    const noticeId = getIdParam(req, "noticeId");

    const idValidation = noticeIdSchema.safeParse(noticeId);

    if (!idValidation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid notice ID.",
      });
      return;
    }

    await deleteNotice(user, noticeId);

    res.status(200).json({
      success: true,
      message: "Notice deleted successfully.",
    });
  } catch (error) {
    console.error("Delete notice error:", error);

    res.status(getErrorStatus(error)).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete notice.",
    });
  }
}

/**
 * Get the five latest notice notifications for a Head.
 */
export async function getRecentNoticeNotificationsController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = getAuthenticatedUser(req);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    const notifications = await getRecentNoticeNotifications(user);

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    console.error("Get notice notifications error:", error);

    res.status(getErrorStatus(error)).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to retrieve notice notifications.",
    });
  }
}

/**
 * Dismiss a notice notification received by a Head.
 */
export async function dismissNoticeNotificationController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = getAuthenticatedUser(req);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    const notificationId = getIdParam(req, "notificationId");

    const idValidation = noticeIdSchema.safeParse(notificationId);

    if (!idValidation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
      });
      return;
    }

    await dismissNoticeNotification(user, notificationId);

    res.status(200).json({
      success: true,
      message: "Notice notification dismissed successfully.",
    });
  } catch (error) {
    console.error("Dismiss notice notification error:", error);

    res.status(getErrorStatus(error)).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to dismiss notification.",
    });
  }
}