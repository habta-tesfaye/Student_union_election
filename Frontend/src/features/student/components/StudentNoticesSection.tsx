
import { useCallback, useEffect, useState } from "react";
import { api } from "../../../services/api";

interface StudentNotice {
  _id: string;
  title: string;
  message: string;
  targetRole: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

interface ApiResponse {
  success: boolean;
  count: number;
  data: StudentNotice[];
}

function formatNoticeDate(value?: string): string {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleString();
}

export default function StudentNoticesSection() {
  const [notices, setNotices] = useState<StudentNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotices = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<ApiResponse>("/notices/student");
      setNotices(response.data ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load student notices."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotices();
  }, [loadNotices]);

  return (
    <section className="student-notices-panel">
      <header className="student-notices-header">
        <div>
          <span className="student-notices-eyebrow">
            DEBRE MARKOS UNIVERSITY · BURE CAMPUS
          </span>
          <h2>View Notices</h2>
          <p>
            Read university-wide and department announcements.
          </p>
        </div>

        <button
          type="button"
          className="student-notices-refresh"
          onClick={() => void loadNotices()}
          disabled={loading}
        >
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </header>

      {error && (
        <div className="student-notices-error" role="alert">
          <strong>Unable to load notices</strong>
          <p>{error}</p>
          <button type="button" onClick={() => void loadNotices()}>
            Try Again
          </button>
        </div>
      )}

      {loading ? (
        <div className="student-notices-empty">
          Loading university notices...
        </div>
      ) : !error && notices.length === 0 ? (
        <div className="student-notices-empty">
          <span className="student-notices-empty-icon">📢</span>
          <h3>No notices available</h3>
          <p>
            There are currently no university or department notices.
          </p>
        </div>
      ) : (
        <div className="student-notices-list">
          {notices.map((notice) => (
            <article
              key={notice._id}
              className="student-notice-card"
            >
              <div className="student-notice-card-header">
                <span className="student-notice-icon">📢</span>

                <span className="student-notice-category">
                  {notice.targetRole === "all"
                    ? "University Notice"
                    : "Department Notice"}
                </span>
              </div>

              <h3>{notice.title}</h3>

              <p className="student-notice-message">
                {notice.message}
              </p>

              <div className="student-notice-footer">
                <span>
                  Published: {formatNoticeDate(notice.createdAt)}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
