import type { StudentSection } from "../pages/StudentMenu";

interface StudentHomeSectionProps {
  onSelect: (section: StudentSection) => void;
}

function StudentHomeSection({ onSelect }: StudentHomeSectionProps) {
  return (
    <section className="student-panel student-home-panel">
      <p className="student-panel-kicker">Student portal</p>
      <h2>Welcome to your dashboard</h2>

      <p className="student-muted">
        Select a function from the menu to manage your election
        application, nomination, class information, voting, and
        notifications.
      </p>

      <div className="student-home-cards">
        <button type="button" onClick={() => onSelect("application")}>
          <span>My Application</span>
          <small>View your application or submit one.</small>
        </button>

        <button type="button" onClick={() => onSelect("nomination")}>
          <span>Nomination</span>
          <small>Nominate a student using their student ID.</small>
        </button>

        <button type="button" onClick={() => onSelect("classmates")}>
          <span>Classmates</span>
          <small>View students in your class section.</small>
        </button>

        <button type="button" onClick={() => onSelect("candidates")}>
          <span>Candidates</span>
          <small>View official candidates.</small>
        </button>

        <button type="button" onClick={() => onSelect("voting")}>
          <span>Voting</span>
          <small>Vote for an eligible candidate.</small>
        </button>

        <button type="button" onClick={() => onSelect("results")}>
          <span>Election Results</span>
          <small>View class election results.</small>
        </button>

        <button type="button" onClick={() => onSelect("notifications")}>
          <span>Notifications</span>
          <small>Read your recent election updates.</small>
        </button>
      </div>
    </section>
  );
}

export default StudentHomeSection;
