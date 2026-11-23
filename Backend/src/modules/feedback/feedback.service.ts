import { Feedback } from "./feedback.model.js";
import type { FeedbackType } from "./feedback.model.js";

const MAX_OPEN_FEEDBACK = 3;

// 1. Student submits new feedback.
export async function createFeedback(
  studentId: string,
  feedbackType: FeedbackType,
  message: string
) {
  const openFeedbackCount = await Feedback.countDocuments({
    studentId,
    feedbackType,
    isClosed: false,
  });

  if (openFeedbackCount >= MAX_OPEN_FEEDBACK) {
    throw new Error(
      "You already have 3 open feedback requests in this category. Please wait for them to be resolved."
    );
  }

  const feedback = await Feedback.create({
    studentId,
    feedbackType,
    message: message.trim(),
    reply: null,
    replyBy: null,
    status: "pending",
    isClosed: false,
    feedbackCount: 1,
    satisfaction: "pending",
    repliedAt: null,
  });

  return feedback;
}

// 2. Student views only their own feedback history.
export async function getMyFeedback(studentId: string) {
  return Feedback.find({ studentId }).sort({
    createdAt: -1,
  });
}

// 3. Director views all feedback.
// Original PHP ordering:
// - Not satisfied feedback first.
// - Open feedback before closed feedback.
// - Pending status before replied status.
// - Newest feedback first.
export async function getAllFeedback() {
  return Feedback.aggregate([
    {
      $addFields: {
        notSatisfiedPriority: {
          $cond: [
            { $eq: ["$satisfaction", "not_satisfied"] },
            1,
            0,
          ],
        },
      },
    },
    {
      $sort: {
        notSatisfiedPriority: -1,
        isClosed: 1,
        status: 1,
        createdAt: -1,
      },
    },
    {
      $project: {
        notSatisfiedPriority: 0,
      },
    },
  ]);
}

// 4. Director replies to student feedback.
export async function replyToFeedback(
  feedbackId: string,
  directorId: string,
  replyText: string
) {
  const feedback = await Feedback.findById(feedbackId);

  if (!feedback) {
    throw new Error("Feedback not found.");
  }

  if (feedback.isClosed || feedback.satisfaction === "satisfied") {
    throw new Error("This feedback has already been resolved.");
  }

  feedback.reply = replyText.trim();
  feedback.replyBy = directorId;
  feedback.status = "replied";
  feedback.satisfaction = "pending";
  feedback.repliedAt = new Date();

  await feedback.save();

  return feedback;
}

// 5. Student marks a Director's reply as satisfactory.
export async function markFeedbackSatisfied(
  feedbackId: string,
  studentId: string
) {
  const feedback = await Feedback.findOne({
    _id: feedbackId,
    studentId,
  });

  if (!feedback) {
    throw new Error("Feedback not found.");
  }

  if (feedback.status !== "replied" || feedback.isClosed) {
    throw new Error("There is no pending reply to review.");
  }

  feedback.satisfaction = "satisfied";
  feedback.isClosed = true;

  await feedback.save();

  return feedback;
}

// 6. Student is not satisfied and reopens feedback.
export async function markFeedbackNotSatisfied(
  feedbackId: string,
  studentId: string,
  additionalMessage: string
) {
  const feedback = await Feedback.findOne({
    _id: feedbackId,
    studentId,
  });

  if (!feedback) {
    throw new Error("Feedback not found.");
  }

  if (feedback.status !== "replied" || feedback.isClosed) {
    throw new Error("There is no pending reply to review.");
  }

  feedback.message =
    `${feedback.message}\n\n-- RE-OPENED: ${additionalMessage.trim()}`;

  feedback.status = "pending";
  feedback.satisfaction = "not_satisfied";
  feedback.isClosed = false;

  await feedback.save();

  return feedback;
}

// 7. Director permanently deletes a feedback record.
export async function deleteFeedback(feedbackId: string) {
  const feedback = await Feedback.findByIdAndDelete(feedbackId);

  if (!feedback) {
    throw new Error("Feedback not found.");
  }

  return feedback;
}