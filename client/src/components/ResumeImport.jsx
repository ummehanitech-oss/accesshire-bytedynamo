import React, { useState, useRef } from 'react';
import { importResume } from '../api.js';
import { useMode } from '../context/ModeContext.jsx';

export default function ResumeImport({ onImportSuccess, hasExistingData }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [successNotice, setSuccessNotice] = useState(null);
  const [stagedProfile, setStagedProfile] = useState(null);
  const [mergeChoice, setMergeChoice] = useState('fill-empty'); // 'replace' | 'fill-empty'

  const fileInputRef = useRef(null);
  const { announce } = useMode();

  const handleFileChange = (e) => {
    const selected = e.target.files && e.target.files[0];
    setError(null);
    setSuccessNotice(null);
    setStagedProfile(null);

    if (!selected) {
      setFile(null);
      return;
    }

    // Client-side extension check
    const validExtensions = ['.pdf', '.docx', '.txt'];
    const name = selected.name.toLowerCase();
    const isValid = validExtensions.some(ext => name.endsWith(ext));

    if (!isValid) {
      setError('Please select a PDF (.pdf), Word document (.docx), or plain text file (.txt).');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setError('File is too large. Maximum allowed size is 5 MB.');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFile(selected);
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please choose a file to import.');
      return;
    }

    setError(null);
    setSuccessNotice(null);
    setStagedProfile(null);
    setLoading(true);
    announce('Reading and extracting details from your resume with Gemini AI...');

    try {
      const res = await importResume(file);
      const imported = res.profile;
      const resWarnings = res.warnings || [];

      setWarnings(resWarnings);

      if (hasExistingData) {
        // If user already has profile fields filled, ask how to merge
        setStagedProfile(imported);
        announce('Resume parsed. Please choose whether to replace your existing details or only fill empty fields.');
      } else {
        // Directly apply
        applyImportedData(imported, 'replace');
      }
    } catch (err) {
      const msg = err.message || 'Failed to extract text from resume. Please try another file.';
      setError(msg);
      announce(`Resume import failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const applyImportedData = (dataToApply, mode) => {
    onImportSuccess(dataToApply, mode);
    setStagedProfile(null);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    const doneMsg = 'We filled in your profile from your resume. Please check each section, then save.';
    setSuccessNotice(doneMsg);
    announce(doneMsg);
  };

  return (
    <div className="resume-import-card">
      <div className="resume-import-header">
        <span aria-hidden="true" style={{ fontSize: '1.25rem' }}>📄</span>
        <h3 className="resume-import-title">
          Import Resume to Fill Profile
        </h3>
      </div>
      <p className="resume-import-desc">
        Upload your existing resume to automatically pre-fill contact details, skills, experience, projects, and education. Nothing is saved until you review and click Save.
      </p>

      {/* Error state */}
      {error && (
        <div className="alert-box error" role="alert" style={{ marginBottom: '1rem' }}>
          <span aria-hidden="true">&#9888;</span>
          <div>{error}</div>
        </div>
      )}

      {/* Success notification */}
      {successNotice && (
        <div className="alert-box success" role="status" aria-live="polite" style={{ marginBottom: '1rem' }}>
          <span aria-hidden="true">✓</span>
          <div>
            <strong>Success:</strong> {successNotice}
            {warnings.length > 0 && (
              <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.25rem', fontSize: '0.9rem' }}>
                {warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Staged review choice when user has existing profile details */}
      {stagedProfile && (
        <div
          className="resume-import-review"
          role="region"
          aria-label="Review imported resume details"
        >
          <strong className="resume-import-review-title">
            Review Imported Details
          </strong>
          <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem' }}>
            We detected details for <strong>{stagedProfile.fullName || 'Candidate'}</strong> with{' '}
            {stagedProfile.skills ? stagedProfile.skills.length : 0} skills,{' '}
            {stagedProfile.experience ? stagedProfile.experience.length : 0} roles, and{' '}
            {stagedProfile.educationEntries ? stagedProfile.educationEntries.length : 0} education entries.
            How would you like to apply these to your existing profile?
          </p>

          <fieldset className="resume-import-review-options">
            <legend className="sr-only">How to apply imported resume data</legend>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label className="resume-import-radio-label">
                <input
                  type="radio"
                  name="mergeOption"
                  value="fill-empty"
                  checked={mergeChoice === 'fill-empty'}
                  onChange={() => setMergeChoice('fill-empty')}
                />
                Only fill empty fields (preserve my current entries)
              </label>

              <label className="resume-import-radio-label">
                <input
                  type="radio"
                  name="mergeOption"
                  value="replace"
                  checked={mergeChoice === 'replace'}
                  onChange={() => setMergeChoice('replace')}
                />
                Replace my current details with the resume details
              </label>
            </div>
          </fieldset>

          <div className="resume-import-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => applyImportedData(stagedProfile, mergeChoice)}
            >
              Apply to Profile Form
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setStagedProfile(null)}
            >
              Cancel Import
            </button>
          </div>
        </div>
      )}

      {/* Upload Form */}
      {!stagedProfile && (
        <form onSubmit={handleImport} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="resume-file-input" className="form-label">
              Upload your resume (PDF, Word or text, up to 5 MB)
            </label>
            <p className="form-help" id="resume-file-help">
              Accepted formats: .pdf, .docx, .txt. Scanned image-only PDFs are not supported.
            </p>
            <input
              ref={fileInputRef}
              id="resume-file-input"
              type="file"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              onChange={handleFileChange}
              disabled={loading}
              aria-describedby="resume-file-help"
              className="resume-file-input"
            />
          </div>

          <div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!file || loading}
              style={{ minHeight: '44px' }}
            >
              {loading ? 'Reading and Extracting with AI...' : 'Import Resume'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
