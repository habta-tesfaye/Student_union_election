
import mongoose from "mongoose";

import { Application } from "../applications/application.model.js";
import { Phase2Evaluation } from "../examinations/phase2-evaluation.model.js";
import { ElectionSchedule } from "../elections/election.model.js";
import { StudentAccount } from "../auth/auth.model.js";
import { Candidate } from "../candidates/candidate.model.js";

import { Phase3Parliament } from "./phase3-parliament.model.js";
import { ParliamentVote } from "./parliament-vote.model.js";

/**
 * Synchronize Phase 2 selected_8 students into Phase 3.
 *
 * Original PHP calculation:
 * Application examination score (10)
 * + Certificate score (5)
 * + Proposal score (15)
 * + Interview score (10)
 * = Pre-Parliament score (40)
 */
async function syncSelectedParliamentCandidates(): Promise<void> {
  const selectedStudents = await Phase2Evaluation.find({
    selectionStatus: "selected_8",
  }).lean();

  for (const phase2 of selectedStudents) {
    // The original PHP migration reads exam_score_10
    // from the phase1_exam application table.
    const application = await Application.findOne({
      studentId: phase2.studentId,
    })
      .select("studentId examScore10")
      .lean();

    if (
      !application ||
      typeof application.examScore10 !== "number"
    ) {
      continue;
    }

    const preParliamentScore =
      application.examScore10 +
      phase2.certScore +
      phase2.proposalScore +
      phase2.interviewScore;

    if (
      !Number.isFinite(preParliamentScore) ||
      application.examScore10 < 0 ||
      application.examScore10 > 10 ||
      preParliamentScore < 0 ||
      preParliamentScore > 40
    ) {
      continue;
    }

    let phase3Record = await Phase3Parliament.findOne({
      student_id: phase2.studentId,
    });

    if (phase3Record) {
      phase3Record.pre_parliament_40 = preParliamentScore;

      // Preserve the existing Parliament score and selection status.
      phase3Record.total_score_100 =
        preParliamentScore + phase3Record.parliament_score_60;

      await phase3Record.save();
    } else {
      await Phase3Parliament.create({
        student_id: phase2.studentId,
        pre_parliament_40: preParliamentScore,
        parliament_score_60: 0,
        total_score_100: preParliamentScore,
        final_selection_status: "pending",
      });
    }
  }
}

/**
 * Check whether Parliament voting is currently open.
 */
async function isParliamentVotingOpen(): Promise<boolean> {
  const schedule = await ElectionSchedule.findOne({
    stage_name: "vote_parliament",
    is_active: true,
  }).lean();

  if (!schedule) {
    return false;
  }

  const now = new Date();

  return (
    now >= new Date(schedule.start_time) &&
    now <= new Date(schedule.end_time)
  );
}

/**
 * Get the top eight Parliament candidates.
 */
async function getTopParliamentCandidates() {
  return Phase3Parliament.find()
    .sort({ pre_parliament_40: -1 })
    .limit(8)
    .lean();
}

/**
 * Verify that a student is among the selected eight.
 */
async function verifyParliamentVoter(
  studentId: string
): Promise<void> {
  const [phase2, phase3] = await Promise.all([
    Phase2Evaluation.findOne({
      studentId,
      selectionStatus: "selected_8",
    }).lean(),

    Phase3Parliament.findOne({
      student_id: studentId,
    }).lean(),
  ]);

  if (!phase2 || !phase3) {
    throw new Error(
      "You are not eligible to participate in Parliament voting."
    );
  }
}

/**
 * Get Parliament candidates for an eligible student.
 */
export async function getParliamentCandidatesForStudent(
  voterId: string
) {
  await syncSelectedParliamentCandidates();
  await verifyParliamentVoter(voterId);

  const candidates = await getTopParliamentCandidates();
  const votingOpen = await isParliamentVotingOpen();

  const candidateIds = candidates.map(
    (candidate) => candidate.student_id
  );

  const [students, candidatePhotos, previousVotes] =
    await Promise.all([
      StudentAccount.find({
        studentId: { $in: candidateIds },
      })
        .select(
          "studentId firstName middleName lastName department yearSection"
        )
        .lean(),

      Candidate.find({
        studentId: { $in: candidateIds },
      })
        .select("studentId photo")
        .lean(),

      ParliamentVote.find({
        voter_id: voterId,
        candidate_id: { $in: candidateIds },
      }).lean(),
    ]);

  const studentMap = new Map(
    students.map((student) => [student.studentId, student])
  );

  const photoMap = new Map(
    candidatePhotos.map((candidate) => [
      candidate.studentId,
      candidate.photo,
    ])
  );

  const voteMap = new Map(
    previousVotes.map((vote) => [
      vote.candidate_id,
      vote.score_given,
    ])
  );

  return candidates.map((candidate) => {
    const student = studentMap.get(candidate.student_id);

    return {
      studentId: candidate.student_id,
      firstName: student?.firstName ?? "",
      middleName: student?.middleName ?? "",
      lastName: student?.lastName ?? "",
      department: student?.department ?? "",
      yearSection: student?.yearSection ?? "",
      photo: photoMap.get(candidate.student_id) ?? "",
      preParliamentScore: candidate.pre_parliament_40,
      parliamentScore: candidate.parliament_score_60,
      totalScore: candidate.total_score_100,
      hasScored: voteMap.has(candidate.student_id),
      savedScore: voteMap.get(candidate.student_id) ?? null,
      votingOpen,
    };
  });
}

