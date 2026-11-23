import type { StudentSection } from "../pages/StudentMenu";

interface CandidateStudent {
  studentId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  department?: string;
  yearSection?: string;
  gpa?: number;
}

interface Candidate {
  studentId: string;
  photo: string;
  totalVotes: number;
  student?: CandidateStudent | null;
}

interface StudentCandidatesSectionProps {
  activeSection: StudentSection;
  candidates: Candidate[];
  getFullName: (student?: CandidateStudent | null) => string;
  getInitials: (name: string) => string;
  onRefresh: () => void;
  onVote: (studentId: string) => void;
  votingCandidateId: string;
  voteMessage: string;
  voteError: string;
}

function StudentCandidatesSection({
  activeSection,
  candidates,
  getFullName,
  getInitials,
  onRefresh,
  onVote,
  votingCandidateId,
  voteMessage,
  voteError,
}: StudentCandidatesSectionProps) {
  return (
    <section className="student-panel">
      <div className="student-panel-heading">
        <div>
          <p className="student-panel-kicker">Election</p>
          <h2>
            {activeSection === "voting"
              ? "Cast your vote"
              : "Official candidates"}
          </h2>
        </div>

        <button
          className="student-refresh-button"
          type="button"
          onClick={onRefresh}
        >
          Refresh
        </button>
      </div>

      <p className="student-muted">
        Candidates are limited by the backend to your department
        and year section.
      </p>

      {voteMessage && (
        <div
          className="student-alert student-alert-success"
          role="status"
        >
          {voteMessage}
        </div>
      )}

      {voteError && (
        <div
          className="student-alert student-alert-error"
          role="alert"
        >
          {voteError}
        </div>
      )}

      {candidates.length === 0 ? (
        <p className="student-empty-state">
          No official candidates were returned for your section.
        </p>
      ) : (
        <div className="student-candidate-list">
          {candidates.map((candidate) => (
            <article
              className="student-candidate-card"
              key={candidate.studentId}
            >
              <div className="student-candidate-avatar">
                {getInitials(getFullName(candidate.student))}
              </div>

              <div className="student-candidate-info">
                <h3>{getFullName(candidate.student)}</h3>
                <p>{candidate.studentId}</p>
                <p>
                  {candidate.student?.department ??
                    "Department not listed"}
                  {" · "}
                  {candidate.student?.yearSection ??
                    "Section not listed"}
                </p>
              </div>

              <button
                className="student-primary-button"
                type="button"
                disabled={Boolean(votingCandidateId)}
                onClick={() => onVote(candidate.studentId)}
              >
                {votingCandidateId === candidate.studentId
                  ? "Submitting..."
                  : "Vote"}
              </button>
            </article>
          ))}
        </div>
      )}

      <p className="student-field-help">
        Voting is available only during the active class-voting
        period. The backend verifies eligibility and prevents a
        second vote.
      </p>
    </section>
  );
}

export default StudentCandidatesSection;
