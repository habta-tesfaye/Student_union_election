import "./StudentMenu.css";

export type StudentSection =
  | "dashboard"
  //| "application"
  | "nomination"
| "nomination-response"
  | "classmates"
  | "candidates"
  | "voting"
  | "results"
  | "notifications"
    | "notices"
  //| "feedback"
  | "chat";

interface StudentMenuProps {
  activeSection: StudentSection;
  onSelect: (section: StudentSection) => void;
}

const menuItems: {
  id: StudentSection;
  label: string;
  icon: string;
}[] = [
  { id: "dashboard", label: "Dashboard", icon: "⌂" },
  //{ id: "application", label: "My Application", icon: "▤" },
  { id: "nomination", label: "Nomination", icon: "✎" },
    {
    id: "nomination-response",
    label: "My Nomination Response",
    icon: "✓",
  },
  { id: "classmates", label: "Classmates", icon: "♧" },
  { id: "candidates", label: "Candidates", icon: "♙" },
  { id: "voting", label: "Voting", icon: "✓" },
  { id: "results", label: "Election Results", icon: "▥" },
{ id: "notices", label: "View Notices", icon: "📢" },
{ id: "notifications", label: "Notifications", icon: "♢" },
 // { id: "feedback", label: "Feedback", icon: "✉" },
  { id: "chat", label: "Chat Assistant", icon: "●" },
];

interface StudentMenuProps {
  activeSection: StudentSection;
  onSelect: (section: StudentSection) => void;
}

export default function StudentMenu({
  activeSection,
  onSelect,
}: StudentMenuProps) {
  return (
    <aside className="student-menu">
      <div className="student-menu-heading">
        <span className="student-menu-heading-icon">DMU</span>

        <div>
          <strong>Student Portal</strong>
          <small>Bure Campus</small>
        </div>
      </div>

      <p className="student-menu-label">STUDENT MENU</p>

      <nav className="student-menu-list" aria-label="Student functions">
        {menuItems.map((item) => {
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={
                isActive
                  ? "student-menu-button active"
                  : "student-menu-button"
              }
              aria-current={isActive ? "page" : undefined}
              onClick={() => onSelect(item.id)}
            >
              <span className="student-menu-icon" aria-hidden="true">
                {item.icon}
              </span>

              <span className="student-menu-button-label">
                {item.label}
              </span>

              <span className="student-menu-arrow" aria-hidden="true">
                ›
              </span>
            </button>
          );
        })}
      </nav>

      <div className="student-menu-footer">
        Student Union Election System
      </div>
    </aside>
  );
}
