
import type { Request, Response } from "express";

import type { AuthenticatedUser } from "../auth/auth.types.js";

import {
  createFeedback,
  getMyFeedback,
  getAllFeedback,
  replyToFeedback,
  markFeedbackSatisfied,
  markFeedbackNotSatisfied,
  deleteFeedback,
} from "./feedback.service.js";

import {
  createFeedbackSchema,
  replyFeedbackSchema,
  feedbackSatisfactionSchema,
  feedbackIdSchema,
} from "./feedback.validation.js";

// Get the authenticated user.
function getAuthenticatedUser(req: Request): AuthenticatedUser {
  return (req as Request & { user: AuthenticatedUser }).user;
}

// Get and validate feedback ID.
function getFeedbackId(req: Request): string {
  const result = feedbackIdSchema.safeParse(req.params.feedbackId);

  if (!result.success) {
    throw new Error("Invalid feedback ID.");
  }

  return result.data;
}

// Handle errors consistently.
function handleError(res: Response, error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "An unexpected error occurred.";

  const status =
    message === "Feedback not found." ||
    message === "Invalid feedback ID."
      ? 404
      : message.includes("already have 3 open") ||
          message.includes("already been resolved") ||
          message.includes("no pending reply")
        ? 409
        : 400;

  return res.status(status).json({
    success: false,
    message,
  });
}

// 1. Student submits feedback.
export async function createFeedbackController(
  req: Request,
  res: Response
) {
  try {
    const user = getAuthenticatedUser(req);

    if (!user.studentId) {
      return res.status(403).json({
        success: false,
        message: "Student account required.",
      });
    }

    const validation = createFeedbackSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback information.",
        errors: validation.error.flatten(),
      });
    }

    const feedback = await createFeedback(
      user.studentId,
      validation.data.feedbackType,
      validation.data.message
    );

    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully.",
      data: { feedback },
    });
  } catch (error) {
    return handleError(res, error);
  }
}

// 2. Student views own feedback.
export async function getMyFeedbackController(
  req: Request,
  res: Response
) {
  try {
    const user = getAuthenticatedUser(req);

    if (!user.studentId) {
      return res.status(403).json({
        success: false,
        message: "Student account required.",
      });
    }

    const feedback = await getMyFeedback(user.studentId);

    return res.status(200).json({
      success: true,
      data: {
        feedback,
        count: feedback.length,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
}

// 3. Director views all feedback.
export async function getAllFeedbackController(
  _req: Request,
  res: Response
) {
  try {
    const feedback = await getAllFeedback();

    return res.status(200).json({
      success: true,
      data: {
        feedback,
        count: feedback.length,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
}

// 4. Director replies to feedback.
export async function replyToFeedbackController(
  req: Request,
  res: Response
) {
  try {
    const user = getAuthenticatedUser(req);

    if (!user.staffId) {
      return res.status(403).json({
        success: false,
        message: "Director staff account required.",
      });
    }

    const feedbackId = getFeedbackId(req);

    const validation = replyFeedbackSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid reply information.",
        errors: validation.error.flatten(),
      });
    }

    const feedback = await replyToFeedback(
      feedbackId,
      user.staffId,
      validation.data.reply
    );

    return res.status(200).json({
      success: true,
      message: "Feedback reply sent successfully.",
      data: { feedback },
    });
  } catch (error) {
    return handleError(res, error);
  }
}

// 5. Student marks feedback as satisfied.
export async function markFeedbackSatisfiedController(
  req: Request,
  res: Response
) {
  try {
    const user = getAuthenticatedUser(req);

    if (!user.studentId) {
      return res.status(403).json({
        success: false,
        message: "Student account required.",
      });
    }

    const feedbackId = getFeedbackId(req);

    const validation = feedbackSatisfactionSchema.safeParse(req.body);

    if (
      !validation.success ||
      validation.data.satisfaction !== "satisfied"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid satisfaction information.",
      });
    }

    const feedback = await markFeedbackSatisfied(
      feedbackId,
      user.studentId
    );

    return res.status(200).json({
      success: true,
      message: "Feedback marked as satisfied and closed.",
      data: { feedback },
    });
  } catch (error) {
    return handleError(res, error);
  }
}

// 6. Student marks feedback as not satisfied.
export async function markFeedbackNotSatisfiedController(
  req: Request,
  res: Response
) {
  try {
    const user = getAuthenticatedUser(req);

    if (!user.studentId) {
      return res.status(403).json({
        success: false,
        message: "Student account required.",
      });
    }

    const feedbackId = getFeedbackId(req);

    // Validate satisfaction separately.
    // additionalMessage is intentionally excluded here
    // because feedbackSatisfactionSchema uses strict validation.
    const validation = feedbackSatisfactionSchema.safeParse({
      satisfaction: req.body.satisfaction,
    });

    if (
      !validation.success ||
      validation.data.satisfaction !== "not_satisfied"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid satisfaction information.",
      });
    }

    const additionalMessage =
      typeof req.body.additionalMessage === "string"
        ? req.body.additionalMessage.trim()
        : "";

    if (
      additionalMessage.length < 5 ||
      additionalMessage.length > 10000
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Additional message must contain 5 to 10000 characters.",
      });
    }

    const feedback = await markFeedbackNotSatisfied(
      feedbackId,
      user.studentId,
      additionalMessage
    );

    return res.status(200).json({
      success: true,
      message: "Feedback reopened and sent back to the Director.",
      data: { feedback },
    });
  } catch (error) {
    return handleError(res, error);
  }
}

// 7. Director deletes feedback.
export async function deleteFeedbackController(
  req: Request,
  res: Response
) {
  try {
    const feedbackId = getFeedbackId(req);

    await deleteFeedback(feedbackId);

    return res.status(200).json({
      success: true,
      message: "Feedback deleted successfully.",
    });
  } catch (error) {
    return handleError(res, error);
  }
}
