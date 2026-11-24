
import { useEffect, useState } from "react";
import {
  getHeadWinnersPreview,
  getHeadWinnerPhoto,
  submitHeadWinners,
  type HeadWinnerCandidate,
  type HeadWinnersPreview,
} from "../head-winners.api";
import "./HeadSendToSSDPage.css";

interface HeadSendToSSDPageProps {
  onBack: () => void;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function WinnerCard({
  winner,
  category,
}: {
  winner: HeadWinnerCandidate;
  category: "Male" | "Female";
}) {
  const fullName = [
    winner.firstName,
    winner.middleName,
    winner.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className="ssd-winner-card">
      <div className="ssd-winner-photo">
        {winner.photo ? (
          <img
            src={getHeadWinnerPhoto(winner.photo)}
            alt={fullName}
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <span>No photo</span>
        )}
      </div>

      <div className="ssd-winner-details">
        <div className="ssd-winner-top">
          <span className="ssd-gender-label">{category} Winner</span>
          {winner.submitted ? (
            <span className="ssd-submitted-status">
              Already Submitted
            </span>
          ) : (
            <span className="ssd-pending-status">Not Submitted</span>
          )}
        </div>

        <h3>{fullName}</h3>
        <p className="ssd-student-id">{winner.studentId}</p>

        <div className="ssd-winner-information">
          <div>
            <span>GPA</span>
            <strong>{winner.gpa?.toFixed(2) ?? "N/A"}</strong>
          </div>
          <div>
            <span>Total Votes</span>
            <strong>{winner.totalVotes}</strong>
          </div>
          <div>
            <span>Region</span>
            <strong>{winner.region || "N/A"}</strong>
          </div>
          <div>
            <span>Department</span>
            <strong>{winner.department || "N/A"}</strong>
          </div>
        </div>

        {winner.manualWinner && (
          <span className="ssd-manual-winner">
            Selected through tie resolution
          </span>
        )}
      </div>
    </article>
  );
}

function HeadSendToSSDPage({ onBack }: HeadSendToSSDPageProps) {
  const [preview, setPreview] = useState<HeadWinnersPreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadPreview() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await getHeadWinnersPreview();
      setPreview(result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load the winners list."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadPreview();
  }, []);

  const allWinners =
    preview?.sections.flatMap((section) =>
      [section.maleWinner, section.femaleWinner].filter(
        (winner): winner is HeadWinnerCandidate => winner !== null
      )
    ) ?? [];

  const submittedCount = allWinners.filter(
    (winner) => winner.submitted
  ).length;

  const submissionComplete =
    allWinners.length > 0 && submittedCount === allWinners.length;

  async function handleSubmit() {
    if (!preview || submissionComplete || !preview.scheduleOpen) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to submit the finalized winners to Parliament (SSD)?"
    );

    if (!confirmed) return;

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await submitHeadWinners();

      setSuccessMessage(
        `${result.message} Newly added winners: ${result.insertedCount}.`
      );

      await loadPreview();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Winner submission failed."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="ssd-page">
      <header className="ssd-header">
        <button
          type="button"
          className="ssd-back-button"
          onClick={onBack}
        >
          ← Back to Dashboard
        </button>

        <div className="ssd-heading">
          <span className="ssd-eyebrow">DEPARTMENT HEAD PORTAL</span>
          <h1>Send Winners to SSD</h1>
          <p>
            Review the finalized male and female class winners before
            sending them to Parliament.
          </p>
        </div>
      </header>

      {errorMessage && (
        <div className="ssd-alert ssd-alert-error" role="alert">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="ssd-alert ssd-alert-success" role="status">
          {successMessage}
        </div>
      )}

      {isLoading ? (
        <div className="ssd-loading">Loading finalized winners...</div>
      ) : preview ? (
        <>
          <section className="ssd-summary">
            <div className="ssd-summary-card">
              <span>Total Winners</span>
              <strong>{allWinners.length}</strong>
            </div>
            <div className="ssd-summary-card">
              <span>Already Submitted</span>
              <strong>{submittedCount}</strong>
            </div>
            <div className="ssd-summary-card">
              <span>Remaining</span>
              <strong>{allWinners.length - submittedCount}</strong>
            </div>
          </section>

          <section className="ssd-schedule">
            <div>
              <h2>Submission Schedule</h2>
              {preview.schedule ? (
                <p>
                  <strong>Start:</strong>{" "}
                  {formatDate(preview.schedule.startTime)}
                  <br />
                  <strong>End:</strong>{" "}
                  {formatDate(preview.schedule.endTime)}
                </p>
              ) : (
                <p>No active submission schedule is configured.</p>
              )}
            </div>

            <span
              className={
                preview.scheduleOpen
                  ? "ssd-schedule-open"
                  : "ssd-schedule-closed"
              }
            >
              {preview.scheduleOpen ? "Schedule Open" : "Schedule Closed"}
            </span>
          </section>

          {submissionComplete && (
            <div className="ssd-alert ssd-alert-success">
              All finalized winners have already been submitted to
              Parliament. No further submission is needed.
            </div>
          )}

          {preview.sections.length === 0 ? (
            <div className="ssd-empty">
              No year sections were found for this department.
            </div>
          ) : (
            <section className="ssd-sections">
              <h2>Finalized Department Winners</h2>

              {preview.sections.map((section) => (
                <div
                  className="ssd-section-card"
                  key={section.yearSection}
                >
                  <h3>{section.yearSection}</h3>

                  <div className="ssd-winner-grid">
                    {section.maleWinner ? (
                      <WinnerCard
                        winner={section.maleWinner}
                        category="Male"
                      />
                    ) : (
                      <div className="ssd-no-winner">
                        No male winner selected for this section.
                      </div>
                    )}

                    {section.femaleWinner ? (
                      <WinnerCard
                        winner={section.femaleWinner}
                        category="Female"
                      />
                    ) : (
                      <div className="ssd-no-winner">
                        No female winner selected for this section.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </section>
          )}

          <footer className="ssd-actions">
            <button
              type="button"
              className="ssd-print-button"
              onClick={() => window.print()}
            >
              Print Official Report
            </button>

            {submissionComplete ? (
              <button type="button" className="ssd-done-button" disabled>
                Already Submitted
              </button>
            ) : (
              <button
                type="button"
                className="ssd-submit-button"
                onClick={() => void handleSubmit()}
                disabled={
                  isSubmitting ||
                  !preview.scheduleOpen ||
                  allWinners.length === 0
                }
              >
                {isSubmitting
                  ? "Submitting..."
                  : "Submit Winners to SSD"}
              </button>
            )}
          </footer>
        </>
      ) : (
        <div className="ssd-empty">
          No winners preview is available.
        </div>
      )}
    </main>
  );
}

export default HeadSendToSSDPage;
