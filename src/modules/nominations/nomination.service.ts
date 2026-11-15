import { Nomination } from "./nomination.model.js";
import { Candidate } from "../candidates/candidate.model.js";
import {
  StudentAccount,
  StaffAccount,
} from "../auth/auth.model.js";
import { ElectionSchedule } from "../elections/election.model.js";
import { createNotification } from "../notifications/notification.service.js";

/**
 * Check whether the nomination period is open.
 */
export async function isNominationPeriodOpen(): Promise<boolean> {
  const schedule = await ElectionSchedule.findOne({
    stage_name: "nominate",
  }).lean();

  if (!schedule || !schedule.is_active) {
    return false;
  }

  const now = new Date();

  return now >= schedule.start_time && now <= schedule.end_time;
}

/**
 * Submit a student nomination.
 *
 * Rules based on the original PHP workflow:
 * - Nomination period must be open.
 * - No self-nomination.
 * - One nomination per nominator.
 * - A nominee cannot be nominated more than once.
 * - Maximum three nominees per section.
 * - Nominee must belong to the same department and section.
 * - Nominee GPA must be at least 2.75.
 */
export async function createNomination(
  nominatorStudentId: string,
  nomineeStudentId: string
) {
  const nominatorId = nominatorStudentId.trim();
  const nomineeId = nomineeStudentId.trim();

  if (!nomineeId) {
    throw new Error("A valid nominee student ID is required.");
  }

  if (!(await isNominationPeriodOpen())) {
    throw new Error("The nomination period is currently closed.");
  }

  if (nominatorId === nomineeId) {
    throw new Error("You cannot nominate yourself.");
  }

  const nominator = await StudentAccount.findOne({
    studentId: nominatorId,
  }).select("studentId firstName lastName department yearSection");

  if (!nominator) {
    throw new Error("Nominator student account not found.");
  }

  if (!nominator.department || !nominator.yearSection) {
    throw new Error(
      "Your department and year section must be assigned before nominating."
    );
  }

  const existingSubmission = await Nomination.findOne({
    nominatorStudentId: nominatorId,
  });

  if (existingSubmission) {
    throw new Error(
      "You have already submitted your one allowed nomination."
    );
  }

  const nominee = await StudentAccount.findOne({
    studentId: nomineeId,
  }).select("studentId firstName lastName gpa department yearSection");

  if (!nominee) {
    throw new Error("The nominated student does not exist.");
  }

  if (
    nominee.department !== nominator.department ||
    nominee.yearSection !== nominator.yearSection
  ) {
    throw new Error(
      "The nominee must be from your own department and year section."
    );
  }

  if (typeof nominee.gpa !== "number" || nominee.gpa < 2.75) {
    throw new Error("The nominee's GPA must be 2.75 or higher.");
  }

  const existingNominee = await Nomination.findOne({
    nomineeStudentId: nomineeId,
  });

  if (existingNominee) {
    throw new Error(
      "This student has already been nominated by someone else."
    );
  }

  const sectionStudents = await StudentAccount.find({
    department: nominator.department,
    yearSection: nominator.yearSection,
  }).select("studentId");

  const sectionStudentIds = sectionStudents.map(
    (student) => student.studentId
  );

  const sectionNominationCount = await Nomination.countDocuments({
    nomineeStudentId: { $in: sectionStudentIds },
  });

  if (sectionNominationCount >= 3) {
    throw new Error(
      "This section already has the maximum of three nominees."
    );
  }

  const nomination = await Nomination.create({
    nominatorStudentId: nominatorId,
    nomineeStudentId: nomineeId,
    department: nominator.department,
    yearSection: nominator.yearSection,
    status: "pending",
  });

  const departmentHead = await StaffAccount.findOne({
    department: nominator.department,
    role: "head",
  }).select("staffId");

  if (departmentHead?.staffId) {
    const nominatorName =
      `${nominator.firstName} ${nominator.lastName}`.trim();

    const nomineeName =
      `${nominee.firstName} ${nominee.lastName}`.trim();

    await createNotification({
      recipientId: departmentHead.staffId,
      recipientType: "staff",
      title: "New Nomination Alert",
      message:
        `New Nomination Alert: ${nominatorName} has nominated ` +
        `${nomineeName} from section ${nominator.yearSection}.`,
      type: "nomination",
      relatedId: nomination.id,
    });
  }

  return nomination;
}

/**
 * Get all nominations belonging to one department.
 */
