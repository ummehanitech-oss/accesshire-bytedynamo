import React, { useState, useEffect, useRef } from 'react';
import { updateApplicationProgress } from '../api.js';

const SECTION_TITLES = [
  'Plain English Summary',
  'Compatibility Score & Skills',
  'Documents Needed',
  'Information Needed',
  'Application Steps'
];

/**
 * SimplifiedResults Component
 * Used when Simplified visual mode is active.
 * Displays results ONE section at a time (summary, score, documents, information, steps)
 * with big Next and Back buttons and a "Section X of 5" label.
 */
export default function SimplifiedResults({ analysis, onNewAnalysis, onEditProfile }) {
  // Active section index: 0 = summary, 1 = score, 2 = documents, 3 = information, 4 = steps
  const [currentSection, setCurrentSection] = useState(0);

  // Application steps completion tracker
  const initialCompleted = analysis?.completedSteps || [];
  const [completedSteps, setCompletedSteps] = useState(new Set(initialCompleted));
  const [saveStatus, setSaveStatus] = useState('');

  // Ref to the active section heading for accessible focus management
  const sectionHeadingRef = useRef(null);

  // Focus section heading whenever section changes
  useEffect(() => {
    if (sectionHeadingRef.current) {
      sectionHeadingRef.current.focus();
    }
  }, [currentSection]);

  if (!analysis) return null;

  const {
    id,
    jobTitle,
    company,
    sourceUrl,
    summary,
    compatibilityScore,
    scoreReason,
    matchedSkills = [],
    missingSkills = [],
    documentsNeeded = [],
    informationNeeded = [],
    applicationSteps = []
  } = analysis;

  // Toggle step completion and persist with server
  const handleToggleStep = async (stepIdx) => {
    const updated = new Set(completedSteps);
    if (updated.has(stepIdx)) {
      updated.delete(stepIdx);
    } else {
      updated.add(stepIdx);
    }
    setCompletedSteps(updated);

    if (id) {
      try {
        setSaveStatus('Saving progress...');
        await updateApplicationProgress(id, Array.from(updated));
        setSaveStatus('Progress saved.');
      } catch {
        setSaveStatus('Could not save progress.');
      }
    }
  };

  const handleNext = () => {
    if (currentSection < 4) {
      setCurrentSection((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentSection > 0) {
      setCurrentSection((prev) => prev - 1);
    }
  };

  // Match description for the score
  let matchDescription = 'No score available';
  if (typeof compatibilityScore === 'number') {
    if (compatibilityScore >= 80) matchDescription = 'Strong match';
    else if (compatibilityScore >= 60) matchDescription = 'Good match';
    else if (compatibilityScore >= 40) matchDescription = 'Moderate match';
    else if (compatibilityScore > 0) matchDescription = 'Low match / Needs preparation';
    else matchDescription = 'No match yet';
  }

  return (
    <div className="simplified-results" role="region" aria-label="Simplified job results">
      {/* Job Title Header */}
      <section className="simplified-header-card">
        <h2 style={{ fontSize: '1.9rem', fontWeight: 800, margin: 0, marginBottom: '0.4rem' }}>
          {jobTitle || 'Job Position'}
        </h2>
        <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
          Company: {company || 'Unknown Company'}
        </div>

        {sourceUrl && (
          <div style={{ marginTop: '0.75rem' }}>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="source-link"
              style={{ fontSize: '1.15rem' }}
            >
              <span>View original job posting</span>
              <span aria-hidden="true">&#8599;</span>
            </a>
          </div>
        )}
      </section>

      {/* Stepper Navigation Bar */}
      <nav className="simplified-nav-bar" aria-label="Results sections navigation">
        <button
          type="button"
          className="btn btn-secondary simplified-stepper-btn"
          onClick={handleBack}
          disabled={currentSection === 0}
          aria-label="Go to previous section"
        >
          &larr; Back
        </button>

        {/* Section X of 5 label */}
        <div className="simplified-step-indicator" aria-live="polite">
          Section {currentSection + 1} of 5
        </div>

        <button
          type="button"
          className="btn btn-primary simplified-stepper-btn"
          onClick={handleNext}
          disabled={currentSection === 4}
          aria-label="Go to next section"
        >
          Next &rarr;
        </button>
      </nav>

      {/* ONE Section shown at a time */}
      <main className="simplified-section-content" tabIndex={-1}>
        {/* SECTION 1: SUMMARY */}
        {currentSection === 0 && (
          <div>
            <h3
              ref={sectionHeadingRef}
              tabIndex={-1}
              className="simplified-section-title"
            >
              1. {SECTION_TITLES[0]}
            </h3>
            <p className="simplified-text-block">
              {summary || 'No summary available for this job.'}
            </p>
          </div>
        )}

        {/* SECTION 2: SCORE */}
        {currentSection === 1 && (
          <div>
            <h3
              ref={sectionHeadingRef}
              tabIndex={-1}
              className="simplified-section-title"
            >
              2. {SECTION_TITLES[1]}
            </h3>

            <div
              style={{
                border: '2px solid var(--color-border-dark)',
                borderRadius: '6px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                backgroundColor: 'var(--color-surface-alt)'
              }}
            >
              <div style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                Compatibility Score: {compatibilityScore !== null ? `${compatibilityScore}%` : 'N/A'}
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Rating: {matchDescription}
              </div>
              <p className="simplified-text-block" style={{ margin: 0 }}>
                {scoreReason || 'Compatibility evaluated against your profile.'}
              </p>
            </div>

            {/* Matched Skills List */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Matched Skills ({matchedSkills.length})
              </h4>
              {matchedSkills.length > 0 ? (
                <ul className="simplified-list">
                  {matchedSkills.map((skill, idx) => (
                    <li key={idx} className="simplified-list-item">
                      <span aria-hidden="true">&#10003;</span>
                      <span>{skill}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="simplified-text-block">No overlapping skills found.</p>
              )}
            </div>

            {/* Missing Skills List */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Missing or Growth Skills ({missingSkills.length})
              </h4>
              {missingSkills.length > 0 ? (
                <ul className="simplified-list">
                  {missingSkills.map((skill, idx) => (
                    <li key={idx} className="simplified-list-item">
                      <span aria-hidden="true">&#9675;</span>
                      <span>{skill}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="simplified-text-block">You meet all key required skills!</p>
              )}
            </div>

            {/* Edit Profile Action */}
            <div className="button-row">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onEditProfile}
              >
                Edit my profile
              </button>
            </div>
          </div>
        )}

        {/* SECTION 3: DOCUMENTS */}
        {currentSection === 2 && (
          <div>
            <h3
              ref={sectionHeadingRef}
              tabIndex={-1}
              className="simplified-section-title"
            >
              3. {SECTION_TITLES[2]}
            </h3>
            {documentsNeeded.length > 0 ? (
              <ul className="simplified-list" aria-label="Documents needed list">
                {documentsNeeded.map((doc, idx) => (
                  <li key={idx} className="simplified-list-item">
                    <span aria-hidden="true">&#128196;</span>
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="simplified-text-block">
                No special documents required for this job posting.
              </p>
            )}
          </div>
        )}

        {/* SECTION 4: INFORMATION */}
        {currentSection === 3 && (
          <div>
            <h3
              ref={sectionHeadingRef}
              tabIndex={-1}
              className="simplified-section-title"
            >
              4. {SECTION_TITLES[3]}
            </h3>
            {informationNeeded.length > 0 ? (
              <ul className="simplified-list" aria-label="Information needed list">
                {informationNeeded.map((info, idx) => (
                  <li key={idx} className="simplified-list-item">
                    <span aria-hidden="true">&#128221;</span>
                    <span>{info}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="simplified-text-block">
                No additional specific information listed for this application.
              </p>
            )}
          </div>
        )}

        {/* SECTION 5: STEPS */}
        {currentSection === 4 && (
          <div>
            <h3
              ref={sectionHeadingRef}
              tabIndex={-1}
              className="simplified-section-title"
            >
              5. {SECTION_TITLES[4]}
            </h3>

            <p className="simplified-text-block" style={{ marginBottom: '1.25rem' }}>
              Completed {completedSteps.size} of {applicationSteps.length} steps
              {saveStatus && <span style={{ marginLeft: '1rem', fontStyle: 'italic' }}>({saveStatus})</span>}
            </p>

            {applicationSteps.length > 0 ? (
              <div className="simplified-list" role="list">
                {applicationSteps.map((step, idx) => {
                  const isDone = completedSteps.has(idx);
                  const stepInputId = `simplified-step-${idx}`;
                  return (
                    <div
                      key={idx}
                      className={`simplified-checklist-item ${isDone ? 'done' : ''}`}
                      role="listitem"
                    >
                      <input
                        id={stepInputId}
                        type="checkbox"
                        checked={isDone}
                        onChange={() => handleToggleStep(idx)}
                        className="simplified-checklist-checkbox"
                      />
                      <label htmlFor={stepInputId} className="simplified-checklist-label">
                        <span className="simplified-checklist-title">
                          Step {idx + 1}: {step.title}
                        </span>
                        <span className="simplified-checklist-detail">
                          {step.detail}
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="simplified-text-block">
                No application steps available for this posting.
              </p>
            )}
          </div>
        )}
      </main>

      {/* Global Actions */}
      <div className="button-row" style={{ marginTop: '1.5rem', justifyContent: 'space-between' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onNewAnalysis}
          style={{ minHeight: '52px' }}
        >
          Analyze Another Job
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={onEditProfile}
          style={{ minHeight: '52px' }}
        >
          Edit My Profile
        </button>
      </div>
    </div>
  );
}
