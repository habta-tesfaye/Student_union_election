
import type { Request, Response } from "express";

import {
  getParliamentCandidatesForStudent,
  submitParliamentScoreRecord,
  getParliamentResultsData,
} from "./parliament.service.js";

/**
 * Display Parliament candidates available for evaluation.
 */
export async function getParliamentCandidates(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const studentId = req.user?.studentId;

    if (!studentId) {
      res.status(403).json({
        success: false,
        message:
          "Only authenticated student accounts can access this resource.",
      });
      return;
    }

    const candidates =
      await getParliamentCandidatesForStudent(studentId);

    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates,
    });
  } catch (error) {
    console.error("Get Parliament candidates error:", error);

    const message =
      error instanceof Error ? error.message : "";

    if (message.toLowerCase().includes("not eligible")) {
      res.status(403).json({
        success: false,
        message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Unable to retrieve Parliament candidates.",
    });
  }
}

/**
 * Submit a Parliament evaluation score.
 */
export async function submitParliamentScore(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const voterId = req.user?.studentId;

    if (!voterId) {
      res.status(403).json({
        success: false,
        message:
          "Only authenticated student accounts can submit scores.",
      });
      return;
    }

    const { candidateId, score } = req.body as {
      candidateId?: unknown;
      score?: unknown;
    };

    if (
      typeof candidateId !== "string" ||
      candidateId.trim().length === 0
    ) {
      res.status(400).json({
        success: false,
        message: "Candidate ID is required.",
      });
      return;
    }

    if (
      typeof score !== "number" ||
      !Number.isFinite(score) ||
      score < 0 ||
      score > 60
    ) {
      res.status(400).json({
        success: false,
        message: "Score must be a number between 0 and 60.",
      });
      return;
    }

    const result = await submitParliamentScoreRecord(
      voterId,
      candidateId.trim(),
      score
    );

    res.status(201).json({
      success: true,
      message: "Parliament score submitted successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Submit Parliament score error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to submit Parliament score.";

    const normalizedMessage = message.toLowerCase();

    let statusCode = 500;

    if (normalizedMessage.includes("already")) {
      statusCode = 409;
    } else if (normalizedMessage.includes("not found")) {
      statusCode = 404;
    } else if (
      normalizedMessage.includes("not allowed") ||
      normalizedMessage.includes("not eligible")
    ) {
      statusCode = 403;
    } else if (normalizedMessage.includes("must be between")) {
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      message:
        statusCode === 500
          ? "Unable to submit Parliament score."
          : message,
    });
  }
}

/**
 * Display Parliament results.
 */
export async function getParliamentResults(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const results = await getParliamentResultsData();

    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error("Get Parliament results error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve Parliament results.",
    });
  }
}
