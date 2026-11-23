import type { FormEvent } from "react";

interface StudentNominationSectionProps {
  nomineeStudentId: string;
  onNomineeIdChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  nominationError: string;
  nominationMessage: string;
  submittingNomination: boolean;
}

function StudentNominationSection({
  nomineeStudentId,
  onNomineeIdChange,
  onSubmit,
  nominationError,
  nominationMessage,
  submittingNomination,
}: StudentNominationSectionProps) {
  return (
    <section className="student-panel">
      <p className="student-panel-kicker">Student nomination</p>
      <h2>Nominate a student</h2>

      <p className="student-muted">
        Enter the student ID of the person you want to nominate.
        The backend checks eligibility and whether nominations are
        currently allowed.
      </p>

      <form
        className="student-application-form"
        onSubmit={onSubmit}
      >
        <label htmlFor="nominee-student-id">
          Nominee student ID
        </label>

        <input
          id="nominee-student-id"
          className="student-text-input"
          type="text"
          value={nomineeStudentId}
          onChange={(event) => onNomineeIdChange(event.target.value)}
          placeholder="Enter student ID"
          required
        />

        {nominationError && (
          <p className="student-inline-error" role="alert">
            {nominationError}
          </p>
        )}

        {nominationMessage && (
          <p className="student-inline-success" role="status">
            {nominationMessage}
          </p>
        )}

        <button
          className="student-primary-button"
          type="submit"
          disabled={submittingNomination}
        >
          {submittingNomination
            ? "Submitting..."
            : "Submit nomination"}
        </button>
      </form>
    </section>
  );
}

export default StudentNominationSection;
