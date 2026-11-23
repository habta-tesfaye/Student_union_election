
import { Vote } from "./vote.model.js";
import { Candidate } from "../candidates/candidate.model.js";
import { StudentAccount } from "../auth/auth.model.js";
import { ElectionSchedule } from "../elections/election.model.js";

/**
 * Cast a vote for a candidate in the student's own department and section.
 */
export async function castStudentVote(
  studentId: string,
  candidateStudentId: string
) {
  // 1. Check that the student account exists.
  const voter = await StudentAccount.findOne({ studentId })
    .select("studentId department yearSection")
    .lean();

  if (!voter) {
    throw new Error("Student profile not found.");
  }

  if (!voter.department || !voter.yearSection) {
    throw new Error("Your department or year section is not configured.");
  }

  // 2. Check whether the class voting schedule is currently open.
  const now = new Date();

  const votingSchedule = await ElectionSchedule.findOne({
    stage_name: "class_vote",
    is_active: true,
    start_time: { $lte: now },
    end_time: { $gte: now },
  }).lean();

  if (!votingSchedule) {
    throw new Error("Class voting is currently closed.");
  }

  // 3. Prevent the student from voting more than once.
  const existingVote = await Vote.findOne({
    student_id: studentId,
  }).lean();

  if (existingVote) {
   throw new Error("You have already voted.");
  }

  // 4. Verify that the selected student is an official candidate.
  const candidate = await Candidate.findOne({
    studentId: candidateStudentId,
  }).lean();

  if (!candidate) {
    throw new Error("Selected candidate was not found.");
  }

  // 5. Verify that the candidate belongs to the voter's section.
  const candidateStudent = await StudentAccount.findOne({
    studentId: candidateStudentId,
  })
    .select("studentId department yearSection")
    .lean();

  if (!candidateStudent) {
    throw new Error("Candidate student profile not found.");
  }

  if (
    candidateStudent.department !== voter.department ||
    candidateStudent.yearSection !== voter.yearSection
  ) {
    throw new Error(
      "You can only vote for a candidate in your own department and section."
    );
  }

  // 6. Save the vote using the original PHP database field names.
  const vote = await Vote.create({
    student_id: studentId,
    candidate_id: candidateStudentId,
    department: voter.department,
    year_section: voter.yearSection,
  });

  return vote;
}
