import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { unlink } from "node:fs/promises";
import { fileTypeFromFile } from "file-type";
import type { RequestHandler } from "express";

// Store candidate photos in the original PHP upload directory.
const uploadDirectory = path.resolve(
  process.cwd(),
  "uploads",
  "candidates"
);

// Ensure the upload directory exists.
fs.mkdirSync(uploadDirectory, { recursive: true });

// Supported image formats.
const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

// Configure file storage.
const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (req, file, callback) => {
    const studentId = req.user?.studentId;

    if (!studentId) {
      callback(new Error("Authenticated student ID is required."), "");
      return;
    }

    const safeStudentId = studentId.replace(/[^a-zA-Z0-9_-]/g, "");

    const extensions: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    };

    const extension = extensions[file.mimetype];

    if (!extension) {
      callback(new Error("Unsupported candidate photo format."), "");
      return;
    }

    const uniqueName = `candidate_${safeStudentId}_${Date.now()}${extension}`;

    callback(null, uniqueName);
  },
});

// Check the MIME type supplied by the browser.
const fileFilter: multer.Options["fileFilter"] = (
  _req,
  file,
  callback
) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    callback(
      new Error("Only JPEG, PNG, and WebP candidate photos are allowed.")
    );
    return;
  }

  callback(null, true);
};

// Configure Multer.
const multerUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
}).single("candidate_photo");

// Upload and verify the actual image contents.
export const uploadCandidatePhoto: RequestHandler = (
  req,
  res,
  next
) => {
  multerUpload(req, res, async (uploadError) => {
    if (uploadError) {
      next(uploadError);
      return;
    }

    if (!req.file) {
      next();
      return;
    }

    try {
      // Detect the actual file format from its contents.
      const detectedType = await fileTypeFromFile(req.file.path);

      if (
        !detectedType ||
        !allowedMimeTypes.has(detectedType.mime) ||
        detectedType.mime !== req.file.mimetype
      ) {
        await unlink(req.file.path);

        next(
          new Error(
            "Invalid image file. Please upload a genuine JPEG, PNG, or WebP image."
          )
        );

        return;
      }

      // The image is valid. Continue to the controller.
      next();
    } catch (error) {
      // Remove the uploaded file if verification fails.
      try {
        await unlink(req.file.path);
      } catch {
        // Ignore cleanup errors.
      }

      next(error);
    }
  });
};