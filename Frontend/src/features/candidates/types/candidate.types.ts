export interface CandidateStudent {
  studentId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender?: string;
  region?: string;
  disability?: string;
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

export interface CandidateApplication {
  studentId: string;
  motivationText: string;
  examScore10?: number;
  examStatus: "pending" | "passed" | "failed";
  ssdStatus: "pending" | "approved" | "rejected";
  selectionStatus: "pending" | "selected_16" | "disqualified";
  appliedAt: string;
  examRemarks?: string;
}

export interface CandidateResponse {
  success: boolean;
  message: string;
  data: {
    candidate: Candidate;
  };
}

export interface CandidateApplicationResponse {
  success: boolean;
  message: string;
  data: {
    application: CandidateApplication;
  };
}

export interface ParliamentCandidate {
  studentId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  department: string;
  yearSection: string;
  photo: string;
  preParliamentScore: number;
  parliamentScore: number;
  totalScore: number;
  hasScored: boolean;
  savedScore: number | null;
  votingOpen: boolean;
}

export interface ParliamentScoreSubmission {
  voterId: string;
  candidateId: string;
  scoreGiven: number;
  candidateParliamentScore: number;
  candidateTotalScore: number;
}