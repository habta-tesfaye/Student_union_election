
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
    nominations: "Nominations",
    examinations: "Examinations",
    parliament: "Parliament",
    results: "Election Results",
    notifications: "Notifications",
    discipline: "Discipline",
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
