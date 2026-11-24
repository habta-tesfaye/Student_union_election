import { useCallback, useEffect, useState } from "react";
import "./HeadWinnerSubmissions.css";
type HeadWinner = {
  studentId: string;
  status: string;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  department: string;
  yearSection: string;
};

type SubmissionNotification = {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function getApiData<T>(path: string): Promise<T> {
  const token = localStorage.getItem("dmu_access_token") || "";

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const result = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Could not load the information.");
  }

  return result.data;
}

export default function HeadWinnerSubmissions() {
  const [winners, setWinners] = useState<HeadWinner[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [winnerData, notificationData] = await Promise.all([
        getApiData<HeadWinner[]>("/results/head-winners/review"),
        getApiData<{
          notifications: SubmissionNotification[];
          pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
          };
        }>("/notifications?page=1&limit=100"),
      ]);

      setWinners(winnerData);
      setSubmissions(
        notificationData.notifications.filter(
          (notification) => notification.type === "winner_submission",
        ),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load Head winner submissions.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const groupedWinners = winners.reduce<Record<string, HeadWinner[]>>(
    (groups, winner) => {
      const groupName = `${winner.department || "Department not recorded"} — ${
        winner.yearSection || "Section not recorded"
      }`;

      if (!groups[groupName]) {
        groups[groupName] = [];
      }

      groups[groupName].push(winner);
      return groups;
    },
    {},
  );

  return (
    <div className="head-winner-submissions">
      <div className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <h2>Department Head Winner Submissions</h2>
            <p>
              Review submission notifications and the currently recorded class
              winners.
            </p>
          </div>

          <button type="button" onClick={() => void loadData()}>
            Refresh
          </button>
        </div>

        {loading && <p>Loading winner submissions…</p>}

        {!loading && error && <p role="alert">{error}</p>}

        {!loading && !error && (
          <>
            <h3>Submission History</h3>

            {submissions.length === 0 ? (
              <p>No Head winner-submission notifications were found.</p>
            ) : (
              <div className="dashboard-table-wrapper">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Submission</th>
                      <th>Details</th>
                      <th>Received</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((submission) => (
                      <tr key={submission._id}>
                        <td>{submission.title}</td>
                        <td>{submission.message}</td>
                        <td>
                          {new Date(submission.createdAt).toLocaleString()}
                        </td>
                        <td>{submission.isRead ? "Read" : "Unread"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <h3>Recorded Class Winners</h3>

            {winners.length === 0 ? (
              <p>No active class winners are currently recorded.</p>
            ) : (
              Object.entries(groupedWinners).map(([groupName, groupWinners]) => (
                <section key={groupName}>
                  <h4>{groupName}</h4>

                  <div className="dashboard-table-wrapper">
                    <table className="dashboard-table">
                      <thead>
                        <tr>
                          <th>Student ID</th>
                          <th>Student Name</th>
                          <th>Gender</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupWinners.map((winner) => (
                          <tr key={winner.studentId}>
                            <td>{winner.studentId}</td>
                            <td>
                              {[
                                winner.firstName,
                                winner.middleName,
                                winner.lastName,
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            </td>
                            <td>{winner.gender || "—"}</td>
                            <td>{winner.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}