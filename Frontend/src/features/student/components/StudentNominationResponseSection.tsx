import { useCallback, useEffect, useState } from "react";
import {
  acceptNomination,
  declineNomination,
  getNominationNotifications,
} from "../../nominations/services/nomination.api";
import type { NominationNotification } from "../../nominations/types/nomination.types";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function StudentNominationResponseSection() {
  const [notifications, setNotifications] = useState<
    NominationNotification[]
  >([]);
  const [selectedPhotos, setSelectedPhotos] = useState<
    Record<string, File | null>
  >({});
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getNominationNotifications();
      setNotifications(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  function handlePhotoChange(
    nominationId: string,
    file: File | null
  ) {
    setError("");
    setMessage("");

    if (!file) {
      setSelectedPhotos((current) => ({
        ...current,
        [nominationId]: null,
      }));
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPEG, PNG, or WebP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("The candidate photo must not exceed 5 MB.");
      return;
    }

    setSelectedPhotos((current) => ({
      ...current,
      [nominationId]: file,
    }));
  }

  async function handleAccept(nominationId: string) {
    const photo = selectedPhotos[nominationId];

    if (!photo) {
      setError("Please select your candidate photo before accepting.");
      return;
    }

    setProcessingId(nominationId);
    setError("");
    setMessage("");

    try {
      const result = await acceptNomination(nominationId, photo);

      setNotifications((current) =>
        current.filter(
          (notification) => notification.relatedId !== nominationId
        )
      );

      setSelectedPhotos((current) => {
        const updated = { ...current };
        delete updated[nominationId];
        return updated;
      });

      setMessage(
        result.candidate
          ? "You accepted the nomination. Your candidate record has been created successfully."
          : "Your nomination response was submitted successfully."
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDecline(nominationId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to decline this nomination?"
    );

    if (!confirmed) {
      return;
    }

    setProcessingId(nominationId);
    setError("");
    setMessage("");

    try {
      await declineNomination(nominationId);

      setNotifications((current) =>
        current.filter(
          (notification) => notification.relatedId !== nominationId
        )
      );

      setSelectedPhotos((current) => {
        const updated = { ...current };
        delete updated[nominationId];
        return updated;
      });

      setMessage("You have successfully declined the nomination.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <section className="student-panel student-nomination-response-panel">
      <div className="student-panel-heading">
        <div>
          <p className="student-panel-kicker">Candidate registration</p>
          <h2>My Nomination Response</h2>
          <p>
            Review nominations approved by your Department Head and choose
            whether to accept or decline.
          </p>
        </div>

        <button
          className="student-refresh-button"
          type="button"
          onClick={() => void loadNotifications()}
          disabled={loading || processingId !== null}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="student-response-error" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="student-response-success" role="status">
          {message}
        </div>
      )}

      {loading ? (
        <p className="student-empty-state">
          Loading your approved nominations...
        </p>
      ) : notifications.length === 0 ? (
        <p className="student-empty-state">
          You have no approved nomination requests waiting for your response.
        </p>
      ) : (
        <div className="student-nomination-response-list">
          {notifications.map((notification) => {
            const nominationId = notification.relatedId ?? "";
            const isProcessing = processingId === nominationId;

            return (
              <article
                className="student-nomination-response-card"
                key={
                  notification._id ??
                  notification.id ??
                  nominationId
                }
              >
                <div className="student-panel-heading">
                  <div>
                    <p className="student-panel-kicker">
                      Approved nomination
                    </p>
                    <h3>{notification.title}</h3>
                  </div>

                  <span className="student-nomination-approved-label">
                    Approved
                  </span>
                </div>

                <p className="student-nomination-response-message">
                  {notification.message}
                </p>

                {notification.createdAt && (
                  <p className="student-notification-date">
                    Received:{" "}
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                )}

                <div className="student-nomination-photo-field">
                  <label htmlFor={`candidate-photo-${nominationId}`}>
                    Candidate photo
                  </label>

                  <input
                    id={`candidate-photo-${nominationId}`}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) =>
                      handlePhotoChange(
                        nominationId,
                        event.target.files?.[0] ?? null
                      )
                    }
                    disabled={isProcessing}
                  />

                  <small>
                    Required to accept. JPEG, PNG, or WebP; maximum size 5 MB.
                  </small>
                </div>

                <div className="student-nomination-response-actions">
                  <button
                    type="button"
                    className="student-response-accept-button"
                    onClick={() => void handleAccept(nominationId)}
                    disabled={
                      !nominationId ||
                      isProcessing ||
                      processingId !== null
                    }
                  >
                    {isProcessing ? "Processing..." : "Accept nomination"}
                  </button>

                  <button
                    type="button"
                    className="student-response-decline-button"
                    onClick={() => void handleDecline(nominationId)}
                    disabled={
                      !nominationId ||
                      isProcessing ||
                      processingId !== null
                    }
                  >
                    Decline
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default StudentNominationResponseSection;