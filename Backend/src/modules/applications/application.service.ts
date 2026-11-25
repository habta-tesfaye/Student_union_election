import { Application } from "./application.model.js";

import type {
  ApplicationDocument,
} from "./application.model.js";

import type {
  CreateApplicationInput,
} from "./application.types.js";

import {
  isStudentDisciplined,
} from "../discipline/discipline.service.js";

import { HeadWinner } from "../parliament/head-winner.model.js";
import { ElectionSchedule } from "../elections/election.model.js";
import { StaffAccount } from "../staff/staff.model.js";
import { createNotification } from "../notifications/notification.service.js";

/**
 * Submit a new Phase 1 application.
 *
 * Business rules preserved from the original PHP system:
 * 1. Candidate must be a Parliament member.
 * 2. Application submission schedule must be open.
 * 3. Candidate must not have applied before.
 * 4. Disciplined candidates cannot apply.
 * 5. Candidate and Director (SSD) receive notifications.
 */
async function createApplication(
  studentId: string,
  input: CreateApplicationInput
): Promise<ApplicationDocument> {

  // 1. Check Parliament membership.
  // The original PHP checks whether a membership record exists.
  const parliamentMember = await HeadWinner.exists({
    student_id: studentId,
  });

  if (!parliamentMember) {
    throw new Error(
      "You are not authorized to submit an application because you are not a Parliament member."
    );
  }

  // 2. Retrieve the application submission schedule.
  const schedule = await ElectionSchedule.findOne({
    stage_name: "application_send",
  });

  if (!schedule) {
    throw new Error(
      "The application submission schedule has not been set."
    );
  }

  if (!schedule.is_active) {
    throw new Error(
      "Application submission is currently disabled."
    );
  }

  // Compare actual instants. Schedule dates must represent
  // the correct Ethiopia local time when stored in MongoDB.
  const now = new Date();

  if (now < schedule.start_time) {
    throw new Error(
      "Application submission has not started yet."
    );
  }

  if (now > schedule.end_time) {
    throw new Error(
      "The application submission period has closed."
    );
  }

  // 3. Check whether the candidate has already applied.
  const existingApplication = await Application.findOne({
    studentId,
  });

  if (existingApplication) {
    throw new Error(
      "You have already submitted an application."
    );
  }

  // 4. Check the candidate's discipline status.
  const disciplined = await isStudentDisciplined(studentId);

  if (disciplined) {
    throw new Error(
      "You are not eligible to apply because your discipline status is Disciplined."
    );
  }

  // 5. Save the application in the existing phase1_exam collection.
  const application = await Application.create({
    studentId,
    motivationText: input.motivationText,
  });

  const applicationId = application._id.toString();

  // 6. Notify the candidate and Director (SSD).
  // Notifications are attempted after saving the application.
  // MongoDB standalone does not support the transactions used by
  // the original MySQL implementation.

  const notificationTasks = [
    createNotification({
      recipientId: studentId,
      recipientType: "student",
      title: "Leadership Vision Submitted",
      message:
        "Your leadership vision has been successfully submitted.",
      type: "application_send",
      relatedId: applicationId,
    }),
  ];

  // The Director role represents SSD in this system.
  const director = await StaffAccount.findOne({
    role: "director",
  }).select("staffId");

  if (director?.staffId) {
    notificationTasks.push(
      createNotification({
        recipientId: director.staffId,
        recipientType: "staff",
        title: "New Candidate Application",
        message:
          `Candidate ${studentId} has submitted their leadership vision for review.`,
        type: "application_send",
        relatedId: applicationId,
      })
    );
  }

  // Do not lose a successfully saved application if a notification fails.
  const notificationResults = await Promise.allSettled(
    notificationTasks
  );

  notificationResults.forEach((result) => {
    if (result.status === "rejected") {
      console.error(
        "Application notification error:",
        result.reason
      );
    }
  });

  return application.toObject() as ApplicationDocument;
}

/**
 * Retrieve an application belonging to a student.
 */
async function getStudentApplication(
  studentId: string
): Promise<ApplicationDocument | null> {
  const application = await Application.findOne({
    studentId,
  }).lean<ApplicationDocument>();

  return application;
}

/**
 * Application service functions.
 */
export const applicationService = {
  createApplication,
  getStudentApplication,
};