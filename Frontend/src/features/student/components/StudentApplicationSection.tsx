import type { FormEvent } from "react";

interface ApplicationSummary {
  motivationText: string;
  examScore10?: number;
  examStatus: string;
  ssdStatus: string;
  selectionStatus: string;
  appliedAt: string;
}

interface StudentApplicationSectionProps {
  application: ApplicationSummary | null;
  motivationText: string;
  onMotivationChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  applicationError: string;
  applicationMessage: string;
  submittingApplication: boolean;
  formatDate: (value: string) => string;
}

function StudentApplicationSection({
  application,
  motivationText,
  onMotivationChange,
  onSubmit,
  applicationError,
  applicationMessage,
  submittingApplication,
  formatDate,
}: StudentApplicationSectionProps) {
  return (
    <section className="student-panel student-application-panel">
      <div className="student-panel-heading">
        <div>
          <p className="student-panel-kicker">Election application</p>
          <h2>Your application</h2>
        </div>
      </div>

      {application ? (
        <div className="student-application-details">
          <p>
            <strong>Application status:</strong> {application.examStatus}
          </p>

          <p>
            <strong>SSD review:</strong> {application.ssdStatus}
          </p>

          <p>
            <strong>Selection status:</strong> {application.selectionStatus}
          </p>

          {typeof application.examScore10 === "number" && (
            <p>
              <strong>Phase 1 score:</strong> {application.examScore10} / 10
            </p>
          )}

          <p>
            <strong>Submitted:</strong> {formatDate(application.appliedAt)}
          </p>

          <div className="student-motivation">
            <strong>Motivation statement</strong>
            <p>{application.motivationText}</p>
          </div>
        </div>
      ) : (
        <>
          <p className="student-muted">
            You have not submitted an election application yet.
          </p>

          <form className="student-application-form" onSubmit={onSubmit}>
            <label htmlFor="student-motivation">
              Motivation statement
            </label>

            <textarea
              id="student-motivation"
              value={motivationText}
              onChange={(event) => onMotivationChange(event.target.value)}
              maxLength={5000}
              rows={6}
              placeholder="Explain why you want to apply..."
              required
            />

            <p className="student-field-help">
              Maximum 5,000 characters. The backend checks eligibility and
              prevents duplicate applications.
            </p>

            {applicationError && (
              <p className="student-inline-error" role="alert">
                {applicationError}
              </p>
            )}

            {applicationMessage && (
              <p className="student-inline-success" role="status">
                {applicationMessage}
              </p>
            )}

            <button
              className="student-primary-button"
              type="submit"
              disabled={submittingApplication}
            >
              {submittingApplication
                ? "Submitting..."
                : "Submit application"}
            </button>
          </form>
        </>
      )}
    </section>
  );
}

export default StudentApplicationSection;
