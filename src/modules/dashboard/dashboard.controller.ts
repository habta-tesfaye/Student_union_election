import type { Request, Response } from "express";
import { getDashboardStatistics } from "./dashboard.service.js";

/**
 * GET /api/dashboard
 *
 * Returns dashboard statistics for the authenticated Director.
 */
export async function getDashboard(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Ensure the authenticated account is a Director.
    if (
      !req.user ||
      req.user.accountType !== "staff" ||
      req.user.role !== "director" ||
      !req.user.staffId
    ) {
      res.status(403).json({
        success: false,
        message: "Only the Director can access this dashboard.",
      });
      return;
    }

    // Retrieve statistics using this Director's staff ID.
    const statistics = await getDashboardStatistics(
      req.user.staffId
    );

    res.status(200).json({
      success: true,
      message: "Director dashboard statistics retrieved successfully.",
      data: statistics,
    });
  } catch (error) {
    console.error("Director dashboard error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve dashboard statistics.",
    });
  }
}