import mongoose from "mongoose";

import {
  Notice,
  type NoticeTargetRole,
} from "./notice.model.js";

import {
  StudentAccount,
  StaffAccount,
} from "../auth/auth.model.js";

import { Candidate } from "../candidates/candidate.model.js";
import { Notification } from "../notifications/notification.model.js";
import { createNotification } from "../notifications/notification.service.js";

interface CreateNoticeInput {
  title: string;
  message: string;
  targetRole: NoticeTargetRole;
}

interface UpdateNoticeInput {
  title?: string;
  message?: string;
}

interface NoticeUser {
  accountType: "student" | "staff";
  role: string;
  studentId?: string;
  staffId?: string;
  department?: string;
}

/**
 * Get the authenticated user's identifier.
 */
function getCreatorId(user: NoticeUser): string {
  const creatorId =
    user.accountType === "student"
      ? user.studentId
      : user.staffId;

  if (!creatorId) {
    throw new Error("User identifier not found.");
  }

  return creatorId;
}

/**
 * Validate MongoDB ObjectId.
 */
function ensureObjectId(id: string): void {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("Invalid notice ID.");
  }
}

/**
 * Send notifications to the selected audience.
 *
 * Original PHP behavior:
 * - Director notices use "New Director Notice".
 * - Head notices use "New Department Notice".
 * - Director student notices notify all students.
 * - Head student notices notify only department students.
 * - Editing a notice does not send notifications again.
 */
async function notifyAudience(
  targetRole: NoticeTargetRole,
  title: string,
  creatorRole: string,
  department?: string
): Promise<void> {
  const notificationMessage =
    creatorRole === "head"
      ? `New Department Notice: ${title}`
      : `New Director Notice: ${title}`;

  if (targetRole === "student") {
    const studentFilter = department
      ? { department }
      : {};

    const students = await StudentAccount.find(studentFilter)
      .select({ studentId: 1 })
      .lean();

    await Promise.all(
      students.map((student) =>
        createNotification({
          recipientId: student.studentId,
          recipientType: "student",
          title: notificationMessage,
          message: notificationMessage,
          type: "notice",
        })
      )
    );

    return;
  }

  if (targetRole === "candidate") {
    const candidates = await Candidate.find()
      .select({ studentId: 1 })
      .lean();

    await Promise.all(
      candidates.map((candidate) =>
        createNotification({
          recipientId: candidate.studentId,
          recipientType: "student",
          title: notificationMessage,
          message: notificationMessage,
          type: "notice",
        })
      )
    );

    return;
  }

  if (targetRole === "head" || targetRole === "registrar") {
    const staffMembers = await StaffAccount.find({
      role: targetRole,
    })
      .select({ staffId: 1 })
      .lean();

    await Promise.all(
      staffMembers.map((staff) =>
        createNotification({
          recipientId: staff.staffId,
          recipientType: "staff",
          title: notificationMessage,
          message: notificationMessage,
          type: "notice",
        })
      )
    );

    return;
  }

  if (targetRole === "all") {
    const [students, staffMembers] = await Promise.all([
      StudentAccount.find()
        .select({ studentId: 1 })
        .lean(),

      StaffAccount.find()
        .select({ staffId: 1 })
        .lean(),
    ]);

    await Promise.all([
      ...students.map((student) =>
        createNotification({
          recipientId: student.studentId,
          recipientType: "student",
          title: notificationMessage,
          message: notificationMessage,
          type: "notice",
        })
      ),

      ...staffMembers.map((staff) =>
        createNotification({
          recipientId: staff.staffId,
          recipientType: "staff",
          title: notificationMessage,
          message: notificationMessage,
          type: "notice",
        })
      ),
    ]);
  }
}

/**
 * Create a notice.
 *
 * Director:
 * - Can publish notices to all supported audiences.
 *
 * Head:
 * - Can publish notices only to students in their department.
 */
export async function createNotice(
  user: NoticeUser,
  input: CreateNoticeInput
) {
  const creatorId = getCreatorId(user);

  let targetRole = input.targetRole;
  let department: string | undefined;

  if (user.role === "head") {
    if (!user.department) {
      throw new Error("Head department was not found.");
    }

    targetRole = "student";
    department = user.department;
  } else if (user.role !== "director") {
    throw new Error("You are not allowed to create notices.");
  }

  const notice = await Notice.create({
    title: input.title,
    message: input.message,
    targetRole,
    createdBy: creatorId,
  });

  try {
    await notifyAudience(
      targetRole,
      notice.title,
      user.role,
      department
    );
  } catch (error) {
    console.error(
      "Notice notification delivery failed:",
      error
    );
  }

  return notice;
}

