import { z } from "zod";

const dateSchema = z.coerce.date({
  error: "A valid date and time are required.",
});

export const createElectionScheduleSchema = z
  .object({
    stage_name: z
      .string()
      .trim()
      .min(1, "Stage name is required.")
      .max(100, "Stage name cannot exceed 100 characters."),

    stage_label: z
      .string()
      .trim()
      .min(1, "Stage label is required.")
      .max(255, "Stage label cannot exceed 255 characters."),

    start_time: dateSchema,

    end_time: dateSchema,
  })
  .refine((data) => data.end_time > data.start_time, {
    message: "End time must be later than start time.",
    path: ["end_time"],
  });

export const updateElectionScheduleSchema = z
  .object({
    stage_name: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .optional(),

    stage_label: z
      .string()
      .trim()
      .min(1)
      .max(255)
      .optional(),

    start_time: dateSchema.optional(),

    end_time: dateSchema.optional(),

    is_active: z.boolean().optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "Provide at least one field to update.",
    }
  )
  .refine(
    (data) =>
      !data.start_time ||
      !data.end_time ||
      data.end_time > data.start_time,
    {
      message: "End time must be later than start time.",
      path: ["end_time"],
    }
  );

export const electionScheduleIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid election schedule ID."),
});