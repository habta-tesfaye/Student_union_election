
import type { Request, Response, NextFunction } from "express";

import { authService } from "./auth.service.js";
import { loginSchema } from "./auth.validation.js";

/**
 * Handles authentication HTTP requests.
 */
export class AuthController {
  /**
   * Login a student or staff member.
   */
  login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate information received from the frontend.
      const validation = loginSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "Invalid login information",
          errors: validation.error.flatten().fieldErrors,
        });
        return;
      }

      // Capture login request metadata.
      const metadata = {
        ipAddress: req.ip,
        deviceInfo: req.get("user-agent") || undefined,
      };

      // Authenticate the account and record successful login.
      const result = await authService.login(
        validation.data,
        metadata
      );

      // Return successful login information.
      res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Invalid ID or password"
      ) {
        res.status(401).json({
          success: false,
          message: error.message,
        });
        return;
      }

      next(error);
    }
  };
}

export const authController = new AuthController();