/**
 * Get all notices for Director.
 */
export async function getAllNotices() {
  return Notice.find()
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Get notices created by the logged-in Head.
 */
export async function getMyDepartmentNotices(
  user: NoticeUser
) {
  if (user.role !== "head") {
    throw new Error(
      "Only Heads can access their department notices."
    );
  }

  const creatorId = getCreatorId(user);

  return Notice.find({
    createdBy: creatorId,
  })
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Get notices from other creators for a Head.
 *
 * Original PHP query:
 * target_role = head OR all,
 * and created_by != current Head.
 */
export async function getNoticesForHead(
  user: NoticeUser
) {
  if (user.role !== "head") {
    throw new Error(
      "Only Heads can access these notices."
    );
  }

  const creatorId = getCreatorId(user);

  return Notice.find({
    targetRole: { $in: ["head", "all"] },
    createdBy: { $ne: creatorId },
  })
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Get notices visible to the logged-in student.
 *
 * Original PHP rules:
 * - target_role = all: university-wide notices.
 * - target_role = student: notices created by staff
 *   belonging to the student's department.
 */
export async function getNoticesForStudent(
  user: NoticeUser
) {
  if (
    user.accountType !== "student" ||
    !user.department
  ) {
    throw new Error(
      "Student department was not found."
    );
  }

  const departmentStaff = await StaffAccount.find({
    department: user.department,
  })
    .select({ staffId: 1 })
    .lean();

  const departmentStaffIds = departmentStaff.map(
    (staff) => staff.staffId
  );

  return Notice.find({
    $or: [
      { targetRole: "all" },
      {
        targetRole: "student",
        createdBy: { $in: departmentStaffIds },
      },
    ],
  })
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Update a notice.
 *
 * Director can update notices.
 * Head can update only notices created by themselves.
 *
 * Editing does not send another notification.
 */
export async function updateNotice(
  user: NoticeUser,
  noticeId: string,
  input: UpdateNoticeInput
) {
  ensureObjectId(noticeId);

  const creatorId = getCreatorId(user);

  if (
    user.role !== "director" &&
    user.role !== "head"
  ) {
    throw new Error(
      "You are not allowed to update notices."
    );
  }

  const filter: Record<string, unknown> = {
    _id: noticeId,
  };

  if (user.role === "head") {
    filter.createdBy = creatorId;
  }

  const updateData: UpdateNoticeInput = {};

  if (input.title !== undefined) {
    updateData.title = input.title;
  }

  if (input.message !== undefined) {
    updateData.message = input.message;
  }

  const notice = await Notice.findOneAndUpdate(
    filter,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!notice) {
    throw new Error(
      "Notice not found or you do not own this notice."
    );
  }

  return notice;
}

/**
 * Delete a notice.
 *
 * Head can delete only their own notices.
 * Director can delete notices.
 */
export async function deleteNotice(
  user: NoticeUser,
  noticeId: string
) {
  ensureObjectId(noticeId);

  const creatorId = getCreatorId(user);

  if (
    user.role !== "director" &&
    user.role !== "head"
  ) {
    throw new Error(
      "You are not allowed to delete notices."
    );
  }

  const filter: Record<string, unknown> = {
    _id: noticeId,
  };

  if (user.role === "head") {
    filter.createdBy = creatorId;
  }

  const notice = await Notice.findOneAndDelete(filter);

  if (!notice) {
    throw new Error(
      "Notice not found or you do not own this notice."
    );
  }

  return notice;
}

/**
 * Get the five latest notice notifications for a Head.
 */
export async function getRecentNoticeNotifications(
  user: NoticeUser
) {
  if (user.role !== "head") {
    throw new Error(
      "Only Heads can access these notifications."
    );
  }

  const recipientId = getCreatorId(user);

  return Notification.find({
    recipientId,
    recipientType: "staff",
    type: "notice",
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();
}

/**
 * Dismiss one of the Head's own notice notifications.
 */
export async function dismissNoticeNotification(
  user: NoticeUser,
  notificationId: string
) {
  ensureObjectId(notificationId);

  if (user.role !== "head") {
    throw new Error(
      "Only Heads can dismiss these notifications."
    );
  }

  const recipientId = getCreatorId(user);

  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    recipientId,
    recipientType: "staff",
    type: "notice",
  });

  if (!notification) {
    throw new Error("Notification not found.");
  }

  return notification;
}