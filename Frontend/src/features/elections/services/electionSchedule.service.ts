
import { api } from "../../../services/api";

import type {
  CreateElectionScheduleInput,
  ElectionScheduleListResponse,
  ElectionScheduleMessageResponse,
  ElectionScheduleResponse,
  UpdateElectionScheduleInput,
} from "../types/electionSchedule.types";

export async function getElectionSchedules() {
  return api.get<ElectionScheduleListResponse>("/elections");
}

export async function createElectionSchedule(
  input: CreateElectionScheduleInput
) {
  return api.post<ElectionScheduleResponse>("/elections", input);
}

export async function updateElectionSchedule(
  id: string,
  input: UpdateElectionScheduleInput
) {
  return api.patch<ElectionScheduleResponse>(
    `/elections/${id}`,
    input
  );
}

export async function updateElectionScheduleStatus(
  id: string,
  isActive: boolean
) {
  return api.patch<ElectionScheduleResponse>(
    `/elections/${id}/status`,
    { is_active: isActive }
  );
}

export async function deleteElectionSchedule(id: string) {
  return api.delete<ElectionScheduleMessageResponse>(
    `/elections/${id}`
  );
}
