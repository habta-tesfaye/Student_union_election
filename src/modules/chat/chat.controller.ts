import type { Request, Response } from "express";

import {
  sendMessageSchema,
  conversationSchema,
  chatMessageIdSchema,
} from "./chat.validation.js";

import {
  sendChatMessage,
  getChatConversation,
  getUnreadChatCount,
  deleteChatMessage,
  clearChatConversation,
  getAIWelcomeMessage,
} from "./chat.service.js";

import type {
  ChatParticipant,
} from "./chat.service.js";

// Get the authenticated user's chat identity.
function getCurrentParticipant(
  req: Request
): ChatParticipant | null {
  const user = req.user;

  if (!user) {
    return null;
  }

  if (
    user.accountType === "student" &&
    user.studentId
  ) {
    return {
      id: user.studentId,
      type: "student",
    };
  }

  if (
    user.accountType === "staff" &&
    user.staffId
  ) {
    return {
      id: user.staffId,
      type: "staff",
    };
  }

  return null;
}

// Handle service errors consistently.
function handleError(
  res: Response,
  error: unknown
) {
  const message =
    error instanceof Error
      ? error.message
      : "An unexpected error occurred.";

  const notFoundMessages = [
    "Receiver account not found.",
    "Conversation partner not found.",
    "Message not found or access denied.",
  ];

  const badRequestMessages = [
    "Message cannot be empty.",
    "You cannot send a message to yourself.",
    "You cannot open a conversation with yourself.",
    "Invalid AI assistant account.",
    "Invalid receiver account type.",
    "Invalid sender account.",
    "Conversation partner is required.",
    "Invalid conversation partner.",
    "Invalid message ID.",
  ];

  if (notFoundMessages.includes(message)) {
    return res.status(404).json({
      success: false,
      message,
    });
  }

  if (badRequestMessages.includes(message)) {
    return res.status(400).json({
      success: false,
      message,
    });
  }

  console.error("Chat controller error:", error);

  return res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
}

// 1. Send a message.
export async function sendMessageController(
  req: Request,
  res: Response
) {
  try {
    const participant = getCurrentParticipant(req);

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: "Invalid chat account.",
      });
    }

    const validation = sendMessageSchema.safeParse(
      req.body
    );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid message information.",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const result = await sendChatMessage(
      participant,
      validation.data.receiverId,
      validation.data.receiverType,
      validation.data.message
    );

    return res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

// 2. Retrieve conversation history.
export async function getConversationController(
  req: Request,
  res: Response
) {
  try {
    const participant = getCurrentParticipant(req);

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: "Invalid chat account.",
      });
    }

    const validation = conversationSchema.safeParse({
      participantId: req.params.participantId,
      participantType: req.query.participantType,
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation information.",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const messages = await getChatConversation(
      participant,
      validation.data.participantId,
      validation.data.participantType
    );

    return res.status(200).json({
      success: true,
      data: {
        messages,
        count: messages.length,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
}

// 3. Get unread message count.
export async function getUnreadCountController(
  req: Request,
  res: Response
) {
  try {
    const participant = getCurrentParticipant(req);

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: "Invalid chat account.",
      });
    }

    const unreadCount = await getUnreadChatCount(
      participant
    );

    return res.status(200).json({
      success: true,
      data: {
        unreadCount,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
}

// 4. Delete one message.
export async function deleteMessageController(
  req: Request,
  res: Response
) {
  try {
    const participant = getCurrentParticipant(req);

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: "Invalid chat account.",
      });
    }

    const validation = chatMessageIdSchema.safeParse(
      req.params.messageId
    );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID.",
      });
    }

    await deleteChatMessage(
      validation.data,
      participant
    );

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully.",
    });
  } catch (error) {
    return handleError(res, error);
  }
}

// 5. Clear a conversation.
export async function clearConversationController(
  req: Request,
  res: Response
) {
  try {
    const participant = getCurrentParticipant(req);

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: "Invalid chat account.",
      });
    }

    const validation = conversationSchema.safeParse({
      participantId: req.params.participantId,
      participantType: req.body.participantType,
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation information.",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const result = await clearChatConversation(
      participant,
      validation.data.participantId,
      validation.data.participantType
    );

    return res.status(200).json({
      success: true,
      message: "Conversation cleared successfully.",
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

// 6. Get AI assistant welcome message.
export async function getAIWelcomeController(
  _req: Request,
  res: Response
) {
  try {
    return res.status(200).json({
      success: true,
      data: {
        botId: "AI_BOT",
        welcomeMessage: getAIWelcomeMessage(),
      },
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve AI welcome message.",
    });
  }
}