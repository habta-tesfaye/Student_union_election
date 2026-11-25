import { Candidate } from "../candidates/candidate.model.js";
import { Vote } from "../voting/vote.model.js";
import { StudentAccount } from "../auth/auth.model.js";
import { Phase3Parliament } from "../parliament/phase3-parliament.model.js";
import { HeadWinner } from "../parliament/head-winner.model.js";
import { createNotification } from "../notifications/notification.service.js";

interface ClassCandidateResult {
  studentId: string;
  photo: string;
  totalVotes: number;
  manualWinner: boolean;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  region: string;
  disability: string;
  department: string;
  yearSection: string;
  gpa: number;
}

/**
 * Original PHP class-election ranking:
 * 1. Manual winner first.
 * 2. Total votes descending.
 * 3. GPA descending.
 * 4. Region 6 preference.
 */
function compareClassCandidates(
  a: ClassCandidateResult,
  b: ClassCandidateResult
): number {
  if (a.manualWinner !== b.manualWinner) {
    return Number(b.manualWinner) - Number(a.manualWinner);
  }

  if (a.totalVotes !== b.totalVotes) {
    return b.totalVotes - a.totalVotes;
  }

  if (a.gpa !== b.gpa) {
    return b.gpa - a.gpa;
  }

  const aRegion6 = a.region === "6" ? 1 : 0;
  const bRegion6 = b.region === "6" ? 1 : 0;

  return bRegion6 - aRegion6;
}

/**
 * Get class-election results.
 * Department and year section are supplied by the controller.
 */
export async function getClassElectionResults(
  department: string,
  yearSection?: string
) {
  const studentFilter: Record<string, unknown> = {
    department,
  };

  if (yearSection) {
    studentFilter.yearSection = yearSection;
  }

  const students = await StudentAccount.find(studentFilter)
    .select(
      "studentId firstName middleName lastName gender region disability department yearSection gpa"
    )
    .lean();

  const studentIds = students.map((student) => student.studentId);

  const candidates = await Candidate.find({
    studentId: { $in: studentIds },
  }).lean();

  const votes = await Vote.aggregate([
    {
      $match: {
        department,
        ...(yearSection ? { year_section: yearSection } : {}),
      },
    },
    {
      $group: {
        _id: "$candidate_id",
        totalVotes: { $sum: 1 },
      },
    },
  ]);

  const voteCounts = new Map<string, number>(
    votes.map((vote) => [vote._id, vote.totalVotes])
  );

  const studentMap = new Map(
    students.map((student) => [student.studentId, student])
  );

  const results: ClassCandidateResult[] = candidates.map((candidate) => {
    const student = studentMap.get(candidate.studentId);

    return {
      studentId: candidate.studentId,
      photo: candidate.photo,
      totalVotes: voteCounts.get(candidate.studentId) ?? 0,
      manualWinner: candidate.manualWinner ?? false,
      firstName: student?.firstName ?? "",
      middleName: student?.middleName ?? "",
      lastName: student?.lastName ?? "",
      gender: student?.gender ?? "",
      region: student?.region ?? "",
      disability: student?.disability ?? "",
      department: student?.department ?? "",
      yearSection: student?.yearSection ?? "",
      gpa: student?.gpa ?? 0,
    };
  });

  results.sort(compareClassCandidates);

  const maleCandidates = results.filter(
    (candidate) => candidate.gender.toLowerCase() === "male"
  );

  // Original PHP places all non-male candidates in this group.
  const femaleCandidates = results.filter(
    (candidate) => candidate.gender.toLowerCase() !== "male"
  );

  function getWinner(
    group: ClassCandidateResult[]
  ): ClassCandidateResult | null {
    if (group.length === 0) {
      return null;
    }

    const first = group[0];
    const second = group[1];

    if (
      second &&
      compareClassCandidates(first, second) === 0 &&
      !first.manualWinner
    ) {
      return null;
    }

    return first;
  }

  const maleWinner = getWinner(maleCandidates);
  const femaleWinner = getWinner(femaleCandidates);

  const maleDeadlock = maleCandidates.length > 1 && maleWinner === null;
  const femaleDeadlock =
    femaleCandidates.length > 1 && femaleWinner === null;

  return {
    department,
    yearSection: yearSection ?? null,
    totalCandidates: results.length,
    totalVotes: results.reduce(
      (sum, candidate) => sum + candidate.totalVotes,
      0
    ),
    maleWinner,
    femaleWinner,
    maleDeadlock,
    femaleDeadlock,
    tieDetected: maleDeadlock || femaleDeadlock,
    candidates: results,
  };
}

/**
 * Get finalized parliament results.
 * Results are published only after an official leadership
 * designation has been assigned.
 */
