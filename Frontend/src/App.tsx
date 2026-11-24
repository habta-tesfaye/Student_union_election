import "./App.css";

import { useAuthContext } from "./context/AuthContext";

// Dashboard pages
import StudentDashboardPage from "./features/student/pages/StudentDashboardPage";
import CandidateDashboardPage from "./features/candidates/pages/CandidateDashboardPage";
import AdminDashboardPage from "./features/admin/pages/AdminDashboardPage";
import RegistrarDashboardPage from "./features/registrar/pages/RegistrarDashboardPage";
import DirectorDashboardPage from "./features/director/pages/DirectorDashboardPage";
import HeadDashboardPage from "./features/head/pages/HeadDashboardPage";

// Authentication pages
import ForgotPasswordPage from "./features/auth/pages/ForgotPasswordPage";
import LoginPage from "./features/auth/pages/LoginPage";

function App() {
  const { user, isAuthenticated, signOut } = useAuthContext();

  const currentPath = window.location.pathname;

  // Authenticated user dashboards
  if (isAuthenticated && user) {
    switch (user.role) {
      case "admin":
        return <AdminDashboardPage />;

      case "student":
        return <StudentDashboardPage />;

      case "candidate":
        return <CandidateDashboardPage />;

      case "registrar":
        return <RegistrarDashboardPage />;

      case "director":
        return <DirectorDashboardPage />;

      case "head":
        return <HeadDashboardPage />;

      default: {
        const displayName = [
          user.firstName,
          user.middleName,
          user.lastName,
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <main className="app">
            <header className="app-header">
              <div className="app-brand">
                <div className="app-logo">DMU</div>

                <div className="app-brand-text">
                  <h1>Debre Markos University</h1>
                  <p>Bure Campus</p>
                </div>
              </div>

              <span className="app-system-label">
                Student Union Election System
              </span>
            </header>

            <section className="welcome-section">
              <div className="welcome-content">
                <span className="welcome-badge">{user.role}</span>

                <h2>Welcome, {displayName || "User"}</h2>

                <p className="welcome-description">
                  You have signed in successfully. Your dashboard
                  will be available according to your assigned role.
                </p>

                <button
                  className="welcome-login-link"
                  type="button"
                  onClick={() => void signOut()}
                >
                  Sign out
                </button>
              </div>
            </section>

            <footer className="app-footer">
              <p>
                © {new Date().getFullYear()} Debre Markos University,
                Bure Campus. Student Union Election System.
              </p>
            </footer>
          </main>
        );
      }
    }
  }

  // Public authentication pages
  if (currentPath === "/login") {
    return <LoginPage />;
  }

  if (currentPath === "/forgot-password") {
    return <ForgotPasswordPage />;
  }

  // Public welcome page
  return (
    <main className="app">
      <header className="app-header">
        <div className="app-brand">
          <div className="app-logo">DMU</div>

          <div className="app-brand-text">
            <h1>Debre Markos University</h1>
            <p>Bure Campus</p>
          </div>
        </div>

        <span className="app-system-label">
          Student Union Election System
        </span>
      </header>

      <section className="welcome-section">
        <div className="welcome-content">
          <span className="welcome-badge">Bure Campus</span>

          <h2>
            Student Union
            <br />
            Election System
          </h2>

          <p className="welcome-description">
            A centralized digital platform for managing student union
            elections, candidate nominations, voting, examinations,
            campaigns and election results.
          </p>

          <div className="welcome-status">
            <span className="status-indicator" />
            Frontend development started
          </div>

          <a className="welcome-login-link" href="/login">
            Sign in to the system
          </a>
        </div>

        <div className="welcome-information">
          <h3>Election Management Platform</h3>

          <p>
            The system supports the actors defined in the original
            system requirements:
          </p>

          <ul>
            <li>System Administrator</li>
            <li>Registrar</li>
            <li>Student / Voter</li>
            <li>SSD</li>
            <li>Candidate</li>
            <li>Department Head</li>
          </ul>
        </div>
      </section>

      <footer className="app-footer">
        <p>
          © {new Date().getFullYear()} Debre Markos University,
          Bure Campus. Student Union Election System.
        </p>
      </footer>
    </main>
  );
}

export default App;