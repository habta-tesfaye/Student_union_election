export type StaffRole = "admin" | "head" | "registrar" | "director";

export type UserRole = StaffRole | "student" | "candidate";
export type AccountType = "student" | "staff";

export interface AuthenticatedUser {
  id: string;
  accountType: AccountType;
  role: UserRole;
  studentId?: string;
  staffId?: string;
  firstName: string;
  middleName: string;
  lastName: string;
  department?: string;
}

export interface LoginInput {
  identifier: string;
  password: string;
}

export interface LoginResponseData {
  accessToken: string;
  user: AuthenticatedUser;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: LoginResponseData;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}