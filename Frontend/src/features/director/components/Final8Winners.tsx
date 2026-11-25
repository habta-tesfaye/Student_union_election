import { useCallback, useEffect, useState } from "react";
import { api } from "../../../services/api";
import "./Final8Winners.css";

interface Phase2Evaluation {
  _id: string;
  studentId: string;
  certScore: number;
  proposalScore: number;
  interviewScore: number;
  totalScore: number;
  selectionStatus?: string;
}

interface Phase2Response {
  success: boolean;
  data: Phase2Evaluation[];
}

export default function Final8Winners() {
  const [evaluations, setEvaluations] = useState<Phase2Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEvaluations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const response =
        await api.get<Phase2Response>("/examinations/phase2");

      if (!response.success || !Array.isArray(response.data)) {
        throw new Error("Invalid Phase 2 evaluation response.");
      }

      setEvaluations(response.data);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load Phase 2 evaluations."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEvaluations();
  }, [loadEvaluations]);

  return (
    <div className="final8-page">
      <div className="final8-header">
        <div>
          <h2>Final 8 Winners</h2>
          <p>Review Phase 2 evaluation scores.</p>
        </div>

        <button
          type="button"
          onClick={() => void loadEvaluations()}
          disabled={isLoading}
        >
          Refresh
        </button>
      </div>

      <div className="final8-score-cards">
        <article>
          <span>Evaluated Students</span>
          <strong>{evaluations.length}</strong>
        </article>

        <article>
          <span>Certificate Maximum</span>
          <strong>5</strong>
        </article>

        <article>
          <span>Proposal Maximum</span>
          <strong>15</strong>
        </article>

        <article>
          <span>Interview Maximum</span>
          <strong>10</strong>
        </article>
      </div>

      {isLoading && <p className="final8-message">Loading evaluations...</p>}

      {error && (
        <div className="final8-error" role="alert">
          {error}
          <button type="button" onClick={() => void loadEvaluations()}>
            Try Again
          </button>
        </div>
      )}

      {!isLoading && !error && evaluations.length === 0 && (
        <p className="final8-message">
          No Phase 2 evaluation records are available.
        </p>
      )}

      {!isLoading && !error && evaluations.length > 0 && (
        <div className="final8-table-wrapper">
          <table className="final8-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Certificate / 5</th>
                <th>Proposal / 15</th>
                <th>Interview / 10</th>
                <th>Total / 30</th>
                <th>Selection Status</th>
              </tr>
            </thead>

            <tbody>
              {evaluations.map((item) => (
                <tr key={item._id}>
                  <td>{item.studentId}</td>
                  <td>{item.certScore}</td>
                  <td>{item.proposalScore}</td>
                  <td>{item.interviewScore}</td>
                  <td>
                    <strong>{item.totalScore} / 30</strong>
                  </td>
                  <td>{item.selectionStatus || "Pending"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="final8-notice">
        <strong>Director review required</strong>
        <p>
          This page displays Phase 2 evaluation records only.
          It does not select or finalize the Final 8 students.
          Final selection must follow the original PHP rules.
        </p>
      </div>
    </div>
  );
}