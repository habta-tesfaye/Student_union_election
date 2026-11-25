
import { useEffect, useState, type CSSProperties } from "react";
import {
  getMyClassElectionResults,
  type ClassCandidateResult,
  type ClassElectionResults,
} from "../services/candidate.api";
import "./CandidateVoteStatistics.css";

const chartColors = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#9333ea",
  "#0891b2",
  "#e11d48",
  "#64748b",
  "#0f766e",
];

function getCandidateName(candidate: ClassCandidateResult): string {
  return [
    candidate.firstName,
    candidate.middleName,
    candidate.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function CandidateVoteStatistics() {
  const [results, setResults] = useState<ClassElectionResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadResults() {
    setLoading(true);
    setError("");

    try {
      const data = await getMyClassElectionResults();
      setResults(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load vote statistics.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadResults();
  }, []);

  if (loading) {
    return (
      <section className="candidate-statistics">
        <p className="statistics-message">Loading vote statistics...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="candidate-statistics">
        <div className="statistics-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => void loadResults()}>
            Try again
          </button>
        </div>
      </section>
    );
  }

  if (!results) {
    return (
      <section className="candidate-statistics">
        <p className="statistics-message">
          Vote statistics are currently unavailable.
        </p>
      </section>
    );
  }

  const sortedCandidates = [...results.candidates].sort(
    (a, b) => b.totalVotes - a.totalVotes,
  );

  const highestVoteCount = Math.max(
    1,
    ...sortedCandidates.map((candidate) => candidate.totalVotes),
  );

  const totalCandidateVotes = sortedCandidates.reduce(
    (total, candidate) => total + candidate.totalVotes,
    0,
  );

  let currentAngle = 0;

  const donutSegments = sortedCandidates.map((candidate, index) => {
    const percentage =
      totalCandidateVotes > 0
        ? (candidate.totalVotes / totalCandidateVotes) * 100
        : 0;

    const startAngle = currentAngle;
    currentAngle += (percentage / 100) * 360;

    return {
      candidate,
      percentage,
      color: chartColors[index % chartColors.length],
      startAngle,
      endAngle: currentAngle,
    };
  });

  const donutGradient =
    totalCandidateVotes > 0
      ? `conic-gradient(${donutSegments
          .map(
            (segment) =>
              `${segment.color} ${segment.startAngle}deg ${segment.endAngle}deg`,
          )
          .join(", ")})`
      : "#e2e8f0";

  const donutStyle = {
    background: donutGradient,
  } as CSSProperties;

  return (
    <section className="candidate-statistics">
      {/* Heading */}
      <div className="statistics-heading">
        <div>
          <span className="statistics-eyebrow">CANDIDATE PORTAL</span>
          <h2>Vote Statistics</h2>
          <p>
            {results.department}
            {results.yearSection ? ` · ${results.yearSection}` : ""}
          </p>
        </div>

        <button
          type="button"
          className="statistics-refresh"
          onClick={() => void loadResults()}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="statistics-summary">
        <article className="statistics-card">
          <div className="statistics-card-icon blue-icon">♟</div>
          <span>Total Candidates</span>
          <strong>{results.totalCandidates}</strong>
          <small>Participating candidates</small>
        </article>

        <article className="statistics-card">
          <div className="statistics-card-icon green-icon">✓</div>
          <span>Total Votes</span>
          <strong>{results.totalVotes}</strong>
          <small>Recorded class votes</small>
        </article>

        <article className="statistics-card">
          <div className="statistics-card-icon orange-icon">▤</div>
          <span>Result Status</span>
          <strong className="statistics-status-value">
            {results.tieDetected ? "Tie detected" : "Available"}
          </strong>
          <small>Current election result</small>
        </article>
      </div>

      {results.tieDetected && (
        <p className="statistics-notice">
          A tie was detected in the class election results. The winner
          determination is pending review.
        </p>
      )}

      {/* Graphs */}
      <div className="statistics-graphs">
        {/* Horizontal bar graph */}
        <article className="statistics-chart-card">
          <div className="statistics-section-heading">
            <div>
              <h3>Candidate Vote Comparison</h3>
              <p>Number of votes received by each candidate</p>
            </div>
            <span className="chart-tag">Bar graph</span>
          </div>

          {sortedCandidates.length === 0 ? (
            <p className="statistics-message">
              No candidate vote data is available yet.
            </p>
          ) : (
            <div className="vote-bar-chart">
              {sortedCandidates.map((candidate, index) => {
                const percentage =
                  (candidate.totalVotes / highestVoteCount) * 100;

                return (
                  <div
                    className="vote-bar-row"
                    key={candidate.studentId}
                  >
                    <div className="vote-bar-label">
                      <span
                        className="vote-bar-color"
                        style={{
                          backgroundColor:
                            chartColors[index % chartColors.length],
                        }}
                      />
                      <span className="vote-bar-name">
                        {getCandidateName(candidate) ||
                          candidate.studentId}
                      </span>
                      <strong>{candidate.totalVotes}</strong>
                    </div>

                    <div
                      className="vote-bar-track"
                      role="img"
                      aria-label={`${getCandidateName(candidate) || candidate.studentId}: ${candidate.totalVotes} votes`}
                    >
                      <div
                        className="vote-bar-fill"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor:
                            chartColors[index % chartColors.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        {/* Donut graph */}
        <article className="statistics-chart-card">
          <div className="statistics-section-heading">
            <div>
              <h3>Vote Distribution</h3>
              <p>Share of recorded candidate votes</p>
            </div>
            <span className="chart-tag">Donut chart</span>
          </div>

          {sortedCandidates.length === 0 || totalCandidateVotes === 0 ? (
            <p className="statistics-message">
              Vote distribution will appear when votes are recorded.
            </p>
          ) : (
            <>
              <div className="donut-chart-area">
                <div
                  className="vote-donut"
                  style={donutStyle}
                  role="img"
                  aria-label="Donut chart showing the distribution of candidate votes"
                >
                  <div className="donut-center">
                    <strong>{totalCandidateVotes}</strong>
                    <span>Candidate votes</span>
                  </div>
                </div>
              </div>

              <div className="donut-legend">
                {donutSegments.map((segment) => (
                  <div
                    className="donut-legend-item"
                    key={segment.candidate.studentId}
                  >
                    <span
                      className="donut-legend-dot"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="donut-legend-name">
                      {getCandidateName(segment.candidate) ||
                        segment.candidate.studentId}
                    </span>
                    <strong>{segment.percentage.toFixed(1)}%</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </article>
      </div>

      {/* Winners */}
      <div className="statistics-winners">
        <article className="statistics-winner-card male-winner">
          <div className="winner-icon">♂</div>
          <div>
            <span className="winner-label">CLASS RESULT</span>
            <h3>Male Winner</h3>

            {results.maleWinner ? (
              <>
                <strong>{getCandidateName(results.maleWinner)}</strong>
                <span>{results.maleWinner.totalVotes} votes</span>
              </>
            ) : (
              <p>No male winner is currently available.</p>
            )}
          </div>
        </article>

        <article className="statistics-winner-card female-winner">
          <div className="winner-icon">♀</div>
          <div>
            <span className="winner-label">CLASS RESULT</span>
            <h3>Female Winner</h3>

            {results.femaleWinner ? (
              <>
                <strong>{getCandidateName(results.femaleWinner)}</strong>
                <span>{results.femaleWinner.totalVotes} votes</span>
              </>
            ) : (
              <p>No female winner is currently available.</p>
            )}
          </div>
        </article>
      </div>

      {/* Candidate results table */}
      <div className="statistics-table-section">
        <div className="statistics-section-heading">
          <div>
            <h3>Candidate Vote Counts</h3>
            <p>Detailed class election results</p>
          </div>
        </div>

        {sortedCandidates.length === 0 ? (
          <p className="statistics-message">
            No candidate vote statistics are available yet.
          </p>
        ) : (
          <div className="statistics-table-wrapper">
            <table className="statistics-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Candidate</th>
                  <th>Department</th>
                  <th>Year / Section</th>
                  <th>Votes</th>
                  <th>Vote Share</th>
                </tr>
              </thead>

              <tbody>
                {sortedCandidates.map((candidate, index) => {
                  const share =
                    totalCandidateVotes > 0
                      ? (candidate.totalVotes / totalCandidateVotes) * 100
                      : 0;

                  return (
                    <tr key={candidate.studentId}>
                      <td>
                        <span className="candidate-rank">
                          {index + 1}
                        </span>
                      </td>
                      <td>
                        <strong>
                          {getCandidateName(candidate) ||
                            candidate.studentId}
                        </strong>
                      </td>
                      <td>{candidate.department || "—"}</td>
                      <td>{candidate.yearSection || "—"}</td>
                      <td>
                        <strong>{candidate.totalVotes}</strong>
                      </td>
                      <td>{share.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default CandidateVoteStatistics;
