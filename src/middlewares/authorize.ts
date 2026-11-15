import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "../modules/auth/auth.types.js";

/**
 * Check whether the authenticated user has permission
 * to access a particular route.
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    // Check authentication
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
      return;
    }

    // Check user role
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Access denied. You do not have permission.",
      });
      return;
    }

    // Permission granted
    next();
  };
}