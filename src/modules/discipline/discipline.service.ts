import { Discipline } from "./discipline.model.js";
import type { DisciplineStatus } from "./discipline.model.js";

import { StudentAccount } from "../auth/auth.model.js";

// 1. Find a student and create or update their discipline record.
export async function setDisciplineStatus(
  studentId: string,
  status: DisciplineStatus
) {
  const student = await StudentAccount.findOne({
    studentId: studentId.trim(),
  }).select("studentId firstName middleName lastName");

  if (!student) {
    throw new Error("Student not found.");
  }

  const fullName = [
    student.firstName,
    student.middleName,
    student.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const discipline = await Discipline.findOneAndUpdate(
    { studentId: student.studentId },
    {
      $set: {
        fullName,
        status,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  return discipline;
}

// 2. Retrieve all discipline records.
// Most recently updated records appear first.
export async function getAllDisciplineRecords() {
  return Discipline.find()
    .sort({ updatedAt: -1 })
    .lean();
}

// 3. Retrieve one student's discipline record.
export async function getDisciplineByStudentId(
  studentId: string
) {
  return Discipline.findOne({
    studentId: studentId.trim(),
  }).lean();
}

// 4. Check whether a student is disciplined.
export async function isStudentDisciplined(
  studentId: string
): Promise<boolean> {
  const discipline = await Discipline.findOne({
    studentId: studentId.trim(),
  })
    .select("status")
    .lean();

  return discipline?.status === "Disciplined";
}