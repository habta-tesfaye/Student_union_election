import { useCallback, useEffect, useState } from "react";
import { api } from "../../../services/api";
import "./Top16WinnersEntry.css";

interface Top16Candidate {
  rank: number;
  studentId: string;
  examScore10: number;
  selectionStatus?: string;
  fullName?: string;
  department?: string;
  yearSection?: string;
}

interface Top16Response {
  success: boolean;
  count: number;
  data: Top16Candidate[];
}

export default function Top16WinnersEntry() {
  const [candidates, setCandidates] = useState<Top16Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadCandidates = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response =
        await api.get<Top16Response>("/examinations/phase1/top16");

      if (!response.success || !Array.isArray(response.data)) {
        throw new Error("The Top 16 candidates response is invalid.");
      }

      setCandidates(response.data);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not load the Top 16 candidates."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCandidates();
  }, [loadCandidates]);

  return (
    <div className="top16-page">
      <div className="top16-page-header">
        <div>
          <h2>16 Winners Entry</h2>
          <p>
            Review the Phase 1 examination rankings of students
            approved by SSD.
          </p>
        </div>

        <button
          type="button"
          className="top16-refresh-button"
          onClick={() => void loadCandidates()}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Refresh List"}
        </button>
      </div>

      <div className="top16-summary">
        <div className="top16-summary-card">
          <span>Eligible Students</span>
          <strong>{candidates.length}</strong>
        </div>

        <div className="top16-summary-card">
          <span>Top 16 Candidates</span>
          <strong>{Math.min(candidates.length, 16)}</strong>
        </div>

        <div className="top16-summary-card">
          <span>Selection Status</span>
          <strong>Pending Review</strong>
        </div>
      </div>

      {errorMessage && (
        <div className="top16-error" role="alert">
          <strong>Unable to load candidates</strong>
          <p>{errorMessage}</p>
          <button
            type="button"
            onClick={() => void loadCandidates()}
          >
            Try Again
          </button>
        </div>
      )}

      {isLoading && (
        <div className="top16-message">
          Loading Phase 1 examination rankings...
        </div>
      )}

      {!isLoading && !errorMessage && candidates.length === 0 && (
        <div className="top16-message">
          <h3>No eligible students found</h3>
          <p>
            There are currently no SSD-approved students with
            recorded Phase 1 examination scores.
          </p>
        </div>
      )}

      {!isLoading && !errorMessage && candidates.length > 0 && (
        <div className="top16-table-container">
          <table className="top16-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Department</th>
                <th>Year / Section</th>
                <th>Exam Score</th>
                <th>Selection Status</th>
              </tr>
            </thead>

            <tbody>
              {candidates.map((candidate) => (
                <tr key={candidate.studentId}>
                  <td>
                    <span className="top16-rank">
                      {candidate.rank}
                    </span>
                  </td>

                  <td>{candidate.studentId}</td>
                  <td>{candidate.fullName || "—"}</td>
                  <td>{candidate.department || "—"}</td>
                  <td>{candidate.yearSection || "—"}</td>

                  <td>
                    <strong>
                      {candidate.examScore10.toFixed(2)} / 10
                    </strong>
                  </td>

                  <td>
                    <span className="top16-status">
                      {candidate.selectionStatus || "Pending review"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="top16-notice">
        <strong>Review notice</strong>
        <p>
          This page displays the current rankings only. It does not
          finalize the Top 16 selection or modify student records.
          Review the scores before proceeding to final selection.
        </p>
      </div>
    </div>
  );
}