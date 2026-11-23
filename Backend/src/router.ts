import router from "express";

import authRoutes from "./modules/auth/auth.routes.js";
import applicationRoutes from "./modules/applications/application.routes.js";
import studentRoutes from "./modules/students/student.routes.js";
import staffRoutes from "./modules/staff/staff.routes.js";
import candidateRoutes from "./modules/candidates/candidate.routes.js";
import nominationRoutes from "./modules/nominations/nomination.routes.js";
import votingRoutes from "./modules/voting/vote.routes.js";
import electionRoutes from "./modules/elections/election.routes.js";
import examinationRoutes from "./modules/examinations/examination.routes.js";
import parliamentRoutes from "./modules/parliament/parliament.routes.js";
import campaignRoutes from "./modules/campaigns/campaign.routes.js";
import notificationRoutes from "./modules/notifications/notification.routes.js";
import noticeRoutes from "./modules/notices/notice.routes.js";
import feedbackRoutes from "./modules/feedback/feedback.routes.js";
import disciplineRoutes from "./modules/discipline/discipline.routes.js";
import chatRoutes from "./modules/chat/chat.routes.js";
import resultsRoutes from "./modules/results/results.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";

const appRouter = router();

// Authentication routes
appRouter.use("/auth", authRoutes);

// Student election application routes
appRouter.use("/applications", applicationRoutes);

// Student management routes
appRouter.use("/students", studentRoutes);

// Staff management routes
appRouter.use("/staff", staffRoutes);

// Candidate management routes
appRouter.use("/candidates", candidateRoutes);

// Nomination management routes
appRouter.use("/nominations", nominationRoutes);

// Student voting routes
appRouter.use("/voting", votingRoutes);

// Election schedule management routes
appRouter.use("/elections", electionRoutes);

// Examination management routes
appRouter.use("/examinations", examinationRoutes);

// Parliament management and scoring routes
appRouter.use("/parliament", parliamentRoutes);

// Campaign management and approval routes
appRouter.use("/campaigns", campaignRoutes);

// Notification management routes
appRouter.use("/notifications", notificationRoutes);

// Notice management routes
appRouter.use("/notices", noticeRoutes);

// Student feedback and Director response routes
appRouter.use("/feedback", feedbackRoutes);

// Student discipline management routes
appRouter.use("/discipline", disciplineRoutes);

// Student and staff chat routes
appRouter.use("/chat", chatRoutes);

// Class election and parliament results routes
appRouter.use("/results", resultsRoutes);

// Dashboard statistics routes
appRouter.use("/dashboard", dashboardRoutes);
// Admin overview and login history routes
appRouter.use("/admin", adminRoutes);

export default appRouter;
