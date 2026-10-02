import { Router } from 'express';
import {
  getApplications,
  getApplicationById,
  updateApplicationProgress,
  deleteApplication
} from '../storage.js';

const router = Router();

// GET /api/applications
// Returns summary list of saved applications (newest first, up to 50)
router.get('/', async (req, res, next) => {
  try {
    const list = await getApplications();
    const summaries = list.map(app => ({
      id: app.id,
      jobTitle: app.jobTitle,
      company: app.company,
      compatibilityScore: app.compatibilityScore,
      createdAt: app.createdAt,
      sourceUrl: app.sourceUrl || null,
      completedSteps: Array.isArray(app.completedSteps) ? app.completedSteps : [],
      totalSteps: Array.isArray(app.applicationSteps) ? app.applicationSteps.length : 0
    }));

    res.json(summaries);
  } catch (err) {
    next(err);
  }
});

// GET /api/applications/:id
// Returns full saved analysis details for a single job
router.get('/:id', async (req, res, next) => {
  try {
    const app = await getApplicationById(req.params.id);
    if (!app) {
      return res.status(404).json({ error: 'Saved job application not found.' });
    }
    res.json(app);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/applications/:id
// Update checklist completion progress
router.patch('/:id', async (req, res, next) => {
  try {
    const { completedSteps } = req.body || {};
    if (!Array.isArray(completedSteps)) {
      return res.status(400).json({ error: 'completedSteps must be an array of step index numbers.' });
    }

    const updated = await updateApplicationProgress(req.params.id, completedSteps);
    if (!updated) {
      return res.status(404).json({ error: 'Saved job application not found.' });
    }

    res.json({
      success: true,
      id: updated.id,
      completedSteps: updated.completedSteps
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/applications/:id
// Remove an application from saved list
router.delete('/:id', async (req, res, next) => {
  try {
    const success = await deleteApplication(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Saved job application not found.' });
    }
    res.json({ success: true, message: 'Application removed successfully.' });
  } catch (err) {
    next(err);
  }
});

export default router;
