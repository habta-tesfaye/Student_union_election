import { useCallback, useEffect, useState } from "react";

import {
  getDisciplineByStudentId,
  getDisciplineRecords,
  saveDisciplineStatus,
} from "../services/discipline.service";

import type {
  DisciplineRecord,
  DisciplineStatus,
} from "../types/discipline.types";

import "./DisciplinePage.css";

function DisciplinePage() {
  const [records, setRecords] = useState<DisciplineRecord[]>([]);
  const [studentId, setStudentId] = useState("");
  const [status, setStatus] = useState<DisciplineStatus>("Disciplined");
  const [searchId, setSearchId] = useState("");
  const [searchResult, setSearchResult] = useState<DisciplineRecord | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getDisciplineRecords();
      setRecords(response.data.disciplineRecords);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load discipline records."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedId = studentId.trim();

    if (!trimmedId) {
      setError("Please enter a student ID.");
      return;
    }

    if (trimmedId.length > 30) {
      setError("Student ID cannot exceed 30 characters.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    setSearchResult(null);

    try {
      await saveDisciplineStatus(trimmedId, status);

      setMessage("Student discipline status saved successfully.");
      setStudentId("");

      await loadRecords();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save discipline status."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedId = searchId.trim();

    if (!trimmedId) {
      setError("Enter a student ID to search.");
      return;
    }

    setSearching(true);
    setError("");
    setMessage("");
    setSearchResult(null);

    try {
      const response = await getDisciplineByStudentId(trimmedId);
      setSearchResult(response.data.discipline);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to retrieve the discipline record."
      );
    } finally {
      setSearching(false);
    }
  }

  function formatDate(date: string) {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleString();
  }

  return (
    <section className="discipline-page">
      <div className="discipline-heading">
        <div>
          <h2>Student Discipline Management</h2>
          <p>
            Find students and manage their discipline clearance status.
          </p>
        </div>

        <div className="discipline-total">
          <span>Total records</span>
          <strong>{records.length}</strong>
        </div>
      </div>

      {message && (
        <div className="discipline-alert discipline-alert-success">
          {message}
        </div>
      )}

      {error && (
        <div className="discipline-alert discipline-alert-error">
          {error}
        </div>
      )}

      <div className="discipline-card">
        <div className="discipline-card-heading">
          <div>
            <h3>Update Student Status</h3>
            <p>Enter the student's ID and select their status.</p>
          </div>
        </div>

        <form className="discipline-form" onSubmit={handleSave}>
          <div className="discipline-field">
            <label htmlFor="discipline-student-id">Student ID</label>
            <input
              id="discipline-student-id"
              type="text"
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              placeholder="Enter student ID"
              maxLength={30}
              required
            />
          </div>

          <div className="discipline-field">
            <label htmlFor="discipline-status">Discipline Status</label>
            <select
              id="discipline-status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as DisciplineStatus)
              }
            >
              <option value="Cleared">Cleared</option>
              <option value="Disciplined">Disciplined</option>
            </select>
          </div>

          <button
            className="discipline-primary-button"
            type="submit"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Student Status"}
          </button>
        </form>

        <p className="discipline-help">
          The system checks the student ID against student records and
          retrieves the student's name automatically.
        </p>
      </div>

      <div className="discipline-card">
        <div className="discipline-card-heading">
          <div>
            <h3>Find Student Record</h3>
            <p>Search for an individual student's discipline record.</p>
          </div>
        </div>

        <form className="discipline-search-form" onSubmit={handleSearch}>
          <input
            type="text"
            value={searchId}
            onChange={(event) => setSearchId(event.target.value)}
            placeholder="Enter student ID"
            maxLength={30}
            aria-label="Student ID to search"
          />

          <button
            className="discipline-secondary-button"
            type="submit"
            disabled={searching}
          >
            {searching ? "Searching..." : "Search"}
          </button>
        </form>

        {searchResult && (
          <div className="discipline-search-result">
            <div>
              <span>Student ID</span>
              <strong>{searchResult.studentId}</strong>
            </div>

            <div>
              <span>Full Name</span>
              <strong>{searchResult.fullName || "—"}</strong>
            </div>

            <div>
              <span>Status</span>
              <strong
                className={
                  searchResult.status === "Cleared"
                    ? "discipline-status-cleared"
                    : "discipline-status-disciplined"
                }
              >
                {searchResult.status}
              </strong>
            </div>

            <div>
              <span>Last Updated</span>
              <strong>{formatDate(searchResult.updatedAt)}</strong>
            </div>
          </div>
        )}
      </div>

      <div className="discipline-card">
        <div className="discipline-card-heading discipline-table-heading">
          <div>
            <h3>All Discipline Records</h3>
            <p>Records are displayed with the most recently updated first.</p>
          </div>

          <button
            className="discipline-refresh-button"
            type="button"
            onClick={() => void loadRecords()}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="discipline-empty">Loading discipline records...</div>
        ) : records.length === 0 ? (
          <div className="discipline-empty">
            No discipline records found.
          </div>
        ) : (
          <div className="discipline-table-wrapper">
            <table className="discipline-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Full Name</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                </tr>
              </thead>

              <tbody>
                {records.map((record) => (
                  <tr key={record._id || record.studentId}>
                    <td>{record.studentId}</td>
                    <td>{record.fullName || "—"}</td>
                    <td>
                      <span
                        className={`discipline-status ${
                          record.status === "Cleared"
                            ? "discipline-status-cleared"
                            : "discipline-status-disciplined"
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td>{formatDate(record.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default DisciplinePage;