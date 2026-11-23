
import { z } from "zod";

/**
 * Login validation schema.
 *
 * A user can log in using either:
 * - Student ID
 * - Staff ID
 */
export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Student ID or Staff ID is required")
    .max(50, "ID cannot exceed 50 characters"),

  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password is too long"),
});

/**
 * TypeScript type generated from the login schema.
 */
export type LoginValidationInput = z.infer<typeof loginSchema>;
