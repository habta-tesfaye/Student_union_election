import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.js";

import {
  sendMessageController,
  getConversationController,
  getUnreadCountController,
  deleteMessageController,
  clearConversationController,
  getAIWelcomeController,
} from "./chat.controller.js";

const router = Router();

// All chat endpoints require authentication.
router.use(authenticate);

// Get the AI assistant welcome message.
router.get(
  "/ai/welcome",
  getAIWelcomeController
);

// Send a message.
router.post(
  "/messages",
  sendMessageController
);

// Get unread message count.
router.get(
  "/unread-count",
  getUnreadCountController
);

// Retrieve conversation history.
router.get(
  "/conversation/:participantId",
  getConversationController
);

// Clear a conversation.
router.delete(
  "/conversation/:participantId",
  clearConversationController
);

// Delete one message.
router.delete(
  "/messages/:messageId",
  deleteMessageController
);

export default router;