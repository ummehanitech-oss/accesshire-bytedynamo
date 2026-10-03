import { Router } from 'express';
import multer from 'multer';
import { getProfile, saveProfile } from '../storage.js';
import { extractTextFromUpload } from '../utils/documentText.js';
import { parseResumeWithAI } from '../services/resumeImport.js';

const router = Router();

// In-memory multer storage for resume uploads (5 MB max)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max
  }
});

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

// POST /api/profile/import-resume
// Parse uploaded resume in-memory and return prefill data without writing to disk or saving
router.post('/import-resume', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No resume file uploaded. Please select a PDF, Word document, or plain text file.'
      });
    }

    const text = await extractTextFromUpload(req.file);
    const result = await parseResumeWithAI(text);

    res.json({
      success: true,
      profile: result.profile,
      warnings: result.warnings
    });
  } catch (err) {
    next(err);
  }
});

export default router;
