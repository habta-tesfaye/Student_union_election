import { ElectionSchedule } from "./election.model.js";

export interface CreateElectionScheduleInput {
  stage_name: string;
  stage_label: string;
  start_time: Date;
  end_time: Date;
}

export interface UpdateElectionScheduleInput {
  stage_name?: string;
  stage_label?: string;
  start_time?: Date;
  end_time?: Date;
  is_active?: boolean;
}

// Get all election schedules.
export async function getAllElectionSchedules() {
  return ElectionSchedule.find()
    .sort({ _id: 1 })
    .lean();
}

// Get one election schedule by its ID.
export async function getElectionScheduleById(id: string) {
  return ElectionSchedule.findById(id).lean();
}

// Create a new election schedule.
export async function createElectionSchedule(
  input: CreateElectionScheduleInput
) {
  if (input.end_time <= input.start_time) {
    throw new Error("End time must be later than start time.");
  }

  return ElectionSchedule.create({
    stage_name: input.stage_name,
    stage_label: input.stage_label,
    start_time: input.start_time,
    end_time: input.end_time,
    is_active: false,
  });
}

// Update an existing election schedule.
export async function updateElectionSchedule(
  id: string,
  input: UpdateElectionScheduleInput
) {
  const existingSchedule = await ElectionSchedule.findById(id);

  if (!existingSchedule) {
    throw new Error("Election schedule not found.");
  }

  const startTime = input.start_time ?? existingSchedule.start_time;
  const endTime = input.end_time ?? existingSchedule.end_time;

  if (endTime <= startTime) {
    throw new Error("End time must be later than start time.");
  }

  Object.assign(existingSchedule, input);

  await existingSchedule.save();

  return existingSchedule;
}

// Activate or deactivate an election schedule.
export async function updateElectionScheduleStatus(
  id: string,
  isActive: boolean
) {
  const schedule = await ElectionSchedule.findByIdAndUpdate(
    id,
    { is_active: isActive },
    { new: true, runValidators: true }
  );

  if (!schedule) {
    throw new Error("Election schedule not found.");
  }

  return schedule;
}

// Delete an election schedule.
export async function deleteElectionSchedule(id: string) {
  const schedule = await ElectionSchedule.findByIdAndDelete(id);

  if (!schedule) {
    throw new Error("Election schedule not found.");
  }

  return schedule;
}