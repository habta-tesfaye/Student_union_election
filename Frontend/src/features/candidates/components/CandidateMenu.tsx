
import {
  LayoutDashboard,
  User,
  Award,
  Megaphone,
  CalendarDays,
  BarChart3,
  Bell,
  MessageSquare,
  MessageCircle,
  CircleHelp,
  Settings,
  FileText,
  ClipboardCheck,
  ClipboardList,
  Vote,
  LogOut,
} from "lucide-react";

import "./CandidateMenu.css";

export type CandidateSection =
  | "dashboard"
  | "profile"
  | "application"
  | "stage1-status"
  | "stage2-status"
  | "parliament-voting"
  | "campaign"
  | "schedule"
  | "statistics"
  | "notices"
  | "notifications"
  | "feedback"
  | "candidacy"
  | "help"
  | "account";

interface CandidateMenuProps {
  activeSection: CandidateSection;
  onSectionChange: (section: CandidateSection) => void;
  onSignOut: () => void;
}

const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Overview and quick statistics",
    icon: LayoutDashboard,
  },
  {
    id: "profile",
    label: "My Profile",
    description: "View candidate and student information",
    icon: User,
  },
  {
    id: "stage2-status",
    label: "Phase 2 Status",
    description: "View your evaluation scores",
    icon: ClipboardList,
  },
  {
    id: "application",
    label: "Phase 1 Application",
    description: "Submit your leadership vision",
    icon: FileText,
  },
  {
    id: "candidacy",
    label: "My Candidacy",
    description: "View official candidacy information",
    icon: Award,
  },
  {
    id: "stage1-status",
    label: "Phase 1 Status",
    description: "View your examination and selection status",
    icon: ClipboardCheck,
  },
  {
    id: "parliament-voting",
    label: "Parliament Scoring",
    description: "Evaluate the eight Parliament candidates",
    icon: Vote,
  },
  {
    id: "campaign",
    label: "My Campaign",
    description: "Campaign information and activities",
    icon: Megaphone,
  },
  {
    id: "schedule",
    label: "Election Schedule",
    description: "View election dates and stages",
    icon: CalendarDays,
  },
  {
    id: "statistics",
    label: "Vote Statistics",
    description: "View votes and published results",
    icon: BarChart3,
  },
  {
    id: "notices",
    label: "Election Notices",
    description: "Read election announcements",
    icon: Bell,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "View system alerts and messages",
    icon: MessageSquare,
  },
  {
    id: "feedback",
    label: "Feedback",
    description: "Submit feedback and check its status",
    icon: MessageCircle,
  },
  {
    id: "help",
    label: "Help & Chat",
    description: "Contact the DMU Burie Election Assistant",
    icon: CircleHelp,
  },
  {
    id: "account",
    label: "My Account",
    description: "Account information and settings",
    icon: Settings,
  },
] as const;

export default function CandidateMenu({
  activeSection,
  onSectionChange,
  onSignOut,
}: CandidateMenuProps) {
  return (
    <aside className="candidate-sidebar">
      {/* University branding */}
      <div className="candidate-sidebar-brand">
        <h2>DMU BURE CAMPUS</h2>

        <p>Student Union Election System</p>

        <span className="candidate-portal-name">
          Candidate Portal
        </span>
      </div>

      {/* Candidate navigation */}
      <nav
        className="candidate-navigation"
        aria-label="Candidate dashboard navigation"
      >
        <p className="candidate-menu-heading">
          CANDIDATE MENU
        </p>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              type="button"
              title={item.description}
              onClick={() =>
                onSectionChange(item.id as CandidateSection)
              }
              aria-current={isActive ? "page" : undefined}
              className={`candidate-menu-item ${
                isActive ? "active" : ""
              }`}
            >
              <Icon className="candidate-menu-icon" />

              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="candidate-sidebar-footer">
        <button
          type="button"
          onClick={onSignOut}
          className="candidate-signout-button"
        >
          <LogOut className="candidate-menu-icon" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
