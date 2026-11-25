
import { useEffect, useState } from "react";
import {
  getMyPhase2Evaluation,
  type Phase2Evaluation,
} from "../services/candidate.api";
import "./CandidateStage2Status.css";

function formatStatus(status: string): string {
  if (!status) return "Not available";

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusClass(status: string): string {
  const value = status.toLowerCase();

  if (
    ["approved", "passed", "selected_8", "selected"].includes(value)
  ) {
    return "stage2-success";
  }

  if (
    ["rejected", "failed", "disqualified", "not_selected"].includes(value)
  ) {
    return "stage2-danger";
  }

  return "stage2-pending";
}

function formatDate(date?: string): string {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return parsedDate.toLocaleDateString();
}

export default function CandidateStage2Status() {
  const [evaluation, setEvaluation] = useState<Phase2Evaluation | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadEvaluation() {
      try {
        setLoading(true);
        setError("");

        const result = await getMyPhase2Evaluation();

        if (isMounted) {
          setEvaluation(result);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message =
            err instanceof Error
              ? err.message
              : "Unable to load your Phase 2 evaluation.";

          setError(message);
          setEvaluation(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadEvaluation();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="candidate-stage2-page">
        <div className="stage2-loading">
          Loading your Phase 2 evaluation...
        </div>
      </div>
    );
  }

  return (
    <div className="candidate-stage2-page">
      {/* Page heading */}
      <div className="stage2-heading">
        <div>
          <span className="stage2-label">CANDIDATE PORTAL</span>

          <h1>Phase 2 Evaluation Status</h1>

          <p>
            Review your Phase 2 examination scores and selection status.
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="stage2-error">
          {error}
        </div>
      )}

      {/* No evaluation */}
      {!evaluation ? (
        <div className="stage2-card stage2-empty">
          <div className="stage2-empty-icon">!</div>

          <h2>No Phase 2 evaluation found</h2>

          <p>
            Your Phase 2 evaluation has not been recorded or is not
            currently available.
          </p>
        </div>
      ) : (
        <>
          {/* Evaluation information */}
          <div className="stage2-card">
            <div className="stage2-card-heading">
              <div>
                <h2>Phase 2 Examination Results</h2>
                <p>Your evaluation scores recorded by the SSD.</p>
              </div>

              <span className="stage2-number">02</span>
            </div>

            {/* Individual scores */}
            <div className="stage2-details-grid">
              <div className="stage2-detail">
                <span>Certificate Score</span>
                <strong>
                  {evaluation.certScore ?? "Not evaluated"} / 5
                </strong>
              </div>

              <div className="stage2-detail">
                <span>Proposal Score</span>
                <strong>
                  {evaluation.proposalScore ?? "Not evaluated"} / 15
                </strong>
              </div>

              <div className="stage2-detail">
                <span>Interview Score</span>
                <strong>
                  {evaluation.interviewScore ?? "Not evaluated"} / 10
                </strong>
              </div>

              <div className="stage2-detail">
                <span>Evaluation Date</span>
                <strong>
                  {formatDate(evaluation.evaluatedAt)}
                </strong>
              </div>
            </div>

            {/* Total Phase 2 score */}
            <div className="stage2-score-summary">
              <span>Total Phase 2 Score</span>

              <strong>
                {evaluation.totalScore ?? 0} / 30
              </strong>
            </div>
          </div>

          {/* Selection status */}
          <div className="stage2-card">
            <div className="stage2-card-heading">
              <div>
                <h2>Selection Information</h2>
                <p>Your current Phase 2 selection status.</p>
              </div>
            </div>

            <div className="stage2-detail">
              <span>Selection Status</span>

              <strong
                className={getStatusClass(
                  evaluation.selectionStatus ?? ""
                )}
              >
                {formatStatus(evaluation.selectionStatus ?? "")}
              </strong>
            </div>

            {evaluation.remarks && (
              <div style={{ marginTop: "20px" }}>
                <span
                  style={{
                    display: "block",
                    marginBottom: "10px",
                    color: "#77849a",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  SSD Remarks
                </span>

                <div className="stage2-information">
                  {evaluation.remarks}
                </div>
              </div>
            )}
          </div>

          {/* Important information */}
          <div className="stage2-information">
            <strong>Important:</strong>
            <span>
              This page displays your Phase 2 evaluation information.
              Candidates cannot change their examination scores or
              selection status.
            </span>
          </div>
        </>
      )}
    </div>
  );
}
