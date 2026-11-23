/**
 * Possible SSD approval statuses.
 */
export type SSDStatus =
  | "pending"
  | "approved"
  | "rejected";

/**
 * Possible student application selection statuses.
 */
export type ApplicationSelectionStatus =
  | "pending"
  | "selected_16"
  | "disqualified";

/**
 * Information submitted by a student.
 */
export interface CreateApplicationInput {
  motivationText: string;
}

/**
 * Complete election application information.
 */
export interface Application {
  id: string;

  studentId: string;

  motivationText: string;

  examScore10?: number;

  ssdStatus: SSDStatus;

  selectionStatus: ApplicationSelectionStatus;

  appliedAt: Date;

  createdAt: Date;

  updatedAt: Date;
}