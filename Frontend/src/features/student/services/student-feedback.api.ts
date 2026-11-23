import { api } from "../../../services/api";

export type StudentFeedbackType =
  | "exam_10"
  | "evaluation_40"
  | "vote_result";

export type StudentFeedbackStatus = "pending" | "replied";

export type StudentFeedbackSatisfaction =
  | "pending"
  | "satisfied"
  | "not_satisfied";

export interface StudentFeedback {
  _id: string;
  studentId: string;
  feedbackType: StudentFeedbackType;
  message: string;
  reply: string | null;
  replyBy: string | null;
  status: StudentFeedbackStatus;
  isClosed: boolean;
  feedbackCount: number;
  satisfaction: StudentFeedbackSatisfaction;
  repliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StudentFeedbackListResponse {
  success: boolean;
  data: {
    feedback: StudentFeedback[];
    count: number;
  };
}

interface StudentFeedbackResponse {
  success: boolean;
  message: string;
  data: {
    feedback: StudentFeedback;
  };
}



export async function getMyFeedback(): Promise<StudentFeedback[]> {
  const response = await api.get<StudentFeedbackListResponse>(
    "/feedback/mine"
  );

  return response.data.feedback;
}

export async function createStudentFeedback(
  feedbackType: StudentFeedbackType,
  message: string
): Promise<StudentFeedback> {
  const response = await api.post<StudentFeedbackResponse>(
    "/feedback",
    {
      feedbackType,
      message,
    }
  );

  return response.data.feedback;
}

export async function markStudentFeedbackSatisfied(
  feedbackId: string
): Promise<StudentFeedback> {
  const response = await api.patch<StudentFeedbackResponse>(
    `/feedback/${feedbackId}/satisfaction`,
    {
      satisfaction: "satisfied",
    }
  );

  return response.data.feedback;
}

export async function reopenStudentFeedback(
  feedbackId: string,
  additionalMessage: string
): Promise<StudentFeedback> {
  const response = await api.patch<StudentFeedbackResponse>(
    `/feedback/${feedbackId}/reopen`,
    {
      satisfaction: "not_satisfied",
      additionalMessage,
    }
  );

  return response.data.feedback;
}
