import { api } from "../../services/api";

export interface HeadTieCandidate {
  studentId: string;
  photo: string;
  totalVotes: number;
  manualWinner: boolean;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  department: string;
  yearSection: string;
  gpa: number;
}

interface HeadClassResultsResponse {
  success: boolean;
  message: string;
  data: {
    yearSection: string | null;
    maleDeadlock: boolean;
    femaleDeadlock: boolean;
    tieDetected: boolean;
    candidates: HeadTieCandidate[];
  };
}

interface ManualWinnerResponse {
  success: boolean;
  message: string;
  data?: {
    candidate: HeadTieCandidate;
  };
}

/**
 * Load class-election candidates for a section.
 * The backend determines the Head's department from the login token.
 */
export async function getHeadClassResults(
  yearSection: string
): Promise<HeadClassResultsResponse["data"]> {
  const section = yearSection.trim();

  if (!section) {
    throw new Error("Please select a year section.");
  }

  const response = await api.get<HeadClassResultsResponse>(
    `/results/class?section=${encodeURIComponent(section)}`
  );

  if (!response.success || !response.data) {
    throw new Error(response.message || "Unable to load class results.");
  }

  return response.data;
}

/**
 * Select a candidate tied for the highest vote count.
 * The backend checks the Head's department from the login token.
 */
export async function selectHeadManualWinner(
  studentId: string,
  yearSection: string
): Promise<string> {
  const response = await api.patch<ManualWinnerResponse>(
    "/candidates/manual-winner",
    {
      studentId: studentId.trim(),
      yearSection: yearSection.trim(),
    }
  );

  if (!response.success) {
    throw new Error(response.message || "Unable to select the manual winner.");
  }

  return response.message;
}
