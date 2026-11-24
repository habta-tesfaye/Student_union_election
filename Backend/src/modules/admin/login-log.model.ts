import mongoose, { Schema } from "mongoose";

import type { UserRole, AccountType } from "../auth/auth.types.js";

export interface LoginLogDocument {
  userIdentifier: string;
  userRole: UserRole;
  accountType: AccountType;
  loginTime: Date;
  ipAddress?: string;
  deviceInfo?: string;
}

const loginLogSchema = new Schema<LoginLogDocument>(
  {
    userIdentifier: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    userRole: {
      type: String,
      required: true,
enum: ["admin", "head", "registrar", "director", "student", "candidate"],    },

    accountType: {
      type: String,
      required: true,
      enum: ["student", "staff"],
    },

    loginTime: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },

    ipAddress: {
      type: String,
      trim: true,
    },

    deviceInfo: {
      type: String,
      trim: true,
    },
  },
  {
    collection: "login_logs",
    versionKey: false,
  }
);

// Efficiently retrieve the latest login records.
loginLogSchema.index({ loginTime: -1 });

export const LoginLog =
  mongoose.models.LoginLog ||
  mongoose.model<LoginLogDocument>("LoginLog", loginLogSchema);