import { api } from "./api.js";

export interface FileUploadOptions {
  /** Form field name expected by the backend. */
  fieldName: string;

  /** Additional form fields to send with the file. */
  fields?: Record<string, string>;

  /** Optional file size limit in megabytes. */
  maxSizeMB?: number;

  /** Optional allowed MIME types, e.g. ["image/jpeg", "image/png"]. */
  acceptedTypes?: string[];
}

/**
 * Upload one file to an API endpoint.
 *
 * The endpoint and field name must match the backend route.
 * Do not set Content-Type manually for FormData.
 */
export async function uploadFile<T>(
  endpoint: string,
  file: File,
  options: FileUploadOptions
): Promise<T> {
  const {
    fieldName,
    fields = {},
    maxSizeMB,
    acceptedTypes,
  } = options;

  if (!file) {
    throw new Error("Please select a file to upload.");
  }

  if (maxSizeMB !== undefined && file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`The file must be no larger than ${maxSizeMB} MB.`);
  }

  if (
    acceptedTypes &&
    acceptedTypes.length > 0 &&
    !acceptedTypes.includes(file.type)
  ) {
    throw new Error("This file type is not supported.");
  }

  const formData = new FormData();
  formData.append(fieldName, file);

  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value);
  }

  return api.post<T>(endpoint, formData);
}