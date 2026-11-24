import { api } from "../../../services/api";

import type { Candidate, CandidateResponse } from "../types/candidate.types";

// Election schedule returned by the backend.
export interface ElectionSchedule {
  _id: string;
  stage_name: string;
  stage_label: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ElectionSchedulesResponse {
  success: boolean;
  count: number;
  data: ElectionSchedule[];
}

export interface Campaign {
  _id: string;
  studentId: string;
  campaignTitle: string;
  motto: string;
  manifestoDetailed: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string | null;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignSubmission {
  campaignTitle: string;
  motto: string;
  manifestoDetailed: string;
}

export interface CampaignResponse {
  success: boolean;
  message: string;
  data?: Campaign;
}

/**
 * Retrieve all election schedules.
 * Available to authenticated students, Admin and Director.
 */
export async function getElectionSchedules(): Promise<ElectionSchedule[]> {
  const response = await api.get<ElectionSchedulesResponse>("/elections");

  if (!response.success || !Array.isArray(response.data)) {
    throw new Error("Failed to retrieve election schedules.");
  }

  return response.data;
}

/**
 * Retrieve one official candidate by student ID.
 */
export async function getCandidateByStudentId(
  studentId: string,
): Promise<Candidate> {
  const normalizedStudentId = studentId.trim();

  if (!normalizedStudentId) {
    throw new Error("Please enter a valid student ID.");
  }

  const response = await api.get<CandidateResponse>(
    `/candidates/${encodeURIComponent(normalizedStudentId)}`,
  );

  if (!response.success || !response.data?.candidate) {
    throw new Error(response.message || "Candidate information not found.");
  }

  return response.data.candidate;
}

/**
 * Retrieve the authenticated candidate's own profile.
 */
export async function getMyCandidate(): Promise<Candidate> {
  const response = await api.get<CandidateResponse>("/candidates/me");

  if (!response.success || !response.data?.candidate) {
    throw new Error(
      response.message || "Your candidate profile was not found.",
    );
  }

  return response.data.candidate;
}

/**
 * Submit the authenticated student's campaign.
 * Only one campaign submission is allowed per student.
 */
export async function submitMyCampaign(
  campaign: CampaignSubmission,
): Promise<Campaign> {
  const response = await api.post<CampaignResponse>("/campaigns", campaign);

  if (!response.success || !response.data) {
    throw new Error(response.message || "Campaign submission failed.");
  }

  return response.data;
}
