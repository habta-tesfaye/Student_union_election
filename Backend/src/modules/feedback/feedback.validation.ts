import { z } from "zod";

export const feedbackTypeSchema = z.enum([
  "exam_10",
  "evaluation_40",
  "vote_result",
]);

export const createFeedbackSchema = z
  .object({
    feedbackType: feedbackTypeSchema,
    message: z
      .string()
      .trim()
      .min(10, "Feedback must contain at least 10 characters.")
      .max(10000, "Feedback cannot exceed 10000 characters."),
  })
  .strict();

export const replyFeedbackSchema = z
  .object({
    reply: z
      .string()
      .trim()
      .min(5, "Reply must contain at least 5 characters.")
      .max(10000, "Reply cannot exceed 10000 characters."),
  })
  .strict();

export const feedbackSatisfactionSchema = z
  .object({
    satisfaction: z.enum(["satisfied", "not_satisfied"]),
  })
  .strict();

export const feedbackIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid feedback ID.");