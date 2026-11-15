import { Candidate } from "./candidate.model.js";
import { StudentAccount } from "../auth/auth.model.js";

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
 * Get one candidate with the associated student information.
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