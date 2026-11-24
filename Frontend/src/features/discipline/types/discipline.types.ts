export type DisciplineStatus = "Cleared" | "Disciplined";

export interface DisciplineRecord {
  _id?: string;
  studentId: string;
  fullName: string | null;
  status: DisciplineStatus;
  updatedAt: string;
}

export interface DisciplineRecordResponse {
  success: boolean;
  data: {
    discipline: DisciplineRecord;
  };
}

export interface DisciplineListResponse {
  success: boolean;
  data: {
    disciplineRecords: DisciplineRecord[];
    count: number;
  };
}

export interface DisciplineMessageResponse {
  success: boolean;
  message: string;
}