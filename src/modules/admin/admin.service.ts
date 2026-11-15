
import { StaffAccount } from "../auth/auth.model.js";
import { LoginLog } from "./login-log.model.js";

/**
 * Get the Admin overview statistics.
 */
export async function getAdminOverview() {
  const [
    totalStaff,
    totalDepartmentHeads,
    staffRoles,
    latestLoginLogs,
  ] = await Promise.all([
    // Total registered staff accounts.
    StaffAccount.countDocuments(),

    // Total department heads.
    StaffAccount.countDocuments({
      role: "head",
    }),

    // Retrieve all distinct staff roles.
    StaffAccount.distinct("role"),

    // Latest 100 successful login records.
    LoginLog.find()
      .select(
        "userIdentifier userRole accountType loginTime ipAddress deviceInfo"
      )
      .sort({ loginTime: -1 })
      .limit(100)
      .lean(),
  ]);

  return {
    totalStaff,
    totalDepartmentHeads,
    totalStaffRoles: staffRoles.length,
    staffRoles,
    latestLoginLogs,
  };
}

/**
 * Get the latest 100 login records.
 */
export async function getLoginHistory() {
  return LoginLog.find()
    .select(
      "userIdentifier userRole accountType loginTime ipAddress deviceInfo"
    )
    .sort({ loginTime: -1 })
    .limit(100)
    .lean();
}
