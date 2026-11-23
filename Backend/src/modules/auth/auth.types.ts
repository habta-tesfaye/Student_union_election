
/**
 * Account types used by the authentication module.
 */

// Roles available in the original election system
export type StaffRole =
  | "admin"
  | "head"
  | "registrar"
  | "director";

export type UserRole = StaffRole | "student";

// Identifies whether the account belongs to a student or staff member
export type AccountType = "student" | "staff";

/**
 * Information about an authenticated account.
 */
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

/**
 * Information required during login.
 */
export interface LoginInput {
  identifier: string;
  password: string;
}

/**
 * Information stored inside a JWT token.
 */
export interface AuthTokenPayload {
  sub: string;
  accountType: AccountType;
  role: UserRole;
}

/**
 * Response returned after successful login.
 */
export interface LoginResponse {
  accessToken: string;
  user: AuthenticatedUser;
}
