import React, { useState, useEffect, useRef } from 'react';
import { getProfile, updateProfile } from '../api.js';
import { useMode } from '../context/ModeContext.jsx';

/**
 * ProfileForm component
 *
 * Allows candidate to view and update their profile details.
 * Implements WCAG / Section 508 accessible form features:
 * - A Form Error Summary that receives focus after a failed submit with links to invalid fields.
 * - aria-invalid and aria-describedby on invalid fields.
 * - Inline accessible error messages linked via ID.
 * - Status announcements for screen readers upon save.
 * - Proper heading hierarchy (h2) under the page h1.
 */
export default function ProfileForm({ onProfileSaved, onContinueToAnalyze, profileIncompleteAlert }) {
  const { announce } = useMode();

  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    skillsString: '',
    yearsExperience: 0,
    education: '',
    summary: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: '' }
  const [isSavedComplete, setIsSavedComplete] = useState(false);
  const [errors, setErrors] = useState([]); // Array of { fieldId: string, message: string }

  const continueBtnRef = useRef(null);
  const errorSummaryRef = useRef(null);

  // Load profile on mount
  useEffect(() => {
    async function load() {
      try {
        const data = await getProfile();
        const skillsArr = Array.isArray(data.skills) ? data.skills : [];
        setProfile({
          fullName: data.fullName || '',
          email: data.email || '',
          skillsString: skillsArr.join(', '),
          yearsExperience: typeof data.yearsExperience === 'number' ? data.yearsExperience : 0,
          education: data.education || '',
          summary: data.summary || ''
        });

        // Check if initially complete
        const complete = Boolean(data.fullName && data.fullName.trim() && skillsArr.length > 0);
        setIsSavedComplete(complete);
        if (onProfileSaved) {
          onProfileSaved(data);
        }
      } catch (_err) {
        setStatus({
          type: 'error',
          message: 'Could not load your saved profile from the server.'
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [onProfileSaved]);

  // When saved as complete, move focus to the "Continue to Analyze a job" button
  useEffect(() => {
    if (isSavedComplete && status && status.type === 'success' && continueBtnRef.current) {
      continueBtnRef.current.focus();
    }
  }, [isSavedComplete, status]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value
    }));

    // Clear error for field if being corrected
    const fieldIdMap = {
      fullName: 'profile-fullname',
      skillsString: 'profile-skills',
      email: 'profile-email',
      yearsExperience: 'profile-experience'
    };
    const targetFieldId = fieldIdMap[name];
    if (targetFieldId && errors.some((err) => err.fieldId === targetFieldId)) {
      setErrors((prev) => prev.filter((err) => err.fieldId !== targetFieldId));
    }
  };

  // Helper to check if a field has an active error
  const getFieldError = (fieldId) => {
    const found = errors.find((err) => err.fieldId === fieldId);
    return found ? found.message : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    // Validate form inputs before submission
    const validationErrors = [];

    const trimmedName = profile.fullName.trim();
    if (!trimmedName) {
      validationErrors.push({
        fieldId: 'profile-fullname',
        message: 'Enter your full name'
      });
    }

    const skillsArray = profile.skillsString
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (skillsArray.length === 0) {
      validationErrors.push({
        fieldId: 'profile-skills',
        message: 'Enter at least one skill or technical tool (separated by commas)'
      });
    }

    const trimmedEmail = profile.email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      validationErrors.push({
        fieldId: 'profile-email',
        message: 'Enter a valid email address, like name@example.com'
      });
    }

    const expNum = Number(profile.yearsExperience);
    if (isNaN(expNum) || expNum < 0) {
      validationErrors.push({
        fieldId: 'profile-experience',
        message: 'Years of experience cannot be negative'
      });
    }

    // If validation fails, present error summary and move focus to it
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      announce(
        `Form submission failed with ${validationErrors.length} error${
          validationErrors.length > 1 ? 's' : ''
        }. Review the error summary above.`
      );
      setTimeout(() => {
        if (errorSummaryRef.current) {
          errorSummaryRef.current.focus();
        }
      }, 40);
      return;
    }

    // Clear validation errors and proceed to submit
    setErrors([]);
    setSaving(true);

    const payload = {
      fullName: trimmedName,
      email: trimmedEmail,
      skills: skillsArray,
      yearsExperience: expNum || 0,
      education: profile.education.trim(),
      summary: profile.summary.trim()
    };

    try {
      const res = await updateProfile(payload);
      const savedProfile = res.profile || payload;

      const complete = Boolean(
        savedProfile.fullName &&
          savedProfile.fullName.trim() &&
          savedProfile.skills &&
          savedProfile.skills.length > 0
      );
      setIsSavedComplete(complete);

      const successMsg = complete
        ? 'Your profile is saved and complete! You can now analyze job postings.'
        : 'Profile saved. Please add your full name and at least one skill to analyze jobs.';

      setStatus({
        type: 'success',
        message: successMsg
      });

      announce('Candidate profile saved successfully.');

      if (onProfileSaved) {
        onProfileSaved(savedProfile);
      }
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.message || 'Failed to update profile.'
      });
      announce(`Failed to save profile: ${err.message || 'Server error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="card-section" role="status" aria-live="polite" aria-label="Profile loading status">
        <p>Loading candidate profile...</p>
      </section>
    );
  }

  return (
    <section className="card-section" aria-labelledby="profile-heading">
      <h2 id="profile-heading" className="section-title">
        Candidate Details
      </h2>
      <p className="section-subtitle">
        AccessHire uses your profile to check how well your skills and background match each job posting.
      </p>

      {/* Form Error Summary: receives focus after a failed submit with direct links to fields */}
      {errors.length > 0 && (
        <div
          ref={errorSummaryRef}
          className="error-summary-box"
          role="alert"
          tabIndex={-1}
          aria-labelledby="profile-error-summary-heading"
        >
          <h2 id="profile-error-summary-heading" className="error-summary-heading">
            There is a problem
          </h2>
          <ul className="error-summary-list">
            {errors.map((err) => (
              <li key={err.fieldId}>
                <a
                  href={`#${err.fieldId}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const targetEl = document.getElementById(err.fieldId);
                    if (targetEl) {
                      targetEl.focus();
                      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

      {/* Alert shown when user attempted to navigate to Analyze before completing profile */}
      {profileIncompleteAlert && (
        <div
          className="alert-box error"
          role="alert"
          aria-live="assertive"
          style={{ marginBottom: '1.25rem' }}
        >
          <span aria-hidden="true">&#9888;</span>
          <div>
            <strong>Action Required:</strong> Please complete your profile first. We use it to check how well you match each job.
          </div>
        </div>
      )}

      {/* Save Status Notification */}
      {status && (
        <div
          className={`alert-box ${status.type}`}
          role={status.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          <span aria-hidden="true">{status.type === 'success' ? '✓' : '⚠'}</span>
          <div>{status.message}</div>
        </div>
      )}

      {/* Notice and button after saving complete profile */}
      {isSavedComplete && status && status.type === 'success' && (
        <div
          style={{
            backgroundColor: 'var(--color-primary-light)',
            border: '2px solid #bfdbfe',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div>
            <strong style={{ display: 'block', fontSize: '1.05rem', color: 'var(--color-primary)' }}>
              Ready for Job Analysis!
            </strong>
            <span style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>
              Your profile has the required details. You can now analyze job descriptions.
            </span>
          </div>
          <button
            ref={continueBtnRef}
            type="button"
            className="btn btn-primary"
            onClick={onContinueToAnalyze}
            aria-label="Continue to analyze a job posting"
            style={{ fontSize: '1.05rem', padding: '0.75rem 1.5rem' }}
          >
            Continue to Analyze a job &rarr;
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <fieldset disabled={saving}>
          <legend>Personal & Contact Details</legend>

          <div className="form-group">
            <label htmlFor="profile-fullname" className="form-label">
              Full Name <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <p className="form-help" id="name-help">
              Required. How you want to be addressed in applications.
            </p>
            {getFieldError('profile-fullname') && (
              <span id="profile-fullname-error" className="field-error-message" role="alert">
                <span className="sr-only">Error: </span>
                {getFieldError('profile-fullname')}
              </span>
            )}
            <input
              id="profile-fullname"
              name="fullName"
              type="text"
              className="form-input"
              value={profile.fullName}
              onChange={handleChange}
              placeholder="e.g. Alex Taylor"
              required
              aria-required="true"
              aria-invalid={Boolean(getFieldError('profile-fullname'))}
              aria-describedby={`name-help ${getFieldError('profile-fullname') ? 'profile-fullname-error' : ''}`.trim()}
            />
          </div>

          <div className="form-group">
            <label htmlFor="profile-email" className="form-label">
              Email Address
            </label>
            <p className="form-help" id="email-help">
              Optional. Contact email address for job opportunities.
            </p>
            {getFieldError('profile-email') && (
              <span id="profile-email-error" className="field-error-message" role="alert">
                <span className="sr-only">Error: </span>
                {getFieldError('profile-email')}
              </span>
            )}
            <input
              id="profile-email"
              name="email"
              type="email"
              className="form-input"
              value={profile.email}
              onChange={handleChange}
              placeholder="e.g. alex.taylor@example.com"
              aria-invalid={Boolean(getFieldError('profile-email'))}
              aria-describedby={`email-help ${getFieldError('profile-email') ? 'profile-email-error' : ''}`.trim()}
            />
          </div>
        </fieldset>

        <fieldset disabled={saving}>
          <legend>Skills & Background</legend>

          <div className="form-group">
            <label htmlFor="profile-skills" className="form-label">
              Skills (comma-separated) <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <p className="form-help" id="skills-help">
              Required. List at least one skill or technical tool, separated by commas.
            </p>
            {getFieldError('profile-skills') && (
              <span id="profile-skills-error" className="field-error-message" role="alert">
                <span className="sr-only">Error: </span>
                {getFieldError('profile-skills')}
              </span>
            )}
            <input
              id="profile-skills"
              name="skillsString"
              type="text"
              className="form-input"
              value={profile.skillsString}
              onChange={handleChange}
              placeholder="e.g. React, JavaScript, HTML, CSS, Communication, Problem Solving"
              required
              aria-required="true"
              aria-invalid={Boolean(getFieldError('profile-skills'))}
              aria-describedby={`skills-help ${getFieldError('profile-skills') ? 'profile-skills-error' : ''}`.trim()}
            />
          </div>

          <div className="form-group">
            <label htmlFor="profile-experience" className="form-label">
              Years of Experience
            </label>
            <p className="form-help" id="exp-help">
              Total years of relevant work, volunteer, or self-directed project experience.
            </p>
            {getFieldError('profile-experience') && (
              <span id="profile-experience-error" className="field-error-message" role="alert">
                <span className="sr-only">Error: </span>
                {getFieldError('profile-experience')}
              </span>
            )}
            <input
              id="profile-experience"
              name="yearsExperience"
              type="number"
              min="0"
              max="60"
              step="0.5"
              className="form-input"
              value={profile.yearsExperience}
              onChange={handleChange}
              aria-invalid={Boolean(getFieldError('profile-experience'))}
              aria-describedby={`exp-help ${getFieldError('profile-experience') ? 'profile-experience-error' : ''}`.trim()}
            />
          </div>

          <div className="form-group">
            <label htmlFor="profile-education" className="form-label">
              Education & Certifications
            </label>
            <p className="form-help" id="edu-help">
              Degrees, bootcamps, certificates, or self-taught background.
            </p>
            <input
              id="profile-education"
              name="education"
              type="text"
              className="form-input"
              value={profile.education}
              onChange={handleChange}
              placeholder="e.g. Self-Taught Developer / Web Accessibility Certificate"
              aria-describedby="edu-help"
            />
          </div>

          <div className="form-group">
            <label htmlFor="profile-summary" className="form-label">
              Professional Summary
            </label>
            <p className="form-help" id="summary-help">
              A brief 2–3 sentence overview of what kind of work you do and what you are looking for.
            </p>
            <textarea
              id="profile-summary"
              name="summary"
              rows="4"
              className="form-textarea"
              value={profile.summary}
              onChange={handleChange}
              placeholder="e.g. Frontend developer with 2 years of experience specializing in accessible web applications and semantic HTML."
              aria-describedby="summary-help"
            />
          </div>
        </fieldset>

        <div className="button-row">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            aria-label={saving ? 'Saving Profile...' : 'Save candidate profile'}
          >
            {saving ? 'Saving Profile...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </section>
  );
}
