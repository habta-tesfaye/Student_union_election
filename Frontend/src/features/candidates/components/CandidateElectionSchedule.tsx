import { useEffect, useState } from "react";

import {
  getElectionSchedules,
  type ElectionSchedule,
} from "../services/candidate.api";

import "./CandidateElectionSchedule.css";

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-ET", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Addis_Ababa",
  });
}

function CandidateElectionSchedule() {
  const [schedules, setSchedules] = useState<ElectionSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSchedules() {
    try {
      setLoading(true);
      setError("");

      const data = await getElectionSchedules();
      setSchedules(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load election schedules."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSchedules();
  }, []);

  return (
    <section className="candidate-schedule">
      <div className="schedule-intro">
        <div>
          <span className="schedule-eyebrow">ELECTION INFORMATION</span>
          <h2>Election Schedule</h2>
          <p>
            View the official election stages and their scheduled dates.
          </p>
        </div>

        <button
          type="button"
          className="schedule-refresh-button"
          onClick={() => void loadSchedules()}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh Schedule"}
        </button>
      </div>

      {loading && (
        <div className="schedule-message">
          Loading election schedules...
        </div>
      )}

      {!loading && error && (
        <div className="schedule-error" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && schedules.length === 0 && (
        <div className="schedule-empty">
          <h3>No Election Schedule Available</h3>
          <p>
            The election administration has not published any schedules yet.
          </p>
        </div>
      )}

      {!loading && !error && schedules.length > 0 && (
        <div className="schedule-list">
          {schedules.map((schedule) => (
            <article className="schedule-card" key={schedule._id}>
              <div className="schedule-card-top">
                <div className="schedule-stage">
                  <span className="schedule-stage-label">
                    ELECTION STAGE
                  </span>

                  <h3>{schedule.stage_label || schedule.stage_name}</h3>

                  <span className="schedule-stage-name">
                    {schedule.stage_name}
                  </span>
                </div>

                <span
                  className={`schedule-status ${
                    schedule.is_active ? "active" : "inactive"
                  }`}
                >
                  {schedule.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="schedule-dates">
                <div className="schedule-date-item">
                  <span>START DATE</span>
                  <strong>{formatDate(schedule.start_time)}</strong>
                </div>

                <div className="schedule-date-item">
                  <span>END DATE</span>
                  <strong>{formatDate(schedule.end_time)}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="schedule-footer-note">
        All dates and times are displayed in East Africa Time (EAT).
      </p>
    </section>
  );
}

export default CandidateElectionSchedule;