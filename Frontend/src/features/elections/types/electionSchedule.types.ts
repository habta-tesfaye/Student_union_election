
export interface ElectionSchedule {
  _id: string;
  stage_name: string;
  stage_label: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface ElectionScheduleListResponse {
  success: boolean;
  count: number;
  data: ElectionSchedule[];
}

export interface ElectionScheduleResponse {
  success: boolean;
  message: string;
  data: ElectionSchedule;
}

export interface ElectionScheduleMessageResponse {
  success: boolean;
  message: string;
}

export interface CreateElectionScheduleInput {
  stage_name: string;
  stage_label: string;
  start_time: string;
  end_time: string;
}

export interface UpdateElectionScheduleInput {
  stage_name?: string;
  stage_label?: string;
  start_time?: string;
  end_time?: string;
}
