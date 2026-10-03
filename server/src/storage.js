import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory helper: allows override via ACCESSHIRE_DATA_DIR for isolated testing
export function getDataDir() {
  return process.env.ACCESSHIRE_DATA_DIR
    ? path.resolve(process.env.ACCESSHIRE_DATA_DIR)
    : path.resolve(__dirname, '..', 'data');
}

export function getProfilePath() {
  return path.join(getDataDir(), 'profile.json');
}

export function getApplicationsPath() {
  return path.join(getDataDir(), 'applications.json');
}

import {
  validateAndSanitizeProfile,
  VALID_ACCESSIBILITY_MODES,
  ADZUNA_COUNTRIES
} from './profileSchema.js';

export { VALID_ACCESSIBILITY_MODES, ADZUNA_COUNTRIES };

// Export DATA_DIR for compatibility
export const DATA_DIR = getDataDir();

// Default candidate profile structure (all empty values, country: 'in')
export const DEFAULT_PROFILE = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  country: 'in',
  links: { linkedin: '', github: '', portfolio: '', other: [] },
  summary: '',
  skills: [],
  yearsExperience: 0,
  experience: [],
  projects: [],
  educationEntries: [],
  education: '',
  certifications: [],
  languages: [],
  accessibilityModes: [],
  accessibilityPreference: ''
};

// Valid accessibility preferences accepted by AccessHire (legacy single mode)
export const VALID_ACCESSIBILITY_PREFERENCES = [
  ...VALID_ACCESSIBILITY_MODES,
  ''
];

/**
 * Ensure the target data directory exists
 */
async function ensureDataDir() {
  await fs.mkdir(getDataDir(), { recursive: true });
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
 * When fields are missing or empty, returns empty values (never invents or substitutes sample data).
 * If profile.json is missing, creates it with empty values and returns DEFAULT_PROFILE.
 * Runs through validateAndSanitizeProfile to apply migrations (e.g. legacy education to educationEntries).
 */
export async function getProfile() {
  try {
    await ensureDataDir();
    const content = await fs.readFile(getProfilePath(), 'utf-8');
    const parsed = JSON.parse(content);
    return validateAndSanitizeProfile(parsed, DEFAULT_PROFILE);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await atomicWriteJson(getProfilePath(), DEFAULT_PROFILE);
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
export async function saveProfile(input = {}) {
  const existing = await getProfile();
  const profile = validateAndSanitizeProfile(input, existing);
  await atomicWriteJson(getProfilePath(), profile);
  return profile;
}

/**
 * Read the list of saved applications. Returns an array.
 */
export async function getApplications() {
  try {
    await ensureDataDir();
    const content = await fs.readFile(getApplicationsPath(), 'utf-8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      await atomicWriteJson(getApplicationsPath(), []);
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
  await atomicWriteJson(getApplicationsPath(), updated);
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

  await atomicWriteJson(getApplicationsPath(), all);
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
  await atomicWriteJson(getApplicationsPath(), filtered);
  return true;
}
