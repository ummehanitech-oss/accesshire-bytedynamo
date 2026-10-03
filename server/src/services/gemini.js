import { GoogleGenAI } from '@google/genai';
import { getProfile, saveApplication } from '../storage.js';

/**
 * Check whether a profile has meaningful skills or experience populated
 */
function isProfileEmpty(profile) {
  if (!profile) return true;
  const hasSkills = Array.isArray(profile.skills) && profile.skills.length > 0;
  const hasExperience = Boolean(profile.yearsExperience && profile.yearsExperience > 0);
  const hasSummary = Boolean(profile.summary && profile.summary.trim().length > 0);
  return !hasSkills && !hasExperience && !hasSummary;
}

/**
 * Safely parse JSON from model output, stripping codeblock backticks if present
 */
function parseJsonSafely(text) {
  let cleaned = (text || '').trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
  }
  return JSON.parse(cleaned);
}

/**
 * Validate and normalize the analysis JSON result
 */
function normalizeAnalysisResult(data, profileIsEmpty) {
  if (data.error === 'not_a_job') {
    const err = new Error('The text provided does not appear to be a job description. Please paste or upload a real job posting.');
    err.status = 400;
    err.code = 'NOT_A_JOB';
    throw err;
  }

  const requiredSkills = Array.isArray(data.requiredSkills)
    ? data.requiredSkills.map(s => String(s).trim()).filter(Boolean)
    : [];

  const niceToHaveSkills = Array.isArray(data.niceToHaveSkills)
    ? data.niceToHaveSkills.map(s => String(s).trim()).filter(Boolean)
    : [];

  const documentsNeeded = Array.isArray(data.documentsNeeded)
    ? data.documentsNeeded.map(s => String(s).trim()).filter(Boolean)
    : [];

  const informationNeeded = Array.isArray(data.informationNeeded)
    ? data.informationNeeded.map(s => String(s).trim()).filter(Boolean)
    : [];

  const applicationSteps = Array.isArray(data.applicationSteps)
    ? data.applicationSteps.map((step, idx) => {
        if (typeof step === 'string') {
          return { title: `Step ${idx + 1}`, detail: step.trim() };
        }
        return {
          title: String(step.title || `Step ${idx + 1}`).trim(),
          detail: String(step.detail || '').trim()
        };
      }).filter(s => s.title || s.detail)
    : [];

  // Compatibility score handling
  let compatibilityScore = null;
  let scoreReason = 'Add your profile to get a score.';
  let matchedSkills = [];
  let missingSkills = [...requiredSkills];

  if (!profileIsEmpty) {
    if (typeof data.compatibilityScore === 'number' && !Number.isNaN(data.compatibilityScore)) {
      compatibilityScore = Math.max(0, Math.min(100, Math.round(data.compatibilityScore)));
    } else {
      compatibilityScore = 50; // Fallback sensible default if model gave NaN
    }

    scoreReason = typeof data.scoreReason === 'string' && data.scoreReason.trim()
      ? data.scoreReason.trim()
      : 'Evaluated against your candidate profile skills and experience.';

    matchedSkills = Array.isArray(data.matchedSkills)
      ? data.matchedSkills.map(s => String(s).trim()).filter(Boolean)
      : [];

    missingSkills = Array.isArray(data.missingSkills)
      ? data.missingSkills.map(s => String(s).trim()).filter(Boolean)
      : requiredSkills.filter(req => !matchedSkills.includes(req));
  }

  return {
    jobTitle: typeof data.jobTitle === 'string' && data.jobTitle.trim() ? data.jobTitle.trim() : 'Job Position',
    company: typeof data.company === 'string' && data.company.trim() ? data.company.trim() : 'Not specified',
    summary: typeof data.summary === 'string' && data.summary.trim() ? data.summary.trim() : 'No summary provided.',
    requiredSkills,
    niceToHaveSkills,
    documentsNeeded,
    informationNeeded,
    applicationSteps,
    compatibilityScore,
    matchedSkills,
    missingSkills,
    scoreReason
  };
}

/**
 * Execute Gemini model call with prompt and system instruction
 */
async function callGemini(ai, modelName, prompt) {
  const systemInstruction = `
You are the AI assistant for AccessHire, an accessible job application helper.
Your job is to make complex job postings understandable for everyone, especially neurodivergent job seekers and people with disabilities.

Core Rules:
1. Write in plain English at about grade 6 reading level.
2. Use short, simple sentences.
3. Avoid business jargon, corporate buzzwords, and confusing acronyms.
4. Never invent facts or qualifications not mentioned in the job text.
5. If the provided text is clearly NOT a job description (for example, random text, poetry, a news article, or cooking recipe), return ONLY this JSON: { "error": "not_a_job" }
6. Always return ONLY valid JSON matching the requested schema. Do not include markdown code block syntax.
`;

  return await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      temperature: 0.2
    }
  });
}

