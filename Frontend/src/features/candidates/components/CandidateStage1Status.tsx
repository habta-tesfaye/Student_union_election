import "./CandidateStage1Status.css";

export interface Phase1StatusData {
  motivationText: string;
  examScore10: number | null;
  ssdStatus: string;
  selectionStatus: string;
  submittedAt: string;
}

interface CandidateStage1StatusProps {
  data?: Phase1StatusData | null;
  loading?: boolean;
  error?: string;
  onBack: () => void;
}

function formatStatus(status: string): string {
  if (!status) return "Not available";

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusClass(status: string): string {
  const value = status.toLowerCase();

  if (["approved", "passed", "selected_16"].includes(value)) {
    return "status-success";
  }

  if (["rejected", "failed", "disqualified"].includes(value)) {
    return "status-danger";
  }

  return "status-pending";
}

export default function CandidateStage1Status({
  data,
  loading = false,
  error,
  onBack,
}: CandidateStage1StatusProps) {
  if (loading) {
    return (
      <div className="candidate-status-page">
        <div className="candidate-status-card">
          <p>Loading Phase 1 application status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="candidate-status-page">
      <div className="candidate-status-heading">
        <div>
          <span className="candidate-status-label">
            CANDIDATE PORTAL
          </span>

          <h1>Phase 1 Application Status</h1>

          <p>
            Review your submitted application and examination result.
          </p>
        </div>

        <button
          type="button"
          className="status-back-button"
          onClick={onBack}
        >
          ← Candidate Dashboard
        </button>
      </div>

      {error && (
        <div className="status-error">
          {error}
        </div>
      )}

      {!data ? (
        <div className="candidate-status-card status-empty">
          <div className="status-empty-icon">!</div>

          <h2>No Phase 1 application found</h2>

          <p>
            Your submitted application information is not currently available.
          </p>
        </div>
      ) : (
        <>
          <div className="candidate-status-card">
            <div className="status-card-heading">
              <div>
                <h2>Application Information</h2>
                <p>Your submitted motivation statement</p>
              </div>

              <span className="status-number">01</span>
            </div>

            <div className="motivation-box">
              {data.motivationText ||
                "No motivation statement available."}
            </div>

            <div className="status-details-grid">
              <div className="status-detail">
                <span>Phase 1 Examination Score</span>

                <strong>
                  {data.examScore10 === null
                    ? "Not evaluated"
                    : `${data.examScore10} / 10`}
                </strong>
              </div>

              <div className="status-detail">
                <span>SSD Approval Status</span>

                <strong className={getStatusClass(data.ssdStatus)}>
                  {formatStatus(data.ssdStatus)}
                </strong>
              </div>

              <div className="status-detail">
                <span>Selection Status</span>

                <strong className={getStatusClass(data.selectionStatus)}>
                  {formatStatus(data.selectionStatus)}
                </strong>
              </div>

              <div className="status-detail">
                <span>Application Submission Date</span>

                <strong>
                  {data.submittedAt
                    ? new Date(data.submittedAt).toLocaleDateString()
                    : "Not available"}
                </strong>
              </div>
            </div>
          </div>

          <div className="status-information">
            <strong>Important:</strong> This page displays your application
            information. Candidates cannot change their examination scores,
            approval status, or selection status.
          </div>
        </>
      )}
    </div>
  );
}