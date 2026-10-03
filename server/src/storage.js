import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory located at server/data
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const PROFILE_FILE = path.join(DATA_DIR, 'profile.json');
const APPLICATIONS_FILE = path.join(DATA_DIR, 'applications.json');

// Default candidate profile structure (starts empty for new installs)
export const DEFAULT_PROFILE = {
  fullName: '',
  email: '',
  skills: [],
  yearsExperience: 0,
  education: '',
  summary: '',
  country: 'in',
  accessibilityModes: [],
  accessibilityPreference: '' // LEGACY: always first item of accessibilityModes or ''
};

// Valid accessibility modes accepted by AccessHire
export const VALID_ACCESSIBILITY_MODES = [
  'voice',
  'keyboard',
  'screen-reader',
  'simplified'
];

// Valid accessibility preferences accepted by AccessHire (legacy single mode)
export const VALID_ACCESSIBILITY_PREFERENCES = [
  ...VALID_ACCESSIBILITY_MODES,
  ''
];

/**
 * Ensure the server/data directory exists
 */
async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

/**
 * Atomic write helper: writes to a temporary file then replaces target file.
 * This prevents corrupt or half-written JSON files if a process is interrupted.
 */
async function atomicWriteJson(filePath, data) {
  await ensureDataDir();
  const tempPath = `${filePath}.${Date.now()}.${Math.random().toString(36).substring(2, 6)}.tmp`;
  const jsonString = JSON.stringify(data, null, 2);

  try {
    await fs.writeFile(tempPath, jsonString, 'utf-8');
    // On Windows, rename can fail if target is locked, so we copy & unlink if needed
    try {
      await fs.rename(tempPath, filePath);
    } catch {
      await fs.writeFile(filePath, jsonString, 'utf-8');
      await fs.unlink(tempPath).catch(() => {});
    }
  } catch (err) {
    await fs.unlink(tempPath).catch(() => {});
    throw err;
  }
}

/**
 * Read and return the candidate profile.
 * Falls back to DEFAULT_PROFILE if file is missing or invalid.
 */
export async function getProfile() {
  try {
    await ensureDataDir();
    const content = await fs.readFile(PROFILE_FILE, 'utf-8');
    const parsed = JSON.parse(content);

    // Normalize accessibility modes and legacy preference
    let accessibilityModes = [];
    if (Array.isArray(parsed.accessibilityModes)) {
      accessibilityModes = Array.from(
        new Set(parsed.accessibilityModes.map(String).map(s => s.trim()).filter(m => VALID_ACCESSIBILITY_MODES.includes(m)))
      );
    } else if (parsed.accessibilityPreference && VALID_ACCESSIBILITY_MODES.includes(parsed.accessibilityPreference)) {
      accessibilityModes = [parsed.accessibilityPreference];
    }
    const accessibilityPreference = accessibilityModes[0] || '';

    // Normalize in case older profile format had different field names
    return {
      fullName: parsed.fullName || parsed.name || DEFAULT_PROFILE.fullName,
      email: parsed.email || DEFAULT_PROFILE.email,
      skills: Array.isArray(parsed.skills)
        ? parsed.skills
        : (typeof parsed.skills === 'string'
            ? parsed.skills.split(',').map(s => s.trim()).filter(Boolean)
            : DEFAULT_PROFILE.skills),
      yearsExperience: typeof parsed.yearsExperience === 'number'
        ? parsed.yearsExperience
        : (typeof parsed.experience === 'number' ? parsed.experience : DEFAULT_PROFILE.yearsExperience),
      education: parsed.education || DEFAULT_PROFILE.education,
      summary: parsed.summary || parsed.experience || DEFAULT_PROFILE.summary,
      accessibilityModes,
      accessibilityPreference
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      await saveProfile(DEFAULT_PROFILE);
      return { ...DEFAULT_PROFILE };
    }
    console.warn('Warning: Could not read profile.json, using default profile.');
    return { ...DEFAULT_PROFILE };
  }
}

/**
 * Validate, sanitize, and save the candidate profile.
 * Merges partial updates with existing profile so specific field updates (e.g. accessibilityModes)
 * do not erase existing fields.
 */
