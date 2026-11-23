import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";

import {
  createNoticeController,
  getAllNoticesController,
  getMyDepartmentNoticesController,
  getNoticesForHeadController,
  getNoticesForStudentController,
  updateNoticeController,
  deleteNoticeController,
  getRecentNoticeNotificationsController,
  dismissNoticeNotificationController,
} from "./notice.controller.js";

const router = Router();

// All notice routes require authentication.
router.use(authenticate);

/*
|--------------------------------------------------------------------------
| Director Routes
|--------------------------------------------------------------------------
*/

// Create a notice.
router.post(
  "/",
  authorize("director"),
  createNoticeController
);

// Get all notices.
router.get(
  "/",
  authorize("director"),
  getAllNoticesController
);

// Update a notice.
router.patch(
  "/:noticeId",
  authorize("director"),
  updateNoticeController
);

// Delete a notice.
router.delete(
  "/:noticeId",
  authorize("director"),
  deleteNoticeController
);

/*
|--------------------------------------------------------------------------
| Head Routes
|--------------------------------------------------------------------------
*/

// Publish a notice to department students.
router.post(
  "/department",
  authorize("head"),
  createNoticeController
);

// Get notices created by this Head.
router.get(
  "/department/mine",
  authorize("head"),
  getMyDepartmentNoticesController
);

// Get notices from the Director.
router.get(
  "/department/director",
  authorize("head"),
  getNoticesForHeadController
);

// Get recent notice notifications.
router.get(
  "/department/notifications",
  authorize("head"),
  getRecentNoticeNotificationsController
);

// Dismiss a notice notification.
router.delete(
  "/department/notifications/:notificationId",
  authorize("head"),
  dismissNoticeNotificationController
);

// Update a notice created by this Head.
router.patch(
  "/department/:noticeId",
  authorize("head"),
  updateNoticeController
);

// Delete a notice created by this Head.
router.delete(
  "/department/:noticeId",
  authorize("head"),
  deleteNoticeController
);

/*
|--------------------------------------------------------------------------
| Student Routes
|--------------------------------------------------------------------------
*/

// Get notices visible to the logged-in student.
router.get(
  "/student",
  authorize("student"),
  getNoticesForStudentController
);

export default router;