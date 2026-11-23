
import { useEffect, useState } from "react";

import { useAuthContext } from "../../../context/AuthContext";
import { api } from "../../../services/api";

import AdminSidebar, {
  type AdminSection,
} from "../components/AdminSidebar";

import AdminUserManagementPage from "./AdminUserManagementPage";

interface LoginLog {
  _id: string;
  userIdentifier: string;
  userRole: string;
  accountType: string;
  loginTime: string;
  ipAddress?: string;
  deviceInfo?: string;
}

interface AdminOverviewData {
  totalStaff: number;
  totalDepartmentHeads: number;
  totalStaffRoles: number;
  staffRoles: string[];
  latestLoginLogs: LoginLog[];
}

interface AdminOverviewResponse {
  success: boolean;
  message: string;
  data: AdminOverviewData;
}

interface AdminLoginLogsResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    logs: LoginLog[];
  };
}

export default function AdminDashboardPage() {
  const { user, signOut } = useAuthContext();

  const [activeSection, setActiveSection] =
    useState<AdminSection>("dashboard");

  const [overview, setOverview] =
    useState<AdminOverviewData | null>(null);

  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadAdminDashboard() {
      try {
        const [overviewResponse, logsResponse] = await Promise.all([
          api.get<AdminOverviewResponse>("/admin/overview"),
          api.get<AdminLoginLogsResponse>("/admin/login-logs"),
        ]);

        if (!overviewResponse.success || !logsResponse.success) {
          throw new Error("The server returned an incomplete response.");
        }

        if (isMounted) {
          setOverview(overviewResponse.data);
          setLoginLogs(logsResponse.data.logs);
          setErrorMessage("");
        }
      } catch (error: unknown) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Could not load the Admin dashboard."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadAdminDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const displayName = user
    ? [user.firstName, user.middleName, user.lastName]
        .filter(Boolean)
        .join(" ")
    : "Administrator";

  function renderDashboardOverview() {
    return (
      <>
        <div className="admin-page-heading">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Overview of staff accounts and system activity.</p>
          </div>
        </div>

        {isLoading && (
          <p className="admin-dashboard-message">
            Loading Admin information...
          </p>
        )}

        {!isLoading && errorMessage && (
          <div className="dashboard-error" role="alert">
            <p>{errorMessage}</p>
            <p>
              Check that the backend is running and that you are signed in
              with an Admin account.
            </p>
          </div>
        )}

        {!isLoading && overview && (
          <>
            <div className="dashboard-statistics">
              <article className="dashboard-stat">
                <h3>Total staff accounts</h3>
                <p>{overview.totalStaff}</p>
              </article>

              <article className="dashboard-stat">
                <h3>Department Heads</h3>
                <p>{overview.totalDepartmentHeads}</p>
              </article>

              <article className="dashboard-stat">
                <h3>Staff roles</h3>
                <p>{overview.totalStaffRoles}</p>
              </article>
            </div>

            <section className="dashboard-panel">
              <h3>Registered staff roles</h3>

              {overview.staffRoles.length === 0 ? (
                <p>No staff roles were returned.</p>
              ) : (
                <ul>
                  {overview.staffRoles.map((role) => (
                    <li key={role}>{role}</li>
                  ))}
                </ul>
              )}
            </section>

            <section className="dashboard-panel">
              <h3>Recent successful login records</h3>

              {loginLogs.length === 0 ? (
                <p>No login records were returned.</p>
              ) : (
                <div className="dashboard-table-wrapper">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Account ID</th>
                        <th>Role</th>
                        <th>Account type</th>
                        <th>Login time</th>
                        <th>IP address</th>
                      </tr>
                    </thead>

                    <tbody>
                      {loginLogs.slice(0, 5).map((log) => (
                        <tr key={log._id}>
                          <td>{log.userIdentifier}</td>
                          <td>{log.userRole}</td>
                          <td>{log.accountType}</td>
                          <td>
                            {new Date(log.loginTime).toLocaleString()}
                          </td>
                          <td>{log.ipAddress || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </>
    );
  }

  function renderLoginHistory() {
    return (
      <>
        <div className="admin-page-heading">
          <div>
            <h1>Login History</h1>
            <p>Review successful account sign-in records.</p>
          </div>
          <span className="admin-history-count">
            {loginLogs.length} Records
          </span>
        </div>

        {isLoading ? (
          <p className="admin-dashboard-message">
            Loading login history...
          </p>
        ) : errorMessage ? (
          <div className="dashboard-error" role="alert">
            {errorMessage}
          </div>
        ) : loginLogs.length === 0 ? (
          <section className="dashboard-panel">
            <p>No login records were returned.</p>
          </section>
        ) : (
          <section className="dashboard-panel">
            <div className="dashboard-table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Account ID</th>
                    <th>Role</th>
                    <th>Account type</th>
                    <th>Login time</th>
                    <th>IP address</th>
                    <th>Device information</th>
                  </tr>
                </thead>

                <tbody>
                  {loginLogs.map((log) => (
                    <tr key={log._id}>
                      <td>{log.userIdentifier}</td>
                      <td>{log.userRole}</td>
                      <td>{log.accountType}</td>
                      <td>
                        {new Date(log.loginTime).toLocaleString()}
                      </td>
                      <td>{log.ipAddress || "—"}</td>
                      <td>{log.deviceInfo || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </>
    );
  }

  function renderActivePage() {
    switch (activeSection) {
      case "dashboard":
        return renderDashboardOverview();

      case "staff":
        return <AdminUserManagementPage />;
/*
      case "students":
        return (
          <section className="dashboard-panel">
            <h2>Student Management</h2>
            <p>
              Student account management will be added in the next step
              using the existing student backend endpoints.
            </p>
          </section>
        );
*/
      case "login-history":
        return renderLoginHistory();

      default:
        return renderDashboardOverview();
    }
  }

  return (
    <div className="admin-dashboard-layout">
      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onSignOut={signOut}
        displayName={displayName}
      />

      <main className="admin-dashboard-main">
        <header className="admin-topbar">
          <div>
            <span>Debre Markos University</span>
            <small>Bure Campus · Student Union Election System</small>
          </div>

          <div className="admin-topbar-user">
            <span>{displayName || "Administrator"}</span>
            <button type="button" onClick={signOut}>
              Sign Out
            </button>
          </div>
        </header>

        <section className="admin-dashboard-content" aria-live="polite">
          {renderActivePage()}
        </section>

        <footer className="admin-dashboard-footer">
          © {new Date().getFullYear()} Debre Markos University, Bure Campus.
          Student Union Election System.
        </footer>
      </main>
    </div>
  );
}
