import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import resumeRouter from '../src/routes/resume.js';
import { errorHandler } from '../src/utils/errorHandler.js';
import { saveProfile } from '../src/storage.js';

describe('Resume API Routes (Phase 4)', () => {
  let app;
  let server;
  let baseUrl;

  before(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/resume', resumeRouter);
    app.use(errorHandler);

    // Save a valid candidate profile for testing routes
    await saveProfile({
      fullName: 'Alex Taylor',
      email: 'alex@example.com',
      skills: ['React', 'Node.js', 'HTML'],
      experience: [
        {
          id: 'exp_test_1',
          company: 'Acme Test Corp',
          role: 'Developer',
          bullets: ['Built accessible UI components']
        }
      ]
    });

    await new Promise(resolve => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise(resolve => server.close(resolve));
  });

  test('GET /api/resume/readiness returns readiness evaluation', async () => {
    const res = await fetch(`${baseUrl}/api/resume/readiness`);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.canGenerate, true);
    assert.ok(Array.isArray(data.missing));
    assert.ok(Array.isArray(data.warnings));
    assert.ok(Array.isArray(data.jobGaps));
  });

  test('POST /api/resume/tailor returns tailored resume structure', async () => {
    const res = await fetch(`${baseUrl}/api/resume/tailor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job: {
          title: 'Frontend Engineer',
          company: 'Tech Solutions',
          description: 'Looking for a React developer with knowledge of accessibility.',
          requiredSkills: ['React', 'Node.js']
        }
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.resume);
    assert.equal(data.resume.fullName, 'Alex Taylor');
    assert.ok(Array.isArray(data.notes));
  });

  test('POST /api/resume/render rejects unsupported format with status 400', async () => {
    const res = await fetch(`${baseUrl}/api/resume/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume: { fullName: 'Alex', email: 'alex@example.com' },
        format: 'html' // unsupported
      })
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /Only "docx" and "pdf" formats are supported/);
  });

  test('POST /api/resume/render downloads valid DOCX binary file', async () => {
    const res = await fetch(`${baseUrl}/api/resume/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume: {
          fullName: 'Alex Taylor',
          email: 'alex@example.com',
          skills: ['React'],
          experience: [{ id: 'exp_1', role: 'Dev', company: 'Acme', bullets: ['Built features'] }]
        },
        format: 'docx'
      })
    });

    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /wordprocessingml/);
    assert.match(res.headers.get('content-disposition'), /Resume-Alex-Taylor\.docx/);

    const arrayBuffer = await res.arrayBuffer();
    assert.ok(arrayBuffer.byteLength > 1000);
  });

  test('POST /api/resume/render downloads valid PDF binary file', async () => {
    const res = await fetch(`${baseUrl}/api/resume/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume: {
          fullName: 'Alex Taylor',
          email: 'alex@example.com',
          skills: ['React'],
          experience: [{ id: 'exp_1', role: 'Dev', company: 'Acme', bullets: ['Built features'] }]
        },
        format: 'pdf'
      })
    });

    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /application\/pdf/);
    assert.match(res.headers.get('content-disposition'), /Resume-Alex-Taylor\.pdf/);

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    assert.equal(buffer.slice(0, 5).toString('ascii'), '%PDF-');
  });
});
