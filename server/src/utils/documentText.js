import path from 'path';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Extract plain text from a PDF buffer using pdf-parse
 */
export async function extractPdfText(buffer) {
  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return (result && result.text) ? result.text.trim() : '';
  } catch (err) {
    console.warn('PDF parser encountered an issue:', err.message);
    return '';
  }
}

/**
 * Extract plain text from an uploaded Multer file (.pdf, .docx, .txt).
 * Kept strictly in memory.
 * Throws friendly plain-English errors with HTTP status codes.
 */
export async function extractTextFromUpload(file) {
  if (!file || !file.buffer) {
    const err = new Error('No file was uploaded. Please upload a PDF, Word, or text file.');
    err.statusCode = 400;
    throw err;
  }

  const ext = path.extname(file.originalname || '').toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  let text = '';

  if (ext === '.txt' || mime === 'text/plain') {
    text = file.buffer.toString('utf-8').trim();
    if (!text) {
      const err = new Error('The uploaded text file is empty. Please upload a file with content.');
      err.statusCode = 422;
      throw err;
    }
  } else if (ext === '.pdf' || mime === 'application/pdf') {
    text = await extractPdfText(file.buffer);
    if (!text || text.length < 20) {
      const err = new Error('This PDF has no readable text. Please upload a text-based PDF, a Word file, or fill the form by hand.');
      err.statusCode = 422;
      throw err;
    }
  } else if (
    ext === '.docx' ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mime === 'application/msword'
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      text = (result && result.value) ? result.value.trim() : '';
    } catch (parseErr) {
      const err = new Error('Could not read Word document. Please ensure it is a valid .docx file.');
      err.statusCode = 422;
      throw err;
    }

    if (!text || text.length < 20) {
      const err = new Error('This Word document has no readable text. Please upload a text-based file or fill the form by hand.');
      err.statusCode = 422;
      throw err;
    }
  } else {
    const err = new Error('Unsupported file type. Please upload a PDF (.pdf), Word document (.docx), or plain text file (.txt).');
    err.statusCode = 400;
    throw err;
  }

  return text;
}
