
import type { Request, Response } from "express";

import {
  getAdminOverview,
  getLoginHistory,
} from "./admin.service.js";

/**
 * GET /api/admin/overview
 *
 * Retrieve Admin dashboard statistics.
 */
export async function getAdminDashboard(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (
      !req.user ||
      req.user.accountType !== "staff" ||
      req.user.role !== "admin"
    ) {
      res.status(403).json({
        success: false,
        message: "Only administrators can access this resource.",
      });
      return;
    }

    const overview = await getAdminOverview();

    res.status(200).json({
      success: true,
      message: "Admin overview retrieved successfully.",
      data: overview,
    });
  } catch (error) {
    console.error("Admin overview error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve Admin overview.",
    });
  }
}

/**
 * GET /api/admin/login-logs
 *
 * Retrieve the latest 100 successful login records.
 */
export async function getAdminLoginLogs(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (
      !req.user ||
      req.user.accountType !== "staff" ||
      req.user.role !== "admin"
    ) {
      res.status(403).json({
        success: false,
        message: "Only administrators can access login history.",
      });
      return;
    }

    const logs = await getLoginHistory();

    res.status(200).json({
      success: true,
      message: "Login history retrieved successfully.",
      data: {
        count: logs.length,
        logs,
      },
    });
  } catch (error) {
    console.error("Admin login history error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve login history.",
    });
  }
}
