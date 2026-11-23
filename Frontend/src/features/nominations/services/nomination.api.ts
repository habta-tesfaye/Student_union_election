import { api } from "../../../services/api";

import type {
  ApiResponse,
  CandidatesData,
  Candidate,
  Nomination,
  NominationAction,
  NominationData,
  NominationNotification,
  NominationResponseData,
  NotificationsData,
  NominationsData,
} from "../types/nomination.types";

export async function getDepartmentNominations(): Promise<Nomination[]> {
  const response = await api.get<ApiResponse<NominationsData>>(
    "/nominations"
  );

  return response.data.nominations;
}

export async function reviewNomination(
  nominationId: string,
  action: NominationAction
): Promise<Nomination> {
  const response = await api.patch<ApiResponse<NominationData>>(
    `/nominations/${encodeURIComponent(nominationId)}/review`,
    { action }
  );

  return response.data.nomination;
}

export async function submitNomination(
  nomineeStudentId: string
): Promise<Nomination> {
  const response = await api.post<ApiResponse<NominationData>>(
    "/nominations",
    { nomineeStudentId }
  );

  return response.data.nomination;
}

export async function getNominationNotifications(): Promise<
  NominationNotification[]
> {
  const response = await api.get<ApiResponse<NotificationsData>>(
    "/notifications?page=1&limit=100"
  );

  return response.data.notifications.filter(
    (notification) =>
      notification.type === "nomination" &&
      notification.title === "Nomination Approved" &&
      Boolean(notification.relatedId)
  );
}

export async function acceptNomination(
  nominationId: string,
  photo: File
): Promise<NominationResponseData> {
  const formData = new FormData();

  formData.append("action", "accept");
  formData.append("candidate_photo", photo);

  const response = await api.post<
    ApiResponse<NominationResponseData>
  >(
    `/nominations/${encodeURIComponent(nominationId)}/response`,
    formData
  );

  return response.data;
}

export async function declineNomination(
  nominationId: string
): Promise<Nomination> {
  const response = await api.post<ApiResponse<NominationData>>(
    `/nominations/${encodeURIComponent(nominationId)}/response`,
    { action: "decline" }
  );

  return response.data.nomination;
}

export async function getCandidates(): Promise<Candidate[]> {
  const response = await api.get<ApiResponse<CandidatesData>>(
    "/candidates"
  );

  return response.data.candidates;
}