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

/**
 * Submit a new student election application.
 */
async function createApplication(
  studentId: string,
  input: CreateApplicationInput
): Promise<ApplicationDocument> {

  // Check whether the student is disciplined.
  const disciplined = await isStudentDisciplined(studentId);

  if (disciplined) {
    throw new Error(
      "You are not eligible to apply because your discipline status is Disciplined."
    );
  }

  // Check whether this student has already applied.
  const existingApplication = await Application.findOne({
    studentId,
  });

  if (existingApplication) {
    throw new Error("You have already submitted an application.");
  }

  // Create the application.
  const application = await Application.create({
    studentId,
    motivationText: input.motivationText,
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