export async function saveProfile(input) {
  const existing = await getProfile();

  // Handle accessibilityModes / accessibilityPreference
  let accessibilityModes = existing.accessibilityModes || [];
  if (input.accessibilityModes !== undefined) {
    if (Array.isArray(input.accessibilityModes)) {
      accessibilityModes = Array.from(
        new Set(input.accessibilityModes.map(String).map(s => s.trim()).filter(m => VALID_ACCESSIBILITY_MODES.includes(m)))
      );
    } else {
      accessibilityModes = [];
    }
  } else if (input.accessibilityPreference !== undefined) {
    const pref = String(input.accessibilityPreference).trim();
    if (VALID_ACCESSIBILITY_MODES.includes(pref)) {
      accessibilityModes = [pref];
    } else {
      accessibilityModes = [];
    }
  }
  const accessibilityPreference = accessibilityModes[0] || '';

  const profile = {
    fullName: input.fullName !== undefined
      ? (typeof input.fullName === 'string' ? input.fullName.trim() : '')
      : existing.fullName,
    email: input.email !== undefined
      ? (typeof input.email === 'string' ? input.email.trim() : '')
      : existing.email,
    skills: input.skills !== undefined
      ? (Array.isArray(input.skills)
          ? input.skills.map(s => String(s).trim()).filter(Boolean)
          : (typeof input.skills === 'string'
              ? input.skills.split(',').map(s => s.trim()).filter(Boolean)
              : []))
      : existing.skills,
    yearsExperience: input.yearsExperience !== undefined
      ? (Number.isFinite(Number(input.yearsExperience))
          ? Math.max(0, Math.min(60, Number(input.yearsExperience)))
          : 0)
      : existing.yearsExperience,
    education: input.education !== undefined
      ? (typeof input.education === 'string' ? input.education.trim() : '')
      : existing.education,
    summary: input.summary !== undefined
      ? (typeof input.summary === 'string' ? input.summary.trim() : '')
      : existing.summary,
    accessibilityModes,
    accessibilityPreference
  };

  await atomicWriteJson(PROFILE_FILE, profile);
  return profile;
}

/**
 * Read the list of saved applications. Returns an array.
 */
export async function getApplications() {
  try {
    await ensureDataDir();
    const content = await fs.readFile(APPLICATIONS_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      await atomicWriteJson(APPLICATIONS_FILE, []);
      return [];
    }
    console.warn('Warning: Could not read applications.json, returning empty list.');
    return [];
  }
}

/**
 * Get a single application by id.
 */
export async function getApplicationById(id) {
  const all = await getApplications();
  return all.find(item => item.id === id) || null;
}

/**
 * Save a new job analysis application. Keeps at most 50 newest items.
 */
export async function saveApplication(analysisData) {
  const all = await getApplications();

  const id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newApp = {
    id,
    createdAt: new Date().toISOString(),
    completedSteps: [],
    sourceUrl: analysisData.sourceUrl || null,
    jobTitle: analysisData.jobTitle || 'Untitled Position',
    company: analysisData.company || 'Unknown Company',
    summary: analysisData.summary || '',
    requiredSkills: Array.isArray(analysisData.requiredSkills) ? analysisData.requiredSkills : [],
    niceToHaveSkills: Array.isArray(analysisData.niceToHaveSkills) ? analysisData.niceToHaveSkills : [],
    documentsNeeded: Array.isArray(analysisData.documentsNeeded) ? analysisData.documentsNeeded : [],
    informationNeeded: Array.isArray(analysisData.informationNeeded) ? analysisData.informationNeeded : [],
    applicationSteps: Array.isArray(analysisData.applicationSteps) ? analysisData.applicationSteps : [],
    compatibilityScore: typeof analysisData.compatibilityScore === 'number'
      ? analysisData.compatibilityScore
      : null,
    matchedSkills: Array.isArray(analysisData.matchedSkills) ? analysisData.matchedSkills : [],
    missingSkills: Array.isArray(analysisData.missingSkills) ? analysisData.missingSkills : [],
    scoreReason: analysisData.scoreReason || ''
  };

  // Prepend newest first and cap at 50 entries
  const updated = [newApp, ...all].slice(0, 50);
  await atomicWriteJson(APPLICATIONS_FILE, updated);
  return newApp;
}

/**
 * Update completed steps for an existing application.
 */
export async function updateApplicationProgress(id, completedSteps) {
  const all = await getApplications();
  const index = all.findIndex(item => item.id === id);
  if (index === -1) {
    return null;
  }

  // Ensure completedSteps is an array of non-negative integers
  const steps = Array.isArray(completedSteps)
    ? Array.from(new Set(completedSteps.map(Number).filter(n => Number.isInteger(n) && n >= 0)))
    : [];

  all[index].completedSteps = steps;
  all[index].updatedAt = new Date().toISOString();

  await atomicWriteJson(APPLICATIONS_FILE, all);
  return all[index];
}

/**
 * Delete a saved application by id.
 */
export async function deleteApplication(id) {
  const all = await getApplications();
  const filtered = all.filter(item => item.id !== id);
  if (filtered.length === all.length) {
    return false;
  }
  await atomicWriteJson(APPLICATIONS_FILE, filtered);
  return true;
}
