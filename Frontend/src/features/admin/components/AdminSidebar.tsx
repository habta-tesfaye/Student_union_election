import "./AdminSidebar.css";
import {
  LayoutDashboard,
  Users,
  //GraduationCap,
  History,
  LogOut,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

export type AdminSection =
  | "dashboard"
  | "staff"
  //| "students"
  | "login-history";

interface AdminSidebarProps {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  onSignOut: () => void;
  displayName: string;
}

const menuItems: {
  id: AdminSection;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
}[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Overview and statistics",
    icon: LayoutDashboard,
  },
  {
    id: "staff",
    label: "Manage Staff",
    description: "Staff accounts and roles",
    icon: Users,
  },
  /*{
    id: "students",
    label: "Manage Students",
    description: "Student accounts",
    icon: GraduationCap,
  },*/
  {
    id: "login-history",
    label: "Login History",
    description: "Successful sign-ins",
    icon: History,
  },
];

export default function AdminSidebar({
  activeSection,
  onSectionChange,
  onSignOut,
  displayName,
}: AdminSidebarProps) {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <div className="admin-sidebar-logo">DMU</div>

        <div>
          <h2>DMU Bure</h2>
          <p>Election System</p>
        </div>
      </div>

      <div className="admin-sidebar-profile">
        <div className="admin-profile-icon">
          <ShieldCheck size={23} />
        </div>

        <div className="admin-profile-details">
          <strong>{displayName || "Administrator"}</strong>
          <span>System Administrator</span>
        </div>
      </div>

      <div className="admin-sidebar-menu-title">
        MAIN MENU
      </div>

      <nav className="admin-sidebar-navigation">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={`admin-sidebar-link ${
                isActive ? "active" : ""
              }`}
              onClick={() => onSectionChange(item.id)}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="admin-sidebar-link-icon">
                <Icon size={20} />
              </span>

              <span className="admin-sidebar-link-text">
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>

              {isActive && (
                <ChevronRight
                  size={18}
                  className="admin-sidebar-chevron"
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="admin-sidebar-bottom">
        <div className="admin-sidebar-university">
          Debre Markos University
          <span>Bure Campus</span>
        </div>

        <button
          type="button"
          className="admin-sidebar-signout"
          onClick={onSignOut}
        >
          <LogOut size={19} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
