import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatResumeFileName,
  hasUnsupportedPdfCharacters,
  sanitizeResumeForRender,
  renderResumeDocx,
  renderResumePdf
} from '../src/services/resumeRender.js';

describe('Resume Rendering Service (Phase 4)', () => {
  const sampleResume = {
    fullName: 'Alex Taylor',
    email: 'alex@example.com',
    phone: '555-123-4567',
    location: 'Bengaluru, India',
    links: { linkedin: 'https://linkedin.com/in/alex' },
    summary: 'Accessible web engineer.',
    skills: ['React', 'Node.js', 'WCAG'],
    experience: [
      {
        id: 'exp_1',
        company: 'Acme',
        role: 'Frontend Dev',
        location: 'Remote',
        startDate: '2022-01',
        endDate: '2023-12',
        current: false,
        bullets: ['Built keyboard navigation systems', 'Reduced contrast bugs']
      }
    ],
    projects: [
      {
        id: 'prj_1',
        name: 'AccessHire',
        description: 'Accessible job application assistant.',
        technologies: ['React', 'Express'],
        link: 'https://example.com/project'
      }
    ],
    educationEntries: [
      {
        id: 'edu_1',
        degree: 'B.S. in Computer Science',
        institution: 'University',
        year: '2021',
        details: 'Honors'
      }
    ],
    certifications: [
      {
        id: 'crt_1',
        name: 'CPACC',
        issuer: 'IAAP',
        year: '2023'
      }
    ],
    languages: ['English', 'Spanish']
  };

  describe('formatResumeFileName', () => {
    test('sanitizes special characters and spaces into dashes', () => {
      assert.equal(formatResumeFileName('Alex Taylor', 'docx'), 'Resume-Alex-Taylor.docx');
      assert.equal(formatResumeFileName('Jane O\'Connor / Senior Dev', 'pdf'), 'Resume-Jane-OConnor-Senior-Dev.pdf');
      assert.equal(formatResumeFileName('', 'docx'), 'Resume-Candidate.docx');
    });
  });

  describe('hasUnsupportedPdfCharacters', () => {
    test('returns false for standard Latin characters', () => {
      assert.equal(hasUnsupportedPdfCharacters('Software Developer with React & Node.js.'), false);
    });

    test('returns true for non-Latin scripts (Devanagari, Cyrillic, Chinese, etc.)', () => {
      assert.equal(hasUnsupportedPdfCharacters('Software Engineer नमस्ते'), true);
      assert.equal(hasUnsupportedPdfCharacters('Разработчик'), true);
      assert.equal(hasUnsupportedPdfCharacters('工程师'), true);
    });
  });

  describe('sanitizeResumeForRender', () => {
    test('throws 400 if fullName is missing', () => {
      assert.throws(
        () => sanitizeResumeForRender({ email: 'alex@example.com' }),
        err => err.statusCode === 400
      );
    });

    test('throws 400 if email is missing', () => {
      assert.throws(
        () => sanitizeResumeForRender({ fullName: 'Alex Taylor' }),
        err => err.statusCode === 400
      );
    });

    test('sanitizes strings and caps lengths', () => {
      const sanitized = sanitizeResumeForRender(sampleResume);
      assert.equal(sanitized.fullName, 'Alex Taylor');
      assert.equal(sanitized.email, 'alex@example.com');
      assert.equal(sanitized.skills.length, 3);
    });
  });

  describe('renderResumeDocx', () => {
    test('generates a non-empty DOCX binary Buffer', async () => {
      const sanitized = sanitizeResumeForRender(sampleResume);
      const buffer = await renderResumeDocx(sanitized);

      assert.ok(Buffer.isBuffer(buffer));
      assert.ok(buffer.length > 1000); // Realistic DOCX is at least several KB
    });
  });

  describe('renderResumePdf', () => {
    test('generates a non-empty PDF binary Buffer', async () => {
      const sanitized = sanitizeResumeForRender(sampleResume);
      const buffer = await renderResumePdf(sanitized);

      assert.ok(Buffer.isBuffer(buffer));
      assert.ok(buffer.length > 500);
      // PDF magic number header: %PDF-
      assert.equal(buffer.slice(0, 5).toString('ascii'), '%PDF-');
    });

    test('throws 422 with recommendation when resume contains unsupported non-Latin characters', async () => {
      const nonLatinResume = {
        ...sampleResume,
        fullName: 'Alex Taylor',
        summary: 'Web developer in 日本 (Tokyo).'
      };

      const sanitized = sanitizeResumeForRender(nonLatinResume);
      await assert.rejects(
        async () => await renderResumePdf(sanitized),
        err => {
          assert.equal(err.statusCode, 422);
          assert.match(err.message, /Word document \(\.docx\)/);
          return true;
        }
      );
    });
  });
});
