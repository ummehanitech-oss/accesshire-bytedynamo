// AccessHire Profile Schema & Validation
// Validates, sanitizes, and normalizes candidate profile data

export const ADZUNA_COUNTRIES = [
  'in', 'gb', 'us', 'au', 'ca', 'sg', 'za', 'nz', 'de', 'fr',
  'at', 'be', 'br', 'ch', 'es', 'it', 'mx', 'nl', 'pl', 'ru'
];

export const VALID_ACCESSIBILITY_MODES = [
  'voice',
  'keyboard',
  'screen-reader',
  'simplified'
];

export const MAX_LENGTHS = {
  name: 200,
  title: 200,
  shortText: 200,
  phone: 50,
  year: 50,
  url: 500,
  bullet: 500,
  description: 1000,
  summary: 2000,
  arrayMax: 50,
  bulletsMax: 20
};

/**
 * Generate a unique ID with prefix for list items
 */
export function generateId(prefix = 'item') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Clean and truncate a string safely
 */
function cleanString(val, maxLength = 200) {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLength);
}

/**
 * Clean an array of strings
 */
function cleanStringArray(arr, maxItems = 50, itemMaxLength = 100) {
  if (!Array.isArray(arr)) {
    if (typeof arr === 'string') {
      return arr.split(',').map(s => s.trim().slice(0, itemMaxLength)).filter(Boolean).slice(0, maxItems);
    }
    return [];
  }
  const result = [];
  const seen = new Set();
  for (const item of arr) {
    if (typeof item !== 'string' && typeof item !== 'number') continue;
    const str = String(item).trim().slice(0, itemMaxLength);
    if (str && !seen.has(str.toLowerCase())) {
      seen.add(str.toLowerCase());
      result.push(str);
    }
    if (result.length >= maxItems) break;
  }
  return result;
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  if (!email) return true; // Optional field
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Normalize and validate links object
 */
function sanitizeLinks(links) {
  const result = {
    linkedin: '',
    github: '',
    portfolio: '',
    other: []
  };
  if (!links || typeof links !== 'object') return result;

  result.linkedin = cleanString(links.linkedin, MAX_LENGTHS.url);
  result.github = cleanString(links.github, MAX_LENGTHS.url);
  result.portfolio = cleanString(links.portfolio, MAX_LENGTHS.url);

  if (Array.isArray(links.other)) {
    result.other = links.other
      .map(url => cleanString(url, MAX_LENGTHS.url))
      .filter(Boolean)
      .slice(0, 10);
  }
  return result;
}

/**
 * Sanitize work experience list
 */
function sanitizeExperience(items) {
  if (!Array.isArray(items)) return [];
  return items.slice(0, MAX_LENGTHS.arrayMax).map(item => {
    if (!item || typeof item !== 'object') return null;
    const bullets = Array.isArray(item.bullets)
      ? item.bullets
          .map(b => cleanString(b, MAX_LENGTHS.bullet))
          .filter(Boolean)
          .slice(0, MAX_LENGTHS.bulletsMax)
      : [];

    return {
      id: cleanString(item.id, 50) || generateId('exp'),
      company: cleanString(item.company, MAX_LENGTHS.name),
      role: cleanString(item.role, MAX_LENGTHS.title),
      location: cleanString(item.location, MAX_LENGTHS.shortText),
      startDate: cleanString(item.startDate, 20),
      endDate: item.current ? '' : cleanString(item.endDate, 20),
      current: Boolean(item.current),
      bullets
    };
  }).filter(Boolean);
}

/**
 * Sanitize projects list
 */
function sanitizeProjects(items) {
  if (!Array.isArray(items)) return [];
  return items.slice(0, MAX_LENGTHS.arrayMax).map(item => {
    if (!item || typeof item !== 'object') return null;
    return {
      id: cleanString(item.id, 50) || generateId('prj'),
      name: cleanString(item.name, MAX_LENGTHS.name),
      description: cleanString(item.description, MAX_LENGTHS.description),
      technologies: cleanStringArray(item.technologies, 20, 50),
      link: cleanString(item.link, MAX_LENGTHS.url)
    };
  }).filter(Boolean);
}

/**
 * Sanitize education entries list
 */
function sanitizeEducationEntries(items) {
  if (!Array.isArray(items)) return [];
  return items.slice(0, MAX_LENGTHS.arrayMax).map(item => {
    if (!item || typeof item !== 'object') return null;
    return {
      id: cleanString(item.id, 50) || generateId('edu'),
      degree: cleanString(item.degree, MAX_LENGTHS.name),
      institution: cleanString(item.institution, MAX_LENGTHS.name),
      year: cleanString(item.year, MAX_LENGTHS.year),
      details: cleanString(item.details, MAX_LENGTHS.bullet)
    };
  }).filter(Boolean);
}

/**
 * Derive legacy education string from educationEntries
 */
export function deriveLegacyEducation(entries, existingEducation = '') {
  if (!Array.isArray(entries) || entries.length === 0) {
    return existingEducation || '';
  }
  return entries
    .map(e => [e.degree, e.institution, e.year].filter(Boolean).join(', '))
    .filter(Boolean)
    .join(' | ');
}

/**
 * Sanitize certifications list
 */
function sanitizeCertifications(items) {
  if (!Array.isArray(items)) return [];
  return items.slice(0, MAX_LENGTHS.arrayMax).map(item => {
    if (!item || typeof item !== 'object') return null;
    return {
      id: cleanString(item.id, 50) || generateId('crt'),
      name: cleanString(item.name, MAX_LENGTHS.name),
      issuer: cleanString(item.issuer, MAX_LENGTHS.name),
      year: cleanString(item.year, MAX_LENGTHS.year)
    };
  }).filter(Boolean);
}

/**
 * Validate and sanitize profile data.
 * Merges partial updates with existing profile if provided.
 * Drops unknown fields and enforces length caps and schemas.
 */
export function validateAndSanitizeProfile(input = {}, existing = null) {
  const base = existing || {};

  // Email format validation
  if (input.email !== undefined) {
    const emailStr = cleanString(input.email, MAX_LENGTHS.name);
    if (emailStr && !isValidEmail(emailStr)) {
      const err = new Error('Please enter a valid email address.');
      err.statusCode = 400;
      throw err;
    }
  }

  // Full Name
  const fullName = input.fullName !== undefined
    ? cleanString(input.fullName, MAX_LENGTHS.name)
    : (input.name !== undefined ? cleanString(input.name, MAX_LENGTHS.name) : cleanString(base.fullName, MAX_LENGTHS.name));

  // Email
  const email = input.email !== undefined
    ? cleanString(input.email, MAX_LENGTHS.name)
    : cleanString(base.email, MAX_LENGTHS.name);

  // Phone
  const phone = input.phone !== undefined
    ? cleanString(input.phone, MAX_LENGTHS.phone)
    : cleanString(base.phone, MAX_LENGTHS.phone);

  // Location
  const location = input.location !== undefined
    ? cleanString(input.location, MAX_LENGTHS.shortText)
    : cleanString(base.location, MAX_LENGTHS.shortText);

  // Country: must be in ADZUNA_COUNTRIES, default 'in'
  let country = 'in';
  const rawCountry = input.country !== undefined ? input.country : base.country;
  if (typeof rawCountry === 'string') {
    const normalizedCountry = rawCountry.trim().toLowerCase();
    if (ADZUNA_COUNTRIES.includes(normalizedCountry)) {
      country = normalizedCountry;
    }
  }

  // Links
  let links;
  if (input.links !== undefined) {
    links = sanitizeLinks(input.links);
  } else if (base.links) {
    links = sanitizeLinks(base.links);
  } else {
    links = sanitizeLinks({});
  }

  // Summary
  const summary = input.summary !== undefined
    ? cleanString(input.summary, MAX_LENGTHS.summary)
    : (input.experience !== undefined && typeof input.experience === 'string'
        ? cleanString(input.experience, MAX_LENGTHS.summary)
        : cleanString(base.summary, MAX_LENGTHS.summary));

  // Skills
  let skills = [];
  if (input.skills !== undefined) {
    skills = cleanStringArray(input.skills, MAX_LENGTHS.arrayMax, 100);
  } else if (Array.isArray(base.skills)) {
    skills = cleanStringArray(base.skills, MAX_LENGTHS.arrayMax, 100);
  }

  // Years Experience
  let yearsExperience = 0;
  const rawYears = input.yearsExperience !== undefined
    ? input.yearsExperience
    : (input.experience !== undefined && typeof input.experience === 'number' ? input.experience : base.yearsExperience);
  if (rawYears !== undefined && rawYears !== null) {
    const num = Number(rawYears);
    if (Number.isFinite(num)) {
      yearsExperience = Math.max(0, Math.min(60, num));
    }
  }

  // Work Experience Entries
  let experience = [];
  if (input.experience !== undefined && Array.isArray(input.experience)) {
    experience = sanitizeExperience(input.experience);
  } else if (Array.isArray(base.experience)) {
    experience = sanitizeExperience(base.experience);
  }

  // Projects
  let projects = [];
  if (input.projects !== undefined && Array.isArray(input.projects)) {
    projects = sanitizeProjects(input.projects);
  } else if (Array.isArray(base.projects)) {
    projects = sanitizeProjects(base.projects);
  }

  // Education Entries
  let educationEntries = [];
  if (input.educationEntries !== undefined && Array.isArray(input.educationEntries)) {
    educationEntries = sanitizeEducationEntries(input.educationEntries);
  } else if (Array.isArray(base.educationEntries)) {
    educationEntries = sanitizeEducationEntries(base.educationEntries);
  }

  // Migration: If educationEntries is empty and legacy education string is present
  const legacyEduInput = typeof input.education === 'string' ? input.education.trim() : (typeof base.education === 'string' ? base.education.trim() : '');
  if (educationEntries.length === 0 && legacyEduInput) {
    educationEntries = [{
      id: generateId('edu'),
      degree: legacyEduInput.slice(0, MAX_LENGTHS.name),
      institution: '',
      year: '',
      details: ''
    }];
  }

  // Legacy education string (derived from educationEntries or preserved)
  const education = deriveLegacyEducation(educationEntries, legacyEduInput);

  // Certifications
  let certifications = [];
  if (input.certifications !== undefined && Array.isArray(input.certifications)) {
    certifications = sanitizeCertifications(input.certifications);
  } else if (Array.isArray(base.certifications)) {
    certifications = sanitizeCertifications(base.certifications);
  }

  // Languages
  let languages = [];
  if (input.languages !== undefined) {
    languages = cleanStringArray(input.languages, MAX_LENGTHS.arrayMax, 50);
  } else if (Array.isArray(base.languages)) {
    languages = cleanStringArray(base.languages, MAX_LENGTHS.arrayMax, 50);
  }

  // Accessibility Modes
  let accessibilityModes = [];
  if (input.accessibilityModes !== undefined) {
    if (Array.isArray(input.accessibilityModes)) {
      accessibilityModes = Array.from(
        new Set(input.accessibilityModes.map(String).map(s => s.trim()).filter(m => VALID_ACCESSIBILITY_MODES.includes(m)))
      );
    }
  } else if (input.accessibilityPreference !== undefined) {
    const pref = String(input.accessibilityPreference).trim();
    if (VALID_ACCESSIBILITY_MODES.includes(pref)) {
      accessibilityModes = [pref];
    }
  } else if (Array.isArray(base.accessibilityModes)) {
    accessibilityModes = Array.from(
      new Set(base.accessibilityModes.map(String).map(s => s.trim()).filter(m => VALID_ACCESSIBILITY_MODES.includes(m)))
    );
  } else if (base.accessibilityPreference && VALID_ACCESSIBILITY_MODES.includes(base.accessibilityPreference)) {
    accessibilityModes = [base.accessibilityPreference];
  }

  const accessibilityPreference = accessibilityModes[0] || '';

  return {
    fullName,
    email,
    phone,
    location,
    country,
    links,
    summary,
    skills,
    yearsExperience,
    experience,
    projects,
    educationEntries,
    education,
    certifications,
    languages,
    accessibilityModes,
    accessibilityPreference
  };
}
