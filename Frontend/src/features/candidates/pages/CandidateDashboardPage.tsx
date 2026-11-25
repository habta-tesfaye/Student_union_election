import { useEffect, useState } from "react";
import "./CandidateDashboardPage.css";

import { useAuthContext } from "../../../context/AuthContext";

import CandidateStage1Status from "../components/CandidateStage1Status";
import CandidateStage2Status from "../components/CandidateStage2Status";
import CandidateApplicationPanel from "../components/CandidateApplication";
import CandidateMenu from "../components/CandidateMenu";
import type { CandidateSection } from "../components/CandidateMenu";

import CandidateParliamentVoting from "../components/CandidateParliamentVoting";
import CandidateNotices from "../components/CandidateNotices";
import CandidateElectionSchedule from "../components/CandidateElectionSchedule";
import CandidateNotifications from "../components/CandidateNotifications";
import CandidateVoteStatistics from "../components/CandidateVoteStatistics";
import CandidateFeedback from "../components/CandidateFeedback";
import CandidateCampaign from "../components/CandidateCampaign";

import {
  getMyCandidate,
  getMyApplication,
} from "../services/candidate.api";

import type {
  Candidate,
  CandidateApplication,
} from "../types/candidate.types";

function CandidateDashboardPage() {
  const { user, signOut } = useAuthContext();

  // Candidate profile
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Candidate application
  const [application, setApplication] =
    useState<CandidateApplication | null>(null);

  const [applicationLoading, setApplicationLoading] = useState(true);
  const [applicationError, setApplicationError] = useState("");

  // Sidebar navigation
  const [activeSection, setActiveSection] =
    useState<CandidateSection>("dashboard");

  // Load candidate profile
  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const data = await getMyCandidate();

        if (active) {
          setCandidate(data);
          setError("");
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load candidate profile."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  // Load the logged-in candidate's own application
  useEffect(() => {
    let active = true;

    async function loadApplication() {
      try {
        const data = await getMyApplication();

        if (active) {
          setApplication(data);
          setApplicationError("");
        }
      } catch (err) {
        if (active) {
          setApplicationError(
            err instanceof Error
              ? err.message
              : "Unable to retrieve your application information."
          );
        }
      } finally {
        if (active) {
          setApplicationLoading(false);
        }
      }
    }

    void loadApplication();

    return () => {
      active = false;
    };
  }, []);

  // Student information attached to the candidate
  const student = candidate?.student;

  // Candidate's full name
  const name = [
    student?.firstName ?? user?.firstName,
    student?.middleName ?? user?.middleName,
    student?.lastName ?? user?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  // Sidebar section titles
  const sectionTitles: Record<CandidateSection, string> = {
    dashboard: "Candidate Dashboard",
    profile: "My Profile",
    candidacy: "My Candidacy",
    application: "Phase 1 Application",
    "stage1-status": "Phase 1 Application Status",
    campaign: "My Campaign",
    schedule: "Election Schedule",
    statistics: "Vote Statistics",
    notices: "Election Notices",
    notifications: "Notifications",
    feedback: "Feedback",
    help: "Help & Chat",
    "parliament-voting": "Parliament Voting",
    account: "My Account",
    "stage2-status": "Phase 2 Evaluation Status",
  };

  // Convert the existing application response into Phase 1 display data
  const phase1Data = application
    ? {
        motivationText: application.motivationText ?? "",
        examScore10:
          typeof application.examScore10 === "number"
            ? application.examScore10
            : null,
        ssdStatus: application.ssdStatus ?? "",
        selectionStatus: application.selectionStatus ?? "",
        submittedAt: application.appliedAt ?? "",
      }
    : null;

  // Main dashboard
  function renderDashboard() {
    return (
      <>
        <p style={styles.eyebrow}>CANDIDATE PORTAL</p>

        <h1>Welcome, {name || "Candidate"}</h1>

        <p style={styles.subtitle}>
          Welcome to your Student Union Election candidate portal.
        </p>

        <section style={styles.profile}>
          <div style={styles.avatar}>
            {name.charAt(0).toUpperCase() || "C"}
          </div>

          <div>
            <span style={styles.status}>Official Candidate</span>

            <h2>{name || "Candidate"}</h2>

            <p>{candidate?.studentId}</p>

            <p>
              {student?.department || "Department unavailable"}
              {student?.yearSection
                ? ` · ${student.yearSection}`
                : ""}
            </p>
          </div>
        </section>

        <section style={styles.cards}>
          <article style={styles.card}>
            <p>Total Votes</p>
            <h2>{candidate?.totalVotes ?? 0}</h2>
          </article>

          <article style={styles.card}>
            <p>GPA</p>
            <h2>
              {typeof student?.gpa === "number"
                ? student.gpa.toFixed(2)
                : "—"}
            </h2>
          </article>

          <article style={styles.card}>
            <p>Manual Winner</p>
            <h2>{candidate?.manualWinner ? "Yes" : "No"}</h2>
          </article>
        </section>

        <section style={styles.information}>
          <h2>Candidate Information</h2>

          <p>
            <strong>Student ID:</strong> {candidate?.studentId}
          </p>

          <p>
            <strong>Department:</strong>{" "}
            {student?.department || "Not available"}
          </p>

          <p>
            <strong>Year / Section:</strong>{" "}
            {student?.yearSection || "Not available"}
          </p>

          <p>
            <strong>Candidate since:</strong>{" "}
            {candidate?.createdAt
              ? new Date(candidate.createdAt).toLocaleDateString()
              : "Not available"}
          </p>
        </section>
      </>
    );
  }

  // Candidate profile
  function renderProfile() {
    return (
      <section style={styles.information}>
        <h2>My Profile</h2>

        <p>
          Review your registered student and candidate information.
        </p>

        <div style={styles.profileDetails}>
          <p>
            <strong>Full Name:</strong> {name || "Not available"}
          </p>

          <p>
            <strong>Student ID:</strong>{" "}
            {candidate?.studentId || "Not available"}
          </p>

          <p>
            <strong>Gender:</strong>{" "}
            {student?.gender || "Not provided"}
          </p>

          <p>
            <strong>Region:</strong>{" "}
            {student?.region || "Not provided"}
          </p>

          <p>
            <strong>Disability:</strong>{" "}
            {student?.disability || "Not provided"}
          </p>

          <p>
            <strong>Department:</strong>{" "}
            {student?.department || "Not available"}
          </p>

          <p>
            <strong>Year / Section:</strong>{" "}
            {student?.yearSection || "Not available"}
          </p>

          <p>
            <strong>GPA:</strong>{" "}
            {typeof student?.gpa === "number"
              ? student.gpa.toFixed(2)
              : "Not available"}
          </p>

          <p>
            <strong>Candidate Registration Date:</strong>{" "}
            {candidate?.createdAt
              ? new Date(candidate.createdAt).toLocaleDateString()
              : "Not available"}
          </p>
        </div>

        <p style={styles.notice}>
          This profile displays your registered information. To correct
          official student information, contact the Registrar.
        </p>
      </section>
    );
  }

  // Candidate application and candidacy information
  function renderCandidacy() {
    if (applicationLoading) {
      return (
        <section style={styles.information}>
          <h2>My Candidacy</h2>
          <p>Loading your application information...</p>
        </section>
      );
    }

    return (
      <>
        <section style={styles.information}>
          <h2>Official Candidate Registration</h2>

          <p>
            <strong>Student ID:</strong>{" "}
            {candidate?.studentId || "Not available"}
          </p>

          <p>
            <strong>Candidate Status:</strong> Official Candidate
          </p>

          <p>
            <strong>Registration Date:</strong>{" "}
            {candidate?.createdAt
              ? new Date(candidate.createdAt).toLocaleDateString()
              : "Not available"}
          </p>

          <p>
            <strong>Total Votes:</strong>{" "}
            {candidate?.totalVotes ?? 0}
          </p>
        </section>

        <section style={styles.information}>
          <h2>Application Information</h2>

          {applicationError ? (
            <p style={styles.notice}>
              Unable to retrieve your application information.
              <br />
              <strong>Details:</strong> {applicationError}
            </p>
          ) : application ? (
            <>
              <p>
                <strong>Application Date:</strong>{" "}
                {application.appliedAt
                  ? new Date(
                      application.appliedAt
                    ).toLocaleDateString()
                  : "Not available"}
              </p>

              <p>
                <strong>Motivation:</strong>{" "}
                {application.motivationText || "Not available"}
              </p>

              <p>
                <strong>Examination Score:</strong>{" "}
                {typeof application.examScore10 === "number"
                  ? `${application.examScore10}/10`
                  : "Not evaluated"}
              </p>

              <p>
                <strong>Examination Status:</strong>{" "}
                {application.examStatus || "Not available"}
              </p>

              <p>
                <strong>SSD Approval:</strong>{" "}
                {application.ssdStatus || "Not available"}
              </p>

              <p>
                <strong>Selection Status:</strong>{" "}
                {application.selectionStatus || "Not available"}
              </p>

              <p>
                <strong>Examination Remarks:</strong>{" "}
                {application.examRemarks || "No remarks available"}
              </p>
            </>
          ) : (
            <p>No application information was returned.</p>
          )}
        </section>
      </>
    );
  }

  // Placeholder for sections awaiting their existing functionality
  function renderPlaceholder(title: string, description: string) {
    return (
      <section style={styles.information}>
        <h2>{title}</h2>

        <p>{description}</p>

        <p style={styles.notice}>
          This section is ready for integration with its existing
          backend functionality. No sample election data is displayed.
        </p>
      </section>
    );
  }

  // Display the selected sidebar section
  function renderContent() {
    if (loading) {
      return <p>Loading your candidate information...</p>;
    }

    if (error) {
      return <p style={styles.error}>{error}</p>;
    }

    if (!candidate) {
      return (
        <p style={styles.error}>
          No candidate profile was returned for this account.
        </p>
      );
    }

    switch (activeSection) {
      case "dashboard":
        return renderDashboard();

      case "profile":
        return renderProfile();

      case "parliament-voting":
        return <CandidateParliamentVoting />;

      case "candidacy":
        return renderCandidacy();

      case "stage1-status":
        return (
          <CandidateStage1Status
            data={phase1Data}
            loading={applicationLoading}
            error={applicationError}
            onBack={() => setActiveSection("dashboard")}
          />
        );

      case "application":
        return <CandidateApplicationPanel />;

      case "campaign":
        return <CandidateCampaign />;

      case "stage2-status":
        return <CandidateStage2Status />;

      case "schedule":
        return <CandidateElectionSchedule />;

      case "statistics":
        return <CandidateVoteStatistics />;

      case "notices":
        return <CandidateNotices />;

      case "notifications":
        return <CandidateNotifications />;

      case "feedback":
        return <CandidateFeedback />;

      case "help":
        return renderPlaceholder(
          "Help & Chat",
          "Get assistance from the DMU Burie Election Assistant."
        );

      case "account":
        return (
          <section style={styles.information}>
            <h2>My Account</h2>

            <p>
              <strong>Name:</strong> {name || "Not available"}
            </p>

            <p>
              <strong>Student ID:</strong> {candidate.studentId}
            </p>

            <p>
              <strong>Role:</strong> Candidate
            </p>

            <button
              style={styles.logout}
              onClick={() => void signOut()}
            >
              Sign Out
            </button>
          </section>
        );

      default:
        return renderDashboard();
    }
  }

  return (
    <div style={styles.layout}>
      <CandidateMenu
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onSignOut={() => void signOut()}
      />

      <div style={styles.workspace}>
        <header style={styles.header}>
          <div>
            <h2 style={styles.headerTitle}>DMU Bure Campus</h2>

            <p style={styles.headerSubtitle}>
              Student Union Election System
            </p>
          </div>

          <span style={styles.portalLabel}>
            Candidate Portal
          </span>
        </header>

        <main style={styles.main}>
          <h2 style={styles.sectionTitle}>
            {sectionTitles[activeSection]}
          </h2>

          {renderContent()}
        </main>

        <footer style={styles.footer}>
          © {new Date().getFullYear()} Debre Markos University · Bure Campus
        </footer>
      </div>
    </div>
  );
}

const styles = {
  layout: {
    minHeight: "100vh",
    display: "flex",
    background: "#f3f6fb",
    color: "#17243b",
    fontFamily: "Arial, sans-serif",
  },

  workspace: {
    flex: 1,
    minWidth: 0,
  },

  header: {
    minHeight: "75px",
    padding: "15px 30px",
    background: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerTitle: {
    margin: 0,
    color: "#102b52",
    fontSize: "20px",
  },

  headerSubtitle: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: "13px",
  },

  portalLabel: {
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "9px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "bold",
  },

  main: {
    maxWidth: "1200px",
    margin: "30px auto",
    padding: "0 30px",
  },

  sectionTitle: {
    marginBottom: "25px",
    color: "#102b52",
    fontSize: "24px",
  },

  eyebrow: {
    color: "#2563eb",
    fontWeight: "bold",
    letterSpacing: "2px",
  },

  subtitle: {
    color: "#64748b",
  },

  profile: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    background: "white",
    padding: "28px",
    borderRadius: "12px",
    marginTop: "30px",
    boxShadow: "0 3px 15px rgba(0,0,0,0.05)",
  },

  avatar: {
    width: "75px",
    height: "75px",
    minWidth: "75px",
    borderRadius: "50%",
    background: "#dbeafe",
    color: "#1d4ed8",
    display: "grid",
    placeItems: "center",
    fontSize: "30px",
    fontWeight: "bold",
  },

  status: {
    color: "#15803d",
    fontWeight: "bold",
  },

  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginTop: "24px",
  },

  card: {
    background: "white",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 3px 15px rgba(0,0,0,0.05)",
  },

  information: {
    background: "white",
    padding: "28px",
    borderRadius: "12px",
    marginTop: "24px",
    lineHeight: 1.8,
    boxShadow: "0 3px 15px rgba(0,0,0,0.05)",
  },

  profileDetails: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    columnGap: "30px",
    rowGap: "5px",
  },

  notice: {
    background: "#eff6ff",
    color: "#1e40af",
    padding: "12px",
    borderRadius: "7px",
  },

  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "16px",
    borderRadius: "8px",
  },

  logout: {
    background: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "11px 20px",
    cursor: "pointer",
  },

  footer: {
    padding: "20px 30px",
    color: "#64748b",
    fontSize: "12px",
    textAlign: "center" as const,
  },
};

export default CandidateDashboardPage;