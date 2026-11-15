import mongoose, { Schema } from "mongoose";

/**
 * Election schedule document.
 * Field names are based on the original PHP election_schedule table.
 */
export interface ElectionScheduleDocument {
  stage_name: string;
  stage_label: string;
  start_time: Date;
  end_time: Date;
  is_active: boolean;
}

const electionScheduleSchema = new Schema<ElectionScheduleDocument>(
  {
    stage_name: {
      type: String,
      required: true,
      trim: true,
    },

    stage_label: {
      type: String,
      default: "",
      trim: true,
    },

    start_time: {
      type: Date,
      required: true,
    },

    end_time: {
      type: Date,
      required: true,
    },

    is_active: {
      type: Boolean,
      default: false,
    },
  },
  {
    collection: "election_schedule",
    versionKey: false,
  }
);

export const ElectionSchedule =
  mongoose.models.ElectionSchedule ||
  mongoose.model<ElectionScheduleDocument>(
    "ElectionSchedule",
    electionScheduleSchema
  );