import React, { useState, useRef } from 'react';
import { useMode } from '../context/ModeContext.jsx';

// Built-in realistic sample job description (> 200 characters)
const SAMPLE_JOB_TEXT = `Frontend Accessibility Specialist (Remote)

About Acme Health Solutions:
Acme Health Solutions provides patient care management tools used by thousands of clinics across the country. We are committed to making our digital healthcare tools usable by everyone.

Role Summary:
We are seeking a Frontend Developer focused on Web Accessibility to join our engineering team. You will audit existing web applications, fix accessibility issues, and build new accessible UI components using React and semantic HTML.

Key Responsibilities:
- Audit web applications against WCAG 2.1 AA accessibility guidelines.
- Build and refactor responsive React components with keyboard navigation and ARIA attributes.
- Collaborate with product designers to review color contrast and screen reader workflows.
- Write clear documentation and unit tests for accessible design patterns.

Requirements:
- Strong experience with JavaScript, React, HTML5, and CSS.
- Understanding of web accessibility standards (WCAG 2.1 AA) and semantic markup.
- Clear communication skills and attention to user needs.

How to Apply:
Please submit your resume and a link to your portfolio or GitHub. Include a brief note describing an accessibility improvement you have worked on.`;

export default function JobInput({ onAnalyzeText, onAnalyzeFile, onAnalyzeUrl, loading, loadingStatus }) {
  const { announce } = useMode();

  const [jobText, setJobText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [errors, setErrors] = useState([]); // Array of { fieldId: string, message: string }

  // References for focus management
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const urlInputRef = useRef(null);
  const errorSummaryRef = useRef(null);

  // Helper to get error for a specific field
  const getFieldError = (fieldId) => {
    const found = errors.find((err) => err.fieldId === fieldId);
    return found ? found.message : null;
  };

  // Move focus to error summary helper
  const triggerErrorSummary = (newErrors, announcementText) => {
    setErrors(newErrors);
    if (announce && announcementText) {
      announce(announcementText);
    }
    setTimeout(() => {
      if (errorSummaryRef.current) {
        errorSummaryRef.current.focus();
      }
    }, 40);
  };

  // Handle Paste Analysis
  const handleAnalyzeText = async (e) => {
    e.preventDefault();
    setErrors([]);

    const trimmed = jobText.trim();
    if (!trimmed) {
      triggerErrorSummary(
        [{ fieldId: 'job-paste-textarea', message: 'Enter a job description to analyze' }],
        'Submission error: Enter a job description to analyze.'
      );
      return;
    }

    if (trimmed.length < 200) {
      triggerErrorSummary(
        [{ fieldId: 'job-paste-textarea', message: 'The pasted job description must be at least 200 characters long' }],
        'Submission error: The job description must be at least 200 characters long.'
      );
      return;
    }

    try {
      await onAnalyzeText(trimmed);
    } catch (err) {
      triggerErrorSummary(
        [{ fieldId: 'job-paste-textarea', message: err.message || 'Failed to analyze job description.' }],
        `Analysis failed: ${err.message || 'Server error'}`
      );
    }
  };

  // Handle File Upload Analysis
  const handleAnalyzeFile = async (e) => {
    e.preventDefault();
    setErrors([]);

    if (!selectedFile) {
      triggerErrorSummary(
        [{ fieldId: 'job-file-upload', message: 'Select a .txt or .pdf file to upload' }],
        'Submission error: Select a .txt or .pdf file to upload.'
      );
      return;
    }

    try {
      await onAnalyzeFile(selectedFile);
    } catch (err) {
      triggerErrorSummary(
        [{ fieldId: 'job-file-upload', message: err.message || 'Failed to analyze uploaded file.' }],
        `File analysis failed: ${err.message || 'Server error'}`
      );
    }
  };

  // Handle URL Import Analysis
  const handleAnalyzeUrl = async (e) => {
    e.preventDefault();
    setErrors([]);

    const trimmedUrl = urlInput.trim();
    if (!trimmedUrl) {
      triggerErrorSummary(
        [{ fieldId: 'job-url-input', message: 'Enter a web link to a job posting' }],
        'Submission error: Enter a web link to a job posting.'
      );
      return;
    }

    if (!/^https?:\/\//i.test(trimmedUrl)) {
      triggerErrorSummary(
        [{ fieldId: 'job-url-input', message: 'Enter a valid web link starting with http:// or https://' }],
        'Submission error: Enter a valid web link starting with http:// or https://'
      );
      return;
    }

    try {
      await onAnalyzeUrl(trimmedUrl);
    } catch (err) {
      triggerErrorSummary(
        [{ fieldId: 'job-url-input', message: err.message || 'Failed to read web page.' }],
        `Web import failed: ${err.message || 'Server error'}`
      );
    }
  };

  // Fill in sample job text
  const handleUseSample = () => {
    setJobText(SAMPLE_JOB_TEXT);
    setErrors([]);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <section className="card-section" aria-labelledby="job-input-heading">
      <h2 id="job-input-heading" className="section-title">
        Job Description Input
      </h2>
      <p className="section-subtitle">
        Choose any of the three input methods below. AccessHire will simplify the posting, check your compatibility, and build an application checklist.
      </p>

      {/* Accessible Form Error Summary */}
      {errors.length > 0 && (
        <div
          ref={errorSummaryRef}
          className="error-summary-box"
          role="alert"
          tabIndex={-1}
          aria-labelledby="job-error-summary-heading"
        >
          <h2 id="job-error-summary-heading" className="error-summary-heading">
            There is a problem
          </h2>
          <ul className="error-summary-list">
            {errors.map((err) => (
              <li key={err.fieldId}>
                <a
                  href={`#${err.fieldId}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById(err.fieldId);
                    if (el) {
                      el.focus();
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                >
                  {err.message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Loading Status Indicator with role="status" */}
      {loading && (
        <div
          className="alert-box info"
          role="status"
          aria-live="polite"
        >
          <span aria-hidden="true">&#8987;</span>
          <div>{loadingStatus || 'Analyzing job description with Gemini...'}</div>
        </div>
      )}

      {/* Input Method 1: Paste Text */}
      <form onSubmit={handleAnalyzeText} style={{ marginBottom: '2rem' }} noValidate>
        <fieldset disabled={loading}>
          <legend>Method 1: Paste Text</legend>
          <div className="form-group">
            <label htmlFor="job-paste-textarea" className="form-label">
              Paste the job description
            </label>
            <p className="form-help" id="paste-help-text">
              Paste between 200 and 12,000 characters from any job advertisement.
            </p>
            {getFieldError('job-paste-textarea') && (
              <span id="paste-inline-error" className="field-error-message" role="alert">
                <span className="sr-only">Error: </span>
                {getFieldError('job-paste-textarea')}
              </span>
            )}
            <textarea
              id="job-paste-textarea"
              ref={textareaRef}
              className="form-textarea"
              rows="8"
              value={jobText}
              onChange={(e) => {
                setJobText(e.target.value);
                if (getFieldError('job-paste-textarea')) {
                  setErrors((prev) => prev.filter((err) => err.fieldId !== 'job-paste-textarea'));
                }
              }}
              placeholder="Paste job posting text here..."
              aria-describedby={`paste-help-text ${getFieldError('job-paste-textarea') ? 'paste-inline-error' : ''}`.trim()}
              aria-invalid={Boolean(getFieldError('job-paste-textarea'))}
            />
          </div>

          <div className="button-row">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !jobText.trim()}
              aria-label="Analyze pasted job description"
            >
              Analyze Job
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleUseSample}
              disabled={loading}
              aria-label="Load sample job description for testing"
            >
              Use Sample Job
            </button>

            {jobText && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setJobText('');
                  setErrors((prev) => prev.filter((err) => err.fieldId !== 'job-paste-textarea'));
                }}
                disabled={loading}
                aria-label="Clear pasted job description"
              >
                Clear Text
              </button>
            )}
          </div>
        </fieldset>
      </form>

      {/* Input Method 2: File Upload */}
      <form onSubmit={handleAnalyzeFile} style={{ marginBottom: '2rem' }} noValidate>
        <fieldset disabled={loading}>
          <legend>Method 2: Upload File</legend>
          <div className="form-group">
            <label htmlFor="job-file-upload" className="form-label">
              Or upload a .txt or .pdf file
            </label>
            <p className="form-help" id="file-help-text">
              Accepts .txt and .pdf documents up to 5 MB. Files are processed in memory and never stored on disk.
            </p>
            {getFieldError('job-file-upload') && (
              <span id="file-inline-error" className="field-error-message" role="alert">
                <span className="sr-only">Error: </span>
                {getFieldError('job-file-upload')}
              </span>
            )}
            <input
              id="job-file-upload"
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf,text/plain,application/pdf"
              onChange={(e) => {
                const file = e.target.files && e.target.files[0];
                setSelectedFile(file || null);
                if (getFieldError('job-file-upload')) {
                  setErrors((prev) => prev.filter((err) => err.fieldId !== 'job-file-upload'));
                }
              }}
              aria-describedby={`file-help-text ${getFieldError('job-file-upload') ? 'file-inline-error' : ''}`.trim()}
              aria-invalid={Boolean(getFieldError('job-file-upload'))}
            />
          </div>

          <div className="button-row">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !selectedFile}
              aria-label="Upload and analyze selected document"
            >
              Upload and Analyze
            </button>

            {selectedFile && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                  setErrors((prev) => prev.filter((err) => err.fieldId !== 'job-file-upload'));
                }}
                disabled={loading}
                aria-label="Clear selected file"
              >
                Clear File
              </button>
            )}
          </div>
        </fieldset>
      </form>

      {/* Input Method 3: Import from URL */}
      <form onSubmit={handleAnalyzeUrl} noValidate>
        <fieldset disabled={loading}>
          <legend>Method 3: Import from Link</legend>
          <div className="form-group">
            <label htmlFor="job-url-input" className="form-label">
              Or import from a job page link
            </label>
            <p className="form-help" id="url-help-text">
              Works on many public job pages. If it fails, paste the text instead.
            </p>
            {getFieldError('job-url-input') && (
              <span id="url-inline-error" className="field-error-message" role="alert">
                <span className="sr-only">Error: </span>
                {getFieldError('job-url-input')}
              </span>
            )}
            <input
              id="job-url-input"
              ref={urlInputRef}
              type="url"
              className="form-input"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                if (getFieldError('job-url-input')) {
                  setErrors((prev) => prev.filter((err) => err.fieldId !== 'job-url-input'));
                }
              }}
              placeholder="https://example.com/careers/frontend-developer"
              aria-describedby={`url-help-text ${getFieldError('job-url-input') ? 'url-inline-error' : ''}`.trim()}
              aria-invalid={Boolean(getFieldError('job-url-input'))}
            />
          </div>

          <div className="button-row">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !urlInput.trim()}
              aria-label="Import and analyze job from web address"
            >
              Import and Analyze
            </button>

            {urlInput && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setUrlInput('');
                  setErrors((prev) => prev.filter((err) => err.fieldId !== 'job-url-input'));
                }}
                disabled={loading}
                aria-label="Clear job web address"
              >
                Clear URL
              </button>
            )}
          </div>
        </fieldset>
      </form>
    </section>
  );
}