export async function getParliamentResults() {
  const finalizedStatuses = [
    "President",
    "Vice President",
    "Executive",
    "Executive Member",
  ];

  const finalizedCount = await Phase3Parliament.countDocuments({
    final_selection_status: {
      $in: finalizedStatuses,
    },
  });

  const isFinalized = finalizedCount > 0;

  const records = await Phase3Parliament.find()
    .sort({
      total_score_100: -1,
      _id: 1,
    })
    .lean();

  const studentIds = records.map((record) => record.student_id);

  const candidates = await Candidate.find({
    studentId: { $in: studentIds },
  }).lean();

  const students = await StudentAccount.find({
    studentId: { $in: studentIds },
  })
    .select(
      "studentId firstName middleName lastName gender disability gpa region department yearSection"
    )
    .lean();

  const candidateMap = new Map(
    candidates.map((candidate) => [candidate.studentId, candidate])
  );

  const studentMap = new Map(
    students.map((student) => [student.studentId, student])
  );

  const results = records.map((record) => {
    const student = studentMap.get(record.student_id);
    const candidate = candidateMap.get(record.student_id);

    return {
      student_id: record.student_id,
      firstName: student?.firstName ?? "",
      middleName: student?.middleName ?? "",
      lastName: student?.lastName ?? "",
      gender: student?.gender ?? "",
      disability: student?.disability ?? "",
      gpa: student?.gpa ?? 0,
      region: student?.region ?? "",
      department: student?.department ?? "",
      yearSection: student?.yearSection ?? "",
      photo: candidate?.photo ?? "",
      pre_parliament_40: record.pre_parliament_40,
      parliament_score_60: record.parliament_score_60,
      total_score_100: record.total_score_100,
      final_selection_status: record.final_selection_status,
      created_at: record.created_at,
    };
  });

  /**
   * Original PHP parliament ranking:
   * 1. Total score descending.
   * 2. Disability descending.
   * 3. Gender descending.
   * 4. GPA descending.
   * 5. Region 6 first.
   * 6. Creation time ascending.
   */
  results.sort((a, b) => {
    if (a.total_score_100 !== b.total_score_100) {
      return b.total_score_100 - a.total_score_100;
    }

    const disabilityComparison = String(b.disability ?? "").localeCompare(
      String(a.disability ?? "")
    );

    if (disabilityComparison !== 0) {
      return disabilityComparison;
    }

    const genderComparison = String(b.gender ?? "").localeCompare(
      String(a.gender ?? "")
    );

    if (genderComparison !== 0) {
      return genderComparison;
    }

    if (a.gpa !== b.gpa) {
      return b.gpa - a.gpa;
    }

    const aRegion6 = a.region === "6" ? 1 : 0;
    const bRegion6 = b.region === "6" ? 1 : 0;

    if (aRegion6 !== bRegion6) {
      return bRegion6 - aRegion6;
    }

    return (
      new Date(a.created_at).getTime() -
      new Date(b.created_at).getTime()
    );
  });

  const leadership = results.filter(
    (item) =>
      item.final_selection_status === "President" ||
      item.final_selection_status === "Vice President" ||
      item.final_selection_status === "Executive"
  );

  const executiveMembers = results.filter(
    (item) => item.final_selection_status === "Executive Member"
  );

  const generalMembers = results.filter(
    (item) => item.final_selection_status === "pending"
  );

  const leadershipOrder: Record<string, number> = {
    President: 1,
    "Vice President": 2,
    Executive: 3,
  };

  const topThree = [...leadership].sort(
    (a, b) =>
      leadershipOrder[a.final_selection_status] -
      leadershipOrder[b.final_selection_status]
  );

  return {
    isFinalized,
    message: isFinalized
      ? "Parliament election results are finalized."
      : "Parliament election results are under review.",
    totalCandidates: results.length,
    topThree: isFinalized ? topThree : [],
    executiveMembers: isFinalized ? executiveMembers : [],
    generalMembers: isFinalized ? generalMembers : [],
    results: isFinalized ? results : [],
  };
}

/**
 * Get active winners submitted by Department Heads.
 * Winner records contain student IDs, so join them with student accounts.
 */
export async function getHeadWinnerReview() {
  const winners = await HeadWinner.find({ status: "active" })
    .select("student_id status")
    .lean();

  const studentIds = winners.map((winner) => winner.student_id);

  const students = await StudentAccount.find({
    studentId: { $in: studentIds },
  })
    .select(
      "studentId firstName middleName lastName gender department yearSection"
    )
    .lean();

  const studentMap = new Map(
    students.map((student) => [student.studentId, student])
  );

  return winners.map((winner) => {
    const student = studentMap.get(winner.student_id);

    return {
      studentId: winner.student_id,
      status: winner.status,
      firstName: student?.firstName ?? "",
      middleName: student?.middleName ?? "",
      lastName: student?.lastName ?? "",
      gender: student?.gender ?? "",
      department: student?.department ?? "",
      yearSection: student?.yearSection ?? "",
    };
  });
}

