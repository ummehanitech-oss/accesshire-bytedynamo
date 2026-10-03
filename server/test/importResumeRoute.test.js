import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import profileRouter from '../src/routes/profile.js';
import { errorHandler } from '../src/utils/errorHandler.js';

describe('POST /api/profile/import-resume Route (Phase 3)', () => {
  let app;
  let server;
  let baseUrl;

  before(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/profile', profileRouter);
    app.use(errorHandler);

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  test('returns 400 when no file is uploaded', async () => {
    const res = await fetch(`${baseUrl}/api/profile/import-resume`, {
      method: 'POST'
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /No resume file uploaded/);
  });

  test('returns 400 when unsupported file type is uploaded', async () => {
    const formData = new FormData();
    const blob = new Blob(['not an allowed binary'], { type: 'image/png' });
    formData.append('file', blob, 'resume.png');

    const res = await fetch(`${baseUrl}/api/profile/import-resume`, {
      method: 'POST',
      body: formData
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /Unsupported file type/);
  });

  test('returns 422 when uploaded text file is empty', async () => {
    const formData = new FormData();
    const blob = new Blob(['   '], { type: 'text/plain' });
    formData.append('file', blob, 'empty.txt');

    const res = await fetch(`${baseUrl}/api/profile/import-resume`, {
      method: 'POST',
      body: formData
    });

    assert.equal(res.status, 422);
    const data = await res.json();
    assert.match(data.error, /The uploaded text file is empty/);
  });

  test('returns 422 when text is too short for AI extraction (< 50 chars)', async () => {
    const formData = new FormData();
    const blob = new Blob(['Short text only'], { type: 'text/plain' });
    formData.append('file', blob, 'resume.txt');

    const res = await fetch(`${baseUrl}/api/profile/import-resume`, {
      method: 'POST',
      body: formData
    });

    assert.equal(res.status, 422);
    const data = await res.json();
    assert.match(data.error, /resume text is too short/);
  });
});
