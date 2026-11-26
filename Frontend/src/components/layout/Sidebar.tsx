import { useEffect, useState } from "react";
import "./Sidebar.css";

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: "⌂" },
  { id: "schedules", label: "Election Schedules", icon: "▦" },
  //{ id: "students", label: "Students", icon: "♙" },
  //{ id: "applications", label: "Applications", icon: "▤" },
 // { id: "candidates", label: "Candidates", icon: "♟" },
 // { id: "nominations", label: "Nominations", icon: "✎" },
  //{ id: "parliament", label: "Parliament", icon: "▣" },
  { id: "results", label: "Election Results", icon: "▥" },
  { id: "notifications", label: "Notifications", icon: "♧" },
  {
    id: "winner-submissions",
    label: "Head Winner Submissions",
    icon: "♙",
  },
  { id: "discipline", label: "Discipline", icon: "⚖" },
  { id: "notices", label: "Notices", icon: "▣" },
];

const winnerManagerPageIds = [
  "winner-entry-16",
  "winner-final-8",
  "winner-final-result",
];

function Sidebar({ activePage, onNavigate, onLogout }: SidebarProps) {
  const [examinationsOpen, setExaminationsOpen] = useState(
    activePage === "phase1" || activePage === "phase2"
  );

  const isWinnerManagerPage = winnerManagerPageIds.includes(activePage);

  const [winnerManagerOpen, setWinnerManagerOpen] =
    useState(isWinnerManagerPage);

  useEffect(() => {
    if (activePage === "phase1" || activePage === "phase2") {
      setExaminationsOpen(true);
    }

    if (isWinnerManagerPage) {
      setWinnerManagerOpen(true);
    }
  }, [activePage, isWinnerManagerPage]);

  return (
    <aside className="director-sidebar">
      <div className="director-sidebar-brand">
        <div className="director-sidebar-logo">DMU</div>

        <div>
          <h2>DMU</h2>
          <p>Bure Campus</p>
        </div>
      </div>

      <div className="director-sidebar-heading">DIRECTOR PORTAL</div>

      <nav className="director-sidebar-menu">
        {menuItems.slice(0, 6).map((item) => (
          <button
            key={item.id}
            type="button"
            className={`director-sidebar-link ${
              activePage === item.id ? "active" : ""
            }`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="director-sidebar-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}

        {/* Examinations dropdown */}
        <button
          type="button"
          className={`director-sidebar-link director-sidebar-dropdown-toggle ${
            activePage === "phase1" || activePage === "phase2" ? "active" : ""
          }`}
          aria-expanded={examinationsOpen}
          onClick={() => setExaminationsOpen((open) => !open)}
        >
          <span className="director-sidebar-icon">▣</span>
          <span>Examinations</span>
          <span className="director-sidebar-chevron">
            {examinationsOpen ? "⌄" : "›"}
          </span>
        </button>

        {examinationsOpen && (
          <div className="director-sidebar-submenu">
            <button
              type="button"
              className={`director-sidebar-sublink ${
                activePage === "phase1" ? "active" : ""
              }`}
              onClick={() => onNavigate("phase1")}
            >
              Phase 1
            </button>

            <button
              type="button"
              className={`director-sidebar-sublink ${
                activePage === "phase2" ? "active" : ""
              }`}
              onClick={() => onNavigate("phase2")}
            >
              Phase 2
            </button>
          </div>
        )}

        {/* Winner Manager dropdown */}
        <button
          type="button"
          className={`director-sidebar-link director-sidebar-dropdown-toggle ${
            isWinnerManagerPage ? "active" : ""
          }`}
          aria-expanded={winnerManagerOpen}
          onClick={() => setWinnerManagerOpen((open) => !open)}
        >
          <span className="director-sidebar-icon">🏆</span>
          <span>Winner Manager</span>
          <span className="director-sidebar-chevron">
            {winnerManagerOpen ? "⌄" : "›"}
          </span>
        </button>

        {winnerManagerOpen && (
          <div className="director-sidebar-submenu">
            <button
              type="button"
              className={`director-sidebar-sublink ${
                activePage === "winner-entry-16" ? "active" : ""
              }`}
              onClick={() => onNavigate("winner-entry-16")}
            >
              16 Winners Entry
            </button>

            <button
              type="button"
              className={`director-sidebar-sublink ${
                activePage === "winner-final-8" ? "active" : ""
              }`}
              onClick={() => onNavigate("winner-final-8")}
            >
              Final 8 Winners
            </button>

            <button
              type="button"
              className={`director-sidebar-sublink ${
                activePage === "winner-final-result" ? "active" : ""
              }`}
              onClick={() => onNavigate("winner-final-result")}
            >
              Final Result
            </button>
          </div>
        )}

        {menuItems.slice(6).map((item) => (
          <button
            key={item.id}
            type="button"
            className={`director-sidebar-link ${
              activePage === item.id ? "active" : ""
            }`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="director-sidebar-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="director-sidebar-bottom">
        <button
          type="button"
          className="director-sidebar-logout"
          onClick={onLogout}
        >
          <span>↪</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;