/**
 * Analyze job text using Gemini with automatic retry and auto-save.
 *
 * @param {string} jobText - The full job description text
 * @param {string} [sourceUrl] - Optional URL if imported from a web page
 * @returns {Promise<object>} The analyzed job result
 */
export async function analyzeJob(jobText, sourceUrl = null) {
  // Validate text length
  const trimmed = (jobText || '').trim();
  if (trimmed.length < 200) {
    const error = new Error('The job text is too short. Please provide at least 200 characters of the job description.');
    error.status = 400;
    throw error;
  }

  // Safely truncate over-long text (max 12000 chars)
  const safeText = trimmed.length > 12000 ? trimmed.slice(0, 12000) : trimmed;

  // Check API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    const error = new Error('GEMINI_API_KEY is not configured on the server. Please add your key to server/.env.');
    error.status = 500;
    error.code = 'MISSING_API_KEY';
    throw error;
  }

  // Load saved profile
  const profile = await getProfile();
  const emptyProfile = isProfileEmpty(profile);

  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
Analyze the following job description for the candidate.

Candidate Profile:
- Full Name: ${profile.fullName || 'Candidate'}
- Skills: ${Array.isArray(profile.skills) && profile.skills.length > 0 ? profile.skills.join(', ') : 'None listed'}
- Years of Experience: ${profile.yearsExperience || 0}
- Summary/Background: ${profile.summary || 'None listed'}
- Accessibility Preference: ${profile.accessibilityPreference || 'none'}
- Profile is empty: ${emptyProfile ? 'YES' : 'NO'}

Job Description:
"""
${safeText}
"""

Return ONLY a JSON object with EXACTLY this structure:
{
  "jobTitle": "Specific title of the position",
  "company": "Company or organization name, or 'Unknown'",
  "summary": "Plain English summary of the job. Maximum 5 short sentences. Grade 6 reading level.",
  "requiredSkills": ["Skill 1", "Skill 2"],
  "niceToHaveSkills": ["Optional skill 1", "Optional skill 2"],
  "documentsNeeded": ["e.g. Resume / CV", "e.g. Portfolio link"],
  "informationNeeded": ["e.g. References contact info", "e.g. Expected start date"],
  "applicationSteps": [
    { "title": "Step 1 title", "detail": "Clear, short action instruction" },
    { "title": "Step 2 title", "detail": "Clear, short action instruction" }
  ],
  "compatibilityScore": ${emptyProfile ? 'null' : 'number between 0 and 100'},
  "matchedSkills": [${emptyProfile ? '' : '"Skill candidate has that matches"'}],
  "missingSkills": [${emptyProfile ? '' : '"Required skill candidate might need to learn"'}],
  "scoreReason": "${emptyProfile ? 'Add your profile to get a score.' : 'Two short sentences explaining the compatibility score.'}"
}
`;

  let responseText = '';
  let parsed = null;

  // Attempt 1
  try {
    const response = await callGemini(ai, modelName, prompt);
    responseText = response.text || '';
    parsed = parseJsonSafely(responseText);
  } catch (err1) {
    // Check if error is rate limit or network
    if (err1.status === 429 || (err1.message && err1.message.includes('429'))) {
      const err = new Error('Google AI rate limit reached. Please wait a moment and try again.');
      err.status = 429;
      throw err;
    }

    // Retry once if JSON parsing failed
    console.warn('First Gemini attempt failed, retrying once...', err1.message);
    try {
      const retryResponse = await callGemini(ai, modelName, prompt);
      responseText = retryResponse.text || '';
      parsed = parseJsonSafely(responseText);
    } catch (err2) {
      if (err2.status === 429 || (err2.message && err2.message.includes('429'))) {
        const err = new Error('Google AI rate limit reached. Please wait a moment and try again.');
        err.status = 429;
        throw err;
      }
      const err = new Error('We could not read the AI response. Please try analyzing again.');
      err.status = 502;
      throw err;
    }
  }

  // Normalize fields & handle "not_a_job"
  const normalized = normalizeAnalysisResult(parsed, emptyProfile);
  if (sourceUrl) {
    normalized.sourceUrl = sourceUrl;
  }

  // Auto-save each successful analysis to applications.json
  const savedApp = await saveApplication(normalized);

  // Return the saved application (which includes id, createdAt, completedSteps)
  return savedApp;
}
