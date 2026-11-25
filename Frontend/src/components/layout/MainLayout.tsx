
import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "./MainLayout.css";

interface MainLayoutProps {
  children: ReactNode;
  onLogout: () => void;
  activePage: string;
  onNavigate: (page: string) => void;
}

function MainLayout({
  children,
  onLogout,
  activePage,
  onNavigate,
}: MainLayoutProps) {
  const pageTitles: Record<string, string> = {
    dashboard: "Director Dashboard",
    schedules: "Election Schedules",
    students: "Students",
    applications: "Applications",
    candidates: "Candidates",
    phase1: "Phase 1 Score Management",
phase2: "Phase 2 Score Management",
    nominations: "Nominations",
    examinations: "Examinations",
    parliament: "Parliament",
    results: "Election Results",
    notifications: "Notifications",
    discipline: "Discipline",
    notices: "Notices",
    "winner-entry-16": "16 Winners Entry",
"winner-final-8": "Final 8 Winners",
"winner-final-result": "Final Result",
  };

  return (
    <div className="director-layout">
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <div className="director-layout-main">
        <Header
          title={pageTitles[activePage] || "Director Dashboard"}
          subtitle="Student Union Election Management"
        />

        <main className="director-layout-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
