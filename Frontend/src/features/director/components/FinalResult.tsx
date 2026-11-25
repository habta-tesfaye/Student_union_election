
import { useEffect, useState } from "react";
import { getAccessToken } from "../../../services/api";
import "./FinalResult.css";

type ParliamentMember = {
  studentId?: string;
  student_id?: string;
  firstName?: string;
  first_name?: string;
  middleName?: string;
  middle_name?: string;
  lastName?: string;
  last_name?: string;
  department?: string;
  photo?: string | null;
  total_score_100?: number;
  final_selection_status?: string;
  finalSelectionStatus?: string;
};

type ParliamentResults = {
  isFinalized?: boolean;
  finalized?: boolean;
  topThree?: ParliamentMember[];
  executiveMembers?: ParliamentMember[];
  generalMembers?: ParliamentMember[];
  results?: ParliamentMember[];
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  data?: ParliamentResults;
};

function getName(member: ParliamentMember): string {
  return [
    member.firstName ?? member.first_name ?? "",
    member.middleName ?? member.middle_name ?? "",
    member.lastName ?? member.last_name ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

function getRole(member: ParliamentMember): string {
  return (
    member.final_selection_status ??
    member.finalSelectionStatus ??
    "Pending"
  );
}

function getPhoto(member: ParliamentMember): string {
  return member.photo || "";
}

function getScore(member: ParliamentMember): number {
  return Number(member.total_score_100 ?? 0);
}

function getStudentId(member: ParliamentMember): string {
  return member.studentId ?? member.student_id ?? "";
}

export default function FinalResult() {
  const [results, setResults] = useState<ParliamentResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadResults(signal?: AbortSignal) {
    try {
      setLoading(true);
      setError("");

      const token = getAccessToken();

      if (!token) {
        throw new Error("Please log in again to view election results.");
      }

      const response = await fetch(
        "http://localhost:5000/api/results/parliament",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          signal,
        }
      );

      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.message || "Unable to retrieve Parliament results."
        );
      }

      setResults(result.data);
    } catch (err) {
      if (
        err instanceof Error &&
        err.name !== "AbortError"
      ) {
        setError(err.message);
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    void loadResults(controller.signal);

    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="final-result-page">
        <div className="fr-message-card">
          <div className="fr-spinner" />
          <h2>Loading Final Results</h2>
          <p>
            Please wait while the election results are retrieved.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="final-result-page">
        <div className="fr-message-card fr-error">
          <h2>Unable to Load Results</h2>
          <p>{error}</p>

          <button
            className="fr-retry-button"
            onClick={() => void loadResults()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const isFinalized =
    results?.isFinalized ?? results?.finalized ?? false;

  if (!isFinalized) {
    return (
      <div className="final-result-page">
        <div className="fr-page-header">
          <span className="fr-eyebrow">
            DIRECTOR / ELECTION RESULTS
          </span>

          <h1>Final Parliament Results</h1>

          <p>Debre Markos University – Bure Campus</p>
        </div>

        <div className="fr-message-card">
          <div className="fr-pending-icon">◷</div>

          <h2>Results Under Review</h2>

          <p>
            The SSD Election Committee is finalizing the leadership
            ranks and verifying scores. Please check back later
            for the official announcement.
          </p>
        </div>
      </div>
    );
  }

  const topThree = results?.topThree ?? [];
  const executiveMembers = results?.executiveMembers ?? [];
  const generalMembers =
    results?.generalMembers ?? results?.results ?? [];

  const leadershipOrder = [
    "Vice President",
    "President",
    "Executive",
  ];

  const orderedLeadership = [...topThree].sort(
    (a, b) =>
      leadershipOrder.indexOf(getRole(a)) -
      leadershipOrder.indexOf(getRole(b))
  );

  return (
    <div className="final-result-page">
      <div className="fr-page-header">
        <span className="fr-eyebrow">
          DIRECTOR / ELECTION RESULTS
        </span>

        <h1>Final Parliament Results</h1>

        <p>Official Parliament Leadership – Bure Campus</p>
      </div>

      <div className="fr-status">
        <span className="fr-status-dot" />
        Official results finalized
      </div>

      {/* TOP THREE LEADERSHIP */}

      <section className="fr-section">
        <div className="fr-section-heading">
          <div>
            <span className="fr-eyebrow">TOP THREE</span>
            <h2>Elected Leadership</h2>
          </div>

          <span className="fr-section-icon">♛</span>
        </div>

        {orderedLeadership.length === 0 ? (
          <div className="fr-empty">
            No leadership assignments available.
          </div>
        ) : (
          <div className="fr-podium">
            {orderedLeadership.map((member) => {
              const role = getRole(member);

              return (
                <article
                  className={`fr-podium-card ${
                    role === "President"
                      ? "fr-president"
                      : role === "Vice President"
                        ? "fr-vice-president"
                        : "fr-executive"
                  }`}
                  key={`${getStudentId(member)}-${role}`}
                >
                  {role === "President" && (
                    <span className="fr-crown">♛</span>
                  )}

                  <div className="fr-avatar fr-large-avatar">
                    {getPhoto(member) ? (
                      <img
                        src={getPhoto(member)}
                        alt={getName(member)}
                      />
                    ) : (
                      <span>
                        {getName(member).charAt(0) || "?"}
                      </span>
                    )}
                  </div>

                  <span className="fr-role">{role}</span>

                  <h3>
                    {getName(member) || "Name unavailable"}
                  </h3>

                  <p>
                    {member.department || "Department unavailable"}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* EXECUTIVE MEMBERS */}

      <section className="fr-section">
        <div className="fr-section-heading">
          <div>
            <span className="fr-eyebrow">RANKS 4–8</span>
            <h2>Executive Members</h2>
          </div>

          <span className="fr-count">
            {executiveMembers.length}
          </span>
        </div>

        {executiveMembers.length === 0 ? (
          <div className="fr-empty">
            No Executive Members available.
          </div>
        ) : (
          <div className="fr-executive-grid">
            {executiveMembers.map((member) => (
              <article
                className="fr-executive-card"
                key={getStudentId(member) || getName(member)}
              >
                <div className="fr-avatar">
                  {getPhoto(member) ? (
                    <img
                      src={getPhoto(member)}
                      alt={getName(member)}
                    />
                  ) : (
                    <span>
                      {getName(member).charAt(0) || "?"}
                    </span>
                  )}
                </div>

                <h3>
                  {getName(member) || "Name unavailable"}
                </h3>

                <p>
                  {member.department || "Department unavailable"}
                </p>

                <span className="fr-role">
                  Executive Member
                </span>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* GENERAL MEMBERS */}

      <section className="fr-section fr-general-section">
        <div className="fr-section-heading">
          <div>
            <span className="fr-eyebrow">PARLIAMENT</span>
            <h2>General Members</h2>
          </div>

          <span className="fr-count">
            {generalMembers.length}
          </span>
        </div>

        {generalMembers.length === 0 ? (
          <div className="fr-empty">
            No General Members available.
          </div>
        ) : (
          <div className="fr-member-grid">
            {generalMembers.map((member, index) => (
              <article
                className="fr-member-card"
                key={
                  getStudentId(member) ||
                  `${getName(member)}-${index}`
                }
              >
                <div className="fr-avatar fr-small-avatar">
                  {getPhoto(member) ? (
                    <img
                      src={getPhoto(member)}
                      alt={getName(member)}
                    />
                  ) : (
                    <span>
                      {getName(member).charAt(0) || "?"}
                    </span>
                  )}
                </div>

                <div className="fr-member-info">
                  <h3>
                    {getName(member) || "Name unavailable"}
                  </h3>

                  <p>
                    {member.department || "Department unavailable"}
                  </p>

                  <span className="fr-score">
                    {getScore(member).toFixed(1)}%
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="fr-footer">
        <p>Verified by the SSD Election Committee</p>
        <p>Debre Markos University – Bure Campus</p>
      </footer>
    </div>
  );
}
