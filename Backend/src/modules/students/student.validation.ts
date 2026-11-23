import { z } from "zod";

/**
 * Validate student information when registering
 * or updating a student record.
 */
export const createStudentSchema = z.object({
  studentId: z
    .string()
    .trim()
    .min(1, "Student ID is required.")
    .max(50, "Student ID cannot exceed 50 characters."),

  firstName: z
    .string()
    .trim()
    .min(1, "First name is required.")
    .max(100),

  middleName: z
    .string()
    .trim()
    .min(1, "Middle name is required.")
    .max(100),

  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required.")
    .max(100),

  gender: z.string().trim().optional(),
  region: z.string().trim().optional(),
  disability: z.string().trim().optional(),
  department: z.string().trim().optional(),
  yearSection: z.string().trim().optional(),
  status: z.string().trim().optional(),

  gpa: z
    .number()
    .min(0, "GPA cannot be negative.")
    .max(4, "GPA cannot exceed 4.")
    .optional(),

  password: z
    .string()
    .min(8, "Password must contain at least 8 characters.")
    .max(128, "Password is too long."),
});

/**
 * Validate student information when updating.
 * Password is not included in this update schema.
 */
export const updateStudentSchema = createStudentSchema
  .omit({
    studentId: true,
    password: true,
  })
  .partial();

export type CreateStudentInput = z.infer<
  typeof createStudentSchema
>;

export type UpdateStudentInput = z.infer<
  typeof updateStudentSchema
>;