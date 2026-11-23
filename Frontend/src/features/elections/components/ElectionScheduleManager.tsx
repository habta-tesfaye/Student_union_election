
import { useEffect, useState, type FormEvent } from "react";

import {
  createElectionSchedule,
  deleteElectionSchedule,
  getElectionSchedules,
  updateElectionSchedule,
  updateElectionScheduleStatus,
} from "../services/electionSchedule.service";

import type { ElectionSchedule } from "../types/electionSchedule.types";

import "./ElectionScheduleManager.css";

const TIME_ZONE = "Africa/Addis_Ababa";

const ELECTION_STAGES = [
  { value: "nominate", label: "Nominate (ዕጩ መምረጥ)" },
  { value: "class_vote", label: "Class Vote (የክፍል ድምፅ)" },
  { value: "upload_photo", label: "Upload Photo (ፎቶ መጫን)" },
  { value: "head_submit", label: "Head Submit (ውሳኔ ማሳለፍ)" },
  { value: "application_send", label: "Application (ማመልከቻ)" },
  { value: "feedback_reason", label: "Feedback (አስተያየት)" },
  { value: "vote_parliament", label: "Parliament Vote (የፓርላማ ድምፅ)" },
];

interface ScheduleForm {
  stage_name: string;
  stage_label: string;
  start_time: string;
  end_time: string;
}

const emptyForm: ScheduleForm = {
  stage_name: "nominate",
  stage_label: "",
  start_time: "",
  end_time: "",
};

function toEthiopiaDate(value: string): string {
  if (!value) return "";
  return `${value}:00+03:00`;
}

