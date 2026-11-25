import { useCallback, useEffect, useState } from "react";
import { ApiError, api } from "../../../services/api";
import "./Phase2Management.css";

interface Phase2Record {
  studentId: string;
  certScore?: number | null;
  proposalScore?: number | null;
  interviewScore?: number | null;
  totalScore?: number | null;
  selectionStatus?: string;
  remarks?: string;
}

interface Phase2Response {
  success: boolean;
  count: number;
  data: Phase2Record[];
}

interface ApiMessage {
  message?: string;
}

interface EvaluationForm {
  studentId: string;
  certScore: string;
  proposalScore: string;
  interviewScore: string;
  selectionStatus: string;
  remarks: string;
}

const emptyForm: EvaluationForm = {
  studentId: "",
  certScore: "",
  proposalScore: "",
  interviewScore: "",
  selectionStatus: "pending",
  remarks: "",
};

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return error instanceof Error ? error.message : "Something went wrong.";
}

function Phase2Management() {
  const [records, setRecords] = useState<Phase2Record[]>([]);
  const [forms, setForms] = useState<Record<string, EvaluationForm>>({});
  const [newForm, setNewForm] = useState<EvaluationForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<Phase2Response>("/examinations/phase2");
      const evaluationRecords = response.data ?? [];

      setRecords(evaluationRecords);
      setForms(
        Object.fromEntries(
          evaluationRecords.map((record) => [
            record.studentId,
            {
              studentId: record.studentId,
              certScore:
                record.certScore == null ? "" : String(record.certScore),
              proposalScore:
                record.proposalScore == null
                  ? ""
                  : String(record.proposalScore),
              interviewScore:
                record.interviewScore == null
                  ? ""
                  : String(record.interviewScore),
              selectionStatus: record.selectionStatus ?? "pending",
              remarks: record.remarks ?? "",
            },
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

  function updateNewForm(field: keyof EvaluationForm, value: string) {
    setNewForm((current) => ({ ...current, [field]: value }));
  }

  function updateRecordForm(
    studentId: string,
    field: keyof EvaluationForm,
    value: string,
  ) {
    setForms((current) => ({
      ...current,
      [studentId]: {
        ...(current[studentId] ?? emptyForm),
        studentId,
        [field]: value,
      },
    }));
  }

  function getScores(form: EvaluationForm) {
    return {
      certScore: Number(form.certScore),
      proposalScore: Number(form.proposalScore),
      interviewScore: Number(form.interviewScore),
    };
  }

  function validScores(form: EvaluationForm) {
    const scores = getScores(form);

    return (
      form.certScore.trim() !== "" &&
      form.proposalScore.trim() !== "" &&
      form.interviewScore.trim() !== "" &&
      Number.isFinite(scores.certScore) &&
      Number.isFinite(scores.proposalScore) &&
      Number.isFinite(scores.interviewScore) &&
      scores.certScore >= 0 &&
      scores.certScore <= 5 &&
      scores.proposalScore >= 0 &&
      scores.proposalScore <= 15 &&
      scores.interviewScore >= 0 &&
      scores.interviewScore <= 10
    );
  }

  async function createEvaluation() {
    const studentId = newForm.studentId.trim();

    if (!studentId) {
      setError("Enter the student ID.");
      return;
    }

    if (!validScores(newForm)) {
      setError(
        "Enter valid scores: certificate 0–5, proposal 0–15, and interview 0–10.",
      );
      return;
    }

    setCreating(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post<ApiMessage>("/examinations/phase2", {
        studentId,
        ...getScores(newForm),
        selectionStatus: newForm.selectionStatus.trim() || "pending",
        remarks: newForm.remarks,
      });

      setMessage(response.message ?? "Phase 2 evaluation created.");
      setNewForm(emptyForm);
      await loadRecords();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setCreating(false);
    }
  }

  async function saveRecord(record: Phase2Record) {
    const form = forms[record.studentId] ?? emptyForm;

    if (!validScores(form)) {
      setError(
        `Enter valid scores for ${record.studentId}: certificate 0–5, proposal 0–15, and interview 0–10.`,
      );
      return;
    }

    setSavingId(record.studentId);
    setError("");
    setMessage("");

    try {
      const response = await api.patch<ApiMessage>(
        `/examinations/phase2/${encodeURIComponent(record.studentId)}`,
        {
          ...getScores(form),
          selectionStatus: form.selectionStatus.trim() || "pending",
          remarks: form.remarks,
        },
      );

      setMessage(response.message ?? "Phase 2 evaluation updated.");
      await loadRecords();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return <div className="phase2-state">Loading Phase 2 evaluations...</div>;
  }

  return (
    <section className="phase2-page">
      <div className="phase2-heading">
        <div>
          <h2>Phase 2 Evaluation Management</h2>
          <p>
            Record certificate, proposal, and interview scores for a maximum
            total of 30 points.
          </p>
        </div>

        <button
          type="button"
          className="phase2-refresh"
          onClick={() => void loadRecords()}
        >
          Refresh
        </button>
      </div>

      {error && <div className="phase2-alert phase2-alert-error">{error}</div>}
      {message && (
        <div className="phase2-alert phase2-alert-success">{message}</div>
      )}

      <form
        className="phase2-create-form"
        onSubmit={(event) => {
          event.preventDefault();
          void createEvaluation();
        }}
      >
        <h3>Create an evaluation</h3>

        <div className="phase2-form-grid">
          <label>
            Student ID
            <input
              value={newForm.studentId}
              onChange={(event) => updateNewForm("studentId", event.target.value)}
              required
            />
          </label>

          <label>
            Certificate / 5
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={newForm.certScore}
              onChange={(event) => updateNewForm("certScore", event.target.value)}
              required
            />
          </label>

          <label>
            Proposal / 15
            <input
              type="number"
              min="0"
              max="15"
              step="0.1"
              value={newForm.proposalScore}
              onChange={(event) =>
                updateNewForm("proposalScore", event.target.value)
              }
              required
            />
          </label>

          <label>
            Interview / 10
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={newForm.interviewScore}
              onChange={(event) =>
                updateNewForm("interviewScore", event.target.value)
              }
              required
            />
          </label>

          <label>
            Total / 30
            <input
              value={
                validScores(newForm)
                  ? String(
                      getScores(newForm).certScore +
                        getScores(newForm).proposalScore +
                        getScores(newForm).interviewScore,
                    )
                  : "—"
              }
              readOnly
            />
          </label>

          <label>
            Selection status
            <input
              value={newForm.selectionStatus}
              onChange={(event) =>
                updateNewForm("selectionStatus", event.target.value)
              }
              placeholder="pending"
            />
          </label>

          <label className="phase2-wide-field">
            Remarks
            <textarea
              rows={2}
              maxLength={1000}
              value={newForm.remarks}
              onChange={(event) => updateNewForm("remarks", event.target.value)}
            />
          </label>
        </div>

        <button type="submit" className="phase2-save" disabled={creating}>
          {creating ? "Creating..." : "Create evaluation"}
        </button>
      </form>

      {records.length === 0 ? (
        <div className="phase2-state">No Phase 2 evaluations were found.</div>
      ) : (
        <div className="phase2-table-wrap">
          <table className="phase2-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Certificate / 5</th>
                <th>Proposal / 15</th>
                <th>Interview / 10</th>
                <th>Total / 30</th>
                <th>Selection status</th>
                <th>Remarks</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {records.map((record) => {
                const form = forms[record.studentId] ?? emptyForm;
                const scores = getScores(form);
                const total = validScores(form)
                  ? scores.certScore + scores.proposalScore + scores.interviewScore
                  : "—";

                return (
                  <tr key={record.studentId}>
                    <td>{record.studentId}</td>

                    <td>
                      <input
                        aria-label={`Certificate score for ${record.studentId}`}
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={form.certScore}
                        onChange={(event) =>
                          updateRecordForm(
                            record.studentId,
                            "certScore",
                            event.target.value,
                          )
                        }
                      />
                    </td>

                    <td>
                      <input
                        aria-label={`Proposal score for ${record.studentId}`}
                        type="number"
                        min="0"
                        max="15"
                        step="0.1"
                        value={form.proposalScore}
                        onChange={(event) =>
                          updateRecordForm(
                            record.studentId,
                            "proposalScore",
                            event.target.value,
                          )
                        }
                      />
                    </td>

                    <td>
                      <input
                        aria-label={`Interview score for ${record.studentId}`}
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={form.interviewScore}
                        onChange={(event) =>
                          updateRecordForm(
                            record.studentId,
                            "interviewScore",
                            event.target.value,
                          )
                        }
                      />
                    </td>

                    <td>{total}</td>

                    <td>
                      <input
                        aria-label={`Selection status for ${record.studentId}`}
                        value={form.selectionStatus}
                        onChange={(event) =>
                          updateRecordForm(
                            record.studentId,
                            "selectionStatus",
                            event.target.value,
                          )
                        }
                      />
                    </td>

                    <td>
                      <textarea
                        aria-label={`Remarks for ${record.studentId}`}
                        rows={2}
                        maxLength={1000}
                        value={form.remarks}
                        onChange={(event) =>
                          updateRecordForm(
                            record.studentId,
                            "remarks",
                            event.target.value,
                          )
                        }
                      />
                    </td>

                    <td>
                      <button
                        type="button"
                        className="phase2-save"
                        disabled={savingId === record.studentId}
                        onClick={() => void saveRecord(record)}
                      >
                        {savingId === record.studentId ? "Saving..." : "Save"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default Phase2Management;