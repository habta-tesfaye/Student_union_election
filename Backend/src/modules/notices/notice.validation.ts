import { z } from "zod";

export const createNoticeSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Notice title must be at least 3 characters.")
      .max(255, "Notice title cannot exceed 255 characters."),

    message: z
      .string()
      .trim()
      .min(5, "Notice message must be at least 5 characters.")
      .max(10000, "Notice message cannot exceed 10000 characters."),

    targetRole: z
      .enum(["all", "head", "candidate", "registrar", "student"])
      .default("all"),
  })
  .strict();

export const updateNoticeSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Notice title must be at least 3 characters.")
      .max(255, "Notice title cannot exceed 255 characters.")
      .optional(),

    message: z
      .string()
      .trim()
      .min(5, "Notice message must be at least 5 characters.")
      .max(10000, "Notice message cannot exceed 10000 characters.")
      .optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.title !== undefined || data.message !== undefined,
    {
      message: "Provide at least one field to update.",
    }
  );

export const noticeIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid notice ID.");