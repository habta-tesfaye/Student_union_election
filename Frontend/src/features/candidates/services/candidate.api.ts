import { api } from "../../../services/api";

import type {
  Candidate,
  CandidateApplication,
  CandidateResponse,
  ParliamentCandidate,
  ParliamentScoreSubmission,
} from "../types/candidate.types";

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

// Candidate data returned by the class election results endpoint.
export interface ClassCandidateResult {
  studentId: string;
  photo: string;
  totalVotes: number;
  manualWinner: boolean;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  region: string;
  disability: string;
  department: string;
  yearSection: string;
  gpa: number;
}

// Class election statistics and candidate results.
export interface ClassElectionResults {
  department: string;
  yearSection: string | null;
  totalCandidates: number;
  totalVotes: number;
  maleWinner: ClassCandidateResult | null;
  femaleWinner: ClassCandidateResult | null;
  maleDeadlock: boolean;
  femaleDeadlock: boolean;
  tieDetected: boolean;
  candidates: ClassCandidateResult[];
}

export interface ClassElectionResultsResponse {
  success: boolean;
  message: string;
  data: ClassElectionResults;
}

/**
 * Retrieve all election schedules.
 */
export async function getElectionSchedules(): Promise<ElectionSchedule[]> {
  const response = await api.get<ElectionSchedulesResponse>("/elections");

  if (!response.success || !Array.isArray(response.data)) {
    throw new Error("Failed to retrieve election schedules.");
  }

  return response.data;
}

/**
 * Retrieve class election results for the authenticated student's class.
 */
export async function getMyClassElectionResults(): Promise<ClassElectionResults> {
  const response =
    await api.get<ClassElectionResultsResponse>("/results/class");

  if (!response.success || !response.data) {
    throw new Error(
      response.message || "Failed to retrieve class election results.",
    );
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

// Notifications returned by the backend.
export interface CandidateNotification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface CandidateNotificationsResponse {
  success: boolean;
  data: {
    notifications: CandidateNotification[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

interface NotificationActionResponse {
  success: boolean;
  message: string;
}

/**
 * Retrieve official notices for the authenticated candidate.
 */
export async function getMyCandidateNotifications(
  page = 1,
  limit = 100,
): Promise<CandidateNotification[]> {
  const response = await api.get<CandidateNotificationsResponse>(
    `/notifications?page=${page}&limit=${limit}`,
  );

  if (!response.success || !Array.isArray(response.data?.notifications)) {
    throw new Error("Failed to retrieve notifications.");
  }

  return response.data.notifications.filter(
    (notification) => notification.type === "notice",
  );
}

/**
 * Retrieve all notifications for the authenticated candidate.
 */
export async function getMyCandidateAllNotifications(
  page = 1,
  limit = 100,
): Promise<CandidateNotification[]> {
  const response = await api.get<CandidateNotificationsResponse>(
    `/notifications?page=${page}&limit=${limit}`,
  );

  if (!response.success || !Array.isArray(response.data?.notifications)) {
    throw new Error("Failed to retrieve notifications.");
  }

  return response.data.notifications;
}

/**
 * Mark one notification as read.
 */
export async function markCandidateNotificationAsRead(
  notificationId: string,
): Promise<void> {
  const response = await api.patch<NotificationActionResponse>(
    `/notifications/${encodeURIComponent(notificationId)}/read`,
  );

  if (!response.success) {
    throw new Error(response.message || "Failed to mark notification as read.");
  }
}

/**
 * Mark all notifications as read.
 */
export async function markAllCandidateNotificationsAsRead(): Promise<void> {
  const response = await api.patch<NotificationActionResponse>(
    "/notifications/read-all",
  );

  if (!response.success) {
    throw new Error(response.message || "Failed to mark notifications as read.");
  }
}

/**
 * Retrieve the authenticated candidate's Phase 1 application.
 */
export async function getMyApplication(): Promise<CandidateApplication> {
  const response = await api.get<{
    success: boolean;
    message: string;
    data: {
      application: CandidateApplication;
    };
  }>("/applications/me");

  return response.data.application;
}

export interface ApplicationSubmission {
  motivationText: string;
}

export interface ApplicationSubmissionResponse {
  success: boolean;
  message: string;
  data: {
    application: CandidateApplication;
  };
}

/**
 * Submit the candidate's Phase 1 application.
 */
export async function submitMyApplication(
  input: ApplicationSubmission,
): Promise<CandidateApplication> {
  const response = await api.post<ApplicationSubmissionResponse>(
    "/applications",
    input,
  );

  if (!response.success || !response.data?.application) {
    throw new Error(response.message || "Application submission failed.");
  }

  return response.data.application;
}

// Phase 2 evaluation information returned by the backend.
export interface Phase2Evaluation {
  studentId: string;
  certScore: number;
  proposalScore: number;
  interviewScore: number;
  totalScore: number;
  selectionStatus: string;
  remarks?: string;
  evaluatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Phase2EvaluationResponse {
  success: boolean;
  message?: string;
  data: Phase2Evaluation;
}

/**
 * Retrieve the authenticated candidate's own Phase 2 evaluation.
 */
export async function getMyPhase2Evaluation(): Promise<Phase2Evaluation> {
  const response = await api.get<Phase2EvaluationResponse>(
    "/examinations/phase2/me",
  );

  if (!response.success || !response.data) {
    throw new Error(
      response.message || "Failed to retrieve Phase 2 evaluation.",
    );
  }

  return response.data;
}

/**
 * Retrieve Parliament candidates available to the authenticated student.
 */
export async function getParliamentCandidates(): Promise<ParliamentCandidate[]> {
  const response = await api.get<{
    success: boolean;
    count: number;
    data: ParliamentCandidate[];
  }>("/parliament/candidates");

  if (!response.success || !Array.isArray(response.data)) {
    throw new Error("Failed to retrieve Parliament candidates.");
  }

  return response.data;
}

/**
 * Submit a Parliament score for one candidate.
 * Each eligible student can score each candidate only once.
 */
export async function submitParliamentScore(
  candidateId: string,
  score: number,
): Promise<ParliamentScoreSubmission> {
  if (!candidateId.trim()) {
    throw new Error("A valid candidate ID is required.");
  }

  if (!Number.isFinite(score) || score < 0 || score > 60) {
    throw new Error("Score must be between 0 and 60.");
  }

  const response = await api.post<{
    success: boolean;
    message: string;
    data: ParliamentScoreSubmission;
  }>("/parliament/vote", {
    candidateId,
    score,
  });

  if (!response.success || !response.data) {
    throw new Error(response.message || "Failed to submit Parliament score.");
  }

  return response.data;
}