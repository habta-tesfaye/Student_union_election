import { api } from "../../../services/api";

import type {
  DisciplineListResponse,
  DisciplineRecordResponse,
  DisciplineStatus,
} from "../types/discipline.types";

export async function getDisciplineRecords(): Promise<DisciplineListResponse> {
  return api.get<DisciplineListResponse>("/discipline");
}

export async function saveDisciplineStatus(
  studentId: string,
  status: DisciplineStatus
): Promise<DisciplineRecordResponse> {
  return api.post<DisciplineRecordResponse>("/discipline", {
    studentId,
    status,
  });
}

export async function getDisciplineByStudentId(
  studentId: string
): Promise<DisciplineRecordResponse> {
  return api.get<DisciplineRecordResponse>(
    `/discipline/${encodeURIComponent(studentId)}`
  );
}