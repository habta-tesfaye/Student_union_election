import express, { type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { env } from "./config/environment.js";
import { errorHandler } from "./middlewares/error-handler.js";

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
// Create Express application
const app = express();

// Security middleware
app.use(helmet());

// Allow frontend application to communicate with backend
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

// Read JSON data sent by frontend
app.use(express.json({ limit: "10mb" }));

// Read form data
app.use(express.urlencoded({ extended: true }));

// Read cookies from requests
app.use(cookieParser());

// Welcome route
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message:
      "Welcome to Debre Markos University Bure Campus Student Union Election System API",
  });
});

// Health check route
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Student Union Election System API is running!",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Student election application routes
app.use("/api/applications", applicationRoutes);

// Student management routes
app.use("/api/students", studentRoutes);

// Staff management routes
app.use("/api/staff", staffRoutes);

// Candidate management routes
app.use("/api/candidates", candidateRoutes);

// Nomination management routes
app.use("/api/nominations", nominationRoutes);

// Student voting routes
app.use("/api/voting", votingRoutes);

// Election schedule management routes
app.use("/api/elections", electionRoutes);

// Examination management routes
app.use("/api/examinations", examinationRoutes);

// Parliament management and scoring routes
app.use("/api/parliament", parliamentRoutes);

// Campaign management and approval routes
app.use("/api/campaigns", campaignRoutes);

// Notification management routes
app.use("/api/notifications", notificationRoutes);

// Notice management routes
app.use("/api/notices", noticeRoutes);

// Student feedback and Director response routes
app.use("/api/feedback", feedbackRoutes);

// Student discipline management routes
app.use("/api/discipline", disciplineRoutes);

// Student and staff chat routes
app.use("/api/chat", chatRoutes);

// Class election and parliament results routes
app.use("/api/results", resultsRoutes);

// Dashboard statistics routes
app.use("/api/dashboard", dashboardRoutes);
// Admin overview and login history routes
app.use("/api/admin", adminRoutes);

// Central error handler - must be registered after all routes.
app.use(errorHandler);

export default app;