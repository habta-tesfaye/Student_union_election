import { Candidate } from "../candidates/candidate.model.js";
import {
  StaffAccount,
  StudentAccount,
} from "../auth/auth.model.js";
import { ElectionSchedule } from "../elections/election.model.js";
import { Vote } from "../voting/vote.model.js";
import { createNotification } from "../notifications/notification.service.js";
import { HeadWinner } from "../parliament/head-winner.model.js";

type StudentRecord = {
  studentId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender?: string;
  region?: string;
  department?: string;
  yearSection?: string;
  gpa?: number;
};

type WinnerRow = StudentRecord & {
  photo: string;
  totalVotes: number;
  manualWinner: boolean;
};

function compareWinners(a: WinnerRow, b: WinnerRow): number {
  if (a.manualWinner !== b.manualWinner) {
    return Number(b.manualWinner) - Number(a.manualWinner);
  }

  if (a.totalVotes !== b.totalVotes) {
    return b.totalVotes - a.totalVotes;
  }

  const aGpa = a.gpa ?? 0;
  const bGpa = b.gpa ?? 0;

  if (aGpa !== bGpa) {
    return bGpa - aGpa;
  }

  const aRegionSix = (a.region ?? "").includes("6");
  const bRegionSix = (b.region ?? "").includes("6");

  return Number(bRegionSix) - Number(aRegionSix);
}

async function getHeadSubmitSchedule() {
  return ElectionSchedule.findOne({
    stage_name: "head_submit",
    is_active: true,
  }).lean();
}

function isWithinSchedule(
  schedule: { start_time: Date; end_time: Date } | null
): boolean {
  if (!schedule) return false;

  const now = Date.now();
  return (
    now >= new Date(schedule.start_time).getTime() &&
    now <= new Date(schedule.end_time).getTime()
  );
}

async function getDepartmentWinners(department: string) {
  const students = await StudentAccount.find({ department })
    .select(
      "studentId firstName middleName lastName gender region department yearSection gpa"
    )
    .lean();

  const studentIds = students.map((student) => student.studentId);

  const [candidates, voteCounts] = await Promise.all([
    Candidate.find({ studentId: { $in: studentIds } })
      .select("studentId photo manualWinner")
      .lean(),

    Vote.aggregate<{ _id: string; totalVotes: number }>([
      { $match: { candidate_id: { $in: studentIds } } },
      { $group: { _id: "$candidate_id", totalVotes: { $sum: 1 } } },
    ]),
  ]);

  const studentMap = new Map(
    students.map((student) => [student.studentId, student])
  );
  const voteMap = new Map(
    voteCounts.map((item) => [item._id, item.totalVotes])
  );

  const rows: WinnerRow[] = candidates.flatMap((candidate) => {
    const student = studentMap.get(candidate.studentId);

    if (!student || student.department !== department) return [];

    return [{
      ...student,
      photo: candidate.photo ?? "",
      manualWinner: candidate.manualWinner ?? false,
      totalVotes: voteMap.get(candidate.studentId) ?? 0,
    }];
  });

  const sections = [...new Set(
    students
      .map((student) => student.yearSection)
      .filter((section): section is string => Boolean(section))
  )].sort();

  return sections.map((yearSection) => {
    const sectionRows = rows.filter(
      (row) => row.yearSection === yearSection
    );

    const male = sectionRows
      .filter((row) => (row.gender ?? "").toLowerCase() === "male")
      .sort(compareWinners);

    // Original PHP treats non-male candidates as the female group.
    const female = sectionRows
      .filter((row) => (row.gender ?? "").toLowerCase() !== "male")
      .sort(compareWinners);

    return {
      yearSection,
      maleWinner: male[0] ?? null,
      femaleWinner: female[0] ?? null,
    };
  });
}

/** Preview the finalized male/female winner for each section. 
export async function previewHeadWinners(department: string) {
  const [schedule, sections] = await Promise.all([
    getHeadSubmitSchedule(),
    getDepartmentWinners(department),
  ]);*/

/** Preview the finalized male/female winner for each section. */
export async function previewHeadWinners(department: string) {
  const [schedule, sections] = await Promise.all([
    getHeadSubmitSchedule(),
    getDepartmentWinners(department),
  ]);

  const winnerIds = sections
    .flatMap((section) => [
      section.maleWinner?.studentId,
      section.femaleWinner?.studentId,
    ])
    .filter((id): id is string => Boolean(id));

  const submittedWinners = await HeadWinner.find({
    student_id: { $in: winnerIds },
  })
    .select("student_id")
    .lean();

  const submittedIds = new Set(
    submittedWinners.map((winner) => winner.student_id)
  );

  const sectionsWithStatus = sections.map((section) => ({
    yearSection: section.yearSection,
    maleWinner: section.maleWinner
      ? {
          ...section.maleWinner,
          submitted: submittedIds.has(section.maleWinner.studentId),
        }
      : null,
    femaleWinner: section.femaleWinner
      ? {
          ...section.femaleWinner,
          submitted: submittedIds.has(section.femaleWinner.studentId),
        }
      : null,
  }));

  return {
    scheduleOpen: isWithinSchedule(schedule),
    schedule: schedule
      ? {
          startTime: schedule.start_time,
          endTime: schedule.end_time,
        }
      : null,
    sections: sectionsWithStatus,
  };
}


/** Save winners using insert-if-absent behavior, then notify Directors. */
export async function submitHeadWinners(
  department: string,
  headName: string
) {
  const schedule = await getHeadSubmitSchedule();

  if (!isWithinSchedule(schedule)) {
    throw new Error("Winner submission is closed at this time.");
  }

  const sections = await getDepartmentWinners(department);
  const winnerIds = sections.flatMap((section) => [
    section.maleWinner?.studentId,
    section.femaleWinner?.studentId,
  ]).filter((id): id is string => Boolean(id));

  let insertedCount = 0;

  for (const studentId of winnerIds) {
    const result = await HeadWinner.updateOne(
      { student_id: studentId },
      { $setOnInsert: { student_id: studentId, status: "active" } },
      { upsert: true }
    );

    if (result.upsertedCount > 0) insertedCount += 1;
  }

  const directors = await StaffAccount.find({
    role: "director",
  })
    .select("staffId")
    .lean();

  const message =
    `Finalized winners list submitted by ${headName} for the ` +
    `${department} department (${insertedCount} winners).`;

  await Promise.all(
    directors.map((director) =>
      createNotification({
        recipientId: director.staffId,
        recipientType: "staff",
        title: "Class winners submitted",
        message,
        type: "winner_submission",
      })
    )
  );

  return {
    insertedCount,
    message:
      `Winners sent to Parliament. ${directors.length} Director(s) notified.`,
  };
}
