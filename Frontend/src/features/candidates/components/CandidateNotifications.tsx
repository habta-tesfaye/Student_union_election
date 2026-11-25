import { useCallback, useEffect, useState } from "react";
import {
  getMyCandidateAllNotifications,
  markAllCandidateNotificationsAsRead,
  markCandidateNotificationAsRead,
} from "../services/candidate.api";
import type { CandidateNotification } from "../services/candidate.api";
import "./CandidateNotices.css";

function CandidateNotifications() {
  const [notifications, setNotifications] = useState<
    CandidateNotification[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState("");

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getMyCandidateAllNotifications();
      setNotifications(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load notifications.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  async function handleMarkRead(notificationId: string) {
    setMarkingId(notificationId);
    setActionError("");

    try {
      await markCandidateNotificationAsRead(notificationId);

      setNotifications((current) =>
        current.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification,
        ),
      );
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to update this notification.",
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

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to mark notifications as read.",
      );
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length;

  if (loading) {
    return (
      <p className="candidate-notices__message">
        Loading notifications...
      </p>
    );
  }

  if (error) {
    return (
      <section className="candidate-notices">
        <p className="candidate-notices__error" role="alert">
          {error}
        </p>

        <button
          type="button"
          className="candidate-notices__button"
          onClick={() => void loadNotifications()}
        >
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
            {notifications.length} notification
            {notifications.length === 1 ? "" : "s"} · {unreadCount} unread
          </p>

          <p className="candidate-notices__description">
            Notifications sent to your candidate account.
          </p>
        </div>

        <button
          type="button"
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

      {notifications.length === 0 ? (
        <div className="candidate-notices__empty">
          <h3>No notifications yet</h3>
          <p>Notifications sent to your account will appear here.</p>
        </div>
      ) : (
        <div className="candidate-notices__list">
          {notifications.map((notification) => (
            <article
              className={`candidate-notices__item ${
                notification.isRead
                  ? ""
                  : "candidate-notices__item--unread"
              }`}
              key={notification._id}
            >
              <div className="candidate-notices__item-heading">
                <h3>{notification.title}</h3>

                {!notification.isRead && (
                  <span className="candidate-notices__unread">
                    Unread
                  </span>
                )}
              </div>

              <p className="candidate-notices__message">
                {notification.message}
              </p>

              <div className="candidate-notices__item-footer">
                <time dateTime={notification.createdAt}>
                  {new Date(notification.createdAt).toLocaleString()}
                </time>

                {!notification.isRead && (
                  <button
                    type="button"
                    className="candidate-notices__text-button"
                    onClick={() =>
                      void handleMarkRead(notification._id)
                    }
                    disabled={markingId === notification._id}
                  >
                    {markingId === notification._id
                      ? "Updating..."
                      : "Mark as read"}
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

export default CandidateNotifications;