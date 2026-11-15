import mongoose, { Schema } from "mongoose";

export type DisciplineStatus = "Cleared" | "Disciplined";

export interface DisciplineDocument {
  studentId: string;
  fullName: string | null;
  status: DisciplineStatus;
  updatedAt: Date;
}

const disciplineSchema = new Schema<DisciplineDocument>(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 30,
    },

    fullName: {
      type: String,
      default: null,
      trim: true,
      maxlength: 255,
    },

    status: {
      type: String,
      enum: ["Cleared", "Disciplined"],
      default: "Cleared",
      required: true,
      index: true,
    },
  },
  {
    collection: "discipline",
    timestamps: {
      createdAt: false,
      updatedAt: true,
    },
    versionKey: false,
  }
);

export const Discipline =
  mongoose.models.Discipline ||
  mongoose.model<DisciplineDocument>(
    "Discipline",
    disciplineSchema
  );