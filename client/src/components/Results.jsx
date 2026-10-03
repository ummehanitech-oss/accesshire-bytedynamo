import React, { useState, useEffect } from 'react';
import { updateApplicationProgress } from '../api.js';
import { useMode } from '../context/ModeContext.jsx';
import SimplifiedResults from './SimplifiedResults.jsx';

/**
 * SummaryCard: Short, plain English overview of the job
 */
function SummaryCard({ summary }) {
  return (
    <section className="summary-container" aria-labelledby="summary-heading">
      <h3 id="summary-heading">Plain English Summary</h3>
      <p>{summary}</p>
    </section>
  );
}

/**
 * ScoreCard: Shows compatibility score with words and numbers, plus matched & missing skills
 */
function ScoreCard({ score, reason, matchedSkills = [], missingSkills = [] }) {
  let matchDescription = 'No score available';
  if (typeof score === 'number') {
    if (score >= 80) matchDescription = 'Strong match';
    else if (score >= 60) matchDescription = 'Good match';
    else if (score >= 40) matchDescription = 'Moderate match';
    else if (score > 0) matchDescription = 'Low match / Needs preparation';
    else matchDescription = 'No match yet';
  }

  return (
    <section className="card-section" aria-labelledby="score-heading">
      <h3 id="score-heading" className="section-title">
        Profile Compatibility
      </h3>

      <div className="score-container">
        <div
          className="score-badge"
          aria-label={score !== null ? `Compatibility score: ${score} percent, ${matchDescription}` : matchDescription}
        >
          <span className="score-number">{score !== null ? `${score}%` : 'N/A'}</span>
          <span className="sr-only">Compatibility rating</span>
        </div>

        <div>
          <div className="score-status-text">{matchDescription}</div>
          <p className="score-reason-text">{reason || 'Compatibility evaluated against your candidate profile.'}</p>
        </div>
      </div>

      <div className="skills-comparison-grid">
        <div className="skills-box">
          <h4>Matched Skills ({matchedSkills.length})</h4>
          {matchedSkills.length > 0 ? (
            <ul>
              {matchedSkills.map((skill, index) => (
                <li key={index}>{skill}</li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: '0.95rem', color: 'var(--color-text-subtle)' }}>
              No overlapping skills identified.
            </p>
          )}
        </div>

        <div className="skills-box">
          <h4>Missing or Growth Skills ({missingSkills.length})</h4>
          {missingSkills.length > 0 ? (
            <ul>
              {missingSkills.map((skill, index) => (
                <li key={index}>{skill}</li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: '0.95rem', color: 'var(--color-text-subtle)' }}>
              You meet all key required skills!
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * DocumentsList: Documents needed to apply
 */
function DocumentsList({ documents = [] }) {
  if (documents.length === 0) return null;

  return (
    <section className="card-section" aria-labelledby="documents-heading">
      <h3 id="documents-heading" className="section-title">
        Documents Needed
      </h3>
      <p className="section-subtitle">
        Gather these files before submitting your application:
      </p>
      <ul className="info-list" aria-label="Documents Needed">
        {documents.map((doc, idx) => (
          <li key={idx} className="info-item">
            <span aria-hidden="true">&#128196;</span>
            <span>{doc}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * InformationNeeded: Crucial details to have ready
 */
function InformationNeeded({ information = [] }) {
  if (information.length === 0) return null;

  return (
    <section className="card-section" aria-labelledby="info-needed-heading">
      <h3 id="info-needed-heading" className="section-title">
        Information Needed
      </h3>
      <p className="section-subtitle">
        Have these details prepared to complete application forms quickly:
      </p>
      <ul className="info-list" aria-label="Information Needed">
        {information.map((item, idx) => (
          <li key={idx} className="info-item">
            <span aria-hidden="true">&#128221;</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * GuidedApply: Step-by-step wizard + full checklist view with PATCH progress saving
 */
function GuidedApply({ applicationId, steps = [], initialCompleted = [] }) {
  const { announce } = useMode();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set(initialCompleted));
  const [viewMode, setViewMode] = useState('wizard'); // 'wizard' | 'checklist'
  const [saveStatus, setSaveStatus] = useState('');
  const { announce } = useMode();

  useEffect(() => {
    setCompletedSteps(new Set(initialCompleted));
  }, [initialCompleted]);

  const totalSteps = steps.length;
  if (totalSteps === 0) return null;

  const currentStep = steps[currentStepIndex] || steps[0];
  const isCurrentDone = completedSteps.has(currentStepIndex);

  // Toggle completion of a step
  const handleToggleStep = async (stepIdx) => {
    const updated = new Set(completedSteps);
    const willBeDone = !updated.has(stepIdx);
    if (updated.has(stepIdx)) {
      updated.delete(stepIdx);
    } else {
      updated.add(stepIdx);
    }
    setCompletedSteps(updated);

    // Save progress to server if applicationId exists
    if (applicationId) {
      try {
        setSaveStatus('Saving progress...');
        await updateApplicationProgress(applicationId, Array.from(updated));
        setSaveStatus('Progress saved.');
        if (announce) {
<<<<<<< HEAD
          announce('Checklist progress saved.');
=======
          announce(`Progress saved. Step ${stepIdx + 1} marked ${willBeDone ? 'done' : 'incomplete'}.`);
>>>>>>> feature/multi-mode-resume-jobs
        }
      } catch (err) {
        console.warn('Failed to save step progress:', err.message);
        setSaveStatus('Could not save progress to server.');
        if (announce) {
          announce('Could not save progress to server.');
        }
      }
    }
  };

  return (
    <section className="card-section" aria-labelledby="guided-apply-heading">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 id="guided-apply-heading" className="section-title">
          Guided Application Steps
        </h3>
        <div className="button-row" style={{ marginTop: 0 }}>
          <button
            type="button"
            className={`btn ${viewMode === 'wizard' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('wizard')}
<<<<<<< HEAD
            aria-label="Switch to step-by-step wizard view"
            style={{ minHeight: '36px', padding: '0.4rem 0.9rem', fontSize: '0.9rem' }}
=======
            style={{ minHeight: '44px', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
>>>>>>> feature/multi-mode-resume-jobs
          >
            Step-by-Step View
          </button>
          <button
            type="button"
            className={`btn ${viewMode === 'checklist' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('checklist')}
<<<<<<< HEAD
            aria-label="Switch to full checklist view"
            style={{ minHeight: '36px', padding: '0.4rem 0.9rem', fontSize: '0.9rem' }}
=======
            style={{ minHeight: '44px', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
>>>>>>> feature/multi-mode-resume-jobs
          >
            Full Checklist View
          </button>
        </div>
      </div>

      <p className="section-subtitle">
        Completed {completedSteps.size} of {totalSteps} steps
        {saveStatus && <span style={{ marginLeft: '1rem', fontStyle: 'italic' }}>({saveStatus})</span>}
      </p>

      {/* Mode 1: Step-by-Step Guided Wizard */}
      {viewMode === 'wizard' && (
        <div className="guided-step-card" role="region" aria-label={`Step ${currentStepIndex + 1} of ${totalSteps}`}>
          <div className="step-indicator">
            Step {currentStepIndex + 1} of {totalSteps}
          </div>
          <h4 className="step-title">{currentStep.title}</h4>
          <p className="step-detail">{currentStep.detail}</p>

          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={isCurrentDone}
              onChange={() => handleToggleStep(currentStepIndex)}
              aria-label={`Mark step ${currentStepIndex + 1}: ${currentStep.title} as completed`}
            />
            <span>Mark step done</span>
          </label>

          <div className="button-row" style={{ marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentStepIndex === 0}
<<<<<<< HEAD
              aria-label="Go to previous step"
=======
              style={{ minHeight: '44px', padding: '0.6rem 1.25rem' }}
>>>>>>> feature/multi-mode-resume-jobs
            >
              &larr; Previous Step
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setCurrentStepIndex((prev) => Math.min(totalSteps - 1, prev + 1))}
              disabled={currentStepIndex === totalSteps - 1}
<<<<<<< HEAD
              aria-label="Go to next step"
=======
              style={{ minHeight: '44px', padding: '0.6rem 1.25rem' }}
>>>>>>> feature/multi-mode-resume-jobs
            >
              Next Step &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Mode 2: Full Checklist List View */}
      {viewMode === 'checklist' && (
        <ul style={{ listStyle: 'none', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {steps.map((step, idx) => {
            const isDone = completedSteps.has(idx);
            const inputId = `full-step-${idx}`;
            return (
              <li
                key={idx}
                style={{
                  background: isDone ? 'var(--color-success-bg)' : '#ffffff',
                  border: `2px solid ${isDone ? 'var(--color-success-border)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem'
                }}
              >
                <input
                  id={inputId}
                  type="checkbox"
                  checked={isDone}
                  onChange={() => handleToggleStep(idx)}
                  style={{ width: '1.3rem', height: '1.3rem', marginTop: '0.2rem', accentColor: 'var(--color-primary)' }}
                />
                <label htmlFor={inputId} style={{ cursor: 'pointer', flex: 1 }}>
                  <strong style={{ display: 'block', fontSize: '1.05rem', textDecoration: isDone ? 'line-through' : 'none' }}>
                    {idx + 1}. {step.title}
                  </strong>
                  <span style={{ fontSize: '0.95rem', color: isDone ? 'var(--color-text-subtle)' : 'var(--color-text-muted)' }}>
                    {step.detail}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/**
 * Main Results Component
 */
export default function Results({ analysis, onNewAnalysis, onEditProfile }) {
  const { hasMode } = useMode();
  if (!analysis) return null;
  if (hasMode('simplified')) {
    return <SimplifiedResults analysis={analysis} onNewAnalysis={onNewAnalysis} onEditProfile={onEditProfile} />;
  }

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
    applicationSteps = [],
    completedSteps = []
  } = analysis;

  const hasScore = typeof compatibilityScore === 'number';
  const isZeroScore = hasScore && compatibilityScore === 0;
  const isNullScore = compatibilityScore === null;
  const showGuidedSteps = hasScore && compatibilityScore > 0 && applicationSteps.length > 0;

  return (
    <div className="results-wrapper" aria-live="polite">
      {/* Top Banner with Title, Company, and Source Link */}
      <section className="card-section results-header-banner" aria-labelledby="job-headline-heading">
        <h2 id="job-headline-heading" className="job-headline">
          {jobTitle || 'Job Position'}
        </h2>
        <div className="company-subhead">
          Company: {company || 'Unknown Company'}
        </div>

        {sourceUrl && (
          <div style={{ marginTop: '0.5rem' }}>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="source-link"
<<<<<<< HEAD
              aria-label={`View original job page for ${jobTitle || 'job position'} (opens in new window)`}
=======
              aria-label={`View original job page for ${jobTitle || 'job'} (opens in new tab)`}
>>>>>>> feature/multi-mode-resume-jobs
            >
              <span>View original job page</span>
              <span aria-hidden="true">&#8599;</span>
            </a>
          </div>
        )}

        <div className="button-row" style={{ marginTop: '1.25rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onNewAnalysis}
            style={{ minHeight: '44px', padding: '0.6rem 1.25rem' }}
          >
            Analyze Another Job
          </button>
        </div>
      </section>

      {/* Summary - Always Shown */}
      <SummaryCard summary={summary} />

      {/* Compatibility Score - Always Shown */}
      <ScoreCard
        score={compatibilityScore}
        reason={scoreReason}
        matchedSkills={matchedSkills}
        missingSkills={missingSkills}
      />

      {/* Zero-Score Status Card: Shown when compatibilityScore is 0 */}
      {isZeroScore && (
        <section
          className="card-section"
          role="status"
          aria-labelledby="zero-score-heading"
          style={{ borderLeft: '5px solid var(--color-warning)' }}
        >
          <h3 id="zero-score-heading" className="section-title" style={{ color: 'var(--color-warning)' }}>
            Your profile does not match this job yet
          </h3>
          <p style={{ fontSize: '1.05rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            {scoreReason || 'Your current candidate profile does not have the skills or background required for this job.'}
          </p>

          {missingSkills.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Skills needed for this role:
              </h4>
              <ul style={{ listStyleType: 'disc', marginLeft: '1.25rem', color: 'var(--color-text-muted)' }}>
                {missingSkills.map((skill, idx) => (
                  <li key={idx} style={{ marginBottom: '0.25rem' }}>{skill}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="button-row">
            <button
              type="button"
              className="btn btn-primary"
              onClick={onEditProfile}
              style={{ minHeight: '44px', padding: '0.6rem 1.25rem' }}
            >
              Edit my profile
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onNewAnalysis}
              style={{ minHeight: '44px', padding: '0.6rem 1.25rem' }}
            >
              Analyze another job
            </button>
          </div>
        </section>
      )}

      {/* Null-Score Status Card: Shown when compatibilityScore is null */}
      {isNullScore && (
        <section
          className="card-section"
          role="status"
          aria-labelledby="null-score-heading"
          style={{ borderLeft: '5px solid var(--color-primary)' }}
        >
          <h3 id="null-score-heading" className="section-title">
            Add your profile to get a score
          </h3>
          <p style={{ fontSize: '1.05rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
            {scoreReason || 'We could not calculate a compatibility score because your profile is not set up yet.'}
          </p>
          <div className="button-row">
            <button
              type="button"
              className="btn btn-primary"
              onClick={onEditProfile}
              style={{ minHeight: '44px', padding: '0.6rem 1.25rem' }}
            >
              Edit my profile
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onNewAnalysis}
              style={{ minHeight: '44px', padding: '0.6rem 1.25rem' }}
            >
              Analyze another job
            </button>
          </div>
        </section>
      )}

      {/* Documents Needed - Always Shown */}
      <DocumentsList documents={documentsNeeded} />

      {/* Information Needed - Always Shown */}
      <InformationNeeded information={informationNeeded} />

      {/* Guided Apply Steps - Shown ONLY when score is above 0 */}
      {showGuidedSteps && (
        <GuidedApply
          applicationId={id}
          steps={applicationSteps}
          initialCompleted={completedSteps}
        />
      )}
    </div>
  );
}
