
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
  getTop16Candidates,
  finalizeTop16Selection,
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
   TOP 16 WINNERS MANAGEMENT
   Original PHP: winners_top16.php
===================================================== */

export async function getTop16Winners(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const candidates = await getTop16Candidates();

    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates,
    });
  } catch (error) {
    console.error("Get Top 16 candidates error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve Top 16 candidates.",
    });
  }
}

export async function finalizeTop16Winners(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const result = await finalizeTop16Selection();

    res.status(200).json({
      success: true,
      message:
        "Top 16 selected successfully and moved to Phase 2 Evaluation.",
      data: result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown error";

    console.error("Finalize Top 16 selection error:", error);

    const statusCode = message.startsWith("No SSD-approved")
      ? 400
      : 500;

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
}

/* =====================================================
   PHASE 2 EVALUATION
===================================================== */

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

    const statusCode = message.includes("already exists") ? 409 : 400;

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
}

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

export async function getMyPhase2Evaluation(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (
      req.user?.accountType !== "student" ||
      req.user.role !== "candidate" ||
      !req.user.studentId
    ) {
      res.status(403).json({
        success: false,
        message: "Only candidates can access their own evaluation.",
      });
      return;
    }

    const evaluation = await getPhase2Evaluation(
      req.user.studentId
    );

    if (!evaluation) {
      res.status(404).json({
        success: false,
        message: "Your Phase 2 evaluation record has not been created yet.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: evaluation,
    });
  } catch (error) {
    console.error("Get my Phase 2 evaluation error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve your Phase 2 evaluation.",
    });
  }
}
