import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import {
  StudentAccount,
  StaffAccount,
} from "../modules/auth/auth.model.js";

import type {
  AuthTokenPayload,
  AuthenticatedUser,
} from "../modules/auth/auth.types.js";

/**
 * Add authenticated user information to Express Request.
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Verify JWT access tokens and retrieve accounts from MongoDB.
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Read the Authorization header.
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Authentication required. Please provide an access token.",
      });
      return;
    }

    // 2. Extract the token.
    const token = authorization.slice(7).trim();

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access token is missing.",
      });
      return;
    }

    // 3. Get the JWT secret.
    const jwtSecret = process.env.JWT_ACCESS_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_ACCESS_SECRET is not configured");
    }

    // 4. Verify the token.
    const decoded = jwt.verify(token, jwtSecret);

    if (typeof decoded === "string") {
      res.status(401).json({
        success: false,
        message: "Invalid access token.",
      });
      return;
    }

    const payload = decoded as jwt.JwtPayload & AuthTokenPayload;

    if (
      typeof payload.sub !== "string" ||
      !payload.sub ||
      (payload.accountType !== "student" &&
        payload.accountType !== "staff")
    ) {
      res.status(401).json({
        success: false,
        message: "Invalid access token information.",
      });
      return;
    }

    // 5. Retrieve the student account from MongoDB.
    let authenticatedUser: AuthenticatedUser;

    if (payload.accountType === "student") {
      if (payload.role !== "student") {
        res.status(401).json({
          success: false,
          message: "Invalid student access token.",
        });
        return;
      }

      const student = await StudentAccount.findById(payload.sub);

      if (!student) {
        res.status(401).json({
          success: false,
          message: "Student account no longer exists.",
        });
        return;
      }

      authenticatedUser = {
        id: student._id.toString(),
        accountType: "student",
        role: "student",
        studentId: student.studentId,
        firstName: student.firstName,
        middleName: student.middleName,
        lastName: student.lastName,
        department: student.department,
      };
    } else {
      // 6. Validate the staff role.
      const allowedStaffRoles = [
        "admin",
        "head",
        "registrar",
        "director",
      ];

      if (
        !allowedStaffRoles.includes(payload.role) ||
        payload.role === "student"
      ) {
        res.status(401).json({
          success: false,
          message: "Invalid staff access token.",
        });
        return;
      }

      const staff = await StaffAccount.findById(payload.sub);

      if (!staff || staff.role !== payload.role) {
        res.status(401).json({
          success: false,
          message: "Staff account is invalid or no longer exists.",
        });
        return;
      }

      authenticatedUser = {
        id: staff._id.toString(),
        accountType: "staff",
        role: staff.role,
        staffId: staff.staffId,
        firstName: staff.firstName,
        middleName: staff.middleName,
        lastName: staff.lastName,
        department: staff.department,
      };
    }

    // 7. Attach the real account information to the request.
    req.user = authenticatedUser;

    // 8. Continue to the protected route.
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: "Access token has expired. Please log in again.",
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: "Invalid access token.",
      });
      return;
    }

    next(error);
  }
}