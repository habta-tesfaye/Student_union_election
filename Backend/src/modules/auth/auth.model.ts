
import mongoose, { Schema } from "mongoose";
import type { StaffRole } from "./auth.types.js";

/**
 * Student account structure.
 * Based on the original MySQL students table.
 */
export interface StudentAccountDocument {
  studentId: string;
  firstName: string;
  middleName: string;
  lastName: string;

  gender?: string;
  region?: string;
  disability?: string;
  department?: string;
  yearSection?: string;
  status?: string;
  gpa?: number;

  password: string;
  role: "student";

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Staff account structure.
 * Based on the original MySQL users table.
 */
export interface StaffAccountDocument {
  staffId: string;
  firstName: string;
  middleName: string;
  lastName: string;

  password: string;
  role: StaffRole;

  department: string;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * MongoDB schema for student accounts.
 */
const studentAccountSchema = new Schema<StudentAccountDocument>(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    middleName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    gender: {
      type: String,
      trim: true,
    },

    region: {
      type: String,
      trim: true,
    },

    disability: {
      type: String,
      trim: true,
    },

    department: {
      type: String,
      trim: true,
    },

    yearSection: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      trim: true,
    },

    gpa: {
      type: Number,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      default: "student",
      enum: ["student"],
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "students",
  }
);

/**
 * MongoDB schema for staff accounts.
 */
const staffAccountSchema = new Schema<StaffAccountDocument>(
  {
    staffId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    middleName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      required: true,
      enum: ["admin", "head", "registrar", "director"],
    },

    department: {
      type: String,
      default: "University Administration",
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

/**
 * Create and export the MongoDB models.
 */
export const StudentAccount =
  mongoose.models.StudentAccount ||
  mongoose.model<StudentAccountDocument>(
    "StudentAccount",
    studentAccountSchema
  );

export const StaffAccount =
  mongoose.models.StaffAccount ||
  mongoose.model<StaffAccountDocument>(
    "StaffAccount",
    staffAccountSchema
  );
