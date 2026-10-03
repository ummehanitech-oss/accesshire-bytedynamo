import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { checkResumeReadiness } from '../src/services/resumeReadiness.js';

describe('Resume Readiness Service (Phase 4)', () => {
  test('blocks generation if full name is missing', () => {
    const profile = {
      fullName: '',
      email: 'alex@example.com',
      experience: [{ id: 'exp_1', role: 'Dev', company: 'Acme', bullets: ['Built apps'] }]
    };

    const res = checkResumeReadiness(profile);
    assert.equal(res.canGenerate, false);
    assert.ok(res.missing.some(m => m.label === 'Full Name' && m.profileStep === 1));
  });

  test('blocks generation if email is missing', () => {
    const profile = {
      fullName: 'Alex Taylor',
      email: '',
      experience: [{ id: 'exp_1', role: 'Dev', company: 'Acme', bullets: ['Built apps'] }]
    };

    const res = checkResumeReadiness(profile);
    assert.equal(res.canGenerate, false);
    assert.ok(res.missing.some(m => m.label === 'Email Address' && m.profileStep === 1));
  });

  test('blocks generation if experience, projects, and education are all empty', () => {
    const profile = {
      fullName: 'Alex Taylor',
      email: 'alex@example.com',
      experience: [],
      projects: [],
      educationEntries: []
    };

    const res = checkResumeReadiness(profile);
    assert.equal(res.canGenerate, false);
    assert.ok(res.missing.some(m => m.section === 'background' && m.profileStep === 3));
  });

  test('allows generation when name, email, and at least one background entry exist', () => {
    const profileWithExp = {
      fullName: 'Alex Taylor',
      email: 'alex@example.com',
      experience: [{ id: 'exp_1', role: 'Developer', company: 'Acme', bullets: ['Created frontend'] }]
    };
    assert.equal(checkResumeReadiness(profileWithExp).canGenerate, true);

    const profileWithPrj = {
      fullName: 'Alex Taylor',
      email: 'alex@example.com',
      projects: [{ id: 'prj_1', name: 'Open Source App' }]
    };
    assert.equal(checkResumeReadiness(profileWithPrj).canGenerate, true);

    const profileWithEdu = {
      fullName: 'Alex Taylor',
      email: 'alex@example.com',
      educationEntries: [{ id: 'edu_1', degree: 'B.S. Computer Science' }]
    };
    assert.equal(checkResumeReadiness(profileWithEdu).canGenerate, true);
  });

  test('detects optional warnings without blocking generation', () => {
    const profile = {
      fullName: 'Alex Taylor',
      email: 'alex@example.com',
      phone: '',
      location: '',
      summary: '',
      experience: [{ id: 'exp_1', role: 'Dev', company: 'Acme', bullets: [] }]
    };

    const res = checkResumeReadiness(profile);
    assert.equal(res.canGenerate, true);
    assert.ok(res.warnings.some(w => w.label === 'Phone Number'));
    assert.ok(res.warnings.some(w => w.label === 'Location'));
    assert.ok(res.warnings.some(w => w.label === 'Professional Summary'));
    assert.ok(res.warnings.some(w => w.label === 'Experience Details'));
  });

  test('computes job skill gaps from application analysis', () => {
    const profile = {
      fullName: 'Alex Taylor',
      email: 'alex@example.com',
      skills: ['JavaScript', 'React', 'HTML'],
      experience: [{ id: 'exp_1', role: 'Dev', company: 'Acme', bullets: ['Coding'] }]
    };

    const application = {
      requiredSkills: ['JavaScript', 'TypeScript', 'Docker', 'React'],
      missingSkills: ['TypeScript', 'Docker']
    };

    const res = checkResumeReadiness(profile, application);
    assert.equal(res.jobGaps.length, 2);
    assert.deepEqual(res.jobGaps.map(g => g.skill), ['TypeScript', 'Docker']);
  });
});
