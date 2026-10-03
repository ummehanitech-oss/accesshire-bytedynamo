import { Router } from 'express';
import { getProfile, saveProfile } from '../storage.js';

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
    const saved = await saveProfile(body);
    res.json({ success: true, message: 'Profile updated successfully.', profile: saved });
  } catch (err) {
    next(err);
  }
};

router.put('/', handleSaveProfile);
router.post('/', handleSaveProfile);

export default router;
