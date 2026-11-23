export type NominationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "final_candidate"
  | "withdrawn";

export type NominationAction = "approve" | "reject";

export type StudentNominationAction = "accept" | "decline";

export interface NominationStudent {
  studentId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  department?: string;
  yearSection?: string;
  cgpa?: number;
}

export interface Nomination {
  _id?: string;
  id?: string;
  nominatorStudentId: string;
  nomineeStudentId: string;
  department: string;
  yearSection: string;
  status: NominationStatus;
  nominee?: NominationStudent;
  nominator?: NominationStudent;
  createdAt?: string;
  updatedAt?: string;
}

export interface NominationNotification {
  _id?: string;
  id?: string;
  title: string;
  message: string;
  type: string;
  relatedId?: string;
  isRead: boolean;
  createdAt?: string;
}

export interface Candidate {
  _id?: string;
  id?: string;
  studentId: string;
  photo: string;
  totalVotes: number;
  manualWinner?: boolean;
  student?: NominationStudent;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  department?: string;
  yearSection?: string;
  cgpa?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface NominationsData {
  nominations: Nomination[];
}

export interface NotificationsData {
  notifications: NominationNotification[];
}

export interface CandidatesData {
  candidates: Candidate[];
}

export interface NominationData {
  nomination: Nomination;
}

export interface NominationResponseData {
  nomination: Nomination;
  candidate?: Candidate;
}