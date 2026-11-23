interface Classmate {
  studentId: string;
  name?: string | null;
  department?: string;
  yearSection?: string;
}

interface StudentClassmatesSectionProps {
  classmates: Classmate[];
  getClassmateName: (classmate: Classmate) => string;
  getInitials: (name: string) => string;
  onRefresh: () => void;
}

function StudentClassmatesSection({
  classmates,
  getClassmateName,
  getInitials,
  onRefresh,
}: StudentClassmatesSectionProps) {
  return (
    <section className="student-panel">
      <div className="student-panel-heading">
        <div>
          <p className="student-panel-kicker">My class</p>
          <h2>Classmates</h2>
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
        Students in your department and year section, excluding
        your own student account.
      </p>

      {classmates.length === 0 ? (
        <p className="student-empty-state">
          No classmates were returned for your department and
          year section.
        </p>
      ) : (
        <div className="student-candidate-list">
          {classmates.map((classmate) => {
            const name = getClassmateName(classmate);

            return (
              <article
                className="student-candidate-card"
                key={classmate.studentId}
              >
                <div className="student-candidate-avatar">
                  {getInitials(name)}
                </div>

                <div className="student-candidate-info">
                  <h3>{name}</h3>
                  <p>{classmate.studentId}</p>
                  <p>
                    {classmate.department || "Department not listed"}
                    {" · "}
                    {classmate.yearSection || "Section not listed"}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default StudentClassmatesSection;
