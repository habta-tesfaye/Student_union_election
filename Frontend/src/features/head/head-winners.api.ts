
import { api } from "../../services/api";

const API_ORIGIN = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

export interface HeadWinnerCandidate {
  studentId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender?: string;
  region?: string;
  department?: string;
  yearSection?: string;
  gpa?: number;
  photo: string;
  totalVotes: number;
  manualWinner: boolean;
  submitted: boolean;
}

export interface HeadWinnerSection {
  yearSection: string;
  maleWinner: HeadWinnerCandidate | null;
  femaleWinner: HeadWinnerCandidate | null;
}

interface HeadWinnersResponse {
  success: boolean;
  message: string;
  data: {
    scheduleOpen: boolean;
    schedule: {
      startTime: string;
      endTime: string;
    } | null;
    sections: HeadWinnerSection[];
  };
}

interface SubmitResponse {
  success: boolean;
  message: string;
  data: {
    insertedCount: number;
    message: string;
  };
}

export interface HeadWinnersPreview {
  scheduleOpen: boolean;
  schedule: HeadWinnersResponse["data"]["schedule"];
  sections: HeadWinnerSection[];
}

export async function getHeadWinnersPreview(): Promise<HeadWinnersPreview> {
  const response = await api.get<HeadWinnersResponse>(
    "/results/head-winners"
  );

  if (!response.success) {
    throw new Error(response.message || "Unable to load winners.");
  }

  return response.data;
}

export async function submitHeadWinners(): Promise<SubmitResponse["data"]> {
  const response = await api.post<SubmitResponse>(
    "/results/head-winners/submit"
  );

  if (!response.success) {
    throw new Error(response.message || "Unable to submit winners.");
  }

  return response.data;
}

export function getHeadWinnerPhoto(photo: string): string {
  if (!photo) return "";

  if (photo.startsWith("http://") || photo.startsWith("https://")) {
    return photo;
  }

  return `${API_ORIGIN}/uploads/candidates/${encodeURIComponent(photo)}`;
}
