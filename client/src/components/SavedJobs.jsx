import React, { useState, useEffect } from 'react';
import { getApplications, getApplicationById, deleteApplication } from '../api.js';

export default function SavedJobs({ onSelectJob }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: '' }

  // Load saved jobs on mount
  const loadSavedJobs = async () => {
    try {
      setLoading(true);
      const data = await getApplications();
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      setStatus({
        type: 'error',
        message: 'Could not load saved job applications.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedJobs();
  }, []);

  // Open saved job
  const handleOpen = async (jobId) => {
    try {
      const fullJob = await getApplicationById(jobId);
      if (fullJob && onSelectJob) {
        onSelectJob(fullJob);
      }
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.message || 'Could not load job details.'
      });
    }
  };

  // Delete saved job
  const handleDelete = async (jobId, jobTitle) => {
    const confirmed = window.confirm(`Are you sure you want to remove "${jobTitle}" from your saved jobs?`);
    if (!confirmed) return;

    try {
      await deleteApplication(jobId);
      setJobs(prev => prev.filter(j => j.id !== jobId));
      setStatus({
        type: 'success',
        message: `Removed "${jobTitle}" from your saved jobs.`
      });
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.message || 'Failed to remove job.'
      });
    }
  };

  if (loading) {
    return (
      <section className="card-section" role="status" aria-live="polite">
        <p>Loading saved job analyses...</p>
      </section>
    );
  }

  return (
    <section className="card-section" aria-labelledby="saved-jobs-heading">
      <h2 id="saved-jobs-heading" className="section-title">
        Saved Job Applications ({jobs.length})
      </h2>
      <p className="section-subtitle">
        Review your past analyses, continue your checklist progress, and track your applications.
      </p>

      {status && (
        <div
          className={`alert-box ${status.type}`}
          role={status.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          <span>{status.type === 'success' ? '✓' : '⚠'}</span>
          <div>{status.message}</div>
        </div>
      )}

      {jobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-muted)' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No saved jobs yet.</p>
          <p style={{ fontSize: '0.95rem' }}>
            Whenever you analyze a job posting using text, file upload, or a web link, it will be automatically saved here.
          </p>
        </div>
      ) : (
        <ul className="saved-jobs-list" style={{ listStyle: 'none' }}>
          {jobs.map((job) => {
            const completedCount = Array.isArray(job.completedSteps) ? job.completedSteps.length : 0;
            const totalSteps = job.totalSteps || 0;
            const scoreText = job.compatibilityScore !== null ? `${job.compatibilityScore}% match` : 'No score';

            return (
              <li key={job.id} className="saved-job-card">
                <div className="saved-job-info" style={{ flex: 1, minWidth: '240px' }}>
                  <h3>{job.jobTitle}</h3>
                  <div className="saved-job-meta">
                    <strong>{job.company}</strong> &bull; Score: {scoreText} &bull;{' '}
                    {totalSteps > 0 ? `Completed ${completedCount} of ${totalSteps} steps` : 'No checklist steps'}
                  </div>

                  {job.sourceUrl && (
                    <div style={{ marginTop: '0.35rem' }}>
                      <a
                        href={job.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="source-link"
                      >
                        <span>View original job page</span>
                        <span aria-hidden="true">&#8599;</span>
                      </a>
                    </div>
                  )}
                </div>

                <div className="saved-job-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleOpen(job.id)}
                    aria-label={`Open analysis for ${job.jobTitle}`}
                    style={{ minHeight: '40px', padding: '0.5rem 1rem' }}
                  >
                    Open Analysis
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleDelete(job.id, job.jobTitle)}
                    aria-label={`Delete ${job.jobTitle}`}
                    style={{ minHeight: '40px', padding: '0.5rem 0.75rem' }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
