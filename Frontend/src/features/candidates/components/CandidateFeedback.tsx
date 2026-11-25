
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "../../../services/api";
import "./CandidateFeedback.css";

type FeedbackType = "exam_10" | "evaluation_40" | "vote_result";
type FeedbackStatus = "pending" | "replied";
type Satisfaction = "pending" | "satisfied" | "not_satisfied";

interface Feedback {
  _id: string;
  feedbackType: FeedbackType;
  message: string;
  reply: string | null;
  status: FeedbackStatus;
  satisfaction: Satisfaction;
  isClosed: boolean;
  createdAt: string;
  repliedAt?: string | null;
}

interface FeedbackListResponse {
  success: boolean;
  message?: string;
  data: {
    feedback: Feedback[];
    count?: number;
  };
}

interface FeedbackActionResponse {
  success: boolean;
  message?: string;
}

const feedbackCategories: { value: FeedbackType; label: string }[] = [
  { value: "exam_10", label: "Exam (10%)" },
  { value: "evaluation_40", label: "Evaluation (40%)" },
  { value: "vote_result", label: "Vote Result" },
];

function categoryLabel(type: FeedbackType): string {
  return (
    feedbackCategories.find((category) => category.value === type)?.label ??
    type
  );
}

function formatDate(date: string): string {
  return new Date(date).toLocaleString();
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export default function CandidateFeedback() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [feedbackType, setFeedbackType] =
    useState<FeedbackType>("exam_10");
  const [message, setMessage] = useState("");
  const [reopenMessages, setReopenMessages] = useState<Record<string, string>>(
    {},
  );
  const [showReopen, setShowReopen] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response =
        await api.get<FeedbackListResponse>("/feedback/mine");

      if (!response.success || !Array.isArray(response.data?.feedback)) {
        throw new Error(response.message || "Invalid feedback response.");
      }

      setFeedback(response.data.feedback);
    } catch (requestError: unknown) {
      setError(
        getErrorMessage(
          requestError,
          "Could not load your feedback. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFeedback();
  }, [loadFeedback]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const trimmedMessage = message.trim();

    if (trimmedMessage.length < 10) {
      setError("Feedback must contain at least 10 characters.");
      return;
    }

    if (trimmedMessage.length > 10000) {
      setError("Feedback cannot exceed 10000 characters.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post<FeedbackActionResponse>("/feedback", {
        feedbackType,
        message: trimmedMessage,
      });

      if (!response.success) {
        throw new Error(response.message || "Feedback submission failed.");
      }

      setMessage("");
      setSuccess("Your feedback was submitted successfully.");
      await loadFeedback();
    } catch (requestError: unknown) {
      setError(
        getErrorMessage(
          requestError,
          "Could not submit feedback. Please try again.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSatisfaction(
    feedbackId: string,
    satisfaction: "satisfied" | "not_satisfied",
  ) {
    setError("");
    setSuccess("");
    setActionId(feedbackId);

    try {
      const response = await api.patch<FeedbackActionResponse>(
        `/feedback/${encodeURIComponent(feedbackId)}/satisfaction`,
        { satisfaction },
      );

      if (!response.success) {
        throw new Error(
          response.message || "Could not update feedback satisfaction.",
        );
      }

      setSuccess(
        satisfaction === "satisfied"
          ? "Feedback marked as satisfied."
          : "Feedback marked as not satisfied.",
      );

      await loadFeedback();
    } catch (requestError: unknown) {
      setError(
        getErrorMessage(
          requestError,
          "Could not update feedback satisfaction.",
        ),
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleReopen(feedbackId: string) {
    const additionalMessage = (reopenMessages[feedbackId] ?? "").trim();

    setError("");
    setSuccess("");

    if (additionalMessage.length < 5) {
      setError("The additional message must contain at least 5 characters.");
      return;
    }

    if (additionalMessage.length > 10000) {
      setError("The additional message cannot exceed 10000 characters.");
      return;
    }

    setActionId(feedbackId);

    try {
      const response = await api.patch<FeedbackActionResponse>(
        `/feedback/${encodeURIComponent(feedbackId)}/reopen`,
        {
          satisfaction: "not_satisfied",
          additionalMessage,
        },
      );

      if (!response.success) {
        throw new Error(response.message || "Could not reopen feedback.");
      }

      setReopenMessages((current) => ({
        ...current,
        [feedbackId]: "",
      }));

      setShowReopen((current) => ({
        ...current,
        [feedbackId]: false,
      }));

      setSuccess("Your feedback was reopened and sent back for review.");
      await loadFeedback();
    } catch (requestError: unknown) {
      setError(
        getErrorMessage(
          requestError,
          "Could not reopen feedback. Please try again.",
        ),
      );
    } finally {
      setActionId(null);
    }
  }

  const openFeedback = feedback.filter((item) => !item.isClosed).length;

  return (
    <main className="candidate-feedback">
      <header className="candidate-feedback__header">
        <div>
          <p className="candidate-feedback__eyebrow">CANDIDATE PORTAL</p>
          <h1>Feedback</h1>
          <p>
            Submit feedback about your election process and review responses
            from the Student Union administration.
          </p>
        </div>

        <div className="candidate-feedback__summary">
          <span>Open feedback</span>
          <strong>{openFeedback}</strong>
        </div>
      </header>

      {error && (
        <div className="candidate-feedback__alert candidate-feedback__alert--error">
          {error}
        </div>
      )}

      {success && (
        <div className="candidate-feedback__alert candidate-feedback__alert--success">
          {success}
        </div>
      )}

      <section className="candidate-feedback__panel">
        <div className="candidate-feedback__section-heading">
          <div>
            <h2>Submit feedback</h2>
            <p>
              You can have up to 3 open feedback requests in each category.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="candidate-feedback__form">
          <label htmlFor="feedbackType">Feedback category</label>

          <select
            id="feedbackType"
            value={feedbackType}
            onChange={(event) =>
              setFeedbackType(event.target.value as FeedbackType)
            }
          >
            {feedbackCategories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>

          <label htmlFor="feedbackMessage">Your feedback</label>

          <textarea
            id="feedbackMessage"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Explain your feedback clearly..."
            rows={5}
            minLength={10}
            maxLength={10000}
            required
          />

          <div className="candidate-feedback__form-footer">
            <span>{message.trim().length} / 10000 characters</span>

            <button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit feedback"}
            </button>
          </div>
        </form>
      </section>

      <section className="candidate-feedback__history">
        <div className="candidate-feedback__section-heading">
          <div>
            <h2>Feedback history</h2>
            <p>View your requests and review any replies.</p>
          </div>

          <button
            type="button"
            className="candidate-feedback__refresh"
            onClick={() => void loadFeedback()}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="candidate-feedback__empty">Loading feedback...</div>
        ) : feedback.length === 0 ? (
          <div className="candidate-feedback__empty">
            You have not submitted any feedback yet.
          </div>
        ) : (
          <div className="candidate-feedback__list">
            {feedback.map((item) => (
              <article className="candidate-feedback__item" key={item._id}>
                <div className="candidate-feedback__item-top">
                  <div>
                    <span className="candidate-feedback__category">
                      {categoryLabel(item.feedbackType)}
                    </span>
                    <p className="candidate-feedback__date">
                      Submitted {formatDate(item.createdAt)}
                    </p>
                  </div>

                  <span
                    className={`candidate-feedback__status candidate-feedback__status--${
                      item.isClosed ? "closed" : item.status
                    }`}
                  >
                    {item.isClosed ? "Resolved" : item.status}
                  </span>
                </div>

                <p className="candidate-feedback__message">{item.message}</p>

                {item.reply && (
                  <div className="candidate-feedback__reply">
                    <strong>Administration reply</strong>
                    <p>{item.reply}</p>

                    {item.repliedAt && (
                      <span>Replied {formatDate(item.repliedAt)}</span>
                    )}
                  </div>
                )}

                {item.status === "replied" && !item.isClosed && (
                  <div className="candidate-feedback__review">
                    <p>Are you satisfied with this reply?</p>

                    <div className="candidate-feedback__actions">
                      <button
                        type="button"
                        className="candidate-feedback__button candidate-feedback__button--primary"
                        disabled={actionId === item._id}
                        onClick={() =>
                          void handleSatisfaction(item._id, "satisfied")
                        }
                      >
                        {actionId === item._id ? "Updating..." : "Satisfied"}
                      </button>

                      <button
                        type="button"
                        className="candidate-feedback__button candidate-feedback__button--secondary"
                        disabled={actionId === item._id}
                        onClick={() =>
                          setShowReopen((current) => ({
                            ...current,
                            [item._id]: !current[item._id],
                          }))
                        }
                      >
                        Not satisfied
                      </button>
                    </div>

                    {showReopen[item._id] && (
                      <div className="candidate-feedback__reopen">
                        <label htmlFor={`reopen-${item._id}`}>
                          Explain what still needs attention
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
                          placeholder="Enter at least 5 characters..."
                        />

                        <button
                          type="button"
                          className="candidate-feedback__button candidate-feedback__button--primary"
                          disabled={actionId === item._id}
                          onClick={() => void handleReopen(item._id)}
                        >
                          {actionId === item._id
                            ? "Reopening..."
                            : "Reopen feedback"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {item.isClosed && (
                  <p className="candidate-feedback__resolved">
                    This feedback request has been resolved.
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
