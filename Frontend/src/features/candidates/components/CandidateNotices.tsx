import { useCallback, useEffect, useState } from "react";
import {
  getMyCandidateNotifications,
  markAllCandidateNotificationsAsRead,
  markCandidateNotificationAsRead,
} from "../services/candidate.api";
import type { CandidateNotification } from "../services/candidate.api";
import "./CandidateNotices.css";

function CandidateNotices() {
  const [notices, setNotices] = useState<CandidateNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState("");

  const loadNotices = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getMyCandidateNotifications();
      setNotices(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load election notices.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotices();
  }, [loadNotices]);

  async function handleMarkRead(notificationId: string) {
    setMarkingId(notificationId);
    setActionError("");

    try {
      await markCandidateNotificationAsRead(notificationId);
      setNotices((current) =>
        current.map((notice) =>
          notice._id === notificationId ? { ...notice, isRead: true } : notice,
        ),
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to update this notice.",
      );
    } finally {
      setMarkingId("");
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    setActionError("");

    try {
      await markAllCandidateNotificationsAsRead();
      setNotices((current) =>
        current.map((notice) => ({ ...notice, isRead: true })),
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to mark notices as read.",
      );
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = notices.filter((notice) => !notice.isRead).length;

  if (loading) {
    return <p className="candidate-notices__message">Loading election notices...</p>;
  }

  if (error) {
    return (
      <section className="candidate-notices">
        <p className="candidate-notices__error">{error}</p>
        <button className="candidate-notices__button" onClick={() => void loadNotices()}>
          Try again
        </button>
      </section>
    );
  }

  return (
    <section className="candidate-notices">
      <div className="candidate-notices__top">
        <div>
          <p className="candidate-notices__summary">
            {notices.length} notice{notices.length === 1 ? "" : "s"} · {unreadCount} unread
          </p>
          <p className="candidate-notices__description">
            Official election announcements sent to your account.
          </p>
        </div>

        <button
          className="candidate-notices__button"
          onClick={() => void handleMarkAllRead()}
          disabled={unreadCount === 0 || markingAll}
        >
          {markingAll ? "Updating..." : "Mark all as read"}
        </button>
      </div>

      {actionError && (
        <p className="candidate-notices__error" role="alert">
          {actionError}
        </p>
      )}

      {notices.length === 0 ? (
        <div className="candidate-notices__empty">
          <h3>No election notices yet</h3>
          <p>Official notices sent to your account will appear here.</p>
        </div>
      ) : (
        <div className="candidate-notices__list">
          {notices.map((notice) => (
            <article
              className={`candidate-notices__item ${
                notice.isRead ? "" : "candidate-notices__item--unread"
              }`}
              key={notice._id}
            >
              <div className="candidate-notices__item-heading">
                <h3>{notice.title}</h3>
                {!notice.isRead && (
                  <span className="candidate-notices__unread">Unread</span>
                )}
              </div>

              <p className="candidate-notices__message">{notice.message}</p>

              <div className="candidate-notices__item-footer">
                <time dateTime={notice.createdAt}>
                  {new Date(notice.createdAt).toLocaleString()}
                </time>

                {!notice.isRead && (
                  <button
                    className="candidate-notices__text-button"
                    onClick={() => void handleMarkRead(notice._id)}
                    disabled={markingId === notice._id}
                  >
                    {markingId === notice._id ? "Updating..." : "Mark as read"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default CandidateNotices;