function toEthiopiaInput(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

function formatEthiopiaDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function ElectionScheduleManager() {
  const [schedules, setSchedules] = useState<ElectionSchedule[]>([]);
  const [form, setForm] = useState<ScheduleForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadSchedules() {
    try {
      setIsLoading(true);

      const response = await getElectionSchedules();

      if (!response.success) {
        throw new Error("Could not retrieve election schedules.");
      }

      setSchedules(response.data);
      setErrorMessage("");
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load election schedules."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSchedules();
  }, []);

  function handleInputChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function handleEdit(schedule: ElectionSchedule) {
    setEditingId(schedule._id);

    setForm({
      stage_name: schedule.stage_name,
      stage_label: schedule.stage_label,
      start_time: toEthiopiaInput(schedule.start_time),
      end_time: toEthiopiaInput(schedule.end_time),
    });

    setErrorMessage("");
    setSuccessMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!form.stage_name || !form.stage_label.trim()) {
      setErrorMessage("Please select a stage name and enter a stage label.");
      return;
    }

    if (!form.start_time || !form.end_time) {
      setErrorMessage("Please select both the start and end times.");
      return;
    }

    const startDate = new Date(toEthiopiaDate(form.start_time));
    const endDate = new Date(toEthiopiaDate(form.end_time));

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      setErrorMessage("Please enter valid dates and times.");
      return;
    }

    if (endDate <= startDate) {
      setErrorMessage("The end time must be later than the start time.");
      return;
    }

    const input = {
      stage_name: form.stage_name,
      stage_label: form.stage_label.trim(),
      start_time: toEthiopiaDate(form.start_time),
      end_time: toEthiopiaDate(form.end_time),
    };

    try {
      setIsSaving(true);

      if (editingId) {
        await updateElectionSchedule(editingId, input);
        setSuccessMessage("Election schedule updated successfully.");
      } else {
        await createElectionSchedule(input);
        setSuccessMessage(
          "Election schedule created successfully. Activate it when ready."
        );
      }

      resetForm();
      await loadSchedules();
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not save the election schedule."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleStatus(schedule: ElectionSchedule) {
    const nextStatus = !schedule.is_active;

    const confirmed = window.confirm(
      `Are you sure you want to ${nextStatus ? "activate" : "deactivate"} "${schedule.stage_label}"?`
    );

    if (!confirmed) return;

    setErrorMessage("");
    setSuccessMessage("");

    try {
      setBusyId(schedule._id);

      await updateElectionScheduleStatus(schedule._id, nextStatus);

      setSuccessMessage(
        nextStatus
          ? "Election schedule activated successfully."
          : "Election schedule deactivated successfully."
      );

      await loadSchedules();
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not update schedule status."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(schedule: ElectionSchedule) {
    const confirmed = window.confirm(
      `Delete the "${schedule.stage_label}" schedule? This action cannot be undone.`
    );

    if (!confirmed) return;

    setErrorMessage("");
    setSuccessMessage("");

    try {
      setBusyId(schedule._id);

      await deleteElectionSchedule(schedule._id);

      if (editingId === schedule._id) {
        resetForm();
      }

      setSuccessMessage("Election schedule deleted successfully.");
      await loadSchedules();
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not delete the election schedule."
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="schedule-manager">
      <div className="schedule-heading">
        <div>
          <h2>Election Schedule Management</h2>
          <p>
            Create and manage election stages and their opening and closing
            times.
          </p>
        </div>

        <button
          type="button"
          className="schedule-refresh-button"
          onClick={() => void loadSchedules()}
          disabled={isLoading}
        >
          Refresh schedules
        </button>
      </div>

      {errorMessage && (
        <div className="schedule-message schedule-error" role="alert">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="schedule-message schedule-success" role="status">
          {successMessage}
        </div>
      )}

      <div className="schedule-form-panel">
        <h3>
          {editingId ? "Edit election schedule" : "Create election schedule"}
        </h3>

        <form onSubmit={handleSubmit} className="schedule-form">
          <div className="schedule-form-grid">
            <label>
              Stage name

              <select
                name="stage_name"
                value={form.stage_name}
                onChange={handleInputChange}
                required
              >
                <option value="" disabled>
                  Select election stage
                </option>

                {ELECTION_STAGES.map((stage) => (
                  <option key={stage.value} value={stage.value}>
                    {stage.label}
                  </option>
                ))}
              </select>

              <small>
                Select the system stage. For the nomination period,
                select Nominate.
              </small>
            </label>

            <label>
              Stage label

              <input
                type="text"
                name="stage_label"
                value={form.stage_label}
                onChange={handleInputChange}
                placeholder="Example: Student Nomination Period"
                maxLength={255}
                required
              />
            </label>

            <label>
              Start date and time (Ethiopia)

              <input
                type="datetime-local"
                name="start_time"
                value={form.start_time}
                onChange={handleInputChange}
                required
              />
            </label>

            <label>
              End date and time (Ethiopia)

              <input
                type="datetime-local"
                name="end_time"
                value={form.end_time}
                onChange={handleInputChange}
                required
              />
            </label>
          </div>

          <p className="schedule-timezone-note">
            All dates and times are entered and displayed in Ethiopia time
            (Africa/Addis_Ababa, UTC+03:00).
          </p>

          <div className="schedule-form-actions">
            <button
              type="submit"
              className="schedule-primary-button"
              disabled={isSaving}
            >
              {isSaving
                ? "Saving..."
                : editingId
                  ? "Save changes"
                  : "Create schedule"}
            </button>

            {editingId && (
              <button
                type="button"
                className="schedule-cancel-button"
                onClick={resetForm}
                disabled={isSaving}
              >
                Cancel editing
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="schedule-list-panel">
        <h3>Existing election schedules</h3>

        {isLoading ? (
          <p>Loading election schedules...</p>
        ) : schedules.length === 0 ? (
          <p>No election schedules have been created yet.</p>
        ) : (
          <div className="schedule-table-wrapper">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>Stage</th>
                  <th>Stage name</th>
                  <th>Start time (Ethiopia)</th>
                  <th>End time (Ethiopia)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {schedules.map((schedule) => (
                  <tr key={schedule._id}>
                    <td>{schedule.stage_label}</td>
                    <td>
                      <code>{schedule.stage_name}</code>
                    </td>
                    <td>{formatEthiopiaDate(schedule.start_time)}</td>
                    <td>{formatEthiopiaDate(schedule.end_time)}</td>
                    <td>
                      <span
                        className={
                          schedule.is_active
                            ? "schedule-status schedule-active"
                            : "schedule-status schedule-inactive"
                        }
                      >
                        {schedule.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="schedule-row-actions">
                        <button
                          type="button"
                          onClick={() => handleEdit(schedule)}
                          disabled={busyId === schedule._id}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleToggleStatus(schedule)}
                          disabled={busyId === schedule._id}
                        >
                          {schedule.is_active ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          type="button"
                          className="schedule-delete-button"
                          onClick={() => void handleDelete(schedule)}
                          disabled={busyId === schedule._id}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
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
