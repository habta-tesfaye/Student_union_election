
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { HeadWinner } from "../parliament/head-winner.model.js";
import { StudentAccount, StaffAccount } from "./auth.model.js";
import { LoginLog } from "../admin/login-log.model.js";

import type {
  AuthenticatedUser,
  AuthTokenPayload,
  LoginInput,
  LoginResponse,
} from "./auth.types.js";

export interface LoginMetadata {
  ipAddress?: string;
  deviceInfo?: string;
}

/**
 * Authenticate a student or staff member.
 * Identify Head-submitted Parliament members as candidates.
 */
export class AuthService {
  async login(
    input: LoginInput,
    metadata: LoginMetadata = {}
  ): Promise<LoginResponse> {
    const { identifier, password } = input;

    const jwtSecret = process.env.JWT_ACCESS_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_ACCESS_SECRET is not configured");
    }

    // First, search for a student account.
    const student = await StudentAccount.findOne({
      studentId: identifier,
    }).select("+password");

    if (student) {
      const passwordMatches = await bcrypt.compare(
        password,
        student.password
      );

      if (!passwordMatches) {
        throw new Error("Invalid ID or password");
      }

      // Check whether the student was submitted to Parliament by the Head.
      const headWinner = await HeadWinner.findOne({
        student_id: student.studentId,
        status: "active",
      });

      // Parliament members receive the candidate role.
      const studentRole: "student" | "candidate" = headWinner
        ? "candidate"
        : "student";

      const user: AuthenticatedUser = {
        id: student._id.toString(),
        accountType: "student",
        role: studentRole,
        studentId: student.studentId,
        firstName: student.firstName,
        middleName: student.middleName,
        lastName: student.lastName,
        department: student.department,
      };

      // Create JWT token using the identified role.
      const payload: AuthTokenPayload = {
        sub: user.id,
        accountType: "student",
        role: studentRole,
      };

      const accessToken = jwt.sign(payload, jwtSecret, {
        expiresIn: "15m",
      });

      // Record successful student or candidate login.
      await LoginLog.create({
        userIdentifier: student.studentId,
        userRole: studentRole,
        accountType: "student",
        loginTime: new Date(),
        ipAddress: metadata.ipAddress,
        deviceInfo: metadata.deviceInfo,
      });

      return {
        accessToken,
        user,
      };
    }

    // If no student is found, search for a staff account.
    const staff = await StaffAccount.findOne({
      staffId: identifier,
    }).select("+password");

    if (!staff) {
      throw new Error("Invalid ID or password");
    }

    const passwordMatches = await bcrypt.compare(
      password,
      staff.password
    );

    if (!passwordMatches) {
      throw new Error("Invalid ID or password");
    }

    const user: AuthenticatedUser = {
      id: staff._id.toString(),
      accountType: "staff",
      role: staff.role,
      staffId: staff.staffId,
      firstName: staff.firstName,
      middleName: staff.middleName,
      lastName: staff.lastName,
      department: staff.department,
    };

    const payload: AuthTokenPayload = {
      sub: user.id,
      accountType: "staff",
      role: staff.role,
    };

    const accessToken = jwt.sign(payload, jwtSecret, {
      expiresIn: "15m",
    });

    // Record successful staff login.
    await LoginLog.create({
      userIdentifier: staff.staffId,
      userRole: staff.role,
      accountType: "staff",
      loginTime: new Date(),
      ipAddress: metadata.ipAddress,
      deviceInfo: metadata.deviceInfo,
    });

    return {
      accessToken,
      user,
    };
  }
}

export const authService = new AuthService();
