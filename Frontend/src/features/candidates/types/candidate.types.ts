
export interface CandidateStudent {
  studentId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  department: string;
  yearSection: string;
  gpa: number;
}

export interface Candidate {
  _id?: string;
  studentId: string;
  photo: string;
  totalVotes: number;
  manualWinner: boolean;
  createdAt: string;
  student: CandidateStudent | null;
}

export interface CandidateResponse {
  success: boolean;
  message: string;
  data: {
    candidate: Candidate;
  };
}
