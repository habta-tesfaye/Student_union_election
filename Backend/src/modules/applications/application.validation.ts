import { z } from "zod";

/**
 * Validate information submitted by a student
 * when applying for an election position.
 */
export const createApplicationSchema = z.object({
  motivationText: z
    .string()
    .trim()
    .min(1, "Motivation statement is required.")
    .max(5000, "Motivation statement cannot exceed 5000 characters."),
});

/**
 * TypeScript type generated from the validation schema.
 */
export type CreateApplicationValidationInput =
  z.infer<typeof createApplicationSchema>;