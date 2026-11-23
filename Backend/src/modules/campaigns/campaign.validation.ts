import { z } from "zod";

export const createCampaignSchema = z
  .object({
    campaignTitle: z
      .string()
      .trim()
      .min(3, "Campaign title must contain at least 3 characters.")
      .max(200, "Campaign title cannot exceed 200 characters."),

    motto: z
      .string()
      .trim()
      .min(2, "Motto must contain at least 2 characters.")
      .max(300, "Motto cannot exceed 300 characters."),

    manifestoDetailed: z
      .string()
      .trim()
      .min(20, "Manifesto must contain at least 20 characters.")
      .max(10000, "Manifesto cannot exceed 10000 characters."),
  })
  .strict();

export const rejectCampaignSchema = z
  .object({
    rejectionReason: z
      .string()
      .trim()
      .min(1, "Rejection reason is required.")
      .max(2000, "Rejection reason cannot exceed 2000 characters."),
  })
  .strict();

export const campaignIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid campaign ID.");

export type CreateCampaignRequest = z.infer<
  typeof createCampaignSchema
>;

export type RejectCampaignRequest = z.infer<
  typeof rejectCampaignSchema
>;
