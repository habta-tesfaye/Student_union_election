
import bcrypt from "bcrypt";

import { StaffAccount } from "./staff.model.js";

import type { StaffRole } from "../auth/auth.types.js";

export interface CreateStaffInput {
  staffId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  password: string;
  role: StaffRole;
  department?: string;
}

export interface UpdateStaffInput {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  role?: StaffRole;
  department?: string;
}

/**
 * Register a new staff member.
 */
async function createStaff(input: CreateStaffInput) {
  const existingStaff = await StaffAccount.findOne({
    staffId: input.staffId,
  });

  if (existingStaff) {
    throw new Error("A staff member with this ID already exists.");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const staff = await StaffAccount.create({
    staffId: input.staffId,
    firstName: input.firstName,
    middleName: input.middleName,
    lastName: input.lastName,
    password: passwordHash,
    role: input.role,
    department: input.department,
  });

  const staffObject = staff.toObject() as Record<string, unknown>;
  delete staffObject.password;

  return staffObject;
}

/**
 * Retrieve all staff members.
 */
async function getAllStaff() {
  return StaffAccount.find()
    .select("-password")
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Retrieve one staff member by staff ID.
 */
async function getStaffById(staffId: string) {
  return StaffAccount.findOne({ staffId })
    .select("-password")
    .lean();
}

/**
 * Update staff information.
 */
async function updateStaff(
  staffId: string,
  input: UpdateStaffInput
) {
  // Find the staff member before updating.
  const existingStaff = await StaffAccount.findOne({ staffId });

  if (!existingStaff) {
    throw new Error("Staff member not found.");
  }

  // Protect the last administrator from being demoted.
  if (
    existingStaff.role === "admin" &&
    input.role !== undefined &&
    input.role !== "admin"
  ) {
    const adminCount = await StaffAccount.countDocuments({
      role: "admin",
    });

    if (adminCount <= 1) {
      throw new Error(
        "Cannot change the role of the last administrator."
      );
    }
  }

  const staff = await StaffAccount.findOneAndUpdate(
    { staffId },
    { $set: input },
    {
      new: true,
      runValidators: true,
    }
  )
    .select("-password")
    .lean();

  if (!staff) {
    throw new Error("Staff member not found.");
  }

  return staff;
}

/**
 * Delete a staff account.
 */
async function deleteStaff(staffId: string) {
  const existingStaff = await StaffAccount.findOne({ staffId });

  if (!existingStaff) {
    throw new Error("Staff member not found.");
  }

  // Protect the last administrator.
  if (existingStaff.role === "admin") {
    const adminCount = await StaffAccount.countDocuments({
      role: "admin",
    });

    if (adminCount <= 1) {
      throw new Error(
        "Cannot delete the last administrator."
      );
    }
  }

  await StaffAccount.deleteOne({ staffId });

  return {
    staffId: existingStaff.staffId,
    message: "Staff account deleted successfully.",
  };
}

export const staffService = {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
};
