import {
  api,
  setAccessToken,
} from "../../../services/api";

import type {
  AuthenticatedUser,
  LoginInput,
  LoginResponse,
} from "../types/auth.types";

/**
 * Log in a student or staff member through the backend.
 *
 * Backend endpoint: POST /api/auth/login
 */
export async function login(
  credentials: LoginInput
): Promise<AuthenticatedUser> {
  const response = await api.post<LoginResponse>(
    "/auth/login",
    credentials,
    { auth: false }
  );

  if (!response.success || !response.data?.accessToken || !response.data.user) {
    throw new Error("The server returned an invalid login response.");
  }

  setAccessToken(response.data.accessToken);

  return response.data.user;
}