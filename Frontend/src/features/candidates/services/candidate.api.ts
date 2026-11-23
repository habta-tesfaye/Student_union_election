
import { api } from "../../../services/api";

import type {
  Candidate,
  CandidateResponse,
} from "../types/candidate.types";

/**
 * Retrieve one official candidate by student ID.
 * Department Heads can only access candidates in their department.
 */
export async function getCandidateByStudentId(
  studentId: string
): Promise<Candidate> {
  const normalizedStudentId = studentId.trim();

  if (!normalizedStudentId) {
    throw new Error("Please enter a valid student ID.");
  }

  const response = await api.get<CandidateResponse>(
    `/candidates/${encodeURIComponent(normalizedStudentId)}`
  );

  if (!response.success || !response.data?.candidate) {
    throw new Error(response.message || "Candidate information not found.");
  }

  return response.data.candidate;
}
