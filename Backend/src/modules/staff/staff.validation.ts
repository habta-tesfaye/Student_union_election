
import { z } from "zod";

/**
 * Validate staff information when registering
 * a new staff member.
 */
export const createStaffSchema = z.object({
  staffId: z
    .string()
    .trim()
    .min(1, "Staff ID is required.")
    .max(50, "Staff ID cannot exceed 50 characters."),

  firstName: z
    .string()
    .trim()
    .min(1, "First name is required.")
    .max(100, "First name cannot exceed 100 characters."),

  middleName: z
    .string()
    .trim()
    .min(1, "Middle name is required.")
    .max(100, "Middle name cannot exceed 100 characters."),

  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required.")
    .max(100, "Last name cannot exceed 100 characters."),

  password: z
    .string()
    .min(8, "Password must contain at least 8 characters.")
    .max(128, "Password is too long."),

  role: z.enum([
    "admin",
    "head",
    "registrar",
    "director",
  ]),

  department: z
    .string()
    .trim()
    .optional(),
});

/**
 * Validate staff information when updating
 * an existing staff member.
 */
export const updateStaffSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100).optional(),
    middleName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),

    role: z.enum([
      "admin",
      "head",
      "registrar",
      "director",
    ]).optional(),

    department: z.string().trim().optional(),
  })
  .strict();

export type CreateStaffInput = z.infer<typeof createStaffSchema>;

export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
