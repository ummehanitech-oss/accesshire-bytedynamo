import { Router } from 'express';
import { getProfile, saveProfile, VALID_ACCESSIBILITY_MODES, VALID_ACCESSIBILITY_PREFERENCES } from '../storage.js';

const router = Router();

// GET /api/profile
// Returns current candidate profile
router.get('/', async (req, res, next) => {
  try {
    const profile = await getProfile();
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

// PUT /api/profile (also alias POST /api/profile)
// Updates and validates candidate profile (merging partial updates)
const handleSaveProfile = async (req, res, next) => {
  try {
    const body = req.body || {};
    const sanitized = {};

    // Validate email format if provided
    if (body.email !== undefined) {
      const email = String(body.email).trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }
      sanitized.email = email;
    }

    // Validate accessibility modes (multi-mode array)
    if (body.accessibilityModes !== undefined) {
      if (Array.isArray(body.accessibilityModes)) {
        sanitized.accessibilityModes = Array.from(
          new Set(body.accessibilityModes.map(String).map(s => s.trim()).filter(m => VALID_ACCESSIBILITY_MODES.includes(m)))
        );
      } else {
        sanitized.accessibilityModes = [];
      }
      sanitized.accessibilityPreference = sanitized.accessibilityModes[0] || '';
    } else if (body.accessibilityPreference !== undefined) {
      // Legacy single-mode support
      let pref = String(body.accessibilityPreference).trim();
      if (!VALID_ACCESSIBILITY_MODES.includes(pref)) {
        pref = '';
      }
      sanitized.accessibilityPreference = pref;
      sanitized.accessibilityModes = pref ? [pref] : [];
    }

    // Validate years of experience if provided
    if (body.yearsExperience !== undefined) {
      let yearsExperience = Number(body.yearsExperience);
      if (Number.isNaN(yearsExperience) || yearsExperience < 0) {
        yearsExperience = 0;
      }
      sanitized.yearsExperience = yearsExperience;
    }

    // Full name if provided
    if (body.fullName !== undefined || body.name !== undefined) {
      sanitized.fullName = String(body.fullName ?? body.name ?? '').trim();
    }

    // Education if provided
    if (body.education !== undefined) {
      sanitized.education = String(body.education || '').trim();
    }

    // Summary if provided
    if (body.summary !== undefined || body.experience !== undefined) {
      sanitized.summary = String(body.summary ?? body.experience ?? '').trim();
    }

    // Normalize skills if provided
    if (body.skills !== undefined) {
      if (Array.isArray(body.skills)) {
        sanitized.skills = body.skills.map(s => String(s).trim()).filter(Boolean);
      } else if (typeof body.skills === 'string') {
        sanitized.skills = body.skills.split(',').map(s => s.trim()).filter(Boolean);
      } else {
        sanitized.skills = [];
      }
    }

    const saved = await saveProfile(sanitized);
    res.json({ success: true, message: 'Profile updated successfully.', profile: saved });
  } catch (err) {
    next(err);
  }
};

router.put('/', handleSaveProfile);
router.post('/', handleSaveProfile);

export default router;
