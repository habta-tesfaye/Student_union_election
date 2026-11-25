import { useCallback, useEffect, useState } from "react";
import { ApiError, api } from "../../../services/api";
import "./Phase1Management.css";

type ExamStatus = "pending" | "passed" | "failed";

interface Phase1Record {
  studentId: string;
  motivationText?: string;
  examScore10?: number | null;
  examStatus?: ExamStatus;
  examRemarks?: string;
}

interface Phase1Response {
  success: boolean;
  count: number;
  data: Phase1Record[];
}

interface ApiMessage {
  message?: string;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return error instanceof Error ? error.message : "Something went wrong.";
}

function Phase1Management() {
  const [records, setRecords] = useState<Phase1Record[]>([]);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, ExamStatus>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<Phase1Response>("/examinations/phase1");
      const examRecords = response.data ?? [];

      setRecords(examRecords);
      setScores(
        Object.fromEntries(
          examRecords.map((record) => [
            record.studentId,
            record.examScore10 == null ? "" : String(record.examScore10),
          ]),
        ),
      );
      setStatuses(
        Object.fromEntries(
          examRecords.map((record) => [
            record.studentId,
            record.examStatus ?? "pending",
          ]),
        ),
      );
      setRemarks(
        Object.fromEntries(
          examRecords.map((record) => [
            record.studentId,
            record.examRemarks ?? "",
          ]),
        ),
      );
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  async function saveRecord(record: Phase1Record) {
    const scoreText = scores[record.studentId] ?? "";
    const score = Number(scoreText);

    if (
      scoreText.trim() === "" ||
      !Number.isFinite(score) ||
      score < 0 ||
      score > 10
    ) {
      setError("Enter a valid Phase 1 score from 0 to 10.");
      return;
    }

    setSavingId(record.studentId);
    setError("");
    setMessage("");

    const body = {
      examScore: score,
      maxScore: 10,
      status: statuses[record.studentId] ?? "pending",
      remarks: remarks[record.studentId] ?? "",
    };

    try {
      let response: ApiMessage;

      if (record.examScore10 == null) {
        response = await api.post<ApiMessage>("/examinations/phase1", {
          studentId: record.studentId,
          ...body,
        });
      } else {
        response = await api.patch<ApiMessage>(
          `/examinations/phase1/${encodeURIComponent(record.studentId)}`,
          body,
        );
      }

      setMessage(response.message ?? "Phase 1 score saved.");
      await loadRecords();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return <div className="phase1-state">Loading Phase 1 records...</div>;
  }

  return (
    <section className="phase1-page">
      <div className="phase1-heading">
        <div>
          <h2>Phase 1 Score Management</h2>
          <p>Review applications and record examination scores out of 10.</p>
        </div>

        <button
          type="button"
          className="phase1-refresh"
          onClick={() => void loadRecords()}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="phase1-alert phase1-alert-error">{error}</div>
      )}

      {message && (
        <div className="phase1-alert phase1-alert-success">{message}</div>
      )}

      {records.length === 0 ? (
        <div className="phase1-state">No Phase 1 records were found.</div>
      ) : (
        <div className="phase1-table-wrap">
          <table className="phase1-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Motivation / Vision</th>
                <th>Score / 10</th>
                <th>Status</th>
                <th>Remarks</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {records.map((record) => (
                <tr key={record.studentId}>
                  <td>{record.studentId}</td>

                  <td className="phase1-motivation">
                    {record.motivationText || "—"}
                  </td>

                  <td>
                    <input
                      aria-label={`Phase 1 score for ${record.studentId}`}
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={scores[record.studentId] ?? ""}
                      onChange={(event) =>
                        setScores((current) => ({
                          ...current,
                          [record.studentId]: event.target.value,
                        }))
                      }
                    />
                  </td>

                  <td>
                    <select
                      aria-label={`Phase 1 status for ${record.studentId}`}
                      value={statuses[record.studentId] ?? "pending"}
                      onChange={(event) =>
                        setStatuses((current) => ({
                          ...current,
                          [record.studentId]: event.target.value as ExamStatus,
                        }))
                      }
                    >
                      <option value="pending">Pending</option>
                      <option value="passed">Passed</option>
                      <option value="failed">Failed</option>
                    </select>
                  </td>

                  <td>
                    <textarea
                      aria-label={`Remarks for ${record.studentId}`}
                      rows={2}
                      value={remarks[record.studentId] ?? ""}
                      onChange={(event) =>
                        setRemarks((current) => ({
                          ...current,
                          [record.studentId]: event.target.value,
                        }))
                      }
                    />
                  </td>

                  <td>
                    <button
                      type="button"
                      className="phase1-save"
                      disabled={savingId === record.studentId}
                      onClick={() => void saveRecord(record)}
                    >
                      {savingId === record.studentId ? "Saving..." : "Save"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default Phase1Management;