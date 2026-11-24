import { useCallback, useEffect, useState } from "react";
import "./DirectorNotifications.css";
type Notification = {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

type NotificationResponse = {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function request<T>(
  path: string,
  method: "GET" | "PATCH" | "DELETE" = "GET",
): Promise<T> {
  const token = localStorage.getItem("dmu_access_token") || "";

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const result = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !result.success) {
    throw new Error(result.message || "The request could not be completed.");
  }

  return result.data;
}

export default function DirectorNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await request<NotificationResponse>(
        "/notifications?page=1&limit=100",
      );
      setNotifications(data.notifications);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load notifications.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  async function markAsRead(notificationId: string) {
    setBusyId(notificationId);
    setError("");

    try {
      await request(
        `/notifications/${notificationId}/read`,
        "PATCH",
      );

      setNotifications((current) =>
        current.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification,
        ),
      );
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Could not mark the notification as read.",
      );
    } finally {
      setBusyId("");
    }
  }

  async function deleteNotification(notificationId: string) {
    setBusyId(notificationId);
    setError("");

    try {
      await request(`/notifications/${notificationId}`, "DELETE");

      setNotifications((current) =>
        current.filter(
          (notification) => notification._id !== notificationId,
        ),
      );
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Could not delete the notification.",
      );
    } finally {
      setBusyId("");
    }
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length;

  return (
   <div className="director-notifications">
      <div className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <h2>Notifications</h2>
            <p>
              View updates and messages sent to your Director account.
            </p>
          </div>

          <button type="button" onClick={() => void loadNotifications()}>
            Refresh
          </button>
        </div>

        <p>
          <strong>{unreadCount}</strong> unread notification
          {unreadCount === 1 ? "" : "s"}
        </p>

        {loading && <p>Loading notifications…</p>}
        {!loading && error && <p role="alert">{error}</p>}

        {!loading && !error && notifications.length === 0 && (
          <p>You have no notifications.</p>
        )}

        {!loading && notifications.length > 0 && (
          <div className="dashboard-table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Notification</th>
                  <th>Message</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {notifications.map((notification) => (
                  <tr key={notification._id}>
                    <td>{notification.title}</td>
                    <td>{notification.message}</td>
                    <td>
                      {new Date(notification.createdAt).toLocaleString()}
                    </td>
                    <td>{notification.isRead ? "Read" : "Unread"}</td>
                    <td>
                      {!notification.isRead && (
                        <button
                          type="button"
                          disabled={busyId === notification._id}
                          onClick={() =>
                            void markAsRead(notification._id)
                          }
                        >
                          Mark read
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={busyId === notification._id}
                        onClick={() =>
                          void deleteNotification(notification._id)
                        }
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}