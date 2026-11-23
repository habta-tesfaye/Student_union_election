
import "./HeadSidebar.css";

interface HeadSidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const headMenuItems = [
  { id: "dashboard", label: "Dashboard", icon: "⌂" },
  { id: "nominations", label: "Department Nominations", icon: "✎" },
  { id: "candidates", label: "Candidate Information", icon: "♙" },
  { id: "tie-resolution", label: "Tie Resolution", icon: "⚖️" },
];

function HeadSidebar({
  activePage,
  onNavigate,
  onLogout,
}: HeadSidebarProps) {
  return (
    <aside className="head-sidebar">
      <div className="head-sidebar-brand">
        <div className="head-sidebar-logo">DMU</div>
        <div>
          <h2>DMU</h2>
          <p>Bure Campus</p>
        </div>
      </div>

      <div className="head-sidebar-heading">
        DEPARTMENT HEAD PORTAL
      </div>

      <nav className="head-sidebar-menu">
        {headMenuItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`head-sidebar-link ${
              activePage === item.id ? "active" : ""
            }`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="head-sidebar-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="head-sidebar-bottom">
        <button
          type="button"
          className="head-sidebar-logout"
          onClick={onLogout}
        >
          <span>↪</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export default HeadSidebar;
