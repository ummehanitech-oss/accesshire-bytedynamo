import React, { useState, useEffect } from 'react';
import { getResumeReadiness, tailorResume, renderResume } from '../api.js';
import { useMode } from '../context/ModeContext.jsx';

export default function ResumePanel({ applicationId, job, onNavigateToProfileStep }) {
  const [readiness, setReadiness] = useState(null);
  const [loadingReadiness, setLoadingReadiness] = useState(true);
  const [tailoring, setTailoring] = useState(false);
  const [tailoredResult, setTailoredResult] = useState(null);
  const [downloadingFormat, setDownloadingFormat] = useState(null);
  const [error, setError] = useState(null);

  const { announce } = useMode();

  useEffect(() => {
    let isMounted = true;
    async function loadReadiness() {
      setLoadingReadiness(true);
      setError(null);
      try {
        const data = await getResumeReadiness(applicationId);
        if (isMounted) {
          setReadiness(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Could not check resume readiness.');
        }
      } finally {
        if (isMounted) {
          setLoadingReadiness(false);
        }
      }
    }

    loadReadiness();
    return () => {
      isMounted = false;
    };
  }, [applicationId]);

  const handleCreateResume = async () => {
    setError(null);
    setTailoring(true);
    announce('Creating your tailored resume with AI...');

    try {
      const res = await tailorResume({ applicationId, job });
      setTailoredResult(res);
      announce('Resume ready. You can preview it below and download it.');
    } catch (err) {
      const msg = err.message || 'Could not tailor your resume. Please check your profile and try again.';
      setError(msg);
      announce(`Resume generation failed: ${msg}`);
    } finally {
      setTailoring(false);
    }
  };

  const handleDownload = async (format) => {
    if (!tailoredResult || !tailoredResult.resume) return;

    setError(null);
    setDownloadingFormat(format);
    const formatLabel = format === 'pdf' ? 'PDF' : 'Word (.docx)';
    announce(`Downloading your ${formatLabel} resume...`);

    try {
      await renderResume({ resume: tailoredResult.resume, format });
      announce(`Downloaded your ${formatLabel} resume.`);
    } catch (err) {
      const msg = err.message || `Could not download ${formatLabel} resume.`;
      setError(msg);
      announce(`Download error: ${msg}`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  if (loadingReadiness) {
    return (
      <div className="resume-panel" role="status" aria-live="polite">
        <p>Checking resume readiness...</p>
      </div>
    );
  }

  const canGenerate = readiness?.canGenerate ?? false;
  const missingItems = readiness?.missing || [];
  const warningItems = readiness?.warnings || [];
  const jobGaps = readiness?.jobGaps || [];
  const resume = tailoredResult?.resume;
  const notes = tailoredResult?.notes || [];

  return (
    <section className="resume-panel" aria-labelledby="resume-panel-heading">
      <div className="resume-panel-header">
        <div>
          <h3 id="resume-panel-heading" className="resume-panel-title">
            Tailored Resume
          </h3>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>
            Generate and download an honest, accessible single-column resume tailored for this position.
          </p>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="alert-box error" role="alert" style={{ marginBottom: '1rem' }}>
          <span aria-hidden="true">&#9888;</span>
          <div>{error}</div>
        </div>
      )}

      {/* Job Skill Gaps Reminder */}
      {jobGaps.length > 0 && (
        <div className="resume-gaps-box" role="note" aria-label="Job skill recommendations">
          <strong style={{ display: 'block', color: '#1e40af', marginBottom: '0.25rem' }}>
            Optional Skill Match Tips:
          </strong>
          <p style={{ margin: 0, fontSize: '0.95rem', color: '#1e3a8a' }}>
            This job asks for{' '}
            <strong>{jobGaps.map(g => g.skill).join(', ')}</strong>.
            If you have experience with these, add them to your profile to strengthen your match.
          </p>
        </div>
      )}

      {/* Readiness Check: Blockers */}
      {!canGenerate && (
        <div className="resume-readiness-box" role="region" aria-label="Required profile details needed">
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-danger, #dc2626)', fontSize: '1.05rem' }}>
            Details needed before creating your resume:
          </h4>
          <ul style={{ margin: '0 0 1rem 0', paddingLeft: '1.25rem' }}>
            {missingItems.map((item, idx) => (
              <li key={idx} style={{ marginBottom: '0.5rem' }}>
                <strong>{item.label}:</strong> {item.reason}{' '}
                {onNavigateToProfileStep && (
                  <button
                    type="button"
                    onClick={() => onNavigateToProfileStep(item.profileStep)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary)',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      padding: 0,
                      fontWeight: 600
                    }}
                  >
                    Go to Section {item.profileStep}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Readiness Check: Optional Warnings */}
      {canGenerate && !tailoredResult && warningItems.length > 0 && (
        <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
          <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600 }}>Optional recommendations for a stronger resume:</p>
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            {warningItems.map((w, idx) => (
              <li key={idx}>{w.reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Button: Create Resume */}
      {!tailoredResult && (
        <div style={{ marginTop: '1rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCreateResume}
            disabled={!canGenerate || tailoring}
            style={{ minHeight: '44px', fontSize: '1rem', padding: '0.75rem 1.5rem' }}
          >
            {tailoring ? 'Creating my resume for this job...' : 'Create my resume for this job'}
          </button>
        </div>
      )}

      {/* AI Coaching Notes */}
      {notes.length > 0 && (
        <div className="resume-notes-box" role="region" aria-label="AI coaching advice">
          <strong style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
            Resume Feedback & Coaching:
          </strong>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.95rem' }}>
            {notes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Tailored Resume Accessible HTML Preview */}
      {resume && (
        <div className="resume-preview-box" role="region" aria-label="Resume Preview">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h4 className="resume-preview-name">{resume.fullName}</h4>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Preview</span>
          </div>

          <p className="resume-preview-contact">
            {[
              resume.email,
              resume.phone,
              resume.location,
              resume.links?.linkedin,
              resume.links?.github,
              resume.links?.portfolio
            ].filter(Boolean).join('  |  ')}
          </p>

          {/* Summary */}
          {resume.summary && (
            <div className="resume-preview-section">
              <h5 className="resume-preview-heading">Summary</h5>
              <p style={{ margin: 0, lineHeight: 1.6 }}>{resume.summary}</p>
            </div>
          )}

          {/* Skills */}
          {resume.skills && resume.skills.length > 0 && (
            <div className="resume-preview-section">
              <h5 className="resume-preview-heading">Skills</h5>
              <p style={{ margin: 0, lineHeight: 1.6 }}>{resume.skills.join(', ')}</p>
            </div>
          )}

          {/* Experience */}
          {resume.experience && resume.experience.length > 0 && (
            <div className="resume-preview-section">
              <h5 className="resume-preview-heading">Work Experience</h5>
              {resume.experience.map(exp => (
                <div key={exp.id} style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <strong>{exp.role} — {exp.company}</strong>
                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                      {[exp.startDate ? `${exp.startDate} to ${exp.endDate || 'Present'}` : '', exp.location].filter(Boolean).join(' | ')}
                    </span>
                  </div>
                  {Array.isArray(exp.bullets) && exp.bullets.length > 0 && (
                    <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '1.25rem', lineHeight: 1.5 }}>
                      {exp.bullets.map((b, bIdx) => (
                        <li key={bIdx}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Projects */}
          {resume.projects && resume.projects.length > 0 && (
            <div className="resume-preview-section">
              <h5 className="resume-preview-heading">Projects</h5>
              {resume.projects.map(prj => (
                <div key={prj.id} style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <strong>{prj.name}</strong>
                    {prj.link && (
                      <a href={prj.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem' }}>
                        View project (opens in a new tab)
                      </a>
                    )}
                  </div>
                  {prj.technologies && prj.technologies.length > 0 && (
                    <p style={{ margin: '0.1rem 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      Technologies: {prj.technologies.join(', ')}
                    </p>
                  )}
                  {prj.description && <p style={{ margin: '0.25rem 0 0 0', lineHeight: 1.5 }}>{prj.description}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Education */}
          {resume.educationEntries && resume.educationEntries.length > 0 && (
            <div className="resume-preview-section">
              <h5 className="resume-preview-heading">Education</h5>
              {resume.educationEntries.map(ed => (
                <p key={ed.id} style={{ margin: '0 0 0.35rem 0' }}>
                  <strong>{ed.degree}</strong>, {ed.institution} {ed.year ? `(${ed.year})` : ''}
                  {ed.details ? ` — ${ed.details}` : ''}
                </p>
              ))}
            </div>
          )}

          {/* Certifications */}
          {resume.certifications && resume.certifications.length > 0 && (
            <div className="resume-preview-section">
              <h5 className="resume-preview-heading">Certifications</h5>
              {resume.certifications.map(crt => (
                <p key={crt.id} style={{ margin: '0 0 0.35rem 0' }}>
                  <strong>{crt.name}</strong> — {crt.issuer} {crt.year ? `(${crt.year})` : ''}
                </p>
              ))}
            </div>
          )}

          {/* Languages */}
          {resume.languages && resume.languages.length > 0 && (
            <div className="resume-preview-section">
              <h5 className="resume-preview-heading">Languages</h5>
              <p style={{ margin: 0 }}>{resume.languages.join(', ')}</p>
            </div>
          )}

          {/* Download Action Buttons */}
          <div className="resume-download-actions" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleDownload('docx')}
              disabled={downloadingFormat !== null}
            >
              {downloadingFormat === 'docx' ? 'Downloading Word (.docx)...' : 'Download Word (.docx)'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleDownload('pdf')}
              disabled={downloadingFormat !== null}
            >
              {downloadingFormat === 'pdf' ? 'Downloading PDF...' : 'Download PDF'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCreateResume}
              disabled={tailoring || downloadingFormat !== null}
              style={{ marginLeft: 'auto' }}
            >
              {tailoring ? 'Re-tailoring...' : 'Re-create Resume'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
