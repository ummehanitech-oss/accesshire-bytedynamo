import { Router } from 'express';
import { getProfile, getApplicationById } from '../storage.js';
import { checkResumeReadiness } from '../services/resumeReadiness.js';
import { tailorResume } from '../services/resumeTailor.js';
import {
  sanitizeResumeForRender,
  renderResumeDocx,
  renderResumePdf,
  formatResumeFileName
} from '../services/resumeRender.js';

const router = Router();

// -----------------------------------------------------------------------------
// GET /api/resume/readiness
// Evaluate whether profile is ready to generate a resume and find job gaps
// -----------------------------------------------------------------------------
router.get('/readiness', async (req, res, next) => {
  try {
    const profile = await getProfile();
    const { applicationId } = req.query;

    let application = null;
    if (applicationId) {
      application = await getApplicationById(applicationId);
    }

    const readiness = checkResumeReadiness(profile, application);
    res.json(readiness);
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------------------------
// POST /api/resume/tailor
// Tailor candidate profile for a specific job posting
// -----------------------------------------------------------------------------
router.post('/tailor', async (req, res, next) => {
  try {
    const { applicationId, job } = req.body || {};

    const result = await tailorResume({ applicationId, job });
    res.json({
      success: true,
      resume: result.resume,
      notes: result.notes,
      warnings: result.warnings
    });
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------------------------
// POST /api/resume/render
// Generate DOCX or PDF binary file for candidate resume
// -----------------------------------------------------------------------------
router.post('/render', async (req, res, next) => {
  try {
    const { resume, format } = req.body || {};

    const selectedFormat = String(format || 'docx').toLowerCase();
    if (selectedFormat !== 'docx' && selectedFormat !== 'pdf') {
      return res.status(400).json({
        error: 'Invalid resume format. Only "docx" and "pdf" formats are supported.'
      });
    }

    if (!resume || typeof resume !== 'object') {
      return res.status(400).json({
        error: 'Resume data is required to render a download.'
      });
    }

    const sanitized = sanitizeResumeForRender(resume);
    const fileName = formatResumeFileName(sanitized.fullName, selectedFormat);

    if (selectedFormat === 'docx') {
      const buffer = await renderResumeDocx(sanitized);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', buffer.length);
      return res.send(buffer);
    } else {
      const buffer = await renderResumePdf(sanitized);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', buffer.length);
      return res.send(buffer);
    }
  } catch (err) {
    next(err);
  }
});

export default router;
