
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  getParliamentCandidates,
  submitParliamentScore,
} from "../services/candidate.api";
import type { ParliamentCandidate } from "../types/candidate.types";

import "./CandidateParliamentVoting.css";

function CandidateParliamentVoting() {
  const [candidates, setCandidates] = useState<ParliamentCandidate[]>([]);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCandidates = useCallback(async () => {
    try {
      setError("");
      const result = await getParliamentCandidates();

      setCandidates(result);

      setScores((previous) => {
        const updated = { ...previous };

        result.forEach((candidate) => {
          if (candidate.savedScore !== null) {
            updated[candidate.studentId] = String(candidate.savedScore);
          } else if (updated[candidate.studentId] === undefined) {
            updated[candidate.studentId] = "";
          }
        });

        return updated;
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load Parliament candidates.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCandidates();
  }, [loadCandidates]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
    candidate: ParliamentCandidate,
  ) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const enteredScore = scores[candidate.studentId]?.trim() ?? "";
    const score = Number(enteredScore);

    if (enteredScore === "" || !Number.isFinite(score)) {
      setError("Please enter a valid score.");
      return;
    }

    if (score < 0 || score > 60) {
      setError("The score must be between 0 and 60.");
      return;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(enteredScore)) {
      setError("Enter a score with no more than two decimal places.");
      return;
    }

    if (!candidate.votingOpen) {
      setError("Parliament scoring is currently closed.");
      return;
    }

    if (candidate.hasScored) {
      setError("You have already scored this candidate.");
      return;
    }

    try {
      setSubmittingId(candidate.studentId);

      await submitParliamentScore(candidate.studentId, score);

      setSuccess(
        `Your score for ${candidate.firstName} ${candidate.lastName} was submitted successfully.`,
      );

      await loadCandidates();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit the Parliament score.",
      );
    } finally {
      setSubmittingId(null);
    }
  }

  const votingOpen = candidates.some((candidate) => candidate.votingOpen);
  const completedCount = candidates.filter(
    (candidate) => candidate.hasScored,
  ).length;

  if (loading) {
    return (
      <div className="parliament-page">
        <div className="parliament-message">
          Loading Parliament candidates...
        </div>
      </div>
    );
  }

  return (
    <div className="parliament-page">
      <div className="parliament-header">
        <div>
          <span className="parliament-eyebrow">DMU BURE CAMPUS</span>
          <h2>Parliament Evaluation Portal</h2>
          <p>
            Evaluate each eligible Parliament candidate by submitting an
            individual score out of 60.
          </p>
        </div>

        <div
          className={`parliament-status ${
            votingOpen ? "status-open" : "status-closed"
          }`}
        >
          <span className="status-indicator" />
          {votingOpen ? "SCORING OPEN" : "SCORING CLOSED"}
        </div>
      </div>

      {error && (
        <div className="parliament-alert parliament-alert-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div
          className="parliament-alert parliament-alert-success"
          role="status"
        >
          {success}
        </div>
      )}

      <div className="parliament-summary">
        <div className="parliament-summary-card">
          <span className="summary-icon">♟</span>
          <div>
            <span className="summary-label">Eligible Candidates</span>
            <strong>{candidates.length}</strong>
          </div>
        </div>

        <div className="parliament-summary-card">
          <span className="summary-icon">✓</span>
          <div>
            <span className="summary-label">Completed Scores</span>
            <strong>{completedCount}</strong>
          </div>
        </div>

        <div className="parliament-summary-card">
          <span className="summary-icon">◷</span>
          <div>
            <span className="summary-label">Remaining Scores</span>
            <strong>{Math.max(candidates.length - completedCount, 0)}</strong>
          </div>
        </div>
      </div>

      <div className="parliament-instructions">
        <h3>Scoring Instructions</h3>
        <ul>
          <li>Give each listed candidate a score between 0 and 60.</li>
          <li>You may enter decimal scores up to two decimal places.</li>
          <li>Submit each candidate's score only once.</li>
          <li>Submitted scores cannot be changed through this page.</li>
          <li>Scores can only be submitted while the scoring period is open.</li>
        </ul>
      </div>

      {candidates.length === 0 ? (
        <div className="parliament-empty">
          <div className="empty-icon">♟</div>
          <h3>No Parliament Candidates Available</h3>
          <p>
            No eligible Parliament candidates are currently available for
            evaluation.
          </p>
        </div>
      ) : (
        <>
          <div className="parliament-section-heading">
            <div>
              <h3>Parliament Candidates</h3>
              <p>Ranked according to their pre-Parliament score.</p>
            </div>
            <span>{candidates.length} candidates</span>
          </div>

          <div className="parliament-candidate-grid">
            {candidates.map((candidate, index) => {
              const isSubmitting = submittingId === candidate.studentId;

              return (
                <article
                  className="parliament-candidate-card"
                  key={candidate.studentId}
                >
                  <div className="candidate-card-top">
                    <span className="candidate-rank">
                      Candidate #{index + 1}
                    </span>

                    {candidate.hasScored ? (
                      <span className="candidate-completed">
                        ✓ Completed
                      </span>
                    ) : (
                      <span className="candidate-pending">
                        Pending Evaluation
                      </span>
                    )}
                  </div>

                  <div className="candidate-profile">
                    {candidate.photo ? (
                      <img
                        className="parliament-candidate-photo"
                        src={candidate.photo}
                        alt={`${candidate.firstName} ${candidate.lastName}`}
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="parliament-candidate-avatar">
                        {candidate.firstName.charAt(0)}
                        {candidate.lastName.charAt(0)}
                      </div>
                    )}

                    <h4>
                      {candidate.firstName} {candidate.middleName ?? ""}{" "}
                      {candidate.lastName}
                    </h4>

                    <p>{candidate.department}</p>
                    <span>{candidate.yearSection}</span>
                  </div>

                  <div className="candidate-score-details">
                    <div>
                      <span>Pre-Parliament Score</span>
                      <strong>
                        {candidate.preParliamentScore.toFixed(2)} / 40
                      </strong>
                    </div>

                    <div>
                      <span>Parliament Score</span>
                      <strong>
                        {candidate.parliamentScore.toFixed(2)} / 60
                      </strong>
                    </div>

                    <div className="candidate-total-score">
                      <span>Total Score</span>
                      <strong>
                        {candidate.totalScore.toFixed(2)} / 100
                      </strong>
                    </div>
                  </div>

                  <form
                    className="parliament-score-form"
                    onSubmit={(event) => handleSubmit(event, candidate)}
                  >
                    <label htmlFor={`score-${candidate.studentId}`}>
                      Your Score (0–60)
                    </label>

                    <input
                      id={`score-${candidate.studentId}`}
                      type="number"
                      min="0"
                      max="60"
                      step="0.01"
                      placeholder="Enter score"
                      value={scores[candidate.studentId] ?? ""}
                      onChange={(event) =>
                        setScores((previous) => ({
                          ...previous,
                          [candidate.studentId]: event.target.value,
                        }))
                      }
                      disabled={
                        candidate.hasScored ||
                        !candidate.votingOpen ||
                        submittingId !== null
                      }
                      required
                    />

                    {candidate.hasScored ? (
                      <div className="parliament-submitted-score">
                        <span>Previously submitted score</span>
                        <strong>
                          {candidate.savedScore?.toFixed(2) ?? "0.00"} / 60
                        </strong>
                      </div>
                    ) : (
                      <button
                        type="submit"
                        className="parliament-submit-button"
                        disabled={
                          !candidate.votingOpen || submittingId !== null
                        }
                      >
                        {isSubmitting
                          ? "Submitting..."
                          : candidate.votingOpen
                            ? "Submit Score"
                            : "Scoring Closed"}
                      </button>
                    )}
                  </form>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default CandidateParliamentVoting;
