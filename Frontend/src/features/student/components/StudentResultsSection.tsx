interface ClassElectionResult {
  studentId: string;
  photo: string;
  totalVotes: number;
  manualWinner: boolean;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  department: string;
  yearSection: string;
  gpa: number;
}

interface ClassResults {
  department: string;
  yearSection: string | null;
  totalCandidates: number;
  totalVotes: number;
  maleWinner: ClassElectionResult | null;
  femaleWinner: ClassElectionResult | null;
  maleDeadlock: boolean;
  femaleDeadlock: boolean;
  tieDetected: boolean;
  candidates: ClassElectionResult[];
}

interface StudentResultsSectionProps {
  classResults: ClassResults | null;
  onRefresh: () => void;
}

function getResultName(candidate: ClassElectionResult): string {
  return (
    [candidate.firstName, candidate.middleName, candidate.lastName]
      .filter(Boolean)
      .join(" ") || candidate.studentId
  );
}

function StudentResultsSection({
  classResults,
  onRefresh,
}: StudentResultsSectionProps) {
  return (
    <section className="student-panel">
      <div className="student-panel-heading">
        <div>
          <p className="student-panel-kicker">Election results</p>
          <h2>Class election results</h2>
        </div>

        <button
          className="student-refresh-button"
          type="button"
          onClick={onRefresh}
        >
          Refresh
        </button>
      </div>

      {!classResults ? (
        <p className="student-empty-state">
          Class election results are not available right now.
        </p>
      ) : (
        <>
          <p className="student-muted">
            {classResults.department}
            {classResults.yearSection
              ? ` · ${classResults.yearSection}`
              : ""}
          </p>

          <div className="student-application-details">
            <p>
              <strong>Total candidates:</strong>{" "}
              {classResults.totalCandidates}
            </p>

            <p>
              <strong>Total votes:</strong>{" "}
              {classResults.totalVotes}
            </p>
          </div>

          {classResults.tieDetected && (
            <p className="student-inline-error" role="status">
              A tie was detected. The result requires review.
            </p>
          )}

          <h3>Male winner</h3>

          {classResults.maleWinner ? (
            <p>
              {getResultName(classResults.maleWinner)} —{" "}
              {classResults.maleWinner.totalVotes} votes
            </p>
          ) : (
            <p className="student-muted">
              No male winner declared.
            </p>
          )}

          <h3>Female winner</h3>

          {classResults.femaleWinner ? (
            <p>
              {getResultName(classResults.femaleWinner)} —{" "}
              {classResults.femaleWinner.totalVotes} votes
            </p>
          ) : (
            <p className="student-muted">
              No female winner declared.
            </p>
          )}

          <h3>Candidate ranking</h3>

          {classResults.candidates.length === 0 ? (
            <p className="student-empty-state">
              No class-election candidates are listed.
            </p>
          ) : (
            <div className="student-candidate-list">
              {classResults.candidates.map((candidate, index) => (
                <article
                  className="student-candidate-card"
                  key={candidate.studentId}
                >
                  <div className="student-candidate-avatar">
                    {index + 1}
                  </div>

                  <div className="student-candidate-info">
                    <h3>{getResultName(candidate)}</h3>
                    <p>{candidate.studentId}</p>
                    <p>{candidate.totalVotes} votes</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default StudentResultsSection;
