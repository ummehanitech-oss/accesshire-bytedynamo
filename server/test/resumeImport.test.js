import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseResumeWithAI, buildResumeWarnings } from '../src/services/resumeImport.js';

describe('Resume Import Service (Phase 3)', () => {
  test('rejects resume text under 50 characters with status 422', async () => {
    await assert.rejects(
      async () => await parseResumeWithAI('Short text'),
      (err) => {
        assert.equal(err.statusCode, 422);
        assert.match(err.message, /The resume text is too short/);
        return true;
      }
    );

    await assert.rejects(
      async () => await parseResumeWithAI(''),
      (err) => {
        assert.equal(err.statusCode, 422);
        return true;
      }
    );
  });

  test('buildResumeWarnings returns expected missing sections', () => {
    const emptyProfile = {
      fullName: '',
      email: '',
      phone: '',
      skills: [],
      summary: '',
      experience: [],
      educationEntries: []
    };

    const warnings = buildResumeWarnings(emptyProfile);
    assert.ok(warnings.some(w => w.includes('Full name')));
    assert.ok(warnings.some(w => w.includes('email address')));
    assert.ok(warnings.some(w => w.includes('phone number')));
    assert.ok(warnings.some(w => w.includes('skills were detected')));
    assert.ok(warnings.some(w => w.includes('summary')));
    assert.ok(warnings.some(w => w.includes('experience')));
    assert.ok(warnings.some(w => w.includes('education')));
  });

  test('buildResumeWarnings returns empty array when all major fields exist', () => {
    const completeProfile = {
      fullName: 'Alex Taylor',
      email: 'alex@example.com',
      phone: '555-1234',
      skills: ['JavaScript', 'HTML'],
      summary: 'Experienced web developer specializing in accessible interfaces.',
      experience: [{ company: 'Acme', role: 'Dev' }],
      educationEntries: [{ degree: 'BS Computer Science', institution: 'State University' }]
    };

    const warnings = buildResumeWarnings(completeProfile);
    assert.equal(warnings.length, 0);
  });
});
