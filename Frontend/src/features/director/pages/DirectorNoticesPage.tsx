
import { useEffect, useState } from "react";
import type { ComponentProps } from "react";
import { getAccessToken } from "../../../services/api";
import "./DirectorNoticesPage.css";

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<"form">["onSubmit"]>
>[0];

type NoticeTargetRole =
  | "student"
  | "candidate"
  | "head"
  | "registrar"
  | "all";

interface Notice {
  _id: string;
  title: string;
  message: string;
  targetRole: NoticeTargetRole;
  createdAt?: string;
}

const API_URL = "http://localhost:5000/api/notices";

function getErrorMessage(data: unknown): string {
  if (
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof data.message === "string"
  ) {
    return data.message;
  }

  return "The request could not be completed.";
}

function getNoticeList(data: unknown): Notice[] {
  if (Array.isArray(data)) {
    return data as Notice[];
  }

  if (
    typeof data === "object" &&
    data !== null &&
    "data" in data &&
    Array.isArray(data.data)
  ) {
    return data.data as Notice[];
  }

  return [];
}

export default function DirectorNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const [targetRole, setTargetRole] =
    useState<NoticeTargetRole>("student");

  const [editingNoticeId, setEditingNoticeId] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadNotices() {
    setLoading(true);
    setError("");

    try {
      const token = getAccessToken();

      if (!token) {
        throw new Error(
          "Your login session was not found. Please sign in again."
        );
      }

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data));
      }

      setNotices(getNoticeList(data));
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load notices."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotices();
  }, []);

  function resetForm() {
    setTitle("");
    setMessage("");
    setTargetRole("student");
    setEditingNoticeId(null);
  }

  function startEditing(notice: Notice) {
    setTitle(notice.title);
    setMessage(notice.message);
    setTargetRole(notice.targetRole);
    setEditingNoticeId(notice._id);

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event: FormSubmitEvent) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const trimmedTitle = title.trim();
    const trimmedMessage = message.trim();

    if (!trimmedTitle || !trimmedMessage) {
      setError(
        "Please enter both the notice title and message."
      );
      return;
    }

    setSaving(true);

    try {
      const token = getAccessToken();

      if (!token) {
        throw new Error(
          "Your login session was not found. Please sign in again."
        );
      }

      const isEditing = editingNoticeId !== null;

      const response = await fetch(
        isEditing
          ? `${API_URL}/${editingNoticeId}`
          : API_URL,
        {
          method: isEditing ? "PATCH" : "POST",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },

          body: JSON.stringify(
            isEditing
              ? {
                  title: trimmedTitle,
                  message: trimmedMessage,
                }
              : {
                  title: trimmedTitle,
                  message: trimmedMessage,
                  targetRole,
                }
          ),
        }
      );

      const data: unknown = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data));
      }

      setSuccess(
        isEditing
          ? "Notice updated successfully."
          : "Notice sent successfully."
      );

      resetForm();

      await loadNotices();
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save the notice."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(notice: Notice) {
    const confirmed = window.confirm(
      `Delete the notice "${notice.title}"?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const token = getAccessToken();

      if (!token) {
        throw new Error(
          "Your login session was not found. Please sign in again."
        );
      }

      const response = await fetch(
        `${API_URL}/${notice._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data: unknown = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data));
      }

      setSuccess("Notice deleted successfully.");

      if (editingNoticeId === notice._id) {
        resetForm();
      }

      await loadNotices();
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete the notice."
      );
    }
  }

  return (
    <main className="director-notices-page">
      <header className="director-notices-header">
        <div>
          <p className="director-notices-eyebrow">
            DIRECTOR PORTAL
          </p>

          <h1>Notices</h1>

          <p>
            Send announcements and manage published notices.
          </p>
        </div>

        <button
          type="button"
          className="director-notices-refresh"
          onClick={() => void loadNotices()}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {error && (
        <div
          className="director-notices-alert error"
          role="alert"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="director-notices-alert success"
          role="status"
        >
          {success}
        </div>
      )}

      <section className="director-notices-card">
        <h2>
          {editingNoticeId ? "Edit Notice" : "Send a Notice"}
        </h2>

        <p className="director-notices-help">
          Select who should receive this notice. The backend
          sends the corresponding notifications when a new
          notice is published.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="director-notice-title">
            Notice Title
          </label>

          <input
            id="director-notice-title"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            placeholder="Enter notice title"
            required
          />

          <label htmlFor="director-notice-message">
            Message
          </label>

          <textarea
            id="director-notice-message"
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            placeholder="Write the notice message..."
            rows={5}
            required
          />

          {!editingNoticeId && (
            <>
              <label htmlFor="director-notice-audience">
                Send To
              </label>

              <select
                id="director-notice-audience"
                value={targetRole}
                onChange={(event) =>
                  setTargetRole(
                    event.target.value as NoticeTargetRole
                  )
                }
              >
                <option value="student">Students</option>
                <option value="candidate">Candidates</option>
                <option value="head">Department Heads</option>
                <option value="registrar">Registrar</option>
                <option value="all">Everyone</option>
              </select>
            </>
          )}

          <div className="director-notices-form-actions">
            <button type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : editingNoticeId
                  ? "Save Changes"
                  : "Send Notice"}
            </button>

            {editingNoticeId && (
              <button
                type="button"
                className="director-notices-cancel"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="director-notices-card">
        <div className="director-notices-list-heading">
          <div>
            <h2>Published Notices</h2>

            <p className="director-notices-help">
              {notices.length} notice
              {notices.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {loading ? (
          <p className="director-notices-empty">
            Loading notices...
          </p>
        ) : notices.length === 0 ? (
          <p className="director-notices-empty">
            No notices have been published.
          </p>
        ) : (
          <div className="director-notices-list">
            {notices.map((notice) => (
              <article
                className="director-notice-item"
                key={notice._id}
              >
                <div className="director-notice-item-content">
                  <div className="director-notice-item-top">
                    <h3>{notice.title}</h3>

                    <span className="director-notice-audience">
                      {notice.targetRole === "all"
                        ? "Everyone"
                        : notice.targetRole === "head"
                          ? "Department Heads"
                          : notice.targetRole === "registrar"
                            ? "Registrar"
                            : notice.targetRole === "candidate"
                              ? "Candidates"
                              : "Students"}
                    </span>
                  </div>

                  <p>{notice.message}</p>

                  {notice.createdAt && (
                    <small>
                      {new Date(
                        notice.createdAt
                      ).toLocaleString()}
                    </small>
                  )}
                </div>

                <div className="director-notice-item-actions">
                  <button
                    type="button"
                    onClick={() => startEditing(notice)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="director-notice-delete"
                    onClick={() => void handleDelete(notice)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
