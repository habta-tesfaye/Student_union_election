import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { submitNomination } from "../../nominations/services/nomination.api";
import { useAuthContext } from "../../../context/AuthContext";
import StudentMenu, { type StudentSection } from "./StudentMenu";
import { ApiError, api } from "../../../services/api";

import "./StudentDashboardPage.css";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface Application {
  studentId: string;
  motivationText: string;
  examScore10?: number;
  examStatus: "pending" | "passed" | "failed";
  ssdStatus: "pending" | "approved" | "rejected";
  selectionStatus: "pending" | "selected_16" | "disqualified";
  appliedAt: string;
}

interface CandidateStudent {
  studentId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  department?: string;
  yearSection?: string;
  gpa?: number;
}

interface Candidate {
  studentId: string;
  photo: string;
  totalVotes: number;
  student?: CandidateStudent | null;
}

interface Classmate {
  studentId: string;
  name?: string | null;
  department?: string;
  yearSection?: string;
}

interface ClassElectionResult {
  studentId: string;
  photo: string;
  totalVotes: number;
  manualWinner: boolean;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  department: string;
  yearSection: string;
  gpa: number;
}

interface ClassResults {
  department: string;
  yearSection: string | null;
  totalCandidates: number;
  totalVotes: number;
  maleWinner: ClassElectionResult | null;
  femaleWinner: ClassElectionResult | null;
  maleDeadlock: boolean;
  femaleDeadlock: boolean;
  tieDetected: boolean;
  candidates: ClassElectionResult[];
}

interface StudentNotification {
  _id?: string;
  id?: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt?: string;
}

interface DashboardData {
  application: Application | null;
  candidates: Candidate[];
  notifications: StudentNotification[];
  classmates: Classmate[];
  classResults: ClassResults | null;
}

interface ChatMessage {
  _id?: string;
  id?: string;
  senderId?: string;
  senderType?: string;
  receiverId?: string;
  receiverType?: string;
  message: string;
  createdAt?: string;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "An unexpected error occurred.";
}

function getFullName(student?: CandidateStudent | null): string {
  if (!student) return "Candidate";

  return [student.firstName, student.middleName, student.lastName]
    .filter(Boolean)
    .join(" ");
}

