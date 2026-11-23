import express, { type Request, type Response } from "express";
import cors from "cors";
import path from "node:path";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { env } from "./config/environment.js";
import { errorHandler } from "./middlewares/error-handler.js";
import appRouter from "./router.js";

// Create Express application
const app = express();

// Security middleware
app.use(helmet());

// Allow frontend application to communicate with backend
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);

// Read JSON data sent by frontend
app.use(express.json({ limit: "10mb" }));

// Read form data
app.use(express.urlencoded({ extended: true }));

// Read cookies from requests
app.use(cookieParser());
// Serve uploaded candidate photos.
app.use(
  "/uploads/candidates",
  helmet.crossOriginResourcePolicy({
    policy: "cross-origin",
  }),
  express.static(path.resolve(process.cwd(), "uploads", "candidates")),
);

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

app.use("/api/", appRouter);

// Central error handler - must be registered after all routes.
app.use(errorHandler);

export default app;
