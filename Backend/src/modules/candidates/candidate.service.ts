import { Candidate } from "./candidate.model.js";
import { StudentAccount } from "../auth/auth.model.js";
import { Vote } from "../voting/vote.model.js";

/**
 * Create an official candidate.
 * Used when a nominated student accepts their nomination.
 */
export async function createCandidate(
  studentId: string,
  photo: string
) {
  const existingCandidate = await Candidate.findOne({ studentId });

  if (existingCandidate) {
    throw new Error("This student is already an official candidate.");
  }

  const student = await StudentAccount.findOne({ studentId });

  if (!student) {
    throw new Error("Student account not found.");
  }

  return Candidate.create({
    studentId,
    photo,
  });
}

/**
 * Get candidates and their student information
 * for a particular department and year section.
 */
export async function getCandidatesBySection(
  department: string,
  yearSection: string
) {
  const students = await StudentAccount.find({
    department,
    yearSection,
  })
    .select(
      "studentId firstName middleName lastName department yearSection gpa"
    )
    .lean();

  const studentIds = students.map((student) => student.studentId);

  const candidates = await Candidate.find({
    studentId: { $in: studentIds },
  })
    .sort({ createdAt: -1 })
    .lean();

  return candidates.map((candidate) => ({
    ...candidate,
    student:
      students.find(
        (student) => student.studentId === candidate.studentId
      ) ?? null,
  }));
}

/**
 * Get one official candidate with the associated student information.
 */
export async function getCandidateByStudentId(studentId: string) {
  const candidate = await Candidate.findOne({ studentId }).lean();

  if (!candidate) {
    return null;
  }

  const student = await StudentAccount.findOne({ studentId })
    .select(
      "studentId firstName middleName lastName department yearSection gpa"
    )
    .lean();

  return {
    ...candidate,
    student,
  };
}

/**
 * Manually select a class-election winner only when the candidate
 * is tied for the highest vote count in their department, section,
 * and gender group.
 *
 * The department must come from the authenticated Department Head.
 */
export async function setManualClassWinner(
  department: string,
  yearSection: string,
  studentId: string
) {
  const student = await StudentAccount.findOne({
    studentId,
    department,
    yearSection,
  })
    .select("studentId gender")
    .lean();

  if (!student) {
    throw new Error(
      "The candidate does not belong to your department and selected section."
    );
  }

  const isMale = (student.gender ?? "").toLowerCase() === "male";

  const students = await StudentAccount.find({
    department,
    yearSection,
  })
    .select("studentId gender")
    .lean();

  // The original PHP groups male candidates separately and places
  // all non-male candidates in the other group.
  const groupStudentIds = students
    .filter(
      (item) =>
        ((item.gender ?? "").toLowerCase() === "male") === isMale
    )
    .map((item) => item.studentId);

  const groupCandidates = await Candidate.find({
    studentId: { $in: groupStudentIds },
  })
    .select("studentId")
    .lean();

  if (groupCandidates.length < 2) {
    throw new Error(
      "A manual winner can only be selected when at least two candidates are tied."
    );
  }

  const candidateIds = groupCandidates.map(
    (candidate) => candidate.studentId
  );

  const voteCounts = await Vote.aggregate<{
    _id: string;
    totalVotes: number;
  }>([
    {
      $match: {
        department,
        year_section: yearSection,
        candidate_id: { $in: candidateIds },
      },
    },
    {
      $group: {
        _id: "$candidate_id",
        totalVotes: { $sum: 1 },
      },
    },
  ]);

  const counts = new Map(
    voteCounts.map((item) => [item._id, item.totalVotes])
  );

  const highestVoteCount = Math.max(
    ...groupCandidates.map(
      (candidate) => counts.get(candidate.studentId) ?? 0
    )
  );

  const tiedCandidateIds = groupCandidates
    .filter(
      (candidate) =>
        (counts.get(candidate.studentId) ?? 0) === highestVoteCount
    )
    .map((candidate) => candidate.studentId);

  if (tiedCandidateIds.length < 2) {
    throw new Error(
      "There is no tie for the highest vote count in this candidate group."
    );
  }

  if (!tiedCandidateIds.includes(studentId)) {
    throw new Error(
      "Only a candidate tied for the highest vote count can be selected."
    );
  }

  // Clear any previous manual winner in this same section and gender group.
  await Candidate.updateMany(
    { studentId: { $in: candidateIds } },
    { $set: { manualWinner: false } }
  );

  const selectedCandidate = await Candidate.findOneAndUpdate(
    { studentId },
    { $set: { manualWinner: true } },
    { new: true }
  );

  if (!selectedCandidate) {
    throw new Error("Candidate not found.");
  }

  return selectedCandidate;
}