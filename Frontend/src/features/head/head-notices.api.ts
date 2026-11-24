import { api } from "../../services/api";

export interface HeadNotice {
  _id: string;
  title: string;
  message: string;
  targetRole: "all" | "head" | "candidate" | "registrar" | "student";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface NoticeListResponse {
  success: boolean;
  message?: string;
  data: HeadNotice[];
}

interface NoticeResponse {
  success: boolean;
  message: string;
  data: HeadNotice;
}

interface NoticeActionResponse {
  success: boolean;
  message: string;
}

function requireSuccess<T extends { success: boolean; message?: string }>(
  response: T,
  fallbackMessage: string,
): T {
  if (!response.success) {
    throw new Error(response.message || fallbackMessage);
  }

  return response;
}

export async function getMyDepartmentNotices(): Promise<HeadNotice[]> {
  const response = requireSuccess(
    await api.get<NoticeListResponse>("/notices/department/mine"),
    "Unable to load your department notices.",
  );

  return response.data;
}

export async function getDirectorNotices(): Promise<HeadNotice[]> {
  const response = requireSuccess(
    await api.get<NoticeListResponse>("/notices/department/director"),
    "Unable to load Director notices.",
  );

  return response.data;
}

export async function createDepartmentNotice(input: {
  title: string;
  message: string;
}): Promise<HeadNotice> {
  const response = requireSuccess(
    await api.post<NoticeResponse>("/notices/department", input),
    "Unable to publish the notice.",
  );

  return response.data;
}

export async function updateDepartmentNotice(
  noticeId: string,
  input: { title: string; message: string },
): Promise<HeadNotice> {
  const response = requireSuccess(
    await api.patch<NoticeResponse>(
      `/notices/department/${encodeURIComponent(noticeId)}`,
      input,
    ),
    "Unable to update the notice.",
  );

  return response.data;
}

export async function deleteDepartmentNotice(noticeId: string): Promise<void> {
  const response = requireSuccess(
    await api.delete<NoticeActionResponse>(
      `/notices/department/${encodeURIComponent(noticeId)}`,
    ),
    "Unable to delete the notice.",
  );

  if (!response.success) {
    throw new Error(response.message || "Unable to delete the notice.");
  }
}
