
import { useCallback, useEffect, useState } from "react";

import {
  getDepartmentNominations,
  reviewNomination,
} from "../../nominations/services/nomination.api";

import type {
  Nomination,
  NominationAction,
} from "../../nominations/types/nomination.types";

import "./HeadNominationReviewPage.css";

interface HeadNominationReviewPageProps {
  onBack: () => void;
}

function getNominationId(nomination: Nomination): string {
  return nomination._id || nomination.id || "";
}

function getStudentName(
  student?: Nomination["nominee"]
): string {
  if (!student) {
    return "Student information unavailable";
  }

  return [
    student.firstName,
    student.middleName,
    student.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function HeadNominationReviewPage({
  onBack,
}: HeadNominationReviewPageProps) {
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadNominations = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await getDepartmentNominations();
      setNominations(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load nominations."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNominations();
  }, [loadNominations]);

  async function handleReview(
    nomination: Nomination,
    action: NominationAction
  ) {
    const nominationId = getNominationId(nomination);

    if (!nominationId) {
      setError("This nomination does not have a valid ID.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this nomination?`
    );

    if (!confirmed) {
      return;
    }

    setProcessingId(nominationId);
    setError("");
    setSuccess("");

    try {
      await reviewNomination(nominationId, action);

      setSuccess(
        action === "approve"
          ? "Nomination approved successfully."
          : "Nomination rejected successfully."
      );

      await loadNominations();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to review nomination."
      );
    } finally {
      setProcessingId(null);
    }
  }

  const pendingCount = nominations.filter(
    (item) => item.status === "pending"
  ).length;

  return (
    <main className="head-nomination-page">
      <header className="head-page-header">
        <div>
          <span className="head-page-label">DMU Bure Campus</span>
          <h1>Nomination Review</h1>
          <p>
            Review and manage student union candidate nominations
            submitted by students in your department.
          </p>
        </div>

        <div className="head-action-buttons">
          <button
            type="button"
            className="head-refresh-button"
            onClick={onBack}
          >
            Back to Dashboard
          </button>

          <button
            type="button"
            className="head-refresh-button"
            onClick={() => void loadNominations()}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </header>

      <section className="head-stat-card">
        <div>
          <span>Total nominations</span>
          <strong>{nominations.length}</strong>
        </div>

        <div>
          <span>Waiting for review</span>
          <strong>{pendingCount}</strong>
        </div>
      </section>

      {error && (
        <div className="head-message head-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="head-message head-success" role="status">
          {success}
        </div>
      )}

      <section className="head-nomination-section">
        <div className="head-section-heading">
          <h2>Student nominations</h2>
          <span>{nominations.length} records</span>
        </div>

        {isLoading ? (
          <p className="head-empty-message">
            Loading nominations...
          </p>
        ) : nominations.length === 0 ? (
          <p className="head-empty-message">
            No nominations are currently available for review.
          </p>
        ) : (
          <div className="head-table-wrapper">
            <table className="head-nomination-table">
              <thead>
                <tr>
                  <th>Nominator</th>
                  <th>Nominator ID</th>
                  <th>Nominee</th>
                  <th>Nominee ID</th>
                  <th>Department</th>
                  <th>Year / Section</th>
                  <th>CGPA</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {nominations.map((nomination) => {
                  const id = getNominationId(nomination);
                  const isProcessing = processingId === id;
                  const isPending = nomination.status === "pending";

                  return (
                    <tr key={id || nomination.nomineeStudentId}>
                      <td>{getStudentName(nomination.nominator)}</td>
                      <td>{nomination.nominatorStudentId}</td>
                      <td>{getStudentName(nomination.nominee)}</td>
                      <td>{nomination.nomineeStudentId}</td>
                      <td>{nomination.department}</td>
                      <td>{nomination.yearSection}</td>
                      <td>{nomination.nominee?.cgpa ?? "N/A"}</td>

                      <td>
                        <span
                          className={`head-status head-status-${nomination.status}`}
                        >
                          {nomination.status.replace("_", " ")}
                        </span>
                      </td>

                      <td>
                        {isPending ? (
                          <div className="head-action-buttons">
                            <button
                              type="button"
                              className="head-approve-button"
                              disabled={isProcessing}
                              onClick={() =>
                                void handleReview(nomination, "approve")
                              }
                            >
                              {isProcessing ? "Please wait..." : "Approve"}
                            </button>

                            <button
                              type="button"
                              className="head-reject-button"
                              disabled={isProcessing}
                              onClick={() =>
                                void handleReview(nomination, "reject")
                              }
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="head-reviewed-label">
                            Reviewed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default HeadNominationReviewPage;
