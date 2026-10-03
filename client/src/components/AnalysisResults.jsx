import React, { useState, useEffect } from 'react';

// AnalysisResults component displays the Gemini breakdown and interactive checklist
export default function AnalysisResults({ results, error, loading }) {
  // Local state to track which checklist items the candidate has completed
  const [completedSteps, setCompletedSteps] = useState({});

  // Reset checklist checkboxes when new analysis results arrive
  useEffect(() => {
    setCompletedSteps({});
  }, [results]);

  const toggleStep = (index) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // If there's an error from the backend (e.g., missing API key or invalid input)
  if (error) {
    return (
      <section
        className="card-section"
        aria-live="polite"
        role="region"
        aria-label="Analysis Error"
      >
        <div className="status-msg error" role="alert">
          <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Analysis Error:</strong>
          {error}
        </div>
      </section>
    );
  }

  // If currently loading
  if (loading) {
    return (
      <section
        className="card-section"
        aria-live="polite"
        aria-busy="true"
        role="region"
        aria-label="Analysis in progress"
      >
        <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <div
            className="spinner"
            style={{ width: '2.5rem', height: '2.5rem', borderColor: '#cbd5e1', borderTopColor: '#1d4ed8' }}
            aria-hidden="true"
          ></div>
          <h3 style={{ marginTop: '1rem', color: 'var(--color-text-main)' }}>
            Analyzing Job Description...
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
            Gemini is translating requirements into simple English and checking profile compatibility.
          </p>
        </div>
      </section>
    );
  }

  // If no results yet, return null (clean baseline page)
  if (!results) {
    return null;
  }

  const {
    summary,
    compatibilityScore,
    scoreReason,
    requiredSkills = [],
    documentsNeeded = [],
    applicationSteps = []
  } = results;

  const totalSteps = applicationSteps.length;
  const completedCount = Object.values(completedSteps).filter(Boolean).length;

  return (
    <section
      className="card-section results-container"
      aria-live="polite"
      role="region"
      aria-labelledby="analysis-results-heading"
    >
      <div className="results-header">
        <h2 id="analysis-results-heading">Analysis Breakdown</h2>
        <p className="section-description">
          Review the simplified summary, compatibility rating, and application checklist below.
        </p>
      </div>

      {/* Compatibility Score Card */}
      <div className="score-card">
        <div className="score-badge" aria-label={`Compatibility Score: ${compatibilityScore} percent`}>
          <span className="score-number">{compatibilityScore}%</span>
          <span className="score-label">Match</span>
        </div>
        <div className="score-details">
          <h3>Profile Compatibility Score</h3>
          <p>{scoreReason}</p>
        </div>
      </div>

      {/* Plain Simple English Summary */}
      <div className="summary-box">
        <h3>Plain English Summary</h3>
        <p>{summary}</p>
      </div>

      {/* Required Skills */}
      {requiredSkills.length > 0 && (
        <div style={{ marginBottom: '1.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>
            Key Required Skills
          </h3>
          <ul className="skills-list" aria-label="Required Skills">
            {requiredSkills.map((skill, index) => (
              <li key={index} className="skill-tag">
                {skill}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Documents Needed */}
      {documentsNeeded.length > 0 && (
        <div style={{ marginBottom: '1.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>
            Documents Needed
          </h3>
          <ul className="doc-list" aria-label="Documents Needed">
            {documentsNeeded.map((doc, index) => (
              <li key={index} className="doc-item">
                <span className="doc-icon" aria-hidden="true">&#128196;</span>
                <span>{doc}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Application Steps Checklist */}
      {applicationSteps.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
              Application Steps Checklist
            </h3>
            {totalSteps > 0 && (
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-subtle)' }}>
                {completedCount} of {totalSteps} completed
              </span>
            )}
          </div>
          <p className="section-description" style={{ marginBottom: '0.75rem' }}>
            Check off each step as you complete it:
          </p>
          <ul className="checklist" aria-label="Application Steps Checklist">
            {applicationSteps.map((step, index) => {
              const isChecked = !!completedSteps[index];
              const checkboxId = `step-checkbox-${index}`;
              return (
                <li
                  key={index}
                  className={`checklist-item ${isChecked ? 'completed' : ''}`}
                >
                  <input
                    type="checkbox"
                    id={checkboxId}
                    checked={isChecked}
                    onChange={() => toggleStep(index)}
                  />
                  <label htmlFor={checkboxId} className="checklist-label">
                    {step}
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
