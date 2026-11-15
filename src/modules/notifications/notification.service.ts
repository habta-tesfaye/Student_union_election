import mongoose from "mongoose";
import { Notification } from "./notification.model.js";

import type {
  NotificationRecipientType,
  NotificationType,
} from "./notification.model.js";

export interface CreateNotificationInput {
  recipientId: string;
  recipientType: NotificationRecipientType;
  title: string;
  message: string;
  type?: NotificationType;
  relatedId?: string;
}

/**
 * Create a notification for a student or staff member.
 */
export async function createNotification(
  input: CreateNotificationInput
) {
  return Notification.create({
    recipientId: input.recipientId,
    recipientType: input.recipientType,
    title: input.title,
    message: input.message,
    type: input.type ?? "general",
    relatedId: input.relatedId,
    isRead: false,
  });
}

/**
 * Get notifications belonging to one recipient.
 */
export async function getRecipientNotifications(
  recipientId: string,
  recipientType: NotificationRecipientType,
  page = 1,
  limit = 20
) {
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));

  const filter = {
    recipientId,
    recipientType,
  };

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),

    Notification.countDocuments(filter),
  ]);

  return {
    notifications,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

/**
 * Count unread notifications for one recipient.
 */
export async function getUnreadNotificationCount(
  recipientId: string,
  recipientType: NotificationRecipientType
) {
  return Notification.countDocuments({
    recipientId,
    recipientType,
    isRead: false,
  });
}

/**
 * Mark one recipient's notification as read.
 */
export async function markNotificationAsRead(
  notificationId: string,
  recipientId: string,
  recipientType: NotificationRecipientType
) {
  if (!mongoose.isValidObjectId(notificationId)) {
    throw new Error("Invalid notification ID.");
  }

  const notification = await Notification.findOneAndUpdate(
    {
      _id: notificationId,
      recipientId,
      recipientType,
    },
    {
      $set: { isRead: true },
    },
    {
      new: true,
      runValidators: true,
    }
  ).lean();

  if (!notification) {
    throw new Error("Notification not found.");
  }

  return notification;
}

/**
 * Mark all notifications belonging to one recipient as read.
 */
export async function markAllNotificationsAsRead(
  recipientId: string,
  recipientType: NotificationRecipientType
) {
  const result = await Notification.updateMany(
    {
      recipientId,
      recipientType,
      isRead: false,
    },
    {
      $set: { isRead: true },
    }
  );

  return {
    modifiedCount: result.modifiedCount,
  };
}

/**
 * Delete one notification belonging to its recipient.
 */
export async function deleteNotification(
  notificationId: string,
  recipientId: string,
  recipientType: NotificationRecipientType
) {
  if (!mongoose.isValidObjectId(notificationId)) {
    throw new Error("Invalid notification ID.");
  }

  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    recipientId,
    recipientType,
  });

  if (!notification) {
    throw new Error("Notification not found.");
  }

  return notification;
}