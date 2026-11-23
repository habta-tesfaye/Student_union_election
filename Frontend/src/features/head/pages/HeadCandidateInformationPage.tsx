
import { useState } from "react";
import "./HeadCandidateInformationPage.css";

import { getCandidateByStudentId } from "../../candidates/services/candidate.api";

import type { Candidate } from "../../candidates/types/candidate.types";

interface HeadCandidateInformationPageProps {
  onBack: () => void;
}

function HeadCandidateInformationPage({
  onBack,
}: HeadCandidateInformationPageProps) {
  const [studentId, setStudentId] = useState("");
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSearch() {
    if (!studentId.trim()) {
      setErrorMessage("Please enter a student ID.");
      setCandidate(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setCandidate(null);

    try {
      const result = await getCandidateByStudentId(studentId);
      setCandidate(result);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to retrieve candidate information."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const fullName = candidate?.student
    ? [
        candidate.student.firstName,
        candidate.student.middleName,
        candidate.student.lastName,
      ]
        .filter(Boolean)
        .join(" ")
    : "Student information unavailable";

  return (
    <main className="head-candidate-page">
      <header className="head-candidate-header">
        <div>
          <span>DEPARTMENT HEAD PORTAL</span>
          <h1>Candidate Information</h1>
          <p>View official candidates in your department.</p>
        </div>

        <button type="button" onClick={onBack}>
          Back to Dashboard
        </button>
      </header>

      <section className="head-candidate-search">
        <h2>Find an Official Candidate</h2>

        <p>
          Enter the student's ID to retrieve their official candidate
          information.
        </p>

        <div className="head-candidate-search-form">
          <input
            type="text"
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleSearch();
              }
            }}
            placeholder="Enter student ID"
            aria-label="Student ID"
          />

          <button
            type="button"
            onClick={() => void handleSearch()}
            disabled={isLoading}
          >
            {isLoading ? "Searching..." : "Search Candidate"}
          </button>
        </div>

        {errorMessage && (
          <p className="head-candidate-error" role="alert">
            {errorMessage}
          </p>
        )}
      </section>

      {candidate && (
        <section className="head-candidate-details">
          <div className="head-candidate-photo">
            <img
              src={candidate.photo}
              alt={`${fullName} candidate`}
            />
          </div>

          <div className="head-candidate-information">
            <span className="head-candidate-status">
              Official Candidate
            </span>

            <h2>{fullName}</h2>

            <div className="head-candidate-information-grid">
              <div>
                <span>Student ID</span>
                <strong>{candidate.studentId}</strong>
              </div>

              <div>
                <span>Department</span>
                <strong>
                  {candidate.student?.department || "Not available"}
                </strong>
              </div>

              <div>
                <span>Year Section</span>
                <strong>
                  {candidate.student?.yearSection || "Not available"}
                </strong>
              </div>

              <div>
                <span>GPA</span>
                <strong>
                  {candidate.student?.gpa ?? "Not available"}
                </strong>
              </div>

              <div>
                <span>Total Votes</span>
                <strong>{candidate.totalVotes}</strong>
              </div>

              <div>
                <span>Manual Winner</span>
                <strong>
                  {candidate.manualWinner ? "Yes" : "No"}
                </strong>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export default HeadCandidateInformationPage;