const PARLIAMENT_LEADERSHIP_ROLES = [
  "President",
  "Vice President",
  "Executive",
] as const;

/**
 * Director finalizes the official Parliament rankings.
 *
 * Ranks 1–3 receive leadership roles.
 * Ranks 4–8 become Executive Members.
 * Remaining candidates stay pending / General Members.
 * Scores are not changed.
 */
export async function finalizeParliamentRoles() {
  const records = await Phase3Parliament.find()
    .select("student_id total_score_100 created_at")
    .lean();

  if (records.length === 0) {
    throw new Error("There are no Parliament candidates to finalize.");
  }

  const studentIds = records.map((record) => record.student_id);

  const students = await StudentAccount.find({
    studentId: { $in: studentIds },
  })
    .select("studentId firstName disability gender gpa region")
    .lean();

  const studentMap = new Map(
    students.map((student) => [student.studentId, student])
  );

  // Only rank Parliament records with a matching student account.
  const ranked = records
    .filter((record) => studentMap.has(record.student_id))
    .sort((a, b) => {
      if (a.total_score_100 !== b.total_score_100) {
        return b.total_score_100 - a.total_score_100;
      }

      const aStudent = studentMap.get(a.student_id)!;
      const bStudent = studentMap.get(b.student_id)!;

      const disabilityComparison = String(
        bStudent.disability ?? ""
      ).localeCompare(String(aStudent.disability ?? ""));

      if (disabilityComparison !== 0) {
        return disabilityComparison;
      }

      const genderComparison = String(
        bStudent.gender ?? ""
      ).localeCompare(String(aStudent.gender ?? ""));

      if (genderComparison !== 0) {
        return genderComparison;
      }

      const gpaComparison =
        (bStudent.gpa ?? 0) - (aStudent.gpa ?? 0);

      if (gpaComparison !== 0) {
        return gpaComparison;
      }

      const aRegion6 = aStudent.region === "6" ? 1 : 0;
      const bRegion6 = bStudent.region === "6" ? 1 : 0;

      if (aRegion6 !== bRegion6) {
        return bRegion6 - aRegion6;
      }

      return (
        new Date(a.created_at).getTime() -
        new Date(b.created_at).getTime()
      );
    });

  if (ranked.length === 0) {
    throw new Error(
      "No Parliament candidates have matching student records."
    );
  }

  // Clear previous roles before assigning the new ranking.
  await Phase3Parliament.updateMany(
    {},
    { $set: { final_selection_status: "pending" } }
  );

  const assignments = ranked.map((record, index) => {
    const rank = index + 1;

    const role =
      rank <= 3
        ? PARLIAMENT_LEADERSHIP_ROLES[rank - 1]
        : rank <= 8
          ? "Executive Member"
          : "pending";

    return {
      studentId: record.student_id,
      firstName: studentMap.get(record.student_id)?.firstName ?? "",
      role,
      rank,
    };
  });

  // Save the assigned roles. Scores are not modified.
  for (const assignment of assignments) {
    await Phase3Parliament.updateOne(
      { student_id: assignment.studentId },
      { $set: { final_selection_status: assignment.role } }
    );
  }

  // Notify every ranked candidate.
  await Promise.all(
    assignments.map((assignment) =>
      createNotification({
        recipientId: assignment.studentId,
        recipientType: "student",
        title: "Parliament selection result",
        message:
          assignment.rank <= 3
            ? `Congratulations ${assignment.firstName}! You are the ${assignment.role} of the DMU Parliament.`
            : assignment.rank <= 8
              ? `Well done ${assignment.firstName}! You have been appointed as an Executive Member.`
              : "Parliament selection is complete. You are a confirmed General Member.",
        type: "result",
      })
    )
  );

  return {
    assignedCount: assignments.length,
    leadershipCount: Math.min(assignments.length, 3),
    executiveMemberCount: Math.max(
      0,
      Math.min(assignments.length - 3, 5)
    ),
    generalMemberCount: Math.max(assignments.length - 8, 0),
    message: "Parliament selection has been finalized successfully.",
  };
}

/**
 * Director resets Parliament role assignments.
 * Scores and candidate records are not changed.
 */
export async function resetParliamentRoles() {
  const result = await Phase3Parliament.updateMany(
    {},
    { $set: { final_selection_status: "pending" } }
  );

  return {
    resetCount: result.modifiedCount,
    message: "All Parliament role assignments have been cleared.",
  };
}