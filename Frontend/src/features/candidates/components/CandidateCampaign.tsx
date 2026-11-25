
import { useState, type FormEvent } from "react";
import {
  submitMyCampaign,
  type Campaign,
} from "../services/candidate.api";

import "./CandidateCampaign.css";

function CandidateCampaign() {
  const [campaignTitle, setCampaignTitle] = useState("");
  const [motto, setMotto] = useState("");
  const [manifestoDetailed, setManifestoDetailed] = useState("");

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const title = campaignTitle.trim();
    const campaignMotto = motto.trim();
    const manifesto = manifestoDetailed.trim();

    if (title.length < 3 || title.length > 200) {
      setError("Campaign title must contain 3–200 characters.");
      return;
    }

    if (campaignMotto.length < 2 || campaignMotto.length > 300) {
      setError("Campaign motto must contain 2–300 characters.");
      return;
    }

    if (manifesto.length < 20 || manifesto.length > 10000) {
      setError("Manifesto must contain 20–10,000 characters.");
      return;
    }

    try {
      setLoading(true);

      const result = await submitMyCampaign({
        campaignTitle: title,
        motto: campaignMotto,
        manifestoDetailed: manifesto,
      });

      setCampaign(result);

      setSuccess(
        result.status === "pending"
          ? "Your campaign was submitted successfully and is awaiting Director review."
          : "Your campaign submission was successful."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit your campaign."
      );
    } finally {
      setLoading(false);
    }
  }

  if (campaign) {
    return (
      <div className="candidate-campaign">
        <div className="campaign-result">
          <div className="campaign-result-icon">✓</div>

          <h2>My Campaign</h2>

          <p className="campaign-success">{success}</p>

          <div className="campaign-status">
            <span>Campaign Status</span>

            <strong className={`status-${campaign.status}`}>
              {campaign.status.toUpperCase()}
            </strong>
          </div>

          <div className="campaign-details">
            <h3>{campaign.campaignTitle}</h3>

            <p>
              <strong>Campaign Motto:</strong> {campaign.motto}
            </p>

            <p>
              <strong>Student ID:</strong> {campaign.studentId}
            </p>

            <p>
              <strong>Submission Date:</strong>{" "}
              {new Date(campaign.createdAt).toLocaleDateString()}
            </p>

            <div>
              <strong>Detailed Manifesto</strong>

              <p className="manifesto-text">
                {campaign.manifestoDetailed}
              </p>
            </div>

            {campaign.status === "rejected" &&
              campaign.rejectionReason && (
                <div className="campaign-rejection">
                  <strong>Rejection Reason</strong>
                  <p>{campaign.rejectionReason}</p>
                </div>
              )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="candidate-campaign">
      <div className="campaign-intro">
        <h2>My Campaign</h2>

        <p>
          Submit your campaign proposal for review by the Student Union
          Director.
        </p>
      </div>

      <form className="campaign-form" onSubmit={handleSubmit}>
        <div className="campaign-form-heading">
          <h3>Campaign Submission Form</h3>
          <p>Complete all three fields before submitting.</p>
        </div>

        {error && (
          <div className="campaign-error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="campaign-success" role="status">
            {success}
          </div>
        )}

        <div className="campaign-field">
          <label htmlFor="campaignTitle">Campaign Title</label>

          <input
            id="campaignTitle"
            type="text"
            value={campaignTitle}
            onChange={(event) => setCampaignTitle(event.target.value)}
            placeholder="Enter your campaign title"
            minLength={3}
            maxLength={200}
            required
            disabled={loading}
          />

          <small>
            {campaignTitle.length}/200 characters (minimum 3)
          </small>
        </div>

        <div className="campaign-field">
          <label htmlFor="campaignMotto">Campaign Motto</label>

          <input
            id="campaignMotto"
            type="text"
            value={motto}
            onChange={(event) => setMotto(event.target.value)}
            placeholder="Enter your campaign motto"
            minLength={2}
            maxLength={300}
            required
            disabled={loading}
          />

          <small>
            {motto.length}/300 characters (minimum 2)
          </small>
        </div>

        <div className="campaign-field">
          <label htmlFor="campaignManifesto">
            Detailed Manifesto
          </label>

          <textarea
            id="campaignManifesto"
            value={manifestoDetailed}
            onChange={(event) =>
              setManifestoDetailed(event.target.value)
            }
            placeholder="Explain your campaign plans, objectives, and proposed activities..."
            minLength={20}
            maxLength={10000}
            rows={9}
            required
            disabled={loading}
          />

          <small>
            {manifestoDetailed.length}/10,000 characters (minimum 20)
          </small>
        </div>

        <div className="campaign-guideline">
          <strong>Submission Guidelines</strong>

          <ul>
            <li>Only one campaign submission is allowed per student.</li>
            <li>Your submission starts with Pending status.</li>
            <li>The Director reviews and approves or rejects your campaign.</li>
          </ul>
        </div>

        <button
          type="submit"
          className="campaign-submit-button"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit Campaign"}
        </button>
      </form>
    </div>
  );
}

export default CandidateCampaign;
