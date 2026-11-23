import { useState } from "react";
import "./HeadTieResolutionPage.css";

import {
  getHeadClassResults,
  selectHeadManualWinner,
  type HeadTieCandidate,
} from "../head-tie-resolution.api";

function HeadTieResolutionPage({
  onBack,
}: {
  onBack: () => void;
}) {
  const [yearSection, setYearSection] = useState("");
  const [candidates, setCandidates] = useState<HeadTieCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadResults() {
    if (!yearSection.trim()) {
      setErrorMessage("Enter a year section to view its election ties.");
      setCandidates([]);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const results = await getHeadClassResults(yearSection);
      setCandidates(results.candidates);
    } catch (error: unknown) {
      setCandidates([]);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load class election results."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function getTiedCandidates(group: HeadTieCandidate[]) {
    if (group.length < 2) {
      return [];
    }

    const highestVotes = Math.max(
      ...group.map((candidate) => candidate.totalVotes)
    );

    const tied = group.filter(
      (candidate) => candidate.totalVotes === highestVotes
    );

    return tied.length > 1 ? tied : [];
  }

  const maleCandidates = candidates.filter(
    (candidate) => candidate.gender.toLowerCase() === "male"
  );

  const femaleCandidates = candidates.filter(
    (candidate) => candidate.gender.toLowerCase() !== "male"
  );

  const maleTiedCandidates = getTiedCandidates(maleCandidates);
  const femaleTiedCandidates = getTiedCandidates(femaleCandidates);

  async function handleSelectWinner(candidate: HeadTieCandidate) {
    const confirmed = window.confirm(
      `Select ${[
        candidate.firstName,
        candidate.middleName,
        candidate.lastName,
      ]
        .filter(Boolean)
        .join(" ")} as the manual winner for ${yearSection}?`
    );

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const message = await selectHeadManualWinner(
        candidate.studentId,
        yearSection
      );

      setSuccessMessage(message);
      await loadResults();
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to select the manual winner."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function renderTieGroup(
    title: string,
    tiedCandidates: HeadTieCandidate[]
  ) {
    if (tiedCandidates.length === 0) {
      return (
        <section className="head-tie-group">
          <h2>{title}</h2>
          <p>No unresolved tie found in this group.</p>
        </section>
      );
    }

    return (
      <section className="head-tie-group">
        <h2>{title}</h2>
        <p>
          These candidates share the highest vote count in this group.
          Select the manual winner to resolve the tie.
        </p>

        <div className="head-tie-candidates">
          {tiedCandidates.map((candidate) => {
            const fullName = [
              candidate.firstName,
              candidate.middleName,
              candidate.lastName,
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <article
                className="head-tie-candidate"
                key={candidate.studentId}
              >
                {candidate.photo ? (
                  <img
                    src={candidate.photo}
                    alt={`${fullName} candidate`}
                    className="head-tie-photo"
                  />
                ) : (
                  <div className="head-tie-photo-placeholder">
                    No photo
                  </div>
                )}

                <div className="head-tie-candidate-details">
                  <h3>{fullName || candidate.studentId}</h3>
                  <p>Student ID: {candidate.studentId}</p>
                  <p>Votes: {candidate.totalVotes}</p>
                  <p>GPA: {candidate.gpa}</p>
                  {candidate.manualWinner && (
                    <strong>Current manual winner</strong>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isSaving || candidate.manualWinner}
                  onClick={() => handleSelectWinner(candidate)}
                >
                  {candidate.manualWinner
                    ? "Selected"
                    : isSaving
                      ? "Saving..."
                      : "Select winner"}
                </button>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <main className="head-tie-resolution-page">
      <header className="head-tie-resolution-header">
        <div>
          <span>DEPARTMENT HEAD PORTAL</span>
          <h1>Tie Resolution</h1>
          <p>
            Review tied class-election candidates and select a manual winner.
          </p>
        </div>

        <button type="button" onClick={onBack}>
          Back to dashboard
        </button>
      </header>

      <section className="head-tie-section-picker">
        <label htmlFor="head-tie-year-section">Year section</label>
        <input
          id="head-tie-year-section"
          value={yearSection}
          onChange={(event) => setYearSection(event.target.value)}
          placeholder="Enter the section, e.g. Year 3"
        />
        <button
          type="button"
          onClick={loadResults}
          disabled={isLoading || !yearSection.trim()}
        >
          {isLoading ? "Loading..." : "Load section results"}
        </button>
      </section>

      {errorMessage && (
        <p className="head-tie-message error" role="alert">
          {errorMessage}
        </p>
      )}

      {successMessage && (
        <p className="head-tie-message success" role="status">
          {successMessage}
        </p>
      )}

      {candidates.length > 0 && (
        <>
          {renderTieGroup("Male candidates", maleTiedCandidates)}
          {renderTieGroup("Female candidates", femaleTiedCandidates)}
        </>
      )}
    </main>
  );
}

export default HeadTieResolutionPage;
