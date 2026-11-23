import { StudentAccount } from "../auth/auth.model.js";
import { Application } from "../applications/application.model.js";
import { Notification } from "../notifications/notification.model.js";
import { Discipline } from "../discipline/discipline.model.js";

/**
 * Get the Director dashboard statistics.
 *
 * Notifications are restricted to the authenticated Director.
 */
export async function getDashboardStatistics(staffId: string) {
  const [
    totalStudents,
    pendingApplications,
    totalDisciplineReports,
    unreadNotifications,
    latestUnreadNotification,
    recentDisciplineRecords,
  ] = await Promise.all([
    // Total registered students.
    StudentAccount.countDocuments({
      role: "student",
    }),

    // Applications awaiting SSD review.
    Application.countDocuments({
      ssdStatus: "pending",
    }),

    // Total discipline records.
    Discipline.countDocuments(),

    // Unread notifications belonging to this Director.
    Notification.countDocuments({
      recipientId: staffId,
      recipientType: "staff",
      isRead: false,
    }),

    // Most recent unread notification for this Director.
    Notification.findOne({
      recipientId: staffId,
      recipientType: "staff",
      isRead: false,
    })
      .select("title message createdAt")
      .sort({ createdAt: -1 })
      .lean(),

    // Five most recently updated discipline records.
    Discipline.find()
      .select("studentId fullName status updatedAt")
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean(),
  ]);

  return {
    totalStudents,

    pendingApplications,

    totalDisciplineReports,

    unreadNotifications,

    latestUnreadNotification,

    recentDisciplineRecords,
  };
}