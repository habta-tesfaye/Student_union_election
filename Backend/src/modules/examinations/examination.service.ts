
import { Application } from "../applications/application.model.js";
import { Phase2Evaluation } from "./phase2-evaluation.model.js";

/* =====================================================
   PHASE 1 EXAMINATION
   Original data source: phase1_exam
===================================================== */

type Phase1Input = {
  studentId: string;
  examScore: number;
  maxScore: number;
  status?: "pending" | "passed" | "failed";
  remarks?: string;
};

type Phase1UpdateInput = {
  examScore?: number;
  maxScore?: number;
  status?: "pending" | "passed" | "failed";
  remarks?: string;
  evaluatedBy?: string;
};

export async function getAllPhase1Exams() {
  return Application.find()
    .sort({ createdAt: -1 })
    .lean();
}

export async function getPhase1Exam(studentId: string) {
  return Application.findOne({ studentId }).lean();
}

export async function createPhase1ExamRecord(input: Phase1Input) {
  const { studentId, examScore, maxScore, status, remarks } = input;

  if (
    !studentId ||
    !Number.isFinite(examScore) ||
    !Number.isFinite(maxScore) ||
    maxScore <= 0 ||
    maxScore > 10 ||
    examScore < 0 ||
    examScore > maxScore
  ) {
    throw new Error("Invalid Phase 1 examination score.");
  }

  const application = await Application.findOne({ studentId });

  if (!application) {
    throw new Error(
      "Student application not found. The student must apply before examination."
    );
  }

  application.examScore10 = examScore;

  if (status) {
    application.examStatus = status;
  }

  if (remarks !== undefined) {
    application.set("examRemarks", remarks);
  }

  await application.save();

  return application;
}

export async function updatePhase1ExamRecord(
  studentId: string,
  input: Phase1UpdateInput
) {
  const application = await Application.findOne({ studentId });

  if (!application) {
    throw new Error("Phase 1 examination record not found.");
  }

  const newScore = input.examScore ?? application.examScore10;
  const maxScore = input.maxScore ?? 10;

  if (
    input.examScore !== undefined &&
    (!Number.isFinite(input.examScore) ||
      input.examScore < 0 ||
      input.examScore > maxScore ||
      maxScore > 10)
  ) {
    throw new Error("Invalid Phase 1 examination score.");
  }

  if (input.status !== undefined) {
    application.examStatus = input.status;
  }

  if (input.examScore !== undefined) {
    application.examScore10 = newScore;
  }

  if (input.remarks !== undefined) {
    application.set("examRemarks", input.remarks);
  }

  if (input.evaluatedBy !== undefined) {
    application.set("evaluatedBy", input.evaluatedBy);
  }

  await application.save();

  return application;
}

/* =====================================================
   PHASE 2 EVALUATION
   Original data source: phase2_eval
===================================================== */

type Phase2Input = {
  studentId: string;
  certScore: number;
  proposalScore: number;
  interviewScore: number;
  selectionStatus?: string;
  remarks?: string;
};

type Phase2UpdateInput = {
  certScore?: number;
  proposalScore?: number;
  interviewScore?: number;
  selectionStatus?: string;
  remarks?: string;
};

function validatePhase2Scores(
  certScore: number,
  proposalScore: number,
  interviewScore: number
) {
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

  return certScore + proposalScore + interviewScore;
}

export async function getAllPhase2Evaluations() {
  return Phase2Evaluation.find()
    .sort({ createdAt: -1 })
    .lean();
}

export async function getPhase2Evaluation(studentId: string) {
  return Phase2Evaluation.findOne({ studentId }).lean();
}

export async function createPhase2EvaluationRecord(
  input: Phase2Input
) {
  const {
    studentId,
    certScore,
    proposalScore,
    interviewScore,
    selectionStatus,
  } = input;

  if (!studentId) {
    throw new Error("Student ID is required.");
  }

  const totalScore = validatePhase2Scores(
    certScore,
    proposalScore,
    interviewScore
  );

  const existing = await Phase2Evaluation.findOne({ studentId });

  if (existing) {
    throw new Error(
      "Phase 2 evaluation already exists for this student."
    );
  }

  const evaluation = await Phase2Evaluation.create({
    studentId,
    certScore,
    proposalScore,
    interviewScore,
    totalScore,
    selectionStatus: selectionStatus ?? "pending",
  });

  return evaluation;
}

