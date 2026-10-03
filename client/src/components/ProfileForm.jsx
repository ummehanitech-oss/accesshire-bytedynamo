import React, { useState, useEffect, useRef } from 'react';
import { getProfile, updateProfile } from '../api.js';
import { useMode } from '../context/ModeContext.jsx';
<<<<<<< HEAD
=======
import ResumeImport from './ResumeImport.jsx';

// Available Adzuna search country options
const COUNTRY_OPTIONS = [
  { code: 'in', name: 'India (in)' },
  { code: 'us', name: 'United States (us)' },
  { code: 'gb', name: 'United Kingdom (gb)' },
  { code: 'ca', name: 'Canada (ca)' },
  { code: 'au', name: 'Australia (au)' },
  { code: 'de', name: 'Germany (de)' },
  { code: 'fr', name: 'France (fr)' },
  { code: 'sg', name: 'Singapore (sg)' },
  { code: 'za', name: 'South Africa (za)' },
  { code: 'nz', name: 'New Zealand (nz)' },
  { code: 'at', name: 'Austria (at)' },
  { code: 'be', name: 'Belgium (be)' },
  { code: 'br', name: 'Brazil (br)' },
  { code: 'ch', name: 'Switzerland (ch)' },
  { code: 'es', name: 'Spain (es)' },
  { code: 'it', name: 'Italy (it)' },
  { code: 'mx', name: 'Mexico (mx)' },
  { code: 'nl', name: 'Netherlands (nl)' },
  { code: 'pl', name: 'Poland (pl)' },
  { code: 'ru', name: 'Russia (ru)' }
];

const SECTIONS = [
  { id: 1, title: 'Contact', short: 'Contact' },
  { id: 2, title: 'Summary and skills', short: 'Summary & Skills' },
  { id: 3, title: 'Work experience', short: 'Work Experience' },
  { id: 4, title: 'Projects', short: 'Projects' },
  { id: 5, title: 'Education', short: 'Education' },
  { id: 6, title: 'Certifications and languages', short: 'Certs & Languages' }
];
>>>>>>> feature/multi-mode-resume-jobs

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
    phone: '',
    location: '',
    country: 'in',
    links: { linkedin: '', github: '', portfolio: '', other: [] },
    summary: '',
    skillsString: '',
    yearsExperience: 0,
    experience: [],
    projects: [],
    educationEntries: [],
    certifications: [],
    languagesString: ''
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: '' }
  const [errors, setErrors] = useState([]); // Form validation errors list
  const [isSavedComplete, setIsSavedComplete] = useState(false);
  const [errors, setErrors] = useState([]); // Array of { fieldId: string, message: string }

  const sectionHeadingRef = useRef(null);
  const errorSummaryRef = useRef(null);
  const continueBtnRef = useRef(null);
<<<<<<< HEAD
  const errorSummaryRef = useRef(null);
=======
  const pendingFocusIdRef = useRef(null);
