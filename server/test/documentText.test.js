import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { extractTextFromUpload, extractPdfText } from '../src/utils/documentText.js';

describe('Document Text Extraction (Phase 3)', () => {
  test('extracts text from plain text file', async () => {
    const file = {
      originalname: 'resume.txt',
      mimetype: 'text/plain',
      buffer: Buffer.from('Jane Doe\nSoftware Engineer\nSkills: JavaScript, Node.js')
    };

    const text = await extractTextFromUpload(file);
    assert.match(text, /Jane Doe/);
    assert.match(text, /Software Engineer/);
    assert.match(text, /JavaScript/);
  });

  test('throws 422 if .txt file is empty or only whitespace', async () => {
    const file = {
      originalname: 'empty.txt',
      mimetype: 'text/plain',
      buffer: Buffer.from('   \n  \t  ')
    };

    await assert.rejects(
      async () => await extractTextFromUpload(file),
      (err) => {
        assert.equal(err.statusCode, 422);
        assert.match(err.message, /The uploaded text file is empty/);
        return true;
      }
    );
  });

  test('throws 400 if file or buffer is missing', async () => {
    await assert.rejects(
      async () => await extractTextFromUpload(null),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /No file was uploaded/);
        return true;
      }
    );

    await assert.rejects(
      async () => await extractTextFromUpload({ originalname: 'foo.txt' }),
      (err) => {
        assert.equal(err.statusCode, 400);
        return true;
      }
    );
  });

  test('throws 400 for unsupported file extensions/mimes', async () => {
    const file = {
      originalname: 'image.png',
      mimetype: 'image/png',
      buffer: Buffer.from([0x89, 0x50, 0x4E, 0x47])
    };

    await assert.rejects(
      async () => await extractTextFromUpload(file),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /Unsupported file type/);
        return true;
      }
    );
  });

  test('throws 422 for a PDF with no readable text', async () => {
    // Empty / minimal corrupt buffer
    const file = {
      originalname: 'scanned.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 minimal dummy')
    };

    await assert.rejects(
      async () => await extractTextFromUpload(file),
      (err) => {
        assert.equal(err.statusCode, 422);
        assert.match(err.message, /This PDF has no readable text/);
        return true;
      }
    );
  });

  test('throws 422 for a corrupt or invalid Word document', async () => {
    const file = {
      originalname: 'corrupt.docx',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from('not a zip or docx content')
    };

    await assert.rejects(
      async () => await extractTextFromUpload(file),
      (err) => {
        assert.equal(err.statusCode, 422);
        assert.match(err.message, /Could not read Word document/);
        return true;
      }
    );
  });

  test('extractPdfText safely catches errors and returns empty string', async () => {
    const result = await extractPdfText(Buffer.from('not a real pdf'));
    assert.equal(result, '');
  });
});
