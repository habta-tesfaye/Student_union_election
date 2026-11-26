const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

const ACCESS_TOKEN_KEY = "dmu_access_token";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

async function request<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { body, headers, auth = true, ...requestOptions } = options;

  const requestHeaders = new Headers(headers);
  const isFormData = body instanceof FormData;

  if (
    body !== undefined &&
    !isFormData &&
    !requestHeaders.has("Content-Type")
  ) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getAccessToken();

    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers: requestHeaders,
    body:
      body === undefined
        ? undefined
        : isFormData
          ? body
          : JSON.stringify(body),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const responseText = await response.text();
  let responseData: unknown;

  try {
    responseData = responseText ? JSON.parse(responseText) : undefined;
  } catch {
    responseData = responseText;
  }

  if (!response.ok) {
    const message =
      typeof responseData === "object" &&
      responseData !== null &&
      "message" in responseData &&
      typeof responseData.message === "string"
        ? responseData.message
        : `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, responseData);
  }

  return responseData as T;
}

export const api = {
  get<T>(
    path: string,
    options: Omit<ApiRequestOptions, "method" | "body"> = {}
  ) {
    return request<T>(path, {
      ...options,
      method: "GET",
    });
  },

  post<T>(
    path: string,
    body?: unknown,
    options: Omit<ApiRequestOptions, "method" | "body"> = {}
  ) {
    return request<T>(path, {
      ...options,
      method: "POST",
      body,
    });
  },

  put<T>(
    path: string,
    body?: unknown,
    options: Omit<ApiRequestOptions, "method" | "body"> = {}
  ) {
    return request<T>(path, {
      ...options,
      method: "PUT",
      body,
    });
  },

  patch<T>(
    path: string,
    body?: unknown,
    options: Omit<ApiRequestOptions, "method" | "body"> = {}
  ) {
    return request<T>(path, {
      ...options,
      method: "PATCH",
      body,
    });
  },

  delete<T>(
    path: string,
    options: Omit<ApiRequestOptions, "method" | "body"> = {}
  ) {
    return request<T>(path, {
      ...options,
      method: "DELETE",
    });
  },
};