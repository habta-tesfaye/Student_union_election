import type { Request, Response, NextFunction } from "express";
import multer from "multer";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("Request error:", error);

  // Handle file upload errors.
  if (error instanceof multer.MulterError) {
    res.status(400).json({
      success: false,
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? "Candidate photo must not exceed 5 MB."
          : "Candidate photo upload failed. Please check the uploaded file.",
    });
    return;
  }

  // Handle invalid image files.
  if (error instanceof Error && error.message.startsWith("Invalid image file")) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
    return;
  }

  // Handle other unsupported image formats.
  if (
    error instanceof Error &&
    error.message.startsWith("Only JPEG, PNG, and WebP")
  ) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
    return;
  }

  // Handle unexpected errors.
  res.status(500).json({
    success: false,
    message: "An unexpected server error occurred.",
  });
}