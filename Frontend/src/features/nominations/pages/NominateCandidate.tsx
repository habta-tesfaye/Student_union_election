
import { useState } from "react";
import type { FormEvent } from "react";

import { submitNomination } from "../services/nomination.api";

interface NominationResponse {
  status: string;
}

export default function NominateCandidate() {
  const [nomineeStudentId, setNomineeStudentId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nomineeId = nomineeStudentId.trim();

    setSuccessMessage("");
    setErrorMessage("");

    if (!nomineeId) {
      setErrorMessage("Please enter the nominee's student ID.");
      return;
    }

    setSubmitting(true);

    try {
      const result = (await submitNomination(
        nomineeId
      )) as NominationResponse;

      setSuccessMessage(
        `Your nomination was submitted successfully. Current status: ${
          result.status || "pending"
        }.`
      );

      setNomineeStudentId("");
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The nomination could not be submitted."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="student-panel">
      <div className="student-panel-heading">
        <div>
          <p className="student-panel-kicker">Student nomination</p>
          <h2>Nominate a candidate</h2>
        </div>
      </div>

      <p className="student-muted">
        Enter the student ID of the student you want to nominate.
        The nominee must belong to your own department and year section.
      </p>

      <div className="student-application-details">
        <h3>Before you submit</h3>
        <ul>
          <li>You can submit only one nomination.</li>
          <li>You cannot nominate yourself.</li>
          <li>The nominee must not have already been nominated.</li>
          <li>The nominee must have a GPA of at least 2.75.</li>
          <li>Your section can have a maximum of three nominees.</li>
          <li>The nomination period must be open.</li>
        </ul>
      </div>

      <form
        className="student-application-form"
        onSubmit={handleSubmit}
      >
        <label htmlFor="nominee-student-id">
          Nominee student ID
        </label>

        <input
          id="nominee-student-id"
          className="student-text-input"
          type="text"
          value={nomineeStudentId}
          onChange={(event) => setNomineeStudentId(event.target.value)}
          placeholder="Example: DMU/CS/001"
          autoComplete="off"
          required
          disabled={submitting}
        />

        {errorMessage && (
          <p className="student-inline-error" role="alert">
            {errorMessage}
          </p>
        )}

        {successMessage && (
          <p className="student-inline-success" role="status">
            {successMessage}
          </p>
        )}

        <button
          className="student-primary-button"
          type="submit"
          disabled={submitting || !nomineeStudentId.trim()}
        >
          {submitting ? "Submitting nomination..." : "Submit nomination"}
        </button>
      </form>

      <p className="student-field-help">
        Your nomination will initially have pending status.
        The backend checks the eligibility rules before saving it.
      </p>
    </section>
  );
}
