
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";

import StudentHomeSection from "../components/StudentHomeSection";
import StudentApplicationSection from "../components/StudentApplicationSection";
import StudentNominationSection from "../components/StudentNominationSection";
import StudentNominationResponseSection from "../components/StudentNominationResponseSection";
import StudentClassmatesSection from "../components/StudentClassmatesSection";
import StudentCandidatesSection from "../components/StudentCandidatesSection";
import StudentResultsSection from "../components/StudentResultsSection";
import StudentNotificationsSection from "../components/StudentNotificationsSection";
import StudentNoticesSection from "../components/StudentNoticesSection";
import StudentFeedbackSection from "../components/StudentFeedbackSection";

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

  // Load student dashboard data
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

  // Load existing bot welcome message and conversation history
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

  // Send chat message
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

      // Reload conversation to display saved messages and bot reply
      await loadChat();
    } catch (error) {
      setChatError(getErrorMessage(error));
    } finally {
      setChatSending(false);
    }
  }

  // Submit student application
  async function handleApplicationSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
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

  // Submit nomination
  async function handleNominationSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
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

  // Vote for candidate
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
  onSelect={(section) => {
    setActiveSection(section);

    if (section === "chat") {
      openChat();
    }
  }}
/>

      <div className="student-dashboard">
        <header className="student-dashboard-header">
          <div>
            <p className="student-dashboard-eyebrow">
              Debre Markos University - Bure Campus
            </p>

            <h1>Student / Voter Dashboard</h1>

            <p className="student-dashboard-subtitle">
              Welcome{displayName ? `, ${displayName}` : ""}. Choose a
              function from the student menu.
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
              <p>Loading your student dashboard...</p>
            </section>
          ) : (
            <>
              {activeSection === "dashboard" && (
                <StudentHomeSection onSelect={setActiveSection} />
              )}

              {activeSection === "application" && (
                <StudentApplicationSection
                  application={data.application}
                  motivationText={motivationText}
                  onMotivationChange={setMotivationText}
                  onSubmit={handleApplicationSubmit}
                  applicationError={applicationError}
                  applicationMessage={applicationMessage}
                  submittingApplication={submittingApplication}
                  formatDate={formatDate}
                />
              )}

              {activeSection === "nomination" && (
                <StudentNominationSection
                  nomineeStudentId={nomineeStudentId}
                  onNomineeIdChange={setNomineeStudentId}
                  onSubmit={handleNominationSubmit}
                  nominationError={nominationError}
                  nominationMessage={nominationMessage}
                  submittingNomination={submittingNomination}
                />
              )}
              {activeSection === "nomination-response" && (
  <StudentNominationResponseSection />
)}

              {activeSection === "classmates" && (
                <StudentClassmatesSection
                  classmates={data.classmates}
                  getClassmateName={getClassmateName}
                  getInitials={getInitials}
                  onRefresh={() => void loadDashboard()}
                />
              )}

              {(activeSection === "candidates" ||
                activeSection === "voting") && (
                <StudentCandidatesSection
                  activeSection={activeSection}
                  candidates={data.candidates}
                  getFullName={getFullName}
                  getInitials={getInitials}
                  onRefresh={() => void loadDashboard()}
                  onVote={handleVote}
                  votingCandidateId={votingCandidateId}
                  voteMessage={voteMessage}
                  voteError={voteError}
                />
              )}

              {activeSection === "results" && (
                <StudentResultsSection
                  classResults={data.classResults}
                  onRefresh={() => void loadDashboard()}
                />
              )}

              {activeSection === "notifications" && (
                <StudentNotificationsSection
                  notifications={data.notifications}
                  onRefresh={() => void loadDashboard()}
                  formatDate={formatDate}
                />
              )}

{activeSection === "notices" && (
  <StudentNoticesSection />
)}
              {activeSection === "feedback" && (
                <StudentFeedbackSection />
              )}{activeSection === "chat" && (
  <section className="student-panel">
    <h2>Chat Assistant</h2>
    <p>
      The DMU Election Assistant is open. You can ask questions
      about the Student Union Election System.
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
        aria-label={
          chatOpen ? "Close Chat Assistant" : "Open Chat Assistant"
        }
        title="Chat with DMU Election Assistant"
      >
        {chatOpen ? "X" : "Chat"}
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
              <small>Bure Campus - Online assistant</small>
            </div>

            <button
              type="button"
              className="student-chat-close"
              onClick={() => setChatOpen(false)}
              aria-label="Close chat"
            >
              X
            </button>
          </header>

          <div className="student-chat-messages">
            <div className="student-chat-bubble student-chat-bot">
              {chatWelcome}
            </div>

            {chatLoading && (
              <p className="student-chat-loading">
                Loading conversation...
              </p>
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