function getClassmateName(classmate: Classmate): string {
  return classmate.name?.trim() || classmate.studentId || "Student";
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getResultName(candidate: ClassElectionResult): string {
  return (
    [candidate.firstName, candidate.middleName, candidate.lastName]
      .filter(Boolean)
      .join(" ") || candidate.studentId
  );
}

function formatDate(value?: string): string {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString();
}

function formatChatTime(value?: string): string {
  if (!value) return "";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
}

function StudentDashboardPage() {
  const { user, signOut } = useAuthContext();

  const [activeSection, setActiveSection] =
    useState<StudentSection>("dashboard");

  const [data, setData] = useState<DashboardData>({
    application: null,
    candidates: [],
    notifications: [],
    classmates: [],
    classResults: null,
  });

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [applicationError, setApplicationError] = useState("");
  const [motivationText, setMotivationText] = useState("");
  const [submittingApplication, setSubmittingApplication] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState("");

  const [votingCandidateId, setVotingCandidateId] = useState("");
  const [voteMessage, setVoteMessage] = useState("");
  const [voteError, setVoteError] = useState("");

  const [nomineeStudentId, setNomineeStudentId] = useState("");
  const [submittingNomination, setSubmittingNomination] = useState(false);
  const [nominationMessage, setNominationMessage] = useState("");
  const [nominationError, setNominationError] = useState("");

  // Floating chat assistant state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatWelcome, setChatWelcome] = useState(
    "Hello! I am your DMU Burie Election Assistant."
  );
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setPageError("");
    setApplicationError("");

    const [
      applicationResult,
      candidatesResult,
      notificationsResult,
      classmatesResult,
      classResultsResult,
    ] = await Promise.allSettled([
      api.get<ApiResponse<{ application: Application }>>("/applications/me"),
      api.get<ApiResponse<{ candidates: Candidate[] }>>("/candidates"),
      api.get<ApiResponse<{ notifications: StudentNotification[] }>>(
        "/notifications?page=1&limit=10"
      ),
      api.get<ApiResponse<{ students: Classmate[] }>>("/students/my-class"),
      api.get<ApiResponse<ClassResults>>("/results/class"),
    ]);

    let application: Application | null = null;
    let candidates: Candidate[] = [];
    let notifications: StudentNotification[] = [];
    let classmates: Classmate[] = [];
    let classResults: ClassResults | null = null;

    const errors: string[] = [];

    if (applicationResult.status === "fulfilled") {
      application = applicationResult.value.data.application;
    } else {
      const error = applicationResult.reason;

      if (error instanceof ApiError && error.status === 404) {
        application = null;
      } else {
        setApplicationError(getErrorMessage(error));
      }
    }

    if (candidatesResult.status === "fulfilled") {
      candidates = candidatesResult.value.data.candidates ?? [];
    } else {
      errors.push(
        `Could not load candidates: ${getErrorMessage(
          candidatesResult.reason
        )}`
      );
    }

    if (notificationsResult.status === "fulfilled") {
      notifications = notificationsResult.value.data.notifications ?? [];
    } else {
      errors.push(
        `Could not load notifications: ${getErrorMessage(
          notificationsResult.reason
        )}`
      );
    }

    if (classmatesResult.status === "fulfilled") {
      classmates = classmatesResult.value.data.students ?? [];
    } else {
      errors.push(
        `Could not load your class list: ${getErrorMessage(
          classmatesResult.reason
        )}`
      );
    }

    if (classResultsResult.status === "fulfilled") {
      classResults = classResultsResult.value.data;
    } else {
      errors.push(
        `Could not load class election results: ${getErrorMessage(
          classResultsResult.reason
        )}`
      );
    }

    setData({
      application,
      candidates,
      notifications,
      classmates,
      classResults,
    });

    if (errors.length > 0) {
      setPageError(errors.join(" "));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  // Load the existing bot welcome message and conversation history.
  const loadChat = useCallback(async () => {
    setChatLoading(true);
    setChatError("");

    const [welcomeResult, historyResult] = await Promise.allSettled([
      api.get<
        ApiResponse<{
          botId: string;
          welcomeMessage: string;
        }>
      >("/chat/ai/welcome"),

      api.get<
        ApiResponse<{
          messages: ChatMessage[];
        }>
      >("/chat/conversation/AI_BOT?participantType=bot"),
    ]);

    if (welcomeResult.status === "fulfilled") {
      setChatWelcome(
        welcomeResult.value.data.welcomeMessage ||
          "Hello! I am your DMU Burie Election Assistant."
      );
    } else {
      setChatError(getErrorMessage(welcomeResult.reason));
    }

    if (historyResult.status === "fulfilled") {
      setChatMessages(historyResult.value.data.messages ?? []);
    } else {
      setChatError((current) =>
        current
          ? `${current} Could not load chat history.`
          : `Could not load chat history: ${getErrorMessage(
              historyResult.reason
            )}`
      );
    }

    setChatLoading(false);
  }, []);

  function openChat() {
    setChatOpen(true);
    void loadChat();
  }

  async function handleChatSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = chatInput.trim();

    if (!message || chatSending) return;

    setChatSending(true);
    setChatError("");

    try {
      await api.post<
        ApiResponse<{
          message: ChatMessage | string;
          aiReply?: ChatMessage | string;
        }>
      >("/chat/messages", {
        receiverId: "AI_BOT",
        receiverType: "bot",
        message,
      });

      setChatInput("");

      // Reload the conversation so both the sent message and bot reply
      // are displayed using the backend's saved conversation history.
      await loadChat();
    } catch (error) {
      setChatError(getErrorMessage(error));
    } finally {
      setChatSending(false);
    }
  }

  async function handleApplicationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setApplicationError("");
    setApplicationMessage("");

    const statement = motivationText.trim();

    if (!statement) {
      setApplicationError("Please enter your motivation statement.");
      return;
    }

    setSubmittingApplication(true);

    try {
      const response = await api.post<
        ApiResponse<{ application: Application }>
      >("/applications", {
        motivationText: statement,
      });

      setData((current) => ({
        ...current,
        application: response.data.application,
      }));

      setMotivationText("");
      setApplicationMessage(response.message);
    } catch (error) {
      setApplicationError(getErrorMessage(error));
    } finally {
      setSubmittingApplication(false);
    }
  }

  async function handleNominationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNominationError("");
    setNominationMessage("");

    const nomineeId = nomineeStudentId.trim();

    if (!nomineeId) {
      setNominationError(
        "Enter the student ID of the person you want to nominate."
      );
      return;
    }

    setSubmittingNomination(true);

    try {
      const nomination = await submitNomination(nomineeId);

      setNominationMessage(
        `Nomination submitted successfully. Current status: ${nomination.status}.`
      );

      setNomineeStudentId("");
    } catch (error) {
      setNominationError(getErrorMessage(error));
    } finally {
      setSubmittingNomination(false);
    }
  }

  async function handleVote(candidateStudentId: string) {
    const confirmed = window.confirm(
      "Submit your vote for this candidate? The backend allows only one vote per student."
    );

    if (!confirmed) return;

    setVotingCandidateId(candidateStudentId);
    setVoteMessage("");
    setVoteError("");

    try {
      const response = await api.post<
        ApiResponse<{ candidate_id: string; voted_at: string }>
      >("/voting", {
        candidate_id: candidateStudentId,
      });

      setVoteMessage(response.message);
    } catch (error) {
      setVoteError(getErrorMessage(error));
    } finally {
      setVotingCandidateId("");
    }
  }

  const displayName = [
    user?.firstName,
    user?.middleName,
    user?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="student-workspace">
      <StudentMenu
        activeSection={activeSection}
        onSelect={setActiveSection}
      />

      <div className="student-dashboard">
        <header className="student-dashboard-header">
          <div>
            <p className="student-dashboard-eyebrow">
              Debre Markos University · Bure Campus
            </p>

            <h1>Student / Voter Dashboard</h1>

            <p className="student-dashboard-subtitle">
              Welcome{displayName ? `, ${displayName}` : ""}. Choose a function
              from the student menu.
            </p>
          </div>

          <button
            className="student-signout-button"
            type="button"
            onClick={signOut}
          >
            Sign out
          </button>
        </header>

        {pageError && (
          <div className="student-alert student-alert-error" role="alert">
            {pageError}
          </div>
        )}

        <section className="student-work-area">
          {loading ? (
            <section className="student-panel">
              <p>Loading your student dashboard…</p>
            </section>
          ) : (
            <>
              {activeSection === "dashboard" && (
                <section className="student-panel student-home-panel">
                  <p className="student-panel-kicker">Student portal</p>
                  <h2>Welcome to your dashboard</h2>

                  <p className="student-muted">
                    Select a function from the menu to manage your election
                    application, nomination, class information, voting, and
                    notifications.
                  </p>

                  <div className="student-home-cards">
                    <button
                      type="button"
                      onClick={() => setActiveSection("application")}
                    >
                      <span>My Application</span>
                      <small>View your application or submit one.</small>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveSection("nomination")}
                    >
                      <span>Nomination</span>
                      <small>Nominate a student using their student ID.</small>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveSection("classmates")}
                    >
                      <span>Classmates</span>
                      <small>View students in your class section.</small>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveSection("candidates")}
                    >
                      <span>Candidates</span>
                      <small>View official candidates.</small>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveSection("voting")}
                    >
                      <span>Voting</span>
                      <small>Vote for an eligible candidate.</small>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveSection("results")}
                    >
                      <span>Election Results</span>
                      <small>View class election results.</small>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveSection("notifications")}
                    >
                      <span>Notifications</span>
                      <small>Read your recent election updates.</small>
                    </button>
                  </div>
                </section>
              )}

              {activeSection === "application" && (
                <section className="student-panel student-application-panel">
                  <div className="student-panel-heading">
                    <div>
                      <p className="student-panel-kicker">
                        Election application
                      </p>
                      <h2>Your application</h2>
                    </div>
                  </div>

                  {data.application ? (
                    <div className="student-application-details">
                      <p>
                        <strong>Application status:</strong>{" "}
                        {data.application.examStatus}
                      </p>

                      <p>
                        <strong>SSD review:</strong>{" "}
                        {data.application.ssdStatus}
                      </p>

                      <p>
                        <strong>Selection status:</strong>{" "}
                        {data.application.selectionStatus}
                      </p>

                      {typeof data.application.examScore10 === "number" && (
                        <p>
                          <strong>Phase 1 score:</strong>{" "}
                          {data.application.examScore10} / 10
                        </p>
                      )}

                      <p>
                        <strong>Submitted:</strong>{" "}
                        {formatDate(data.application.appliedAt)}
                      </p>

                      <div className="student-motivation">
                        <strong>Motivation statement</strong>
                        <p>{data.application.motivationText}</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="student-muted">
                        You have not submitted an election application yet.
                      </p>

                      <form
                        className="student-application-form"
                        onSubmit={handleApplicationSubmit}
                      >
                        <label htmlFor="student-motivation">
                          Motivation statement
                        </label>

                        <textarea
                          id="student-motivation"
                          value={motivationText}
                          onChange={(event) =>
                            setMotivationText(event.target.value)
                          }
                          maxLength={5000}
                          rows={6}
                          placeholder="Explain why you want to apply…"
                          required
                        />

                        <p className="student-field-help">
                          Maximum 5,000 characters. The backend checks
                          eligibility and prevents duplicate applications.
                        </p>

                        {applicationError && (
                          <p className="student-inline-error" role="alert">
                            {applicationError}
                          </p>
                        )}

                        {applicationMessage && (
                          <p className="student-inline-success" role="status">
                            {applicationMessage}
                          </p>
                        )}

                        <button
                          className="student-primary-button"
                          type="submit"
                          disabled={submittingApplication}
                        >
                          {submittingApplication
                            ? "Submitting…"
                            : "Submit application"}
                        </button>
                      </form>
                    </>
                  )}
                </section>
              )}

              {activeSection === "nomination" && (
                <section className="student-panel">
                  <p className="student-panel-kicker">Student nomination</p>
                  <h2>Nominate a student</h2>

                  <p className="student-muted">
                    Enter the student ID of the person you want to nominate.
                    The backend checks eligibility and whether nominations are
                    currently allowed.
                  </p>

                  <form
                    className="student-application-form"
                    onSubmit={handleNominationSubmit}
                  >
                    <label htmlFor="nominee-student-id">
                      Nominee student ID
                    </label>

                    <input
                      id="nominee-student-id"
                      className="student-text-input"
                      type="text"
                      value={nomineeStudentId}
                      onChange={(event) =>
                        setNomineeStudentId(event.target.value)
                      }
                      placeholder="Enter student ID"
                      required
                    />

                    {nominationError && (
                      <p className="student-inline-error" role="alert">
                        {nominationError}
                      </p>
                    )}

                    {nominationMessage && (
                      <p className="student-inline-success" role="status">
                        {nominationMessage}
                      </p>
                    )}

                    <button
                      className="student-primary-button"
                      type="submit"
                      disabled={submittingNomination}
                    >
                      {submittingNomination
                        ? "Submitting…"
                        : "Submit nomination"}
                    </button>
                  </form>
                </section>
              )}

              {activeSection === "classmates" && (
                <section className="student-panel">
                  <div className="student-panel-heading">
                    <div>
                      <p className="student-panel-kicker">My class</p>
                      <h2>Classmates</h2>
                    </div>

                    <button
                      className="student-refresh-button"
                      type="button"
                      onClick={() => void loadDashboard()}
                    >
                      Refresh
                    </button>
                  </div>

                  <p className="student-muted">
                    Students in your department and year section, excluding
                    your own student account.
                  </p>

                  {data.classmates.length === 0 ? (
                    <p className="student-empty-state">
                      No classmates were returned for your department and
                      year section.
                    </p>
                  ) : (
                    <div className="student-candidate-list">
                      {data.classmates.map((classmate) => {
                        const name = getClassmateName(classmate);

                        return (
                          <article
                            className="student-candidate-card"
                            key={classmate.studentId}
                          >
                            <div className="student-candidate-avatar">
                              {getInitials(name)}
                            </div>

                            <div className="student-candidate-info">
                              <h3>{name}</h3>
                              <p>{classmate.studentId}</p>
                              <p>
                                {classmate.department ||
                                  "Department not listed"}
                                {" · "}
                                {classmate.yearSection ||
                                  "Section not listed"}
                              </p>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}

              {(activeSection === "candidates" ||
                activeSection === "voting") && (
                <section className="student-panel">
                  <div className="student-panel-heading">
                    <div>
                      <p className="student-panel-kicker">Election</p>
                      <h2>
                        {activeSection === "voting"
                          ? "Cast your vote"
                          : "Official candidates"}
                      </h2>
                    </div>

                    <button
                      className="student-refresh-button"
                      type="button"
                      onClick={() => void loadDashboard()}
                    >
                      Refresh
                    </button>
                  </div>

                  <p className="student-muted">
                    Candidates are limited by the backend to your department
                    and year section.
                  </p>

                  {voteMessage && (
                    <div
                      className="student-alert student-alert-success"
                      role="status"
                    >
                      {voteMessage}
                    </div>
                  )}

                  {voteError && (
                    <div
                      className="student-alert student-alert-error"
                      role="alert"
                    >
                      {voteError}
                    </div>
                  )}

                  {data.candidates.length === 0 ? (
                    <p className="student-empty-state">
                      No official candidates were returned for your section.
                    </p>
                  ) : (
                    <div className="student-candidate-list">
                      {data.candidates.map((candidate) => (
                        <article
                          className="student-candidate-card"
                          key={candidate.studentId}
                        >
                          <div className="student-candidate-avatar">
                            {getInitials(getFullName(candidate.student))}
                          </div>

                          <div className="student-candidate-info">
                            <h3>{getFullName(candidate.student)}</h3>
                            <p>{candidate.studentId}</p>
                            <p>
                              {candidate.student?.department ??
                                "Department not listed"}
                              {" · "}
                              {candidate.student?.yearSection ??
                                "Section not listed"}
                            </p>
                          </div>

                          <button
                            className="student-primary-button"
                            type="button"
                            disabled={Boolean(votingCandidateId)}
                            onClick={() => void handleVote(candidate.studentId)}
                          >
                            {votingCandidateId === candidate.studentId
                              ? "Submitting…"
                              : "Vote"}
                          </button>
                        </article>
                      ))}
                    </div>
                  )}

                  <p className="student-field-help">
                    Voting is available only during the active class-voting
                    period. The backend verifies eligibility and prevents a
                    second vote.
                  </p>
                </section>
              )}

              {activeSection === "results" && (
                <section className="student-panel">
                  <div className="student-panel-heading">
                    <div>
                      <p className="student-panel-kicker">
                        Election results
                      </p>
                      <h2>Class election results</h2>
                    </div>

                    <button
                      className="student-refresh-button"
                      type="button"
                      onClick={() => void loadDashboard()}
                    >
                      Refresh
                    </button>
                  </div>

                  {!data.classResults ? (
                    <p className="student-empty-state">
                      Class election results are not available right now.
                    </p>
                  ) : (
                    <>
                      <p className="student-muted">
                        {data.classResults.department}
                        {data.classResults.yearSection
                          ? ` · ${data.classResults.yearSection}`
                          : ""}
                      </p>

                      <div className="student-application-details">
                        <p>
                          <strong>Total candidates:</strong>{" "}
                          {data.classResults.totalCandidates}
                        </p>

                        <p>
                          <strong>Total votes:</strong>{" "}
                          {data.classResults.totalVotes}
                        </p>
                      </div>

                      {data.classResults.tieDetected && (
                        <p className="student-inline-error" role="status">
                          A tie was detected. The result requires review.
                        </p>
                      )}

                      <h3>Male winner</h3>

                      {data.classResults.maleWinner ? (
                        <p>
                          {getResultName(data.classResults.maleWinner)} —{" "}
                          {data.classResults.maleWinner.totalVotes} votes
                        </p>
                      ) : (
                        <p className="student-muted">
                          No male winner declared.
                        </p>
                      )}

                      <h3>Female winner</h3>

                      {data.classResults.femaleWinner ? (
                        <p>
                          {getResultName(data.classResults.femaleWinner)} —{" "}
                          {data.classResults.femaleWinner.totalVotes} votes
                        </p>
                      ) : (
                        <p className="student-muted">
                          No female winner declared.
                        </p>
                      )}

                      <h3>Candidate ranking</h3>

                      {data.classResults.candidates.length === 0 ? (
                        <p className="student-empty-state">
                          No class-election candidates are listed.
                        </p>
                      ) : (
                        <div className="student-candidate-list">
                          {data.classResults.candidates.map(
                            (candidate, index) => (
                              <article
                                className="student-candidate-card"
                                key={candidate.studentId}
                              >
                                <div className="student-candidate-avatar">
                                  {index + 1}
                                </div>

                                <div className="student-candidate-info">
                                  <h3>{getResultName(candidate)}</h3>
                                  <p>{candidate.studentId}</p>
                                  <p>{candidate.totalVotes} votes</p>
                                </div>
                              </article>
                            )
                          )}
                        </div>
                      )}
                    </>
                  )}
                </section>
              )}

              {activeSection === "notifications" && (
                <section className="student-panel student-notifications-panel">
                  <div className="student-panel-heading">
                    <div>
                      <p className="student-panel-kicker">Updates</p>
                      <h2>Recent notifications</h2>
                    </div>

                    <button
                      className="student-refresh-button"
                      type="button"
                      onClick={() => void loadDashboard()}
                    >
                      Refresh
                    </button>
                  </div>

                  {data.notifications.length === 0 ? (
                    <p className="student-empty-state">
                      You have no notifications to display.
                    </p>
                  ) : (
                    <ul className="student-notification-list">
                      {data.notifications.map((notification) => (
                        <li
                          key={
                            notification._id ??
                            notification.id ??
                            `${notification.title}-${notification.createdAt}`
                          }
                          className={
                            notification.isRead
                              ? "student-notification"
                              : "student-notification student-notification-unread"
                          }
                        >
                          <div className="student-notification-title">
                            <strong>{notification.title}</strong>

                            {!notification.isRead && (
                              <span className="student-unread-label">
                                Unread
                              </span>
                            )}
                          </div>

                          <p>{notification.message}</p>

                          <span className="student-notification-date">
                            {formatDate(notification.createdAt)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {activeSection === "feedback" && (
                <section className="student-panel">
                  <p className="student-panel-kicker">Student services</p>
                  <h2>Feedback</h2>
                  <p className="student-muted">
                    The feedback interface has not been connected in this
                    dashboard yet.
                  </p>
                </section>
              )}
            </>
          )}
        </section>
      </div>

      {/* Floating Chat Assistant button */}
      <button
        type="button"
        className="student-chat-float-button"
        onClick={() => {
          if (chatOpen) {
            setChatOpen(false);
          } else {
            openChat();
          }
        }}
        aria-label={chatOpen ? "Close Chat Assistant" : "Open Chat Assistant"}
        title="Chat with DMU Election Assistant"
      >
        {chatOpen ? "×" : "✉"}
      </button>

      {/* Floating Chat Assistant window */}
      {chatOpen && (
        <section
          className="student-chat-window"
          aria-label="DMU Burie Election Assistant"
        >
          <header className="student-chat-header">
            <div>
              <strong>DMU Election Assistant</strong>
              <small>Bure Campus · Online assistant</small>
            </div>

            <button
              type="button"
              className="student-chat-close"
              onClick={() => setChatOpen(false)}
              aria-label="Close chat"
            >
              ×
            </button>
          </header>

          <div className="student-chat-messages">
            <div className="student-chat-bubble student-chat-bot">
              {chatWelcome}
            </div>

            {chatLoading && (
              <p className="student-chat-loading">Loading conversation…</p>
            )}

            {!chatLoading &&
              chatMessages.map((chatMessage, index) => {
                const isBot =
                  chatMessage.senderType === "bot" ||
                  chatMessage.senderId === "AI_BOT";

                return (
                  <div
                    key={
                      chatMessage._id ??
                      chatMessage.id ??
                      `${chatMessage.createdAt}-${index}`
                    }
                    className={
                      isBot
                        ? "student-chat-bubble student-chat-bot"
                        : "student-chat-bubble student-chat-user"
                    }
                  >
                    <p>{chatMessage.message}</p>

                    {chatMessage.createdAt && (
                      <small>
                        {formatChatTime(chatMessage.createdAt)}
                      </small>
                    )}
                  </div>
                );
              })}

            {chatError && (
              <p className="student-chat-error" role="alert">
                {chatError}
              </p>
            )}
          </div>

          <form
            className="student-chat-form"
            onSubmit={handleChatSubmit}
          >
            <input
              type="text"
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Type your message..."
              aria-label="Your message"
              disabled={chatSending}
            />

            <button
              type="submit"
              disabled={chatSending || !chatInput.trim()}
            >
              {chatSending ? "..." : "Send"}
            </button>
          </form>
        </section>
      )}
    </main>
  );
}

export default StudentDashboardPage;