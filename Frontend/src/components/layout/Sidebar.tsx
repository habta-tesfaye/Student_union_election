
import "./Sidebar.css";

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: "⌂" },
  { id: "schedules", label: "Election Schedules", icon: "▦" },
  { id: "students", label: "Students", icon: "♙" },
  { id: "applications", label: "Applications", icon: "▤" },
  { id: "candidates", label: "Candidates", icon: "♟" },
  { id: "nominations", label: "Nominations", icon: "✎" },
  { id: "examinations", label: "Examinations", icon: "▣" },
  { id: "parliament", label: "Parliament", icon: "🏛" },
  { id: "results", label: "Election Results", icon: "▥" },
  { id: "notifications", label: "Notifications", icon: "♧" },
  { id: "discipline", label: "Discipline", icon: "⚖" },
];

function Sidebar({
  activePage,
  onNavigate,
  onLogout,
}: SidebarProps) {
  return (
    <aside className="director-sidebar">
      <div className="director-sidebar-brand">
        <div className="director-sidebar-logo">DMU</div>
        <div>
          <h2>DMU</h2>
          <p>Bure Campus</p>
        </div>
      </div>

      <div className="director-sidebar-heading">
        DIRECTOR PORTAL
      </div>

      <nav className="director-sidebar-menu">
        {menuItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`director-sidebar-link ${
              activePage === item.id ? "active" : ""
            }`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="director-sidebar-icon">
              {item.icon}
            </span>
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
