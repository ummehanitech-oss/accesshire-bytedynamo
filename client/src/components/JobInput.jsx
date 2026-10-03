import React, { useState, useRef } from 'react';

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
  const [jobText, setJobText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Reference to paste textarea so focus can move there on error
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Handle Paste Analysis
  const handleAnalyzeText = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmed = jobText.trim();
    if (!trimmed) {
      setErrorMessage('Please paste a job description before analyzing.');
      if (textareaRef.current) textareaRef.current.focus();
      return;
    }

    if (trimmed.length < 200) {
      setErrorMessage('The pasted job description is too short (minimum 200 characters needed).');
      if (textareaRef.current) textareaRef.current.focus();
      return;
    }

    try {
      await onAnalyzeText(trimmed);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to analyze job description.');
      if (textareaRef.current) textareaRef.current.focus();
    }
  };

  // Handle File Upload Analysis
  const handleAnalyzeFile = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedFile) {
      setErrorMessage('Please select a .txt or .pdf file to upload.');
      return;
    }

    try {
      await onAnalyzeFile(selectedFile);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to analyze uploaded file.');
      // Move focus to paste textarea so user can continue by pasting
      if (textareaRef.current) textareaRef.current.focus();
    }
  };

  // Handle URL Import Analysis
  const handleAnalyzeUrl = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedUrl = urlInput.trim();
    if (!trimmedUrl) {
      setErrorMessage('Please enter a job page link to import.');
      return;
    }

    try {
      await onAnalyzeUrl(trimmedUrl);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to read web page.');
      // Move focus to paste textarea so user can continue by pasting
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  // Fill in sample job text
  const handleUseSample = () => {
    setJobText(SAMPLE_JOB_TEXT);
    setErrorMessage('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Clear all inputs
  const handleClearAll = () => {
    setJobText('');
    setSelectedFile(null);
    setUrlInput('');
    setErrorMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (textareaRef.current) textareaRef.current.focus();
  };

  return (
    <section className="card-section" aria-labelledby="job-input-heading">
      <h2 id="job-input-heading" className="section-title">
        Analyze a Job Posting
      </h2>
      <p className="section-subtitle">
        Choose any of the three input methods below. AccessHire will simplify the posting, check your compatibility, and build an application checklist.
      </p>

      {/* Error Message with role="alert" */}
      {errorMessage && (
        <div
          id="job-input-error-msg"
          className="alert-box error"
          role="alert"
          aria-live="assertive"
        >
          <span aria-hidden="true">&#9888;</span>
          <div>
            <strong>Action Needed:</strong> {errorMessage}
          </div>
        </div>
      )}

      {/* Loading Status Indicator with role="status" */}
      {loading && (
        <div
          className="alert-box info"
          role="status"
          aria-live="polite"
        >
          <span>&#8987;</span>
          <div>{loadingStatus || 'Analyzing job description with Gemini...'}</div>
        </div>
      )}

      {/* Input Method 1: Paste Text */}
      <form onSubmit={handleAnalyzeText} style={{ marginBottom: '2rem' }}>
        <fieldset disabled={loading}>
          <legend>Method 1: Paste Text</legend>
          <div className="form-group">
            <label htmlFor="job-paste-textarea" className="form-label">
              Paste the job description
            </label>
            <p className="form-help" id="paste-help-text">
              Paste between 200 and 12,000 characters from any job advertisement.
            </p>
            <textarea
              id="job-paste-textarea"
              ref={textareaRef}
              className="form-textarea"
              rows="8"
              value={jobText}
              onChange={(e) => {
                setJobText(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="Paste job posting text here..."
              aria-describedby={`paste-help-text ${errorMessage ? 'job-input-error-msg' : ''}`.trim()}
              aria-invalid={Boolean(errorMessage)}
            />
          </div>

          <div className="button-row">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !jobText.trim()}
            >
              Analyze Job
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleUseSample}
              disabled={loading}
            >
              Use Sample Job
            </button>

            {jobText && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setJobText('')}
                disabled={loading}
              >
                Clear Text
              </button>
            )}
          </div>
        </fieldset>
      </form>

      {/* Input Method 2: File Upload */}
      <form onSubmit={handleAnalyzeFile} style={{ marginBottom: '2rem' }}>
        <fieldset disabled={loading}>
          <legend>Method 2: Upload File</legend>
          <div className="form-group">
            <label htmlFor="job-file-upload" className="form-label">
              Or upload a .txt or .pdf file
            </label>
            <p className="form-help" id="file-help-text">
              Accepts .txt and .pdf documents up to 5 MB. Files are processed in memory and never stored on disk.
            </p>
            <input
              id="job-file-upload"
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf,text/plain,application/pdf"
              onChange={(e) => {
                const file = e.target.files && e.target.files[0];
                setSelectedFile(file || null);
                if (errorMessage) setErrorMessage('');
              }}
              aria-describedby={`file-help-text ${errorMessage ? 'job-input-error-msg' : ''}`.trim()}
            />
          </div>

          <div className="button-row">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !selectedFile}
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
                }}
                disabled={loading}
              >
                Clear File
              </button>
            )}
          </div>
        </fieldset>
      </form>

      {/* Input Method 3: Import from URL */}
      <form onSubmit={handleAnalyzeUrl}>
        <fieldset disabled={loading}>
          <legend>Method 3: Import from Link</legend>
          <div className="form-group">
            <label htmlFor="job-url-input" className="form-label">
              Or import from a job page link
            </label>
            <p className="form-help" id="url-help-text">
              Works on many public job pages. If it fails, paste the text instead.
            </p>
            <input
              id="job-url-input"
              type="url"
              className="form-input"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="https://example.com/careers/frontend-developer"
              aria-describedby={`url-help-text ${errorMessage ? 'job-input-error-msg' : ''}`.trim()}
            />
          </div>

          <div className="button-row">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !urlInput.trim()}
            >
              Import and Analyze
            </button>

            {urlInput && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setUrlInput('')}
                disabled={loading}
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
