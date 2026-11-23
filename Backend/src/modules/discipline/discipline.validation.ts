import { z } from "zod";

export const disciplineStatusSchema = z.enum([
  "Cleared",
  "Disciplined",
]);

export const createDisciplineSchema = z
  .object({
    studentId: z
      .string()
      .trim()
      .min(1, "Student ID is required.")
      .max(30, "Student ID cannot exceed 30 characters."),

    status: disciplineStatusSchema.default("Disciplined"),
  })
  .strict();

export const updateDisciplineSchema = z
  .object({
    status: disciplineStatusSchema,
  })
  .strict();

export const disciplineIdSchema = z
  .string()
  .trim()
  .min(1, "Student ID is required.")
  .max(30, "Student ID cannot exceed 30 characters.");