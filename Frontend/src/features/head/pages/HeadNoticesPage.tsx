import { useEffect, useState, type FormEvent } from "react";

import {
  createDepartmentNotice,
  deleteDepartmentNotice,
  getDirectorNotices,
  getMyDepartmentNotices,
  updateDepartmentNotice,
  type HeadNotice,
} from "../head-notices.api";

import "./HeadNoticesPage.css";

interface HeadNoticesPageProps {
  onBack: () => void;
}

function HeadNoticesPage({ onBack }: HeadNoticesPageProps) {
  const [myNotices, setMyNotices] = useState<HeadNotice[]>([]);
  const [directorNotices, setDirectorNotices] = useState<HeadNotice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);

  async function loadNotices() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [ownNotices, noticesFromDirector] = await Promise.all([
        getMyDepartmentNotices(),
        getDirectorNotices(),
      ]);

      setMyNotices(ownNotices);
      setDirectorNotices(noticesFromDirector);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load department notices."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadNotices();
  }, []);

  function resetForm() {
    setTitle("");
    setMessage("");
    setEditingNoticeId(null);
  }

  function beginEdit(notice: HeadNotice) {
    setEditingNoticeId(notice._id);
    setTitle(notice.title);
    setMessage(notice.message);
    setSuccessMessage("");
    setErrorMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSaving(true);

    try {
      const input = {
        title: title.trim(),
        message: message.trim(),
      };

      if (editingNoticeId) {
        await updateDepartmentNotice(editingNoticeId, input);
        setSuccessMessage("Department notice updated successfully.");
      } else {
        await createDepartmentNotice(input);
        setSuccessMessage("Department notice published successfully.");
      }

      resetForm();
      await loadNotices();
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save the notice."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(notice: HeadNotice) {
    const confirmed = window.confirm(
      `Delete the notice "${notice.title}"?`
    );

    if (!confirmed) return;

    setErrorMessage("");
    setSuccessMessage("");

    try {
      await deleteDepartmentNotice(notice._id);
      setMyNotices((current) =>
        current.filter((item) => item._id !== notice._id)
      );
      setSuccessMessage("Department notice deleted successfully.");

      if (editingNoticeId === notice._id) {
        resetForm();
      }
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete the notice."
      );
    }
  }

  function formatDate(dateValue: string) {
    const date = new Date(dateValue);

    return Number.isNaN(date.getTime())
      ? "Date unavailable"
      : date.toLocaleString();
  }

  return (
    <main className="head-notices-page">
      <div className="head-notices-heading">
        <div>
          <p className="head-notices-eyebrow">Department Head Portal</p>
          <h1>Department Notices</h1>
          <p>
            Publish notices for your department and review notices from the
            Director.
          </p>
        </div>

        <button
          type="button"
          className="head-notices-secondary-button"
          onClick={onBack}
        >
          Back to Dashboard
        </button>
      </div>

      {errorMessage && (
        <div className="head-notices-alert error" role="alert">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="head-notices-alert success" role="status">
          {successMessage}
        </div>
      )}

      <section className="head-notices-panel">
        <h2>{editingNoticeId ? "Edit Department Notice" : "Publish a Notice"}</h2>

        <form className="head-notices-form" onSubmit={handleSubmit}>
          <label>
            Notice title
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={255}
              required
              placeholder="Enter a clear notice title"
            />
          </label>

          <label>
            Notice message
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={10000}
              rows={6}
              required
              placeholder="Write the notice for your department students"
            />
          </label>

          <div className="head-notices-form-actions">
            <button
              type="submit"
              className="head-notices-primary-button"
              disabled={isSaving}
            >
              {isSaving
                ? "Saving..."
                : editingNoticeId
                  ? "Save Changes"
                  : "Publish Notice"}
            </button>

            {editingNoticeId && (
              <button
                type="button"
                className="head-notices-secondary-button"
                onClick={resetForm}
                disabled={isSaving}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="head-notices-panel">
        <div className="head-notices-section-heading">
          <h2>Your Department Notices</h2>
          <span>{myNotices.length}</span>
        </div>

        {isLoading ? (
          <p>Loading notices...</p>
        ) : myNotices.length === 0 ? (
          <p className="head-notices-empty">
            You have not published any department notices yet.
          </p>
        ) : (
          <div className="head-notices-list">
            {myNotices.map((notice) => (
              <article className="head-notice-card" key={notice._id}>
                <div className="head-notice-card-heading">
                  <div>
                    <h3>{notice.title}</h3>
                    <p className="head-notice-date">
                      Published {formatDate(notice.createdAt)}
                    </p>
                  </div>
                  <span className="head-notice-tag">Department</span>
                </div>

                <p className="head-notice-message">{notice.message}</p>

                <div className="head-notice-actions">
                  <button
                    type="button"
                    className="head-notices-secondary-button"
                    onClick={() => beginEdit(notice)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="head-notices-danger-button"
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

      <section className="head-notices-panel">
        <div className="head-notices-section-heading">
          <h2>Notices from the Director</h2>
          <span>{directorNotices.length}</span>
        </div>

        {isLoading ? (
          <p>Loading Director notices...</p>
        ) : directorNotices.length === 0 ? (
          <p className="head-notices-empty">
            There are no Director notices to display.
          </p>
        ) : (
          <div className="head-notices-list">
            {directorNotices.map((notice) => (
              <article className="head-notice-card" key={notice._id}>
                <div className="head-notice-card-heading">
                  <div>
                    <h3>{notice.title}</h3>
                    <p className="head-notice-date">
                      Published {formatDate(notice.createdAt)}
                    </p>
                  </div>
                  <span className="head-notice-tag director">Director</span>
                </div>

                <p className="head-notice-message">{notice.message}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default HeadNoticesPage;