import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { PDFParse } from 'pdf-parse';
import { analyzeJob } from '../services/gemini.js';
import { fetchPage, extractJobText, isSafeUrl } from '../services/urlImport.js';

const router = Router();

// Configure multer with in-memory storage and 5 MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max
  }
});

// Helper to extract text from PDF buffer
async function extractPdfText(buffer) {
  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return (result && result.text) ? result.text.trim() : '';
  } catch (err) {
    console.warn('PDF parser encountered an issue:', err.message);
    return '';
  }
}

// -----------------------------------------------------------------------------
// POST /api/analyze
// Analyze raw pasted job description text
// -----------------------------------------------------------------------------
router.post('/', async (req, res, next) => {
  try {
    const { jobText } = req.body || {};

    if (!jobText || typeof jobText !== 'string' || !jobText.trim()) {
      return res.status(400).json({
        error: 'Please paste a job description to analyze.'
      });
    }

    const trimmed = jobText.trim();
    if (trimmed.length < 200) {
      return res.status(400).json({
        error: 'Job description is too short (minimum 200 characters needed to evaluate requirements).'
      });
    }

    const result = await analyzeJob(trimmed);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------------------------
// POST /api/analyze/upload
// Analyze uploaded .txt or .pdf file (in-memory only, max 5 MB)
// -----------------------------------------------------------------------------
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file was uploaded. Please choose a .txt or .pdf file.'
      });
    }

    const ext = path.extname(req.file.originalname || '').toLowerCase();
    const mime = (req.file.mimetype || '').toLowerCase();

    let extractedText = '';

    if (ext === '.txt' || mime === 'text/plain') {
      extractedText = req.file.buffer.toString('utf-8').trim();
    } else if (ext === '.pdf' || mime === 'application/pdf') {
      extractedText = await extractPdfText(req.file.buffer);

      if (!extractedText || extractedText.length < 50) {
        return res.status(422).json({
          error: 'This PDF has no readable text. Please paste the text instead.'
        });
      }
    } else {
      return res.status(400).json({
        error: 'Invalid file format. Only .txt and .pdf files are accepted.'
      });
    }

    if (extractedText.length < 200) {
      return res.status(400).json({
        error: 'The file contains less than 200 characters of text. Please paste the job description directly.'
      });
    }

    const result = await analyzeJob(extractedText);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------------------------
// POST /api/analyze/url
// Import and analyze job from a single public web page URL
// -----------------------------------------------------------------------------
router.post('/url', async (req, res, next) => {
  try {
    const { url } = req.body || {};

    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({
        error: 'Please provide a job page URL to import.'
      });
    }

    // SSRF verification and safe page fetch
    const { html, finalUrl } = await fetchPage(url.trim());

    // Extract text from JSON-LD schema or clean HTML body
    const jobText = extractJobText(html);

    // Run analysis through the common analysis engine
    const result = await analyzeJob(jobText, finalUrl);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
