import { Application } from "../applications/application.model.js";
import { Phase2Evaluation } from "./phase2-evaluation.model.js";

/* =====================================================
   PHASE 1 EXAMINATION
   Original PHP collection: phase1_exam
===================================================== */

export async function getAllPhase1Exams() {
  return Application.find()
    .sort({ createdAt: -1 })
    .lean();
}

export async function getPhase1Exam(studentId: string) {
  return Application.findOne({ studentId }).lean();
}

export async function createPhase1ExamRecord(input: {
  studentId: string;
  examScore: number;
  maxScore: number;
  status?: "pending" | "passed" | "failed";
  remarks?: string;
}) {
  if (
    !Number.isFinite(input.examScore) ||
    !Number.isFinite(input.maxScore) ||
    input.examScore < 0 ||
    input.maxScore !== 10 ||
    input.examScore > 10
  ) {
    throw new Error(
      "Invalid Phase 1 examination score. The maximum score is 10."
    );
  }

  const application = await Application.findOne({
    studentId: input.studentId,
  });

  if (!application) {
    throw new Error(
      "Student application not found. The student must apply before examination."
    );
  }

  if (application.examScore10 !== undefined) {
    throw new Error(
      "This student already has a Phase 1 examination record."
    );
  }

  application.examScore10 = input.examScore;
  application.examStatus = input.status ?? "pending";
  application.examRemarks = input.remarks;

  await application.save();

  return application;
}

export async function updatePhase1ExamRecord(
  studentId: string,
  input: {
    examScore?: number;
    maxScore?: number;
    status?: "pending" | "passed" | "failed";
    remarks?: string;
    evaluatedBy?: string;
  }
) {
  const application = await Application.findOne({ studentId });

  if (!application) {
    throw new Error("Phase 1 examination record not found.");
  }

  if (
    input.maxScore !== undefined &&
    input.maxScore !== 10
  ) {
    throw new Error(
      "Phase 1 examination maximum score must be 10."
    );
  }

  const examScore = input.examScore ?? application.examScore10;

  if (
    examScore === undefined ||
    !Number.isFinite(examScore) ||
    examScore < 0 ||
    examScore > 10
  ) {
    throw new Error(
      "Invalid Phase 1 examination score. Score must be between 0 and 10."
    );
  }

  if (input.examScore !== undefined) {
    application.examScore10 = input.examScore;
  }

  if (input.status !== undefined) {
    application.examStatus = input.status;
  }

  if (input.remarks !== undefined) {
    application.examRemarks = input.remarks;
  }

  if (input.evaluatedBy !== undefined) {
    application.examEvaluatedBy = input.evaluatedBy;
  }

  application.examEvaluatedAt = new Date();

  await application.save();

  return application;
}

/* =====================================================
   PHASE 2 EVALUATION
===================================================== */

export async function getAllPhase2Evaluations() {
  return Phase2Evaluation.find()
    .sort({ createdAt: -1 })
    .lean();
}

export async function getPhase2Evaluation(studentId: string) {
  return Phase2Evaluation.findOne({ studentId }).lean();
}

export async function createPhase2EvaluationRecord(input: {
  studentId: string;
  certScore: number;
  proposalScore: number;
  interviewScore: number;
  selectionStatus?: string;
  remarks?: string;
}) {
  if (
    !Number.isFinite(input.certScore) ||
    !Number.isFinite(input.proposalScore) ||
    !Number.isFinite(input.interviewScore) ||
    input.certScore < 0 ||
    input.certScore > 5 ||
    input.proposalScore < 0 ||
    input.proposalScore > 15 ||
    input.interviewScore < 0 ||
    input.interviewScore > 10
  ) {
    throw new Error(
      "Invalid Phase 2 scores. Certificate: 0-5, Proposal: 0-15, Interview: 0-10."
    );
  }

  const existing = await Phase2Evaluation.findOne({
    studentId: input.studentId,
  });

  if (existing) {
    throw new Error(
      "This student already has a Phase 2 evaluation record."
    );
  }

  return Phase2Evaluation.create({
    ...input,
    totalScore:
      input.certScore +
      input.proposalScore +
      input.interviewScore,
    selectionStatus: input.selectionStatus ?? "pending",
  });
}

export async function updatePhase2EvaluationRecord(
  studentId: string,
  input: {
    certScore?: number;
    proposalScore?: number;
    interviewScore?: number;
    selectionStatus?: string;
    remarks?: string;
    evaluatedBy?: string;
  }
) {
  const evaluation = await Phase2Evaluation.findOne({
    studentId,
  });

  if (!evaluation) {
    throw new Error("Phase 2 evaluation record not found.");
  }

  const certScore = input.certScore ?? evaluation.certScore;
  const proposalScore =
    input.proposalScore ?? evaluation.proposalScore;
  const interviewScore =
    input.interviewScore ?? evaluation.interviewScore;

  if (
    !Number.isFinite(certScore) ||
    !Number.isFinite(proposalScore) ||
    !Number.isFinite(interviewScore) ||
    certScore < 0 ||
    certScore > 5 ||
    proposalScore < 0 ||
    proposalScore > 15 ||
    interviewScore < 0 ||
    interviewScore > 10
  ) {
    throw new Error(
      "Invalid Phase 2 scores. Certificate: 0-5, Proposal: 0-15, Interview: 0-10."
    );
  }

  Object.assign(evaluation, {
    ...input,
    totalScore: certScore + proposalScore + interviewScore,
  });

  evaluation.evaluatedAt = new Date();

  await evaluation.save();

  return evaluation;
}