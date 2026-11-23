
import { parse } from "csv-parse/sync";

import { studentService } from "./student.service.js";
import { createStudentSchema } from "./student.validation.js";

const REQUIRED_HEADERS = [
  "student id",
  "first_name",
  "middle_name",
  "last_name",
  "gender",
  "region",
  "disability",
  "department",
  "year/section",
  "cgpa",
  "status",
];

export interface StudentImportResult {
  imported: number;
  skipped: number;
  invalid: number;
  totalRecords: number;
  errors: {
    row: number;
    studentId?: string;
    message: string;
  }[];
}

/**
 * Import student accounts from a CSV file.
 *
 * Uses the original PHP CSV column names.
 * The student ID is used as the initial password.
 */
async function importStudentsFromCsv(
  csvContent: string
): Promise<StudentImportResult> {
  const records = parse(csvContent, {
    bom: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: false,
  }) as string[][];

  if (records.length < 2) {
    throw new Error(
      "The CSV file must contain a header row and at least one student record."
    );
  }

  const headers = records[0].map((header) =>
    header.trim().toLowerCase()
  );

  const missingHeaders = REQUIRED_HEADERS.filter(
    (header) => !headers.includes(header)
  );

  if (missingHeaders.length > 0) {
    throw new Error(
      `Missing required CSV columns: ${missingHeaders.join(", ")}`
    );
  }

  const columnIndex = Object.fromEntries(
    headers.map((header, index) => [header, index])
  );

  const result: StudentImportResult = {
    imported: 0,
    skipped: 0,
    invalid: 0,
    totalRecords: records.length - 1,
    errors: [],
  };

  const processedStudentIds = new Set<string>();

  for (let index = 1; index < records.length; index++) {
    const row = records[index];
    const rowNumber = index + 1;

    const getValue = (header: string): string =>
      (row[columnIndex[header]] ?? "").trim();

    const studentId = getValue("student id");

    // Preserve the original PHP behavior:
    // skip rows without a student ID.
    if (!studentId) {
      result.skipped++;
      continue;
    }

    // Prevent duplicate IDs within the same CSV file.
    if (processedStudentIds.has(studentId)) {
      result.skipped++;
      result.errors.push({
        row: rowNumber,
        studentId,
        message: "Duplicate student ID in this CSV file.",
      });
      continue;
    }

    processedStudentIds.add(studentId);

    const gpaValue = getValue("cgpa");

    const studentInput = {
      studentId,
      firstName: getValue("first_name"),
      middleName: getValue("middle_name"),
      lastName: getValue("last_name"),
      gender: getValue("gender") || undefined,
      region: getValue("region") || undefined,
      disability: getValue("disability") || undefined,
      department: getValue("department") || undefined,
      yearSection: getValue("year/section") || undefined,
      status: getValue("status") || undefined,
      gpa: gpaValue ? Number(gpaValue) : undefined,

      // Original PHP behavior: initial password is student ID.
      password: studentId,
    };

    const validation = createStudentSchema.safeParse(studentInput);

    if (!validation.success) {
      result.invalid++;
      result.errors.push({
        row: rowNumber,
        studentId,
        message: Object.entries(
          validation.error.flatten().fieldErrors
        )
          .map(([field, messages]) =>
            `${field}: ${messages?.join(", ")}`
          )
          .join("; "),
      });
      continue;
    }

    try {
      await studentService.createStudent(validation.data);
      result.imported++;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "A student with this ID already exists."
      ) {
        result.skipped++;
        result.errors.push({
          row: rowNumber,
          studentId,
          message: "Student ID already exists in the database.",
        });
        continue;
      }

      result.invalid++;
      result.errors.push({
        row: rowNumber,
        studentId,
        message:
          error instanceof Error
            ? error.message
            : "Unexpected error while importing this student.",
      });
    }
  }

  return result;
}

export const studentImportService = {
  importStudentsFromCsv,
};