export async function getNominationsByDepartment(
  department: string
) {
  const nominations = await Nomination.find({
    department,
  })
    .sort({ createdAt: -1 })
    .lean();

  const studentIds = [
    ...new Set(
      nominations.flatMap((nomination) => [
        nomination.nominatorStudentId,
        nomination.nomineeStudentId,
      ])
    ),
  ];

  const students = await StudentAccount.find({
    studentId: { $in: studentIds },
  })
    .select(
      "studentId firstName middleName lastName department yearSection"
    )
    .lean();

  return nominations.map((nomination) => ({
    ...nomination,
    nominee:
      students.find(
        (student) =>
          student.studentId === nomination.nomineeStudentId
      ) ?? null,
    nominator:
      students.find(
        (student) =>
          student.studentId === nomination.nominatorStudentId
      ) ?? null,
  }));
}

/**
 * Department Head approves or rejects a pending nomination.
 */
export async function reviewNomination(
  nominationId: string,
  department: string,
  staffId: string,
  action: "approve" | "reject"
) {
  const newStatus = action === "approve" ? "approved" : "rejected";

  const nomination = await Nomination.findOneAndUpdate(
    {
      _id: nominationId,
      department,
      status: "pending",
    },
    {
      $set: {
        status: newStatus,
        reviewedBy: staffId,
        reviewedAt: new Date(),
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!nomination) {
    const existing = await Nomination.findById(nominationId).lean();

    if (!existing) {
      throw new Error("Nomination not found.");
    }

    if (existing.department !== department) {
      throw new Error(
        "You cannot review nominations from another department."
      );
    }

    throw new Error("This nomination has already been reviewed.");
  }

  const studentMessage =
    `Your nomination for section ${nomination.yearSection} ` +
    `has been ${newStatus.toUpperCase()}.`;

  await createNotification({
    recipientId: nomination.nomineeStudentId,
    recipientType: "student",
    title:
      action === "approve"
        ? "Nomination Approved"
        : "Nomination Rejected",
    message: studentMessage,
    type: "nomination",
    relatedId: nomination.id,
  });

  return nomination;
}

/**
 * Accept an approved nomination.
 *
 * Only the nominated student can accept.
 * The candidate is created with the supplied stored photo path.
 */
export async function acceptNomination(
  nominationId: string,
  studentId: string,
  photo: string
) {
  const nomineeId = studentId.trim();
  const photoPath = photo.trim();

  if (!photoPath) {
    throw new Error("Candidate photo is required.");
  }

  const nomination = await Nomination.findOne({
    _id: nominationId,
    nomineeStudentId: nomineeId,
    status: "approved",
  });

  if (!nomination) {
    const existing = await Nomination.findById(nominationId).lean();

    if (!existing) {
      throw new Error("Nomination not found.");
    }

    if (existing.nomineeStudentId !== nomineeId) {
      throw new Error(
        "You can only respond to your own nomination."
      );
    }

    throw new Error(
      "Only an approved nomination can be accepted."
    );
  }

  // Change status only while the nomination is still approved.
  const updatedNomination = await Nomination.findOneAndUpdate(
    {
      _id: nominationId,
      nomineeStudentId: nomineeId,
      status: "approved",
    },
    {
      $set: {
        status: "final_candidate",
        responseAt: new Date(),
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedNomination) {
    throw new Error(
      "This nomination has already received a response."
    );
  }

  try {
    const candidate = await Candidate.create({
      studentId: nomineeId,
      photo: photoPath,
    });

    return {
      nomination: updatedNomination,
      candidate,
    };
  } catch (error) {
    // Restore the approved status if candidate creation fails.
    await Nomination.updateOne(
      {
        _id: nominationId,
        nomineeStudentId: nomineeId,
        status: "final_candidate",
      },
      {
        $set: { status: "approved" },
        $unset: { responseAt: 1 },
      }
    );

    if (
      error instanceof Error &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new Error(
        "This student already has an official candidate record."
      );
    }

    throw error;
  }
}

/**
 * Decline an approved nomination.
 *
 * Only the nominated student can decline.
 */
export async function declineNomination(
  nominationId: string,
  studentId: string
) {
  const nomineeId = studentId.trim();

  const nomination = await Nomination.findOneAndUpdate(
    {
      _id: nominationId,
      nomineeStudentId: nomineeId,
      status: "approved",
    },
    {
      $set: {
        status: "withdrawn",
        responseAt: new Date(),
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (nomination) {
    return nomination;
  }

  const existing = await Nomination.findById(nominationId).lean();

  if (!existing) {
    throw new Error("Nomination not found.");
  }

  if (existing.nomineeStudentId !== nomineeId) {
    throw new Error(
      "You can only respond to your own nomination."
    );
  }

  throw new Error(
    "Only an approved nomination can be declined."
  );
}