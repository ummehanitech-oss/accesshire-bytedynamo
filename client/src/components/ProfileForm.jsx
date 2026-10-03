import React, { useState, useEffect, useRef } from 'react';
import { getProfile, updateProfile } from '../api.js';
import { useMode } from '../context/ModeContext.jsx';

export default function ProfileForm({ onProfileSaved, onContinueToAnalyze, profileIncompleteAlert }) {
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
  const [errors, setErrors] = useState([]); // Form validation errors list
  const [isSavedComplete, setIsSavedComplete] = useState(false);

  const continueBtnRef = useRef(null);
  const errorSummaryRef = useRef(null);
  const { announce } = useMode();

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
      } catch (err) {
        setStatus({
          type: 'error',
          message: 'Could not load your saved profile from the server.'
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // When saved as complete, move focus to the "Continue to Analyze a job" button
  useEffect(() => {
    if (isSavedComplete && status && status.type === 'success' && continueBtnRef.current) {
      continueBtnRef.current.focus();
    }
  }, [isSavedComplete, status]);

  // When form validation fails, move focus to the error summary
  useEffect(() => {
    if (errors.length > 0 && errorSummaryRef.current) {
      errorSummaryRef.current.focus();
    }
  }, [errors]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    // Client-side validation for accessible error summary
    const validationErrors = [];
    if (!profile.fullName.trim()) {
      validationErrors.push({
        fieldId: 'profile-fullname',
        message: 'Full name is required. Please enter your name.'
      });
    }

    // Convert comma-separated string to string array
    const skillsArray = profile.skillsString
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (skillsArray.length === 0) {
      validationErrors.push({
        fieldId: 'profile-skills',
        message: 'At least one skill is required. Please enter your skills separated by commas.'
      });
    }

    if (profile.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) {
      validationErrors.push({
        fieldId: 'profile-email',
        message: 'Email address must be in a valid format (e.g. name@example.com).'
      });
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      announce(`Form submission failed with ${validationErrors.length} error${validationErrors.length > 1 ? 's' : ''}.`);
      return;
    }

    setErrors([]);
    setSaving(true);

    const payload = {
      fullName: profile.fullName.trim(),
      email: profile.email.trim(),
      skills: skillsArray,
      yearsExperience: Number(profile.yearsExperience) || 0,
      education: profile.education.trim(),
      summary: profile.summary.trim()
    };

    try {
      const res = await updateProfile(payload);
      const savedProfile = res.profile || payload;

      // Check completeness: fullName must be filled and at least 1 skill
      const complete = Boolean(savedProfile.fullName && savedProfile.fullName.trim() && savedProfile.skills && savedProfile.skills.length > 0);
      setIsSavedComplete(complete);

      setStatus({
        type: 'success',
        message: complete
          ? 'Your profile is saved and complete! You can now analyze job postings.'
          : 'Profile saved. Please add your full name and at least one skill to analyze jobs.'
      });

      announce('Profile saved successfully.');

      if (onProfileSaved) {
        onProfileSaved(savedProfile);
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to update profile.';
      setStatus({
        type: 'error',
        message: errorMsg
      });
      setErrors([{ fieldId: 'profile-fullname', message: errorMsg }]);
      announce(`Profile save failed: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="card-section" role="status" aria-live="polite">
        <p>Loading candidate profile...</p>
      </section>
    );
  }

  return (
    <section className="card-section" aria-labelledby="profile-heading">
      <h2 id="profile-heading" className="section-title">
        My Candidate Profile
      </h2>
      <p className="section-subtitle">
        AccessHire uses your profile to check how well your skills and background match each job posting.
      </p>

      {/* Alert shown when user tried to open Analyze before completing profile */}
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

      {/* Clear continue button after saving complete profile */}
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
            style={{ fontSize: '1.05rem', padding: '0.75rem 1.5rem' }}
          >
            Continue to Analyze a job &rarr;
          </button>
        </div>
      )}

      {/* Form Error Summary: receives focus on failed submit */}
      {errors.length > 0 && (
        <div
          ref={errorSummaryRef}
          tabIndex={-1}
          role="alert"
          aria-labelledby="profile-error-summary-title"
          className="alert-box error"
          style={{
            outline: '3px solid var(--color-danger)',
            outlineOffset: '2px',
            display: 'block',
            marginBottom: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span aria-hidden="true">&#9888;</span>
            <h3 id="profile-error-summary-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
              There is a problem ({errors.length} {errors.length === 1 ? 'error' : 'errors'})
            </h3>
          </div>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>
            Please review and correct the errors below, or select a link to jump directly to the field:
          </p>
          <ul style={{ paddingLeft: '1.5rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {errors.map((err, idx) => (
              <li key={idx}>
                <a
                  href={`#${err.fieldId}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById(err.fieldId);
                    if (el) el.focus();
                  }}
                  style={{ color: 'var(--color-danger)', fontWeight: 700, textDecoration: 'underline' }}
                >
                  {err.message}
                </a>
              </li>
            ))}
          </ul>
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
            <input
              id="profile-fullname"
              name="fullName"
              type="text"
              className="form-input"
              value={profile.fullName}
              onChange={handleChange}
              placeholder="e.g. Jane Doe"
              required
              aria-required="true"
              aria-invalid={errors.some(e => e.fieldId === 'profile-fullname') ? 'true' : undefined}
              aria-describedby={errors.some(e => e.fieldId === 'profile-fullname') ? 'fullname-error name-help' : 'name-help'}
            />
            {errors.find(e => e.fieldId === 'profile-fullname') && (
              <p id="fullname-error" style={{ color: 'var(--color-danger)', fontWeight: 700, fontSize: '0.9rem', marginTop: '0.35rem' }}>
                {errors.find(e => e.fieldId === 'profile-fullname').message}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="profile-email" className="form-label">
              Email Address
            </label>
            <p className="form-help" id="email-help">
              Optional. Contact email address for job opportunities.
            </p>
            <input
              id="profile-email"
              name="email"
              type="email"
              className="form-input"
              value={profile.email}
              onChange={handleChange}
              placeholder="e.g. jane.doe@example.com"
              aria-invalid={errors.some(e => e.fieldId === 'profile-email') ? 'true' : undefined}
              aria-describedby={errors.some(e => e.fieldId === 'profile-email') ? 'email-error email-help' : 'email-help'}
            />
            {errors.find(e => e.fieldId === 'profile-email') && (
              <p id="email-error" style={{ color: 'var(--color-danger)', fontWeight: 700, fontSize: '0.9rem', marginTop: '0.35rem' }}>
                {errors.find(e => e.fieldId === 'profile-email').message}
              </p>
            )}
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
              aria-invalid={errors.some(e => e.fieldId === 'profile-skills') ? 'true' : undefined}
              aria-describedby={errors.some(e => e.fieldId === 'profile-skills') ? 'skills-error skills-help' : 'skills-help'}
            />
            {errors.find(e => e.fieldId === 'profile-skills') && (
              <p id="skills-error" style={{ color: 'var(--color-danger)', fontWeight: 700, fontSize: '0.9rem', marginTop: '0.35rem' }}>
                {errors.find(e => e.fieldId === 'profile-skills').message}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="profile-experience" className="form-label">
              Years of Experience
            </label>
            <p className="form-help" id="exp-help">
              Total years of relevant work, volunteer, or self-directed project experience.
            </p>
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
              aria-describedby="exp-help"
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
          >
            {saving ? 'Saving Profile...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </section>
  );
}