>>>>>>> feature/multi-mode-resume-jobs

  const { announce, openModeSelect, modes, modeInfo } = useMode();

  // Load profile on initial mount
  useEffect(() => {
    async function load() {
      try {
        const data = await getProfile();
        const skillsArr = Array.isArray(data.skills) ? data.skills : [];
        const langsArr = Array.isArray(data.languages) ? data.languages : [];
        const rawLinks = data.links || {};

        setProfile({
          fullName: data.fullName || '',
          email: data.email || '',
          phone: data.phone || '',
          location: data.location || '',
          country: data.country || 'in',
          links: {
            linkedin: rawLinks.linkedin || '',
            github: rawLinks.github || '',
            portfolio: rawLinks.portfolio || '',
            other: Array.isArray(rawLinks.other) ? rawLinks.other : []
          },
          summary: data.summary || '',
          skillsString: skillsArr.join(', '),
          yearsExperience: typeof data.yearsExperience === 'number' ? data.yearsExperience : 0,
          experience: Array.isArray(data.experience) ? data.experience : [],
          projects: Array.isArray(data.projects) ? data.projects : [],
          educationEntries: Array.isArray(data.educationEntries) ? data.educationEntries : [],
          certifications: Array.isArray(data.certifications) ? data.certifications : [],
          languagesString: langsArr.join(', ')
        });

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

  // Handle focus movement after state updates (e.g. adding new items)
  useEffect(() => {
    if (pendingFocusIdRef.current) {
      const el = document.getElementById(pendingFocusIdRef.current);
      if (el) {
        el.focus();
        pendingFocusIdRef.current = null;
      }
    }
  });

  // Focus error summary when validation fails
  useEffect(() => {
    if (errors.length > 0 && errorSummaryRef.current) {
      errorSummaryRef.current.focus();
    }
  }, [errors]);

  // Handle section navigation (non-linear)
  const goToSection = (stepNum) => {
    setErrors([]);
    setStatus(null);
    setCurrentStep(stepNum);
    const targetSection = SECTIONS.find(s => s.id === stepNum);
    announce(`Navigated to section ${stepNum} of 6: ${targetSection ? targetSection.title : ''}`);
    setTimeout(() => {
      if (sectionHeadingRef.current) {
        sectionHeadingRef.current.focus();
      }
    }, 50);
  };

  // Change handlers
  const handleBasicChange = (e) => {
    const { name, value } = e.target;
<<<<<<< HEAD
    setProfile((prev) => ({
=======
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleLinkChange = (field, value) => {
    setProfile(prev => ({
>>>>>>> feature/multi-mode-resume-jobs
      ...prev,
      links: {
        ...prev.links,
        [field]: value
      }
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

<<<<<<< HEAD
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
=======
  const handleOtherLinkChange = (index, value) => {
    setProfile(prev => {
      const newOther = [...prev.links.other];
      newOther[index] = value;
      return {
        ...prev,
        links: {
          ...prev.links,
          other: newOther
        }
      };
    });
  };

  const addOtherLink = () => {
    const newIdx = profile.links.other.length;
    setProfile(prev => ({
      ...prev,
      links: {
        ...prev.links,
        other: [...prev.links.other, '']
      }
    }));
    pendingFocusIdRef.current = `profile-link-other-${newIdx}`;
    announce('Added new link input');
  };

  const removeOtherLink = (index) => {
    setProfile(prev => ({
      ...prev,
      links: {
        ...prev.links,
        other: prev.links.other.filter((_, idx) => idx !== index)
      }
    }));
    announce('Removed link');
  };

  // Experience handlers
  const addExperience = () => {
    const newId = `exp_${Date.now()}`;
    const newEntry = {
      id: newId,
      company: '',
      role: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      bullets: ['']
>>>>>>> feature/multi-mode-resume-jobs
    };
    setProfile(prev => ({
      ...prev,
      experience: [...prev.experience, newEntry]
    }));
    pendingFocusIdRef.current = `exp-company-${newId}`;
    announce('Added new work experience entry');
  };

  const updateExperience = (id, field, value) => {
    setProfile(prev => ({
      ...prev,
      experience: prev.experience.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'current' && value === true) {
            updated.endDate = '';
          }
          return updated;
        }
        return item;
      })
    }));
  };

  const removeExperience = (id, companyName, roleName) => {
    setProfile(prev => ({
      ...prev,
      experience: prev.experience.filter(item => item.id !== id)
    }));
    announce(`Removed work experience: ${companyName || 'Untitled'} ${roleName || ''}`);
  };

  const addBullet = (expId) => {
    let bulletIdx = 0;
    setProfile(prev => ({
      ...prev,
      experience: prev.experience.map(item => {
        if (item.id === expId) {
          const bullets = Array.isArray(item.bullets) ? [...item.bullets, ''] : [''];
          bulletIdx = bullets.length - 1;
          return { ...item, bullets };
        }
        return item;
      })
    }));
    pendingFocusIdRef.current = `exp-bullet-${expId}-${bulletIdx}`;
    announce('Added new bullet point');
  };

  const updateBullet = (expId, bulletIdx, value) => {
    setProfile(prev => ({
      ...prev,
      experience: prev.experience.map(item => {
        if (item.id === expId) {
          const bullets = [...(item.bullets || [])];
          bullets[bulletIdx] = value;
          return { ...item, bullets };
        }
        return item;
      })
    }));
  };

  const removeBullet = (expId, bulletIdx) => {
    setProfile(prev => ({
      ...prev,
      experience: prev.experience.map(item => {
        if (item.id === expId) {
          return { ...item, bullets: (item.bullets || []).filter((_, idx) => idx !== bulletIdx) };
        }
        return item;
      })
    }));
    announce(`Removed bullet line ${bulletIdx + 1}`);
  };

  // Projects handlers
  const addProject = () => {
    const newId = `prj_${Date.now()}`;
    const newEntry = {
      id: newId,
      name: '',
      description: '',
      technologies: [],
      techString: '',
      link: ''
    };
    setProfile(prev => ({
      ...prev,
      projects: [...prev.projects, newEntry]
    }));
    pendingFocusIdRef.current = `prj-name-${newId}`;
    announce('Added new project entry');
  };

  const updateProject = (id, field, value) => {
    setProfile(prev => ({
      ...prev,
      projects: prev.projects.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'techString') {
            updated.technologies = value.split(',').map(s => s.trim()).filter(Boolean);
          }
          return updated;
        }
        return item;
      })
    }));
  };

  const removeProject = (id, projectName) => {
    setProfile(prev => ({
      ...prev,
      projects: prev.projects.filter(item => item.id !== id)
    }));
    announce(`Removed project: ${projectName || 'Untitled'}`);
  };

  // Education handlers
  const addEducation = () => {
    const newId = `edu_${Date.now()}`;
    const newEntry = {
      id: newId,
      degree: '',
      institution: '',
      year: '',
      details: ''
    };
    setProfile(prev => ({
      ...prev,
      educationEntries: [...prev.educationEntries, newEntry]
    }));
    pendingFocusIdRef.current = `edu-degree-${newId}`;
    announce('Added new education entry');
  };

  const updateEducation = (id, field, value) => {
    setProfile(prev => ({
      ...prev,
      educationEntries: prev.educationEntries.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const removeEducation = (id, degreeName) => {
    setProfile(prev => ({
      ...prev,
      educationEntries: prev.educationEntries.filter(item => item.id !== id)
    }));
    announce(`Removed education: ${degreeName || 'Untitled'}`);
  };

  // Certifications handlers
  const addCertification = () => {
    const newId = `crt_${Date.now()}`;
    const newEntry = {
      id: newId,
      name: '',
      issuer: '',
      year: ''
    };
    setProfile(prev => ({
      ...prev,
      certifications: [...prev.certifications, newEntry]
    }));
    pendingFocusIdRef.current = `crt-name-${newId}`;
    announce('Added new certification entry');
  };

  const updateCertification = (id, field, value) => {
    setProfile(prev => ({
      ...prev,
      certifications: prev.certifications.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const removeCertification = (id, certName) => {
    setProfile(prev => ({
      ...prev,
      certifications: prev.certifications.filter(item => item.id !== id)
    }));
    announce(`Removed certification: ${certName || 'Untitled'}`);
  };

  // Validate only the current section before saving
  const validateSection = (stepNum) => {
    const validationErrors = [];

    if (stepNum === 1) {
      if (!profile.fullName.trim()) {
        validationErrors.push({
          fieldId: 'profile-fullname',
          message: 'Full name is required. Please enter your name.'
        });
      }
      if (profile.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) {
        validationErrors.push({
          fieldId: 'profile-email',
          message: 'Email address must be in a valid format (e.g. name@example.com).'
        });
      }
    }

    if (stepNum === 2) {
      const skills = profile.skillsString.split(',').map(s => s.trim()).filter(Boolean);
      if (skills.length === 0) {
        validationErrors.push({
          fieldId: 'profile-skills',
          message: 'At least one skill is required. Please enter your skills separated by commas.'
        });
      }
    }

    return validationErrors;
  };

  // Save current section (PUT merge)
  const handleSaveSection = async (andNext = false) => {
    setStatus(null);
    const validationErrors = validateSection(currentStep);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      announce(`Section has ${validationErrors.length} validation error${validationErrors.length > 1 ? 's' : ''}.`);
      return;
    }

    setErrors([]);
    setSaving(true);

    // Build section-specific payload for PUT merge
    let payload = {};
    if (currentStep === 1) {
      payload = {
        fullName: profile.fullName.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim(),
        location: profile.location.trim(),
        country: profile.country.trim().toLowerCase(),
        links: profile.links
      };
    } else if (currentStep === 2) {
      payload = {
        summary: profile.summary.trim(),
        skills: profile.skillsString.split(',').map(s => s.trim()).filter(Boolean),
        yearsExperience: Number(profile.yearsExperience) || 0
      };
    } else if (currentStep === 3) {
      payload = {
        experience: profile.experience
      };
    } else if (currentStep === 4) {
      payload = {
        projects: profile.projects.map(p => ({
          ...p,
          technologies: Array.isArray(p.technologies) && p.technologies.length > 0
            ? p.technologies
            : (typeof p.techString === 'string' ? p.techString.split(',').map(s => s.trim()).filter(Boolean) : [])
        }))
      };
    } else if (currentStep === 5) {
      payload = {
        educationEntries: profile.educationEntries
      };
    } else if (currentStep === 6) {
      payload = {
        certifications: profile.certifications,
        languages: profile.languagesString.split(',').map(s => s.trim()).filter(Boolean)
      };
    }

    try {
      const res = await updateProfile(payload);
      const savedProfile = res.profile || payload;

<<<<<<< HEAD
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
=======
      // Update completeness status
      const hasName = Boolean(savedProfile.fullName && savedProfile.fullName.trim());
      const hasSkills = Array.isArray(savedProfile.skills) && savedProfile.skills.length > 0;
      const complete = hasName && hasSkills;
      setIsSavedComplete(complete);

      announce('Saved');
      setStatus({
        type: 'success',
        message: complete
          ? 'Profile section saved! Your profile is complete and ready for job analysis.'
          : 'Section saved! Add your full name and at least one skill to complete your profile.'
>>>>>>> feature/multi-mode-resume-jobs
      });

      announce('Candidate profile saved successfully.');

      if (onProfileSaved) {
        onProfileSaved(savedProfile);
      }

      if (andNext && currentStep < 6) {
        goToSection(currentStep + 1);
      }
    } catch (err) {
<<<<<<< HEAD
      setStatus({
        type: 'error',
        message: err.message || 'Failed to update profile.'
      });
      announce(`Failed to save profile: ${err.message || 'Server error'}`);
=======
      const errorMsg = err.message || 'Failed to save profile.';
      setStatus({ type: 'error', message: errorMsg });
      announce(`Save failed: ${errorMsg}`);
>>>>>>> feature/multi-mode-resume-jobs
    } finally {
      setSaving(false);
    }
  };

  const hasExistingData = Boolean(
    (profile.fullName && profile.fullName.trim()) ||
    (profile.email && profile.email.trim()) ||
    (profile.skillsString && profile.skillsString.trim()) ||
    (profile.summary && profile.summary.trim()) ||
    (Array.isArray(profile.experience) && profile.experience.length > 0) ||
    (Array.isArray(profile.projects) && profile.projects.length > 0) ||
    (Array.isArray(profile.educationEntries) && profile.educationEntries.length > 0)
  );

  const handleResumeImported = (imported, mergeMode) => {
    if (mergeMode === 'replace') {
      const skillsArr = Array.isArray(imported.skills) ? imported.skills : [];
      const langsArr = Array.isArray(imported.languages) ? imported.languages : [];
      const rawLinks = imported.links || {};

      setProfile({
        fullName: imported.fullName || '',
        email: imported.email || '',
        phone: imported.phone || '',
        location: imported.location || '',
        country: imported.country || 'in',
        links: {
          linkedin: rawLinks.linkedin || '',
          github: rawLinks.github || '',
          portfolio: rawLinks.portfolio || '',
          other: Array.isArray(rawLinks.other) ? rawLinks.other : []
        },
        summary: imported.summary || '',
        skillsString: skillsArr.join(', '),
        yearsExperience: typeof imported.yearsExperience === 'number' ? imported.yearsExperience : 0,
        experience: Array.isArray(imported.experience)
          ? imported.experience.map(e => ({
              id: e.id || `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              company: e.company || '',
              role: e.role || '',
              location: e.location || '',
              startDate: e.startDate || '',
              endDate: e.endDate || '',
              current: Boolean(e.current),
              bullets: Array.isArray(e.bullets) ? e.bullets : []
            }))
          : [],
        projects: Array.isArray(imported.projects)
          ? imported.projects.map(p => ({
              id: p.id || `prj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              name: p.name || '',
              description: p.description || '',
              technologies: Array.isArray(p.technologies) ? p.technologies : [],
              techString: Array.isArray(p.technologies) ? p.technologies.join(', ') : '',
              link: p.link || ''
            }))
          : [],
        educationEntries: Array.isArray(imported.educationEntries)
          ? imported.educationEntries.map(ed => ({
              id: ed.id || `edu_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              degree: ed.degree || '',
              institution: ed.institution || '',
              year: ed.year || '',
              details: ed.details || ''
            }))
          : [],
        certifications: Array.isArray(imported.certifications)
          ? imported.certifications.map(c => ({
              id: c.id || `crt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              name: c.name || '',
              issuer: c.issuer || '',
              year: c.year || ''
            }))
          : [],
        languagesString: langsArr.join(', ')
      });
    } else {
      // 'fill-empty': Only fill empty fields, preserve current non-empty entries
      setProfile(prev => {
        const existingSkills = prev.skillsString ? prev.skillsString.split(',').map(s => s.trim()).filter(Boolean) : [];
        const importedSkills = Array.isArray(imported.skills) ? imported.skills : [];
        const combinedSkills = existingSkills.length > 0 ? existingSkills : importedSkills;

        const existingLangs = prev.languagesString ? prev.languagesString.split(',').map(s => s.trim()).filter(Boolean) : [];
        const importedLangs = Array.isArray(imported.languages) ? imported.languages : [];
        const combinedLangs = existingLangs.length > 0 ? existingLangs : importedLangs;

        const rawLinks = imported.links || {};

        return {
          ...prev,
          fullName: prev.fullName.trim() ? prev.fullName : (imported.fullName || ''),
          email: prev.email.trim() ? prev.email : (imported.email || ''),
          phone: prev.phone.trim() ? prev.phone : (imported.phone || ''),
          location: prev.location.trim() ? prev.location : (imported.location || ''),
          country: prev.country || imported.country || 'in',
          links: {
            linkedin: prev.links.linkedin.trim() ? prev.links.linkedin : (rawLinks.linkedin || ''),
            github: prev.links.github.trim() ? prev.links.github : (rawLinks.github || ''),
            portfolio: prev.links.portfolio.trim() ? prev.links.portfolio : (rawLinks.portfolio || ''),
            other: prev.links.other.length > 0 ? prev.links.other : (Array.isArray(rawLinks.other) ? rawLinks.other : [])
          },
          summary: prev.summary.trim() ? prev.summary : (imported.summary || ''),
          skillsString: combinedSkills.join(', '),
          yearsExperience: prev.yearsExperience > 0 ? prev.yearsExperience : (imported.yearsExperience || 0),
          experience: prev.experience.length > 0
            ? prev.experience
            : (Array.isArray(imported.experience)
                ? imported.experience.map(e => ({
                    id: e.id || `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                    company: e.company || '',
                    role: e.role || '',
                    location: e.location || '',
                    startDate: e.startDate || '',
                    endDate: e.endDate || '',
                    current: Boolean(e.current),
                    bullets: Array.isArray(e.bullets) ? e.bullets : []
                  }))
                : []),
          projects: prev.projects.length > 0
            ? prev.projects
            : (Array.isArray(imported.projects)
                ? imported.projects.map(p => ({
                    id: p.id || `prj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                    name: p.name || '',
                    description: p.description || '',
                    technologies: Array.isArray(p.technologies) ? p.technologies : [],
                    techString: Array.isArray(p.technologies) ? p.technologies.join(', ') : '',
                    link: p.link || ''
                  }))
                : []),
          educationEntries: prev.educationEntries.length > 0
            ? prev.educationEntries
            : (Array.isArray(imported.educationEntries)
                ? imported.educationEntries.map(ed => ({
                    id: ed.id || `edu_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                    degree: ed.degree || '',
                    institution: ed.institution || '',
                    year: ed.year || '',
                    details: ed.details || ''
                  }))
                : []),
          certifications: prev.certifications.length > 0
            ? prev.certifications
            : (Array.isArray(imported.certifications)
                ? imported.certifications.map(c => ({
                    id: c.id || `crt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                    name: c.name || '',
                    issuer: c.issuer || '',
                    year: c.year || ''
                  }))
                : []),
          languagesString: combinedLangs.join(', ')
        };
      });
    }

    // Go to step 1 to review from beginning
    setCurrentStep(1);
  };

  if (loading) {
    return (
      <section className="card-section" role="status" aria-live="polite" aria-label="Profile loading status">
        <p>Loading candidate profile...</p>
      </section>
    );
  }

  const currentSectionMeta = SECTIONS.find(s => s.id === currentStep) || SECTIONS[0];

  return (
    <section className="card-section" aria-labelledby="profile-heading">
      <h2 id="profile-heading" className="section-title">
        Candidate Details
      </h2>
      <p className="section-subtitle">
        AccessHire uses your profile to check how well your skills and background match each job posting and build tailored resumes.
      </p>

<<<<<<< HEAD
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
=======
      {/* Resume Import Component */}
      <ResumeImport
        onImportSuccess={handleResumeImported}
        hasExistingData={hasExistingData}
      />

      {/* Alert shown when user tried to open Analyze before completing profile */}
>>>>>>> feature/multi-mode-resume-jobs
      {profileIncompleteAlert && (
        <div
          className="alert-box error"
          role="alert"
          aria-live="assertive"
          style={{ marginBottom: '1.25rem' }}
        >
          <span aria-hidden="true">&#9888;</span>
          <div>
            <strong>Action Required:</strong> Please complete your profile first (full name and at least one skill). We use it to check how well you match each job.
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

<<<<<<< HEAD
      {/* Notice and button after saving complete profile */}
      {isSavedComplete && status && status.type === 'success' && (
=======
      {/* Continue to Analyze Button when profile is complete */}
      {isSavedComplete && (
>>>>>>> feature/multi-mode-resume-jobs
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
              Your profile has the required details. You can continue polishing other sections or start analyzing jobs.
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

      {/* Guided Progress Stepper */}
      <nav className="profile-stepper-nav" aria-label="Profile Sections Navigation">
        <ol className="profile-stepper-list">
          {SECTIONS.map((sec) => (
            <li key={sec.id}>
              <button
                type="button"
                className="profile-step-btn"
                aria-current={currentStep === sec.id ? 'step' : undefined}
                onClick={() => goToSection(sec.id)}
              >
                <span className="profile-step-badge">{sec.id}</span>
                <span>{sec.short}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      {/* Active Section Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3
          ref={sectionHeadingRef}
          tabIndex={-1}
          style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}
        >
          Step {currentStep} of 6: {currentSectionMeta.title}
        </h3>
        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
          Progress is saved section by section. You can jump to any section at any time.
        </p>
      </div>

      {/* Form Error Summary */}
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
            <h4 id="profile-error-summary-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
              There is a problem ({errors.length} {errors.length === 1 ? 'error' : 'errors'})
            </h4>
          </div>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>
            Please review and correct the errors below before continuing:
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

      {/* SECTION 1: CONTACT */}
      {currentStep === 1 && (
        <fieldset disabled={saving} style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend className="sr-only">Contact Information</legend>

          <div className="form-group">
            <label htmlFor="profile-fullname" className="form-label">
              Full Name <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <p className="form-help" id="name-help">
              Required. How you want employers to address you on your applications and resume.
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
              onChange={handleBasicChange}
              placeholder="e.g. Jane Doe"
              required
              aria-required="true"
<<<<<<< HEAD
              aria-invalid={Boolean(getFieldError('profile-fullname'))}
              aria-describedby={`name-help ${getFieldError('profile-fullname') ? 'profile-fullname-error' : ''}`.trim()}
=======
              aria-invalid={errors.some(e => e.fieldId === 'profile-fullname') ? 'true' : undefined}
              aria-describedby={errors.some(e => e.fieldId === 'profile-fullname') ? 'fullname-error name-help' : 'name-help'}
>>>>>>> feature/multi-mode-resume-jobs
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
              Where employers can reach you. Required when generating a resume.
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
<<<<<<< HEAD
              onChange={handleChange}
              placeholder="e.g. alex.taylor@example.com"
              aria-invalid={Boolean(getFieldError('profile-email'))}
              aria-describedby={`email-help ${getFieldError('profile-email') ? 'profile-email-error' : ''}`.trim()}
=======
              onChange={handleBasicChange}
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

          <div className="form-group">
            <label htmlFor="profile-phone" className="form-label">
              Phone Number
            </label>
            <p className="form-help" id="phone-help">
              Optional mobile or contact number.
            </p>
            <input
              id="profile-phone"
              name="phone"
              type="tel"
              className="form-input"
              value={profile.phone}
              onChange={handleBasicChange}
              placeholder="e.g. +91 98765 43210"
              aria-describedby="phone-help"
>>>>>>> feature/multi-mode-resume-jobs
            />
          </div>

          <div className="form-group">
            <label htmlFor="profile-location" className="form-label">
              Location / City
            </label>
            <p className="form-help" id="location-help">
              City or region where you are based, for example "Bengaluru, India" or "Remote".
            </p>
            <input
              id="profile-location"
              name="location"
              type="text"
              className="form-input"
              value={profile.location}
              onChange={handleBasicChange}
              placeholder="e.g. Bengaluru, India"
              aria-describedby="location-help"
            />
          </div>

          <div className="form-group">
            <label htmlFor="profile-country" className="form-label">
              Country for Job Search
            </label>
            <p className="form-help" id="country-help">
              Country used to find job openings via job search providers. Default is India (in).
            </p>
            <select
              id="profile-country"
              name="country"
              className="form-select"
              value={profile.country}
              onChange={handleBasicChange}
              aria-describedby="country-help"
            >
              {COUNTRY_OPTIONS.map(opt => (
                <option key={opt.code} value={opt.code}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          <fieldset style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginTop: '1.5rem' }}>
            <legend style={{ fontWeight: 700, padding: '0 0.5rem', color: 'var(--color-text-main)' }}>
              Online Links & Profiles
            </legend>

            <div className="form-group">
              <label htmlFor="profile-link-linkedin" className="form-label">
                LinkedIn Profile URL
              </label>
              <input
                id="profile-link-linkedin"
                type="url"
                className="form-input"
                value={profile.links.linkedin}
                onChange={(e) => handleLinkChange('linkedin', e.target.value)}
                placeholder="https://linkedin.com/in/yourname"
              />
            </div>

            <div className="form-group">
              <label htmlFor="profile-link-github" className="form-label">
                GitHub Profile URL
              </label>
              <input
                id="profile-link-github"
                type="url"
                className="form-input"
                value={profile.links.github}
                onChange={(e) => handleLinkChange('github', e.target.value)}
                placeholder="https://github.com/yourname"
              />
            </div>

            <div className="form-group">
              <label htmlFor="profile-link-portfolio" className="form-label">
                Portfolio or Personal Website URL
              </label>
              <input
                id="profile-link-portfolio"
                type="url"
                className="form-input"
                value={profile.links.portfolio}
                onChange={(e) => handleLinkChange('portfolio', e.target.value)}
                placeholder="https://yourportfolio.com"
              />
            </div>

            {profile.links.other.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <span className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Other Links:
                </span>
                {profile.links.other.map((linkUrl, oIdx) => (
                  <div key={oIdx} className="bullet-item-row" style={{ marginBottom: '0.5rem' }}>
                    <label htmlFor={`profile-link-other-${oIdx}`} className="sr-only">
                      Other link {oIdx + 1}
                    </label>
                    <input
                      id={`profile-link-other-${oIdx}`}
                      type="url"
                      className="form-input"
                      value={linkUrl}
                      onChange={(e) => handleOtherLinkChange(oIdx, e.target.value)}
                      placeholder="https://..."
                    />
                    <button
                      type="button"
                      className="btn-icon-remove"
                      onClick={() => removeOtherLink(oIdx)}
                      aria-label={`Remove other link ${oIdx + 1}`}
                    >
                      &times; Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              className="btn btn-secondary"
              onClick={addOtherLink}
              style={{ marginTop: '0.75rem', minHeight: '44px' }}
            >
              + Add another link
            </button>
          </fieldset>
        </fieldset>
      )}

      {/* SECTION 2: SUMMARY AND SKILLS */}
      {currentStep === 2 && (
        <fieldset disabled={saving} style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend className="sr-only">Summary and Skills</legend>

          <div className="form-group">
            <label htmlFor="profile-skills" className="form-label">
              Key Skills (comma-separated) <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <p className="form-help" id="skills-help">
              Required. List at least one skill or technical tool, separated by commas (for example: React, JavaScript, HTML, WCAG, Problem Solving).
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
              onChange={handleBasicChange}
              placeholder="e.g. React, JavaScript, HTML, CSS, Communication, Problem Solving"
              required
              aria-required="true"
<<<<<<< HEAD
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
=======
              aria-invalid={errors.some(e => e.fieldId === 'profile-skills') ? 'true' : undefined}
              aria-describedby={errors.some(e => e.fieldId === 'profile-skills') ? 'skills-error skills-help' : 'skills-help'}
>>>>>>> feature/multi-mode-resume-jobs
            />
            {errors.find(e => e.fieldId === 'profile-skills') && (
              <p id="skills-error" style={{ color: 'var(--color-danger)', fontWeight: 700, fontSize: '0.9rem', marginTop: '0.35rem' }}>
                {errors.find(e => e.fieldId === 'profile-skills').message}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="profile-summary" className="form-label">
              Professional Summary
            </label>
            <p className="form-help" id="summary-help">
              A brief 2 to 3 sentence overview of what kind of work you do and what you are looking for.
            </p>
            <textarea
              id="profile-summary"
              name="summary"
              rows="4"
              className="form-textarea"
              value={profile.summary}
              onChange={handleBasicChange}
              placeholder="e.g. Frontend developer with 2 years of experience specializing in accessible web applications, responsive layouts, and semantic HTML."
              aria-describedby="summary-help"
            />
          </div>

          <div className="form-group">
            <label htmlFor="profile-experience-years" className="form-label">
              Total Years of Experience
            </label>
            <p className="form-help" id="exp-years-help">
              Total years of relevant work, volunteer, or self-directed project experience.
            </p>
            <input
              id="profile-experience-years"
              name="yearsExperience"
              type="number"
              min="0"
              max="60"
              step="0.5"
              className="form-input"
              value={profile.yearsExperience}
              onChange={handleBasicChange}
              aria-describedby="exp-years-help"
            />
          </div>
        </fieldset>
      )}

      {/* SECTION 3: WORK EXPERIENCE */}
      {currentStep === 3 && (
        <fieldset disabled={saving} style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend className="sr-only">Work Experience</legend>

          <p className="form-help" style={{ marginBottom: '1.25rem' }}>
            List your employment, internships, freelancing, or volunteer roles. Leave empty if you are seeking your first role.
          </p>

          {profile.experience.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <p style={{ margin: '0 0 1rem 0', color: 'var(--color-text-muted)' }}>
                No work experience entries added yet.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={addExperience}
                style={{ minHeight: '44px' }}
              >
                + Add your first experience
              </button>
            </div>
          ) : (
            <div>
              {profile.experience.map((exp, idx) => (
                <div key={exp.id} className="entry-card">
                  <div className="entry-card-header">
                    <h4 className="entry-card-title">
                      Experience #{idx + 1}: {exp.role || exp.company ? `${exp.role || 'Role'} at ${exp.company || 'Company'}` : 'New Position'}
                    </h4>
                    <button
                      type="button"
                      className="btn-icon-remove"
                      onClick={() => removeExperience(exp.id, exp.company, exp.role)}
                      aria-label={`Remove experience: ${exp.company || 'Untitled'}, ${exp.role || 'Role'}`}
                    >
                      &times; Remove Role
                    </button>
                  </div>

                  <div className="form-group">
                    <label htmlFor={`exp-company-${exp.id}`} className="form-label">
                      Company or Organization Name
                    </label>
                    <input
                      id={`exp-company-${exp.id}`}
                      type="text"
                      className="form-input"
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                      placeholder="e.g. Acme Health Solutions"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor={`exp-role-${exp.id}`} className="form-label">
                      Job Title or Role
                    </label>
                    <input
                      id={`exp-role-${exp.id}`}
                      type="text"
                      className="form-input"
                      value={exp.role}
                      onChange={(e) => updateExperience(exp.id, 'role', e.target.value)}
                      placeholder="e.g. Accessibility Specialist"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor={`exp-location-${exp.id}`} className="form-label">
                      Location
                    </label>
                    <input
                      id={`exp-location-${exp.id}`}
                      type="text"
                      className="form-input"
                      value={exp.location}
                      onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                      placeholder="e.g. Remote / Bengaluru"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label htmlFor={`exp-start-${exp.id}`} className="form-label">
                        Start Date
                      </label>
                      <p className="form-help" id={`exp-start-help-${exp.id}`}>
                        Month and year you began this role.
                      </p>
                      <input
                        id={`exp-start-${exp.id}`}
                        type="month"
                        className="form-input"
                        value={exp.startDate}
                        onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                        aria-describedby={`exp-start-help-${exp.id}`}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label htmlFor={`exp-end-${exp.id}`} className="form-label">
                        End Date
                      </label>
                      <p className="form-help" id={`exp-end-help-${exp.id}`}>
                        Month and year you ended, or check currently working here.
                      </p>
                      <input
                        id={`exp-end-${exp.id}`}
                        type="month"
                        className="form-input"
                        value={exp.endDate}
                        disabled={exp.current}
                        onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                        aria-describedby={`exp-end-help-${exp.id}`}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      id={`exp-current-${exp.id}`}
                      type="checkbox"
                      checked={exp.current}
                      onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                    <label htmlFor={`exp-current-${exp.id}`} style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}>
                      I currently work in this role
                    </label>
                  </div>

                  {/* Bullet Points */}
                  <fieldset style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginTop: '1rem' }}>
                    <legend style={{ fontWeight: 700, padding: '0 0.5rem', color: 'var(--color-text-main)' }}>
                      Key Responsibilities & Achievements
                    </legend>
                    <p className="form-help">
                      Write 2 to 3 short lines about what you did. Start with a verb (for example: "Built accessible React components", "Audited pages for WCAG compliance").
                    </p>

                    <div className="bullet-list-container">
                      {(exp.bullets || []).map((bullet, bIdx) => (
                        <div key={bIdx} className="bullet-item-row">
                          <label htmlFor={`exp-bullet-${exp.id}-${bIdx}`} className="sr-only">
                            {`Bullet line ${bIdx + 1} for ${exp.company || 'role'}`}
                          </label>
                          <input
                            id={`exp-bullet-${exp.id}-${bIdx}`}
                            type="text"
                            className="form-input"
                            value={bullet}
                            onChange={(e) => updateBullet(exp.id, bIdx, e.target.value)}
                            placeholder="e.g. Led redesign to improve screen reader compatibility across 12 pages."
                          />
                          <button
                            type="button"
                            className="btn-icon-remove"
                            onClick={() => removeBullet(exp.id, bIdx)}
                            aria-label={`Remove bullet line ${bIdx + 1} for ${exp.company || 'role'}`}
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => addBullet(exp.id)}
                      style={{ marginTop: '0.75rem', minHeight: '44px' }}
                    >
                      + Add bullet line
                    </button>
                  </fieldset>
                </div>
              ))}

              <button
                type="button"
                className="btn btn-secondary"
                onClick={addExperience}
                style={{ marginBottom: '1.5rem', minHeight: '44px' }}
              >
                + Add another experience
              </button>
            </div>
          )}
        </fieldset>
      )}

      {/* SECTION 4: PROJECTS */}
      {currentStep === 4 && (
        <fieldset disabled={saving} style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend className="sr-only">Personal & Professional Projects</legend>

          <p className="form-help" style={{ marginBottom: '1.25rem' }}>
            Highlight software applications, websites, research, open-source work, or self-directed projects you have built.
          </p>

          {profile.projects.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <p style={{ margin: '0 0 1rem 0', color: 'var(--color-text-muted)' }}>
                No projects added yet.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={addProject}
                style={{ minHeight: '44px' }}
              >
                + Add your first project
              </button>
            </div>
          ) : (
            <div>
              {profile.projects.map((prj, idx) => (
                <div key={prj.id} className="entry-card">
                  <div className="entry-card-header">
                    <h4 className="entry-card-title">
                      Project #{idx + 1}: {prj.name || 'Untitled Project'}
                    </h4>
                    <button
                      type="button"
                      className="btn-icon-remove"
                      onClick={() => removeProject(prj.id, prj.name)}
                      aria-label={`Remove project: ${prj.name || 'Untitled'}`}
                    >
                      &times; Remove Project
                    </button>
                  </div>

                  <div className="form-group">
                    <label htmlFor={`prj-name-${prj.id}`} className="form-label">
                      Project Name
                    </label>
                    <input
                      id={`prj-name-${prj.id}`}
                      type="text"
                      className="form-input"
                      value={prj.name}
                      onChange={(e) => updateProject(prj.id, 'name', e.target.value)}
                      placeholder="e.g. AccessHire Portal"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor={`prj-desc-${prj.id}`} className="form-label">
                      Project Description
                    </label>
                    <p className="form-help" id={`prj-desc-help-${prj.id}`}>
                      Describe the problem this project solved, what you built, and the impact.
                    </p>
                    <textarea
                      id={`prj-desc-${prj.id}`}
                      rows="3"
                      className="form-textarea"
                      value={prj.description}
                      onChange={(e) => updateProject(prj.id, 'description', e.target.value)}
                      placeholder="e.g. Designed and implemented an accessible job matching tool with keyboard shortcuts, high contrast themes, and screen reader optimization."
                      aria-describedby={`prj-desc-help-${prj.id}`}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor={`prj-tech-${prj.id}`} className="form-label">
                      Technologies Used (comma-separated)
                    </label>
                    <p className="form-help" id={`prj-tech-help-${prj.id}`}>
                      List libraries, languages, and tools (e.g. React, Node.js, Express, WCAG).
                    </p>
                    <input
                      id={`prj-tech-${prj.id}`}
                      type="text"
                      className="form-input"
                      value={prj.techString !== undefined ? prj.techString : (Array.isArray(prj.technologies) ? prj.technologies.join(', ') : '')}
                      onChange={(e) => updateProject(prj.id, 'techString', e.target.value)}
                      placeholder="e.g. React, Vite, Node.js, Express"
                      aria-describedby={`prj-tech-help-${prj.id}`}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor={`prj-link-${prj.id}`} className="form-label">
                      Project Demo or Repository Link
                    </label>
                    <p className="form-help" id={`prj-link-help-${prj.id}`}>
                      URL to GitHub repository or live website demo (opens in a new tab).
                    </p>
                    <input
                      id={`prj-link-${prj.id}`}
                      type="url"
                      className="form-input"
                      value={prj.link}
                      onChange={(e) => updateProject(prj.id, 'link', e.target.value)}
                      placeholder="https://github.com/yourname/project"
                      aria-describedby={`prj-link-help-${prj.id}`}
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="btn btn-secondary"
                onClick={addProject}
                style={{ marginBottom: '1.5rem', minHeight: '44px' }}
              >
                + Add another project
              </button>
            </div>
          )}
        </fieldset>
      )}

      {/* SECTION 5: EDUCATION */}
      {currentStep === 5 && (
        <fieldset disabled={saving} style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend className="sr-only">Education Background</legend>

          <p className="form-help" style={{ marginBottom: '1.25rem' }}>
            List degrees, diplomas, bootcamps, courses, or self-directed learning paths.
          </p>

          {profile.educationEntries.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <p style={{ margin: '0 0 1rem 0', color: 'var(--color-text-muted)' }}>
                No education entries added yet.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={addEducation}
                style={{ minHeight: '44px' }}
              >
                + Add education entry
              </button>
            </div>
          ) : (
            <div>
              {profile.educationEntries.map((edu, idx) => (
                <div key={edu.id} className="entry-card">
                  <div className="entry-card-header">
                    <h4 className="entry-card-title">
                      Education #{idx + 1}: {edu.degree || edu.institution ? `${edu.degree || 'Degree'} at ${edu.institution || 'School'}` : 'Education Entry'}
                    </h4>
                    <button
                      type="button"
                      className="btn-icon-remove"
                      onClick={() => removeEducation(edu.id, edu.degree)}
                      aria-label={`Remove education: ${edu.degree || 'Untitled'}`}
                    >
                      &times; Remove Education
                    </button>
                  </div>

                  <div className="form-group">
                    <label htmlFor={`edu-degree-${edu.id}`} className="form-label">
                      Degree, Certificate, or Field of Study
                    </label>
                    <input
                      id={`edu-degree-${edu.id}`}
                      type="text"
                      className="form-input"
                      value={edu.degree}
                      onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                      placeholder="e.g. Bachelor of Science in Computer Science / Web Development Bootcamp"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor={`edu-inst-${edu.id}`} className="form-label">
                      Institution, College, or School
                    </label>
                    <input
                      id={`edu-inst-${edu.id}`}
                      type="text"
                      className="form-input"
                      value={edu.institution}
                      onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                      placeholder="e.g. State University / FreeCodeCamp"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor={`edu-year-${edu.id}`} className="form-label">
                      Graduation Year or Period
                    </label>
                    <input
                      id={`edu-year-${edu.id}`}
                      type="text"
                      className="form-input"
                      value={edu.year}
                      onChange={(e) => updateEducation(edu.id, 'year', e.target.value)}
                      placeholder="e.g. 2023 or 2021 – 2023"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor={`edu-details-${edu.id}`} className="form-label">
                      Additional Details (optional)
                    </label>
                    <p className="form-help" id={`edu-details-help-${edu.id}`}>
                      Relevant coursework, honors, GPA, or notable achievements.
                    </p>
                    <textarea
                      id={`edu-details-${edu.id}`}
                      rows="2"
                      className="form-textarea"
                      value={edu.details}
                      onChange={(e) => updateEducation(edu.id, 'details', e.target.value)}
                      placeholder="e.g. Specialized in Human-Computer Interaction, Dean's List."
                      aria-describedby={`edu-details-help-${edu.id}`}
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="btn btn-secondary"
                onClick={addEducation}
                style={{ marginBottom: '1.5rem', minHeight: '44px' }}
              >
                + Add another education
              </button>
            </div>
          )}
        </fieldset>
      )}

      {/* SECTION 6: CERTIFICATIONS AND LANGUAGES */}
      {currentStep === 6 && (
        <fieldset disabled={saving} style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend className="sr-only">Certifications and Languages</legend>

          <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Professional Certifications
          </h4>
          <p className="form-help" style={{ marginBottom: '1rem' }}>
            Add any accessibility, cloud, coding, or industry certifications you hold.
          </p>

          {profile.certifications.map((crt, idx) => (
            <div key={crt.id} className="entry-card" style={{ padding: '1.25rem' }}>
              <div className="entry-card-header">
                <span style={{ fontWeight: 700 }}>
                  Certification #{idx + 1}: {crt.name || 'Untitled'}
                </span>
                <button
                  type="button"
                  className="btn-icon-remove"
                  onClick={() => removeCertification(crt.id, crt.name)}
                  aria-label={`Remove certification: ${crt.name || 'Untitled'}`}
                >
                  &times; Remove
                </button>
              </div>

              <div className="form-group">
                <label htmlFor={`crt-name-${crt.id}`} className="form-label">
                  Certification Name
                </label>
                <input
                  id={`crt-name-${crt.id}`}
                  type="text"
                  className="form-input"
                  value={crt.name}
                  onChange={(e) => updateCertification(crt.id, 'name', e.target.value)}
                  placeholder="e.g. Certified Professional in Accessibility Core Competencies (CPACC)"
                />
              </div>

              <div className="form-group">
                <label htmlFor={`crt-issuer-${crt.id}`} className="form-label">
                  Issuing Organization
                </label>
                <input
                  id={`crt-issuer-${crt.id}`}
                  type="text"
                  className="form-input"
                  value={crt.issuer}
                  onChange={(e) => updateCertification(crt.id, 'issuer', e.target.value)}
                  placeholder="e.g. IAAP / AWS / Google"
                />
              </div>

              <div className="form-group">
                <label htmlFor={`crt-year-${crt.id}`} className="form-label">
                  Year Issued
                </label>
                <input
                  id={`crt-year-${crt.id}`}
                  type="text"
                  className="form-input"
                  value={crt.year}
                  onChange={(e) => updateCertification(crt.id, 'year', e.target.value)}
                  placeholder="e.g. 2024"
                />
              </div>
            </div>
          ))}

          <button
<<<<<<< HEAD
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            aria-label={saving ? 'Saving Profile...' : 'Save candidate profile'}
=======
            type="button"
            className="btn btn-secondary"
            onClick={addCertification}
            style={{ marginBottom: '1.75rem', minHeight: '44px' }}
>>>>>>> feature/multi-mode-resume-jobs
          >
            + Add another certification
          </button>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '1.5rem 0' }} />

          <div className="form-group">
            <label htmlFor="profile-languages" className="form-label">
              Languages Spoken & Written (comma-separated)
            </label>
            <p className="form-help" id="languages-help">
              List the languages you can work or communicate in (e.g. English, Hindi, French, Spanish).
            </p>
            <input
              id="profile-languages"
              name="languagesString"
              type="text"
              className="form-input"
              value={profile.languagesString}
              onChange={handleBasicChange}
              placeholder="e.g. English, Hindi, Spanish"
              aria-describedby="languages-help"
            />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '1.5rem 0' }} />

          {/* Accessibility Modes Selector Link */}
          <div style={{ background: 'var(--color-surface-alt)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 700 }}>
              Accessibility Modes
            </h4>
            <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              Active modes:{' '}
              <strong>
                {modes.length > 0
                  ? modeInfo.map(m => m.name).join(', ')
                  : 'None selected (standard mode)'}
              </strong>
            </p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={openModeSelect}
              style={{ minHeight: '44px' }}
            >
              Choose accessibility modes &rarr;
            </button>
          </div>
        </fieldset>
      )}

      {/* Guided Form Action Bar (Per-Section Save & Stepping) */}
      <div className="button-row" style={{ marginTop: '2rem', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          {currentStep > 1 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => goToSection(currentStep - 1)}
              disabled={saving}
              style={{ minHeight: '44px' }}
            >
              &larr; Previous: {SECTIONS[currentStep - 2].short}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleSaveSection(false)}
            disabled={saving}
            style={{ minHeight: '44px' }}
          >
            {saving ? 'Saving...' : `Save ${currentSectionMeta.short}`}
          </button>

          {currentStep < 6 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleSaveSection(true)}
              disabled={saving}
              style={{ minHeight: '44px' }}
            >
              Save & Next: {SECTIONS[currentStep].short} &rarr;
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleSaveSection(false)}
              disabled={saving}
              style={{ minHeight: '44px' }}
            >
              Save All & Finish &check;
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
