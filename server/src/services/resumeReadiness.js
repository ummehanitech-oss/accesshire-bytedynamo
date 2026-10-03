/**
 * Resume Readiness Evaluation Service
 * Evaluates whether a candidate profile has the necessary content to generate a resume,
 * identifies non-blocking recommendations, and calculates job-specific skill gaps.
 * Deterministic code (no AI required).
 */

/**
 * Check whether a profile can generate a resume and find missing sections or skill gaps.
 *
 * @param {object} profile - Candidate profile object
 * @param {object} [application] - Optional saved application or job analysis
 * @returns {object} { canGenerate: boolean, missing: Array, warnings: Array, jobGaps: Array }
 */
export function checkResumeReadiness(profile = {}, application = null) {
  const missing = [];
  const warnings = [];

  const fullName = typeof profile.fullName === 'string' ? profile.fullName.trim() : '';
  const email = typeof profile.email === 'string' ? profile.email.trim() : '';
  const phone = typeof profile.phone === 'string' ? profile.phone.trim() : '';
  const location = typeof profile.location === 'string' ? profile.location.trim() : '';
  const summary = typeof profile.summary === 'string' ? profile.summary.trim() : '';

  const experience = Array.isArray(profile.experience) ? profile.experience : [];
  const projects = Array.isArray(profile.projects) ? profile.projects : [];
  const educationEntries = Array.isArray(profile.educationEntries) ? profile.educationEntries : [];
  const skills = Array.isArray(profile.skills) ? profile.skills : [];

  // Required blockers
  if (!fullName) {
    missing.push({
      section: 'contact',
      label: 'Full Name',
      reason: 'A resume must include your name so employers know who you are.',
      profileStep: 1
    });
  }

  if (!email) {
    missing.push({
      section: 'contact',
      label: 'Email Address',
      reason: 'Employers need an email address to contact you for interviews.',
      profileStep: 1
    });
  }

  const hasBackground = experience.length > 0 || projects.length > 0 || educationEntries.length > 0;
  if (!hasBackground) {
    missing.push({
      section: 'background',
      label: 'Work Experience, Projects, or Education',
      reason: 'Add at least one job, project, or education entry so your resume has content to show employers.',
      profileStep: 3
    });
  }

  const canGenerate = missing.length === 0;

  // Non-blocking warnings
  if (!phone) {
    warnings.push({
      section: 'contact',
      label: 'Phone Number',
      reason: 'Adding a phone number helps recruiters reach you quickly.',
      profileStep: 1
    });
  }

  if (!location) {
    warnings.push({
      section: 'contact',
      label: 'Location',
      reason: 'Adding your city or region helps employers know where you are based.',
      profileStep: 1
    });
  }

  if (!summary) {
    warnings.push({
      section: 'summary',
      label: 'Professional Summary',
      reason: 'A brief summary introduces your strengths and goals to recruiters.',
      profileStep: 2
    });
  }

  // Check if any experience entry lacks bullets
  const hasEmptyBullets = experience.some(exp => !Array.isArray(exp.bullets) || exp.bullets.filter(b => String(b).trim()).length === 0);
  if (experience.length > 0 && hasEmptyBullets) {
    warnings.push({
      section: 'experience',
      label: 'Experience Details',
      reason: 'Adding bullet points to your roles shows your specific accomplishments.',
      profileStep: 3
    });
  }

  // Calculate job skill gaps (missing skills from job analysis not currently in candidate profile)
  const jobGaps = [];
  if (application) {
    const candidateSkillsLower = new Set(skills.map(s => String(s).toLowerCase().trim()));
    const missingSkillsList = Array.isArray(application.missingSkills)
      ? application.missingSkills
      : (Array.isArray(application.requiredSkills)
          ? application.requiredSkills.filter(req => !candidateSkillsLower.has(String(req).toLowerCase().trim()))
          : []);

    for (const skill of missingSkillsList) {
      const trimmed = String(skill).trim();
      if (trimmed && !candidateSkillsLower.has(trimmed.toLowerCase())) {
        if (!jobGaps.some(g => g.skill.toLowerCase() === trimmed.toLowerCase())) {
          jobGaps.push({ skill: trimmed });
        }
      }
    }
  }

  return {
    canGenerate,
    missing,
    warnings,
    jobGaps
  };
}
