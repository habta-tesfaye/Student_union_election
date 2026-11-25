import { useEffect, useState } from "react";
import "./DirectorDashboardPage.css";

import Final8Winners from "../components/Final8Winners";
import FinalResult from "../components/FinalResult";
import Phase2Management from "../components/Phase2Management";
import { useAuthContext } from "../../../context/AuthContext";
import { api } from "../../../services/api";
import MainLayout from "../../../components/layout/MainLayout";
import ElectionScheduleManager from "../../elections/components/ElectionScheduleManager";
import DirectorNoticesPage from "./DirectorNoticesPage";
import DisciplinePage from "../../discipline/pages/DisciplinePage";
import DirectorNotifications from "../components/DirectorNotifications";
import Phase1Management from "../components/Phase1Management";
import HeadWinnerSubmissions from "../components/HeadWinnerSubmissions";
import Top16WinnersEntry from "../components/Top16WinnersEntry";

interface DisciplineRecord {
  _id: string;
  studentId?: string;
  fullName?: string;
  status?: string;
  updatedAt: string;
}

interface DirectorDashboardData {
  totalStudents: number;
  pendingApplications: number;
  totalDisciplineReports: number;
  unreadNotifications: number;
  latestUnreadNotification: {
    title: string;
    message: string;
    createdAt: string;
  } | null;
  recentDisciplineRecords: DisciplineRecord[];
}

interface DirectorDashboardResponse {
  success: boolean;
  message: string;
  data: DirectorDashboardData;
}

export default function DirectorDashboardPage() {
  const { signOut } = useAuthContext();

  const [activePage, setActivePage] = useState("dashboard");
  const [dashboard, setDashboard] =
    useState<DirectorDashboardData | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const response =
          await api.get<DirectorDashboardResponse>("/dashboard");

        if (!response.success || !response.data) {
          throw new Error("The dashboard response was incomplete.");
        }

        if (isMounted) {
          setDashboard(response.data);
          setErrorMessage("");
        }
      } catch (error: unknown) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Could not load the Director dashboard."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <MainLayout
      onLogout={signOut}
      activePage={activePage}
      onNavigate={setActivePage}
    >
      <div className="director-dashboard-page">
        {activePage === "dashboard" && (
          <section className="dashboard-content" aria-live="polite">
            <h2>Dashboard Overview</h2>

            {isLoading && <p>Loading dashboard information...</p>}

            {!isLoading && errorMessage && (
              <div className="dashboard-error" role="alert">
                <p>{errorMessage}</p>
                <p>
                  Check that the backend is running and that you are signed
                  in with the Director account.
                </p>
              </div>
            )}

            {!isLoading && dashboard && (
              <>
                <div className="dashboard-statistics">
                  <article className="dashboard-stat">
                    <h3>Registered Students</h3>
                    <p>{dashboard.totalStudents}</p>
                  </article>

                  <article className="dashboard-stat">
                    <h3>Applications Awaiting SSD Review</h3>
                    <p>{dashboard.pendingApplications}</p>
                  </article>

                  <article className="dashboard-stat">
                    <h3>Discipline Reports</h3>
                    <p>{dashboard.totalDisciplineReports}</p>
                  </article>

                  <article className="dashboard-stat">
                    <h3>Unread Notifications</h3>
                    <p>{dashboard.unreadNotifications}</p>
                  </article>
                </div>

                <section className="dashboard-panel">
                  <h3>Latest Unread Notification</h3>

                  {dashboard.latestUnreadNotification ? (
                    <>
                      <h4>{dashboard.latestUnreadNotification.title}</h4>

                      <p>{dashboard.latestUnreadNotification.message}</p>

                      <p>
                        <small>
                          {new Date(
                            dashboard.latestUnreadNotification.createdAt
                          ).toLocaleString()}
                        </small>
                      </p>
                    </>
                  ) : (
                    <p>You have no unread notifications.</p>
                  )}
                </section>

                <section className="dashboard-panel">
                  <h3>Recent Discipline Records</h3>

                  {dashboard.recentDisciplineRecords.length === 0 ? (
                    <p>No discipline records were returned.</p>
                  ) : (
                    <div className="dashboard-table-wrapper">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Student ID</th>
                            <th>Student Name</th>
                            <th>Status</th>
                            <th>Last Updated</th>
                          </tr>
                        </thead>

                        <tbody>
                          {dashboard.recentDisciplineRecords.map((record) => (
                            <tr key={record._id}>
                              <td>{record.studentId || "—"}</td>
                              <td>{record.fullName || "—"}</td>
                              <td>{record.status || "—"}</td>
                              <td>
                                {new Date(record.updatedAt).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            )}
          </section>
        )}

        {activePage === "schedules" && (
          <section className="dashboard-content">
            <ElectionScheduleManager />
          </section>
        )}

        {activePage === "notices" && (
          <section className="dashboard-content">
            <DirectorNoticesPage />
          </section>
        )}

        {activePage === "winner-entry-16" && <Top16WinnersEntry />}

        {activePage === "notifications" && <DirectorNotifications />}

        {activePage === "phase2" && <Phase2Management />}

        {activePage === "discipline" && (
          <section className="dashboard-content">
            <DisciplinePage />
          </section>
        )}

        {activePage === "winner-final-8" && <Final8Winners />}

        {activePage === "winner-final-result" && <FinalResult />}

        {activePage === "winner-submissions" && <HeadWinnerSubmissions />}

        {activePage === "phase1" && <Phase1Management />}

        {activePage !== "dashboard" &&
          activePage !== "schedules" &&
          activePage !== "notices" &&
          activePage !== "winner-entry-16" &&
          activePage !== "notifications" &&
          activePage !== "phase2" &&
          activePage !== "discipline" &&
          activePage !== "winner-final-8" &&
          activePage !== "winner-final-result" &&
          activePage !== "winner-submissions" &&
          activePage !== "phase1" && (
            <section className="dashboard-content">
              <h2>
                {activePage.charAt(0).toUpperCase() + activePage.slice(1)}
              </h2>

              <p>
                This section will be connected to its existing system
                functions next.
              </p>
            </section>
          )}

        {activePage === "dashboard" && (
          <footer className="app-footer">
            <p>
              © {new Date().getFullYear()} Debre Markos University, Bure
              Campus. Student Union Election System.
            </p>
          </footer>
        )}
      </div>
    </MainLayout>
  );
}