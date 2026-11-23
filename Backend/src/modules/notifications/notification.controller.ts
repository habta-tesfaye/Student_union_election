import type { Request, Response } from "express";

import {
  getRecipientNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "./notification.service.js";

import type { NotificationRecipientType } from "./notification.model.js";

/**
 * Get recipient information from the authenticated user.
 */
function getRecipient(req: Request): {
  recipientId: string;
  recipientType: NotificationRecipientType;
} {
  const user = req.user;

  if (!user) {
    throw new Error("Authentication required.");
  }

  if (user.accountType === "student" && user.studentId) {
    return {
      recipientId: user.studentId,
      recipientType: "student",
    };
  }

  if (user.accountType === "staff" && user.staffId) {
    return {
      recipientId: user.staffId,
      recipientType: "staff",
    };
  }

  throw new Error("Invalid authenticated user.");
}

/**
 * GET /api/notifications
 * Get notifications belonging to the logged-in user.
 */
export async function getMyNotifications(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { recipientId, recipientType } = getRecipient(req);

    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    if (
      !Number.isInteger(page) ||
      !Number.isInteger(limit) ||
      page < 1 ||
      limit < 1 ||
      limit > 100
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid pagination parameters.",
      });
      return;
    }

    const result = await getRecipientNotifications(
      recipientId,
      recipientType,
      page,
      limit
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to retrieve notifications.",
    });
  }
}

/**
 * GET /api/notifications/unread-count
 * Get unread notification count.
 */
export async function getMyUnreadNotificationCount(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { recipientId, recipientType } = getRecipient(req);

    const count = await getUnreadNotificationCount(
      recipientId,
      recipientType
    );

    res.status(200).json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to retrieve unread notification count.",
    });
  }
}

/**
 * PATCH /api/notifications/:notificationId/read
 * Mark one notification as read.
 */
export async function markMyNotificationAsRead(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { recipientId, recipientType } = getRecipient(req);
    const notificationId = req.params.notificationId;

    if (
      typeof notificationId !== "string" ||
      !/^[0-9a-fA-F]{24}$/.test(notificationId)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
      });
      return;
    }

    const notification = await markNotificationAsRead(
      notificationId,
      recipientId,
      recipientType
    );

    res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      data: { notification },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "";

    res.status(message === "Notification not found." ? 404 : 500).json({
      success: false,
      message: message || "Failed to mark notification as read.",
    });
  }
}

/**
 * PATCH /api/notifications/read-all
 * Mark all recipient notifications as read.
 */
export async function markAllMyNotificationsAsRead(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { recipientId, recipientType } = getRecipient(req);

    const result = await markAllNotificationsAsRead(
      recipientId,
      recipientType
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to mark notifications as read.",
    });
  }
}

/**
 * DELETE /api/notifications/:notificationId
 * Delete one recipient notification.
 */
export async function deleteMyNotification(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { recipientId, recipientType } = getRecipient(req);
    const notificationId = req.params.notificationId;

    if (
      typeof notificationId !== "string" ||
      !/^[0-9a-fA-F]{24}$/.test(notificationId)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
      });
      return;
    }

    await deleteNotification(
      notificationId,
      recipientId,
      recipientType
    );

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "";

    res.status(message === "Notification not found." ? 404 : 500).json({
      success: false,
      message: message || "Failed to delete notification.",
    });
  }
}