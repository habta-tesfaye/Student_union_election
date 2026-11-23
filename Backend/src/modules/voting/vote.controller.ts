import type { Request, Response } from "express";
import { castStudentVote } from "./vote.service.js";

/**
 * Cast a vote for a candidate.
 * Only authenticated students can vote.
 */
export async function castVote(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // 1. Ensure the authenticated user is a student.
    if (!req.user?.studentId) {
      res.status(403).json({
        success: false,
        message: "Only students can cast votes.",
      });
      return;
    }

    // 2. Validate candidate ID.
    const { candidate_id } = req.body as {
      candidate_id?: string;
    };

    if (
      typeof candidate_id !== "string" ||
      !candidate_id.trim()
    ) {
      res.status(400).json({
        success: false,
        message: "Candidate ID is required.",
      });
      return;
    }

    // 3. Record the vote.
    const vote = await castStudentVote(
      req.user.studentId,
      candidate_id.trim()
    );

    // 4. Return successful response.
    res.status(201).json({
      success: true,
      message: "Your vote has been recorded successfully.",
      data: {
        candidate_id: vote.candidate_id,
        voted_at: vote.voted_at,
      },
    });
  } catch (error) {
    // 5. Handle MongoDB duplicate-key errors.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      res.status(409).json({
        success: false,
        message: "You have already voted.",
      });
      return;
    }

    const message =
      error instanceof Error
        ? error.message
        : "Voting failed.";

    // 6. Handle duplicate voting.
    if (message === "You have already voted.") {
      res.status(409).json({
        success: false,
        message,
      });
      return;
    }

    // 7. Handle missing records.
    const notFoundMessages = [
      "Student profile not found.",
      "Selected candidate was not found.",
      "Candidate student profile not found.",
    ];

    if (notFoundMessages.includes(message)) {
      res.status(404).json({
        success: false,
        message,
      });
      return;
    }

    // 8. Handle invalid voting conditions.
    const badRequestMessages = [
      "Class voting is currently closed.",
      "Your department or year section is not configured.",
    ];

    if (
      badRequestMessages.includes(message) ||
      message.startsWith("You can only vote")
    ) {
      res.status(400).json({
        success: false,
        message,
      });
      return;
    }

    // 9. Handle unexpected errors.
    res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while recording your vote.",
    });
  }
}