
import { useEffect, useState, type FormEvent } from "react";
import {
  getMyApplication,
  submitMyApplication,
} from "../services/candidate.api";
import type {
  CandidateApplication as CandidateApplicationData,
} from "../types/candidate.types";
import "./CandidateApplication.css";

export default function CandidateApplicationPanel() {
  const [application, setApplication] =
    useState<CandidateApplicationData | null>(null);
  const [motivationText, setMotivationText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function loadApplication() {
      try {
        const result = await getMyApplication();

        if (active) {
          setApplication(result);
          setMotivationText(result.motivationText || "");
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to load application.";

        const lowerMessage = message.toLowerCase();

        // No existing application: show the submission form.
        const applicationNotFound =
          lowerMessage.includes("not submitted") ||
          lowerMessage.includes("not found") ||
          lowerMessage.includes("not yet");

        if (active && !applicationNotFound) {
          setError(message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadApplication();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const trimmed = motivationText.trim();

    if (trimmed.length < 20) {
      setError("Your leadership vision must contain at least 20 characters.");
      return;
    }

    if (trimmed.length > 5000) {
      setError("Your leadership vision cannot exceed 5000 characters.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await submitMyApplication({
        motivationText: trimmed,
      });

      setApplication(result);
      setSuccess("Your leadership vision has been successfully submitted.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Application submission failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className="candidate-application">
        <p>Loading your application information...</p>
      </section>
    );
  }

  return (
    <section className="candidate-application">
      <div className="candidate-application-heading">
        <div>
          <span className="candidate-application-eyebrow">
            PHASE 1 · LEADERSHIP APPLICATION
          </span>
          <h2>Submit Phase 1 Application</h2>
          <p>
            Share your leadership vision and explain how you intend to
            serve the students of DMU Bure Campus.
          </p>
        </div>

        <div className="candidate-application-icon">✍</div>
      </div>

      {error && (
        <div className="candidate-application-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="candidate-application-success" role="status">
          {success}
        </div>
      )}

      {application ? (
        <div className="candidate-application-result">
          <h3>Application Submitted</h3>
          <p>
            Your leadership vision has already been submitted. Review
            your application and its current status below.
          </p>

          <div className="candidate-application-details">
            <p>
              <strong>Submission date:</strong>{" "}
              {application.appliedAt
                ? new Date(application.appliedAt).toLocaleString()
                : "Not available"}
            </p>
            <p>
              <strong>Examination status:</strong> {application.examStatus}
            </p>
            <p>
              <strong>SSD approval:</strong> {application.ssdStatus}
            </p>
            <p>
              <strong>Selection status:</strong>{" "}
              {application.selectionStatus}
            </p>
            <p>
              <strong>Examination score:</strong>{" "}
              {typeof application.examScore10 === "number"
                ? `${application.examScore10}/10`
                : "Not evaluated"}
            </p>
          </div>

          <h4>Your submitted leadership vision</h4>
          <p className="candidate-application-motivation">
            {application.motivationText}
          </p>
        </div>
      ) : (
        <form
          className="candidate-application-form"
          onSubmit={handleSubmit}
        >
          <label htmlFor="motivationText">
            Leadership Vision / Motivation Statement
          </label>

          <p className="candidate-application-help">
            Explain why you want to become a student union leader,
            your goals, and how you will represent students.
          </p>

          <textarea
            id="motivationText"
            name="motivationText"
            value={motivationText}
            onChange={(event) => setMotivationText(event.target.value)}
            placeholder="Write your leadership vision and motivation here..."
            minLength={20}
            maxLength={5000}
            rows={10}
            required
            disabled={submitting}
          />

          <div className="candidate-application-counter">
            <span>Minimum 20 characters · Maximum 5,000</span>
            <span>{motivationText.length}/5000</span>
          </div>

          <div className="candidate-application-notice">
            <strong>Important:</strong> Review your statement carefully
            before submission. Only one application is permitted per
            student. Submission is subject to the official election
            schedule and eligibility requirements.
          </div>

          <button
            type="submit"
            disabled={submitting || motivationText.trim().length < 20}
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      )}
    </section>
  );
}