/**
 * Submit a Parliament score for a candidate.
 *
 * Original PHP rules:
 * - Voter must be an eligible Parliament candidate.
 * - Schedule must be open.
 * - Candidate must be in the top eight.
 * - Score must be between 0 and 60.
 * - One score per voter per candidate.
 * - Candidate Parliament score is the average of received scores.
 *
 * MongoDB transactions are not used because the current database
 * is running as a standalone server.
 */
export async function submitParliamentScoreRecord(
  voterId: string,
  candidateId: string,
  score: number
) {
  if (
    !Number.isFinite(score) ||
    score < 0 ||
    score > 60
  ) {
    throw new Error("Score must be between 0 and 60.");
  }

  await syncSelectedParliamentCandidates();
  await verifyParliamentVoter(voterId);

  const votingOpen = await isParliamentVotingOpen();

  if (!votingOpen) {
    throw new Error(
      "Parliament voting is not allowed at this time."
    );
  }

  const topCandidates = await getTopParliamentCandidates();

  const candidate = topCandidates.find(
    (item) => item.student_id === candidateId
  );

  if (!candidate) {
    throw new Error("Parliament candidate not found.");
  }

  const existingVote = await ParliamentVote.findOne({
    voter_id: voterId,
    candidate_id: candidateId,
  });

  if (existingVote) {
    throw new Error(
      "You have already scored this candidate."
    );
  }

  let insertedVote;

  try {
    insertedVote = await ParliamentVote.create({
      voter_id: voterId,
      candidate_id: candidateId,
      score_given: score,
    });
  } catch (error) {
    if (
      error instanceof mongoose.mongo.MongoServerError &&
      error.code === 11000
    ) {
      throw new Error(
        "You have already scored this candidate."
      );
    }

    throw error;
  }

  try {
    const votes = await ParliamentVote.find({
      candidate_id: candidateId,
    })
      .select("score_given")
      .lean();

    const averageScore =
      votes.reduce(
        (total, vote) => total + vote.score_given,
        0
      ) / votes.length;

    const phase3Record = await Phase3Parliament.findOne({
      student_id: candidateId,
    });

    if (!phase3Record) {
      throw new Error(
        "Parliament candidate record not found."
      );
    }

    phase3Record.parliament_score_60 = averageScore;

    // Phase 3 pre-validation recalculates the total score.
    await phase3Record.save();

    return {
      voterId,
      candidateId,
      scoreGiven: score,
      candidateParliamentScore:
        phase3Record.parliament_score_60,
      candidateTotalScore:
        phase3Record.total_score_100,
    };
  } catch (error) {
    // Compensating rollback if the score update fails.
    await ParliamentVote.deleteOne({
      _id: insertedVote._id,
    });

    throw error;
  }
}

/**
 * Get Parliament results.
 *
 * Final selection status is displayed as stored.
 * No President or Executive assignments are invented here.
 */
export async function getParliamentResultsData() {
  await syncSelectedParliamentCandidates();

  const results = await Phase3Parliament.find()
    .sort({
      total_score_100: -1,
      pre_parliament_40: -1,
    })
    .lean();

  const studentIds = results.map(
    (result) => result.student_id
  );

  const [students, candidatePhotos] = await Promise.all([
    StudentAccount.find({
      studentId: { $in: studentIds },
    })
      .select(
        "studentId firstName middleName lastName department yearSection"
      )
      .lean(),

    Candidate.find({
      studentId: { $in: studentIds },
    })
      .select("studentId photo")
      .lean(),
  ]);

  const studentMap = new Map(
    students.map((student) => [student.studentId, student])
  );

  const photoMap = new Map(
    candidatePhotos.map((candidate) => [
      candidate.studentId,
      candidate.photo,
    ])
  );

  return results.map((result) => {
    const student = studentMap.get(result.student_id);

    return {
      studentId: result.student_id,
      firstName: student?.firstName ?? "",
      middleName: student?.middleName ?? "",
      lastName: student?.lastName ?? "",
      department: student?.department ?? "",
      yearSection: student?.yearSection ?? "",
      photo: photoMap.get(result.student_id) ?? "",
      preParliamentScore: result.pre_parliament_40,
      parliamentScore: result.parliament_score_60,
      totalScore: result.total_score_100,
      finalSelectionStatus: result.final_selection_status,
    };
  });
}
