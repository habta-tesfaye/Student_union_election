import bcrypt from "bcrypt";

import { StudentAccount } from "./student.model.js";
import { Application } from "../applications/application.model.js";

import type {
  CreateStudentInput,
  UpdateStudentInput,
} from "./student.validation.js";

/**
 * Register a new student.
 */
async function createStudent(input: CreateStudentInput) {
  const existingStudent = await StudentAccount.findOne({
    studentId: input.studentId,
  });

  if (existingStudent) {
    throw new Error("A student with this ID already exists.");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const student = await StudentAccount.create({
    studentId: input.studentId,
    firstName: input.firstName,
    middleName: input.middleName,
    lastName: input.lastName,
    gender: input.gender,
    region: input.region,
    disability: input.disability,
    department: input.department,
    yearSection: input.yearSection,
    status: input.status,
    gpa: input.gpa,
    password: passwordHash,
    role: "student",
  });

  const studentObject = student.toObject() as Record<string, unknown>;
  delete studentObject.password;

  return studentObject;
}

/**
 * Retrieve all students.
 */
async function getAllStudents() {
  return StudentAccount.find()
    .select("-password")
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Retrieve one student by student ID.
 */
async function getStudentById(studentId: string) {
  return StudentAccount.findOne({ studentId })
    .select("-password")
    .lean();
}

/**
 * Retrieve the classmates of the logged-in student.
 *
 * Classmates must have the same department and yearSection.
 * The logged-in student is excluded from the returned list.
 */
async function getMyClassmates(studentId: string) {
  const currentStudent = await StudentAccount.findOne({
    studentId,
  })
    .select("studentId department yearSection")
    .lean();

  if (!currentStudent) {
    throw new Error("Student account not found.");
  }

  if (!currentStudent.department || !currentStudent.yearSection) {
    throw new Error(
      "Your student account is missing its department or year/section."
    );
  }

  const students = await StudentAccount.find({
    department: currentStudent.department,
    yearSection: currentStudent.yearSection,
    studentId: { $ne: currentStudent.studentId },
  })
    .select("studentId firstName middleName lastName department yearSection")
    .sort({ firstName: 1, middleName: 1, lastName: 1 })
    .lean();

  return students;
}

/**
 * Retrieve all students in the Department Head's department.
 *
 * The department must come from the authenticated Head's account.
 * The controller will enforce the Head role before calling this service.
 */
async function getStudentsByDepartment(department: string) {
  return StudentAccount.find({ department })
    .select(
      "studentId firstName middleName lastName department yearSection gpa"
    )
    .sort({ yearSection: 1, firstName: 1, middleName: 1, lastName: 1 })
    .lean();
}

/**
 * Update student information.
 */
async function updateStudent(
  studentId: string,
  input: UpdateStudentInput
) {
  const student = await StudentAccount.findOneAndUpdate(
    { studentId },
    { $set: input },
    {
      new: true,
      runValidators: true,
    }
  )
    .select("-password")
    .lean();

  if (!student) {
    throw new Error("Student not found.");
  }

  return student;
}

/**
 * Delete a student account safely.
 *
 * A student cannot be deleted if an election
 * application exists for that student.
 */
async function deleteStudent(studentId: string) {
  const student = await StudentAccount.findOne({ studentId });

  if (!student) {
    throw new Error("Student not found.");
  }

  // Check whether an election application exists for the student.
  const existingApplication = await Application.findOne({
    studentId,
  }).lean();

  if (existingApplication) {
    throw new Error(
      "Cannot delete this student because an election application exists."
    );
  }

  await StudentAccount.deleteOne({ studentId });

  return {
    studentId: student.studentId,
    message: "Student account deleted successfully.",
  };
}

export const studentService = {
  createStudent,
  getAllStudents,
  getStudentById,
  getMyClassmates,
  getStudentsByDepartment,
  updateStudent,
  deleteStudent,
};