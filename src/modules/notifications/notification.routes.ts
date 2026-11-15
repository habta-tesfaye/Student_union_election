import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";

import {
  getMyNotifications,
  getMyUnreadNotificationCount,
  markMyNotificationAsRead,
  markAllMyNotificationsAsRead,
  deleteMyNotification,
} from "./notification.controller.js";

const router = Router();

// All notification endpoints require authentication.
router.use(authenticate);

// Get notifications for the logged-in user.
router.get("/", getMyNotifications);

// Get unread notification count.
router.get("/unread-count", getMyUnreadNotificationCount);

// Mark all notifications as read.
// Keep this before /:notificationId/read.
router.patch("/read-all", markAllMyNotificationsAsRead);

// Mark one notification as read.
router.patch("/:notificationId/read", markMyNotificationAsRead);

// Delete one notification.
router.delete("/:notificationId", deleteMyNotification);

export default router;