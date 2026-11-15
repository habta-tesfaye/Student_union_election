import { z } from "zod";

// Supported chat account types.
export const chatAccountTypeSchema = z.enum([
  "student",
  "staff",
  "bot",
]);

// Validate sending a message.
export const sendMessageSchema = z
  .object({
    receiverId: z
      .string()
      .trim()
      .min(1, "Receiver ID is required.")
      .max(50, "Receiver ID cannot exceed 50 characters."),

    receiverType: z.enum([
      "student",
      "staff",
      "bot",
    ]),

    message: z
      .string()
      .trim()
      .min(1, "Message cannot be empty.")
      .max(5000, "Message cannot exceed 5000 characters."),
  })
  .strict();

// Validate conversation retrieval.
export const conversationSchema = z
  .object({
    participantId: z
      .string()
      .trim()
      .min(1, "Participant ID is required.")
      .max(50, "Participant ID cannot exceed 50 characters."),

    participantType: z.enum([
      "student",
      "staff",
      "bot",
    ]),
  })
  .strict();

// Validate message ID.
export const chatMessageIdSchema = z
  .string()
  .trim()
  .regex(
    /^[a-f\d]{24}$/i,
    "Invalid message ID."
  );

// Validate pagination query parameters.
export const chatPaginationSchema = z
  .object({
    page: z.coerce
      .number()
      .int()
      .min(1)
      .default(1),

    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20),
  })
  .strict();

// Export inferred input types.
export type SendMessageInput = z.infer<
  typeof sendMessageSchema
>;

export type ConversationInput = z.infer<
  typeof conversationSchema
>;

export type ChatPaginationInput = z.infer<
  typeof chatPaginationSchema
>;