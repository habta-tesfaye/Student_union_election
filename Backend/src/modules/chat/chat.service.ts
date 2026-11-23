import mongoose from "mongoose";

import { ChatMessage } from "./chat.model.js";
import type {
  ChatAccountType,
} from "./chat.model.js";

import { StudentAccount } from "../auth/auth.model.js";
import { StaffAccount } from "../auth/auth.model.js";

// A participant in a conversation.
export interface ChatParticipant {
  id: string;
  type: "student" | "staff";
}

// Official election assistant questions.
const AI_RESPONSES: Record<string, string> = {
  "how to vote?":
    "Log in to your student dashboard and click 'Vote Now'.",

  "who can be a candidate?":
    "Only students with no disciplinary records from DMU are eligible.",

  "how to apply?":
    "Access the Candidate Portal and submit your Leadership Vision Statement.",

  "what is phase 1?":
    "Phase 1 is for Application and Official Nomination.",

  "what is phase 2?":
    "Phase 2 covers Campaigning and Parliament Scoring.",

  "what is phase 3?":
    "Phase 3 is the Final Election Day for all students.",

  "how to contact admin?":
    "Please visit the Registrar Office at the DMU Burie Campus.",
};

const AI_FALLBACK =
  "I am sorry, I can only answer the 7 official election questions. Please select one from the list.";

const AI_GREETING =
  "Hello! I am your DMU Burie Election Assistant. Please select one of the 7 official questions to get started.";

const AI_TRIGGER_WORDS = [
  "help",
  "error",
  "how to",
  "confused",
  "stuck",
  "problem",
];

// 1. Validate that a real chat participant exists.
async function verifyParticipant(
  participantId: string,
  participantType: "student" | "staff"
): Promise<boolean> {
  if (participantType === "student") {
    const student = await StudentAccount.exists({
      studentId: participantId,
    });

    return Boolean(student);
  }

  const staff = await StaffAccount.exists({
    staffId: participantId,
  });

  return Boolean(staff);
}

// 2. Generate the official AI election response.
export function getAIResponse(question: string): string {
  const normalizedQuestion = question.trim().toLowerCase();

  return AI_RESPONSES[normalizedQuestion] ?? AI_FALLBACK;
}

// 3. Determine whether a message requests assistance.
function isHelpRequest(message: string): boolean {
  const normalizedMessage = message.toLowerCase();

  return AI_TRIGGER_WORDS.some((word) =>
    normalizedMessage.includes(word)
  );
}

// 4. Send a message and optionally generate an AI response.
export async function sendChatMessage(
  sender: ChatParticipant,
  receiverId: string,
  receiverType: ChatAccountType,
  message: string
) {
  const cleanMessage = message.trim();
  const cleanReceiverId = receiverId.trim();

  if (!cleanMessage) {
    throw new Error("Message cannot be empty.");
  }

  if (cleanReceiverId === sender.id && receiverType === sender.type) {
    throw new Error("You cannot send a message to yourself.");
  }

  if (receiverType === "bot") {
    if (cleanReceiverId !== "AI_BOT") {
      throw new Error("Invalid AI assistant account.");
    }

    if (sender.type !== "student" && sender.type !== "staff") {
      throw new Error("Invalid sender account.");
    }
  } else {
    if (cleanReceiverId === "AI_BOT") {
      throw new Error("Invalid receiver account type.");
    }

    const receiverExists = await verifyParticipant(
      cleanReceiverId,
      receiverType
    );

    if (!receiverExists) {
      throw new Error("Receiver account not found.");
    }
  }

  // Save the user's message.
  const savedMessage = await ChatMessage.create({
    senderId: sender.id,
    senderType: sender.type,
    receiverId: cleanReceiverId,
    receiverType,
    message: cleanMessage,
    isRead: false,
    readAt: null,
  });

  let aiReply = null;

  // Preserve the original PHP automatic help-reply behavior.
  if (
    receiverType === "bot" ||
    isHelpRequest(cleanMessage)
  ) {
    const response = getAIResponse(cleanMessage);

    aiReply = await ChatMessage.create({
      senderId: "AI_BOT",
      senderType: "bot",
      receiverId: sender.id,
      receiverType: sender.type,
      message: response,
      isRead: false,
      readAt: null,
    });
  }

  return {
    message: savedMessage,
    aiReply,
  };
}

// 5. Get the conversation history and mark incoming messages as read.
export async function getChatConversation(
  currentUser: ChatParticipant,
  partnerId: string,
  partnerType: ChatAccountType
) {
  if (!partnerId.trim()) {
    throw new Error("Conversation partner is required.");
  }

  const cleanPartnerId = partnerId.trim();

  if (
    cleanPartnerId === currentUser.id &&
    partnerType === currentUser.type
  ) {
    throw new Error("You cannot open a conversation with yourself.");
  }

  if (partnerType === "bot") {
    if (cleanPartnerId !== "AI_BOT") {
      throw new Error("Invalid AI assistant account.");
    }
  } else {
    const partnerExists = await verifyParticipant(
      cleanPartnerId,
      partnerType
    );

    if (!partnerExists) {
      throw new Error("Conversation partner not found.");
    }
  }

  // Mark only incoming messages from this conversation as read.
  await ChatMessage.updateMany(
    {
      senderId: cleanPartnerId,
      senderType: partnerType,
      receiverId: currentUser.id,
      receiverType: currentUser.type,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    }
  );

  // Retrieve the latest 50 messages.
  const messages = await ChatMessage.find({
    $or: [
      {
        senderId: currentUser.id,
        senderType: currentUser.type,
        receiverId: cleanPartnerId,
        receiverType: partnerType,
      },
      {
        senderId: cleanPartnerId,
        senderType: partnerType,
        receiverId: currentUser.id,
        receiverType: currentUser.type,
      },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  // Display messages in chronological order.
  return messages.reverse();
}

// 6. Count unread messages for a participant.
export async function getUnreadChatCount(
  participant: ChatParticipant
): Promise<number> {
  return ChatMessage.countDocuments({
    receiverId: participant.id,
    receiverType: participant.type,
    isRead: false,
  });
}

// 7. Delete one message belonging to the current participant.
export async function deleteChatMessage(
  messageId: string,
  participant: ChatParticipant
) {
  if (!mongoose.isValidObjectId(messageId)) {
    throw new Error("Invalid message ID.");
  }

  const deletedMessage = await ChatMessage.findOneAndDelete({
    _id: messageId,
    $or: [
      {
        senderId: participant.id,
        senderType: participant.type,
      },
      {
        receiverId: participant.id,
        receiverType: participant.type,
      },
    ],
  });

  if (!deletedMessage) {
    throw new Error("Message not found or access denied.");
  }

  return deletedMessage;
}

// 8. Clear a conversation between two participants.
export async function clearChatConversation(
  currentUser: ChatParticipant,
  partnerId: string,
  partnerType: ChatAccountType
) {
  const cleanPartnerId = partnerId.trim();

  if (!cleanPartnerId) {
    throw new Error("Conversation partner is required.");
  }

  if (
    cleanPartnerId === currentUser.id &&
    partnerType === currentUser.type
  ) {
    throw new Error("Invalid conversation partner.");
  }

  if (partnerType === "bot") {
    if (cleanPartnerId !== "AI_BOT") {
      throw new Error("Invalid AI assistant account.");
    }
  } else {
    const partnerExists = await verifyParticipant(
      cleanPartnerId,
      partnerType
    );

    if (!partnerExists) {
      throw new Error("Conversation partner not found.");
    }
  }

  const result = await ChatMessage.deleteMany({
    $or: [
      {
        senderId: currentUser.id,
        senderType: currentUser.type,
        receiverId: cleanPartnerId,
        receiverType: partnerType,
      },
      {
        senderId: cleanPartnerId,
        senderType: partnerType,
        receiverId: currentUser.id,
        receiverType: currentUser.type,
      },
    ],
  });

  return {
    deletedCount: result.deletedCount,
  };
}

// 9. Get the AI assistant's welcome message.
export function getAIWelcomeMessage(): string {
  return AI_GREETING;
}