export async function updatePhase2EvaluationRecord(
  studentId: string,
  input: Phase2UpdateInput
) {
  const evaluation = await Phase2Evaluation.findOne({ studentId });

  if (!evaluation) {
    throw new Error("Phase 2 evaluation record not found.");
  }

  const certScore = input.certScore ?? evaluation.certScore;
  const proposalScore =
    input.proposalScore ?? evaluation.proposalScore;
  const interviewScore =
    input.interviewScore ?? evaluation.interviewScore;

  const totalScore = validatePhase2Scores(
    certScore,
    proposalScore,
    interviewScore
  );

  evaluation.certScore = certScore;
  evaluation.proposalScore = proposalScore;
  evaluation.interviewScore = interviewScore;
  evaluation.totalScore = totalScore;

  if (input.selectionStatus !== undefined) {
    evaluation.selectionStatus = input.selectionStatus;
  }

  await evaluation.save();

  return evaluation;
}

/* =====================================================
   TOP 16 WINNERS SELECTION
   Original PHP: winners_top16.php
===================================================== */

const TOP_16_ELIGIBILITY_FILTER = {
  ssdStatus: "approved",
  examScore10: {
    $type: "number",
  },
};

/**
 * Get SSD-approved students ranked by Phase 1 score.
 */
export async function getTop16Candidates() {
  const applications = await Application.find(
    TOP_16_ELIGIBILITY_FILTER
  )
    .sort({
      examScore10: -1,
      appliedAt: 1,
      studentId: 1,
    })
    .lean();

  return applications.map((application, index) => ({
    ...application,
    rank: index + 1,
  }));
}

/**
 * Finalize Top 16 selection and create Phase 2 records.
 * Existing Phase 2 evaluation scores are preserved.
 */
export async function finalizeTop16Selection() {
  const eligibleApplications = await Application.find(
    TOP_16_ELIGIBILITY_FILTER
  )
    .sort({
      examScore10: -1,
      appliedAt: 1,
      studentId: 1,
    })
    .lean();

  if (eligibleApplications.length === 0) {
    throw new Error(
      "No SSD-approved students with Phase 1 scores are available."
    );
  }

  const selectedStudents = eligibleApplications.slice(0, 16);

  const selectedStudentIds = selectedStudents.map(
    (student) => student.studentId
  );

  let phase2CreatedCount = 0;

  // Create missing Phase 2 records without overwriting existing scores.
  for (const student of selectedStudents) {
    const result = await Phase2Evaluation.updateOne(
      { studentId: student.studentId },
      {
        $setOnInsert: {
          studentId: student.studentId,
          certScore: 0,
          proposalScore: 0,
          interviewScore: 0,
          totalScore: 0,
          selectionStatus: "pending",
        },
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      phase2CreatedCount += 1;
    }
  }

  // Mark eligible students as disqualified first.
  await Application.updateMany(
    TOP_16_ELIGIBILITY_FILTER,
    {
      $set: {
        selectionStatus: "disqualified",
      },
    }
  );

  // Select the highest-scoring 16 students.
  await Application.updateMany(
    {
      studentId: { $in: selectedStudentIds },
      ssdStatus: "approved",
    },
    {
      $set: {
        selectionStatus: "selected_16",
      },
    }
  );

  return {
    eligibleCount: eligibleApplications.length,
    selectedCount: selectedStudents.length,
    phase2CreatedCount,
    selectedStudents: selectedStudents.map(
      (student, index) => ({
        rank: index + 1,
        studentId: student.studentId,
        examScore10: student.examScore10,
        selectionStatus: "selected_16",
      })
    ),
  };
}
