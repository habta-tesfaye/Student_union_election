
import type { Request, Response } from "express";

import {
  getAllPhase1Exams,
  getPhase1Exam,
  createPhase1ExamRecord,
  updatePhase1ExamRecord,
  getAllPhase2Evaluations,
  getPhase2Evaluation,
  createPhase2EvaluationRecord,
  updatePhase2EvaluationRecord,
} from "./examination.service.js";

/**
 * Safely read the student ID from Express route parameters.
 */
function getStudentIdParam(req: Request): string {
  const studentId = req.params.studentId;

  return Array.isArray(studentId)
    ? studentId[0] ?? ""
    : studentId;
}

/* =====================================================
   PHASE 1 EXAMINATION
===================================================== */

/**
 * Get all Phase 1 examination records.
 */
export async function getPhase1Exams(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const exams = await getAllPhase1Exams();

    res.status(200).json({
      success: true,
      count: exams.length,
      data: exams,
    });
  } catch (error) {
    console.error("Get Phase 1 exams error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve Phase 1 examination records.",
    });
  }
}

/**
 * Get one Phase 1 examination by student ID.
 */
export async function getPhase1ExamByStudentId(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const exam = await getPhase1Exam(getStudentIdParam(req));

    if (!exam) {
      res.status(404).json({
        success: false,
        message: "Phase 1 examination record not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: exam,
    });
  } catch (error) {
    console.error("Get Phase 1 exam error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve the examination record.",
    });
  }
}

/**
 * Create a Phase 1 examination record.
 */
export async function createPhase1Exam(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const {
      studentId,
      examScore,
      maxScore,
      status,
      remarks,
    } = req.body;

    if (
      typeof studentId !== "string" ||
      !studentId.trim() ||
      typeof examScore !== "number" ||
      !Number.isFinite(examScore) ||
      typeof maxScore !== "number" ||
      !Number.isFinite(maxScore)
    ) {
      res.status(400).json({
        success: false,
        message: "Student ID, exam score, and maximum score are required.",
      });
      return;
    }

    const exam = await createPhase1ExamRecord({
      studentId: studentId.trim(),
      examScore,
      maxScore,
      status,
      remarks,
    });

    res.status(201).json({
      success: true,
      message: "Phase 1 examination record created successfully.",
      data: exam,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    const statusCode = message.includes("already has") ? 409 : 400;

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
}

/**
 * Update a Phase 1 examination record.
 */
export async function updatePhase1Exam(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const {
      examScore,
      maxScore,
      status,
      remarks,
    } = req.body;

    const exam = await updatePhase1ExamRecord(
      getStudentIdParam(req),
      {
        examScore,
        maxScore,
        status,
        remarks,
        evaluatedBy: req.user?.staffId,
      }
    );

    res.status(200).json({
      success: true,
      message: "Phase 1 examination record updated successfully.",
      data: exam,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    const statusCode = message.includes("not found") ? 404 : 400;

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
}

/* =====================================================
   PHASE 2 EVALUATION
===================================================== */

/**
 * Get all Phase 2 evaluation records.
 */
export async function getPhase2Evaluations(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const evaluations = await getAllPhase2Evaluations();

    res.status(200).json({
      success: true,
      count: evaluations.length,
      data: evaluations,
    });
  } catch (error) {
    console.error("Get Phase 2 evaluations error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve Phase 2 evaluation records.",
    });
  }
}

/**
 * Get one Phase 2 evaluation by student ID.
 */
export async function getPhase2EvaluationByStudentId(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const evaluation = await getPhase2Evaluation(
      getStudentIdParam(req)
    );

    if (!evaluation) {
      res.status(404).json({
        success: false,
        message: "Phase 2 evaluation record not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: evaluation,
    });
  } catch (error) {
    console.error("Get Phase 2 evaluation error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve the Phase 2 evaluation record.",
    });
  }
}

/**
 * Create a Phase 2 evaluation record.
 *
 * Original PHP scoring:
 * Certificate: 0-5
 * Proposal:    0-15
 * Interview:   0-10
 * Total:       0-30
 */
export async function createPhase2Evaluation(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const {
      studentId,
      certScore,
      proposalScore,
      interviewScore,
      selectionStatus,
      remarks,
    } = req.body;

    if (
      typeof studentId !== "string" ||
      !studentId.trim() ||
      typeof certScore !== "number" ||
      !Number.isFinite(certScore) ||
      typeof proposalScore !== "number" ||
      !Number.isFinite(proposalScore) ||
      typeof interviewScore !== "number" ||
      !Number.isFinite(interviewScore)
    ) {
      res.status(400).json({
        success: false,
        message:
          "Student ID, certificate score, proposal score, and interview score are required.",
      });
      return;
    }

    const evaluation = await createPhase2EvaluationRecord({
      studentId: studentId.trim(),
      certScore,
      proposalScore,
      interviewScore,
      selectionStatus,
      remarks,
    });

    res.status(201).json({
      success: true,
      message: "Phase 2 evaluation created successfully.",
      data: evaluation,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    const statusCode = message.includes("already has") ? 409 : 400;

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
}

/**
 * Update a Phase 2 evaluation record.
 */
export async function updatePhase2Evaluation(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const {
      certScore,
      proposalScore,
      interviewScore,
      selectionStatus,
      remarks,
    } = req.body;

    const evaluation = await updatePhase2EvaluationRecord(
      getStudentIdParam(req),
      {
        certScore,
        proposalScore,
        interviewScore,
        selectionStatus,
        remarks,
        evaluatedBy: req.user?.staffId,
      }
    );

    res.status(200).json({
      success: true,
      message: "Phase 2 evaluation updated successfully.",
      data: evaluation,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    const statusCode = message.includes("not found") ? 404 : 400;

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
}
