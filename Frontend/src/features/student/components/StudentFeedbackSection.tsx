import { useCallback, useEffect, useState } from "react";
import {
  createStudentFeedback,
  getMyFeedback,
  markStudentFeedbackSatisfied,
  reopenStudentFeedback,
} from "../services/student-feedback.api";
import type {
  StudentFeedback,
  StudentFeedbackType,
} from "../services/student-feedback.api";

const feedbackCategories: {
  value: StudentFeedbackType;
  label: string;
}[] = [
  { value: "exam_10", label: "Phase 1 Exam (10%)" },
  { value: "evaluation_40", label: "Evaluation (40%)" },
  { value: "vote_result", label: "Voting Result" },
];

function getCategoryLabel(type: StudentFeedbackType): string {
  return (
    feedbackCategories.find((category) => category.value === type)?.label ??
    type
  );
}

function formatFeedbackDate(value?: string | null): string {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString();
}

export default function StudentFeedbackSection() {
  const [feedback, setFeedback] = useState<StudentFeedback[]>([]);
  const [feedbackType, setFeedbackType] =
    useState<StudentFeedbackType>("exam_10");
  const [message, setMessage] = useState("");
  const [reopenMessages, setReopenMessages] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getMyFeedback();
      setFeedback(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your feedback."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFeedback();
  }, [loadFeedback]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const trimmedMessage = message.trim();

    if (trimmedMessage.length < 10) {
      setError("Feedback must contain at least 10 characters.");
      return;
    }

    if (trimmedMessage.length > 10000) {
      setError("Feedback cannot exceed 10,000 characters.");
      return;
    }

    setSubmitting(true);

    try {
      await createStudentFeedback(feedbackType, trimmedMessage);
      setMessage("");
      setSuccess("Your feedback has been submitted successfully.");
      await loadFeedback();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit your feedback."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSatisfied(feedbackId: string) {
    setError("");
    setSuccess("");
    setActionId(feedbackId);

    try {
      await markStudentFeedbackSatisfied(feedbackId);
      setSuccess("Thank you. Your feedback has been marked as satisfactory.");
      await loadFeedback();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update the feedback."
      );
    } finally {
      setActionId("");
    }
  }

  async function handleReopen(feedbackId: string) {
    const additionalMessage = (reopenMessages[feedbackId] ?? "").trim();

    setError("");
    setSuccess("");

    if (additionalMessage.length < 5) {
      setError("Your additional message must contain at least 5 characters.");
      return;
    }

    if (additionalMessage.length > 10000) {
      setError("Your additional message cannot exceed 10,000 characters.");
      return;
    }

    setActionId(feedbackId);

    try {
      await reopenStudentFeedback(feedbackId, additionalMessage);
      setReopenMessages((current) => ({
        ...current,
        [feedbackId]: "",
      }));
      setSuccess("Your feedback has been reopened successfully.");
      await loadFeedback();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reopen the feedback."
      );
    } finally {
      setActionId("");
    }
  }

  return (
    <section className="student-panel">
      <div className="student-panel-heading">
        <div>
          <p className="student-panel-kicker">Student services</p>
          <h2>Feedback</h2>
        </div>

        <button
          type="button"
          className="student-refresh-button"
          onClick={() => void loadFeedback()}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <p className="student-muted">
        Submit feedback about your examination, evaluation, or voting result.
        You can also review replies from the Director.
      </p>

      {error && (
        <p className="student-alert student-alert-error" role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className="student-alert student-alert-success" role="status">
          {success}
        </p>
      )}

      <form className="student-application-form" onSubmit={handleSubmit}>
        <h3>Submit new feedback</h3>

        <label htmlFor="student-feedback-type">Feedback category</label>
        <select
          id="student-feedback-type"
          className="student-text-input"
          value={feedbackType}
          onChange={(event) =>
            setFeedbackType(event.target.value as StudentFeedbackType)
          }
          disabled={submitting}
        >
          {feedbackCategories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>

        <label htmlFor="student-feedback-message">Your message</label>
        <textarea
          id="student-feedback-message"
          rows={5}
          minLength={10}
          maxLength={10000}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Explain your feedback clearly (at least 10 characters)..."
          required
          disabled={submitting}
        />

        <p className="student-field-help">
          You can have up to 3 open feedback requests in each category.
        </p>

        <button
          type="submit"
          className="student-primary-button"
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit feedback"}
        </button>
      </form>

      <div className="student-feedback-history">
        <div className="student-panel-heading">
          <h3>My feedback history</h3>
          <span className="student-status">{feedback.length} requests</span>
        </div>

        {loading ? (
          <div className="student-empty-state">Loading your feedback...</div>
        ) : feedback.length === 0 ? (
          <div className="student-empty-state">
            You have not submitted any feedback yet.
          </div>
        ) : (
          <div className="student-candidate-list">
            {feedback.map((item) => (
              <article className="student-feedback-card" key={item._id}>
                <div className="student-feedback-card-heading">
                  <div>
                    <h4>{getCategoryLabel(item.feedbackType)}</h4>
                    <span className="student-feedback-date">
                      Submitted: {formatFeedbackDate(item.createdAt)}
                    </span>
                  </div>

                  <span className="student-status">
                    {item.isClosed
                      ? "Closed"
                      : item.status === "replied"
                        ? "Reply received"
                        : "Pending"}
                  </span>
                </div>

                <p className="student-feedback-message">{item.message}</p>

                {item.reply && (
                  <div className="student-feedback-reply">
                    <strong>Director's reply</strong>
                    <p>{item.reply}</p>
                    <span className="student-feedback-date">
                      {formatFeedbackDate(item.repliedAt)}
                    </span>
                  </div>
                )}

                {item.satisfaction === "not_satisfied" && (
                  <p className="student-inline-error">
                    You requested further attention to this feedback.
                  </p>
                )}

                {item.status === "replied" && !item.isClosed && (
                  <div className="student-feedback-actions">
                    <button
                      type="button"
                      className="student-primary-button"
                      onClick={() => void handleSatisfied(item._id)}
                      disabled={actionId !== ""}
                    >
                      {actionId === item._id
                        ? "Updating..."
                        : "I am satisfied"}
                    </button>

                    <label htmlFor={`reopen-${item._id}`}>
                      If you are not satisfied, explain why:
                    </label>
                    <textarea
                      id={`reopen-${item._id}`}
                      rows={3}
                      minLength={5}
                      maxLength={10000}
                      value={reopenMessages[item._id] ?? ""}
                      onChange={(event) =>
                        setReopenMessages((current) => ({
                          ...current,
                          [item._id]: event.target.value,
                        }))
                      }
                      placeholder="Write at least 5 characters..."
                      disabled={actionId !== ""}
                    />
                    <button
                      type="button"
                      className="student-refresh-button"
                      onClick={() => void handleReopen(item._id)}
                      disabled={actionId !== ""}
                    >
                      Reopen feedback
                    </button>
                  </div>
                )}

                {item.isClosed && (
                  <p className="student-field-help">
                    This feedback request has been closed.
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
