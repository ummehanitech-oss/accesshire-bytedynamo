import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAndSanitizeProfile,
  ADZUNA_COUNTRIES,
  MAX_LENGTHS,
  isValidEmail,
  deriveLegacyEducation
} from '../src/profileSchema.js';

describe('Phase 2: Profile Schema, Validation & Migrations', () => {
  test('ADZUNA_COUNTRIES contains major codes and includes in, gb, us', () => {
    assert.ok(ADZUNA_COUNTRIES.includes('in'));
    assert.ok(ADZUNA_COUNTRIES.includes('gb'));
    assert.ok(ADZUNA_COUNTRIES.includes('us'));
    assert.ok(ADZUNA_COUNTRIES.includes('ca'));
    assert.ok(ADZUNA_COUNTRIES.includes('de'));
  });

  test('validateAndSanitizeProfile defaults empty fields and sets country to in', () => {
    const res = validateAndSanitizeProfile({});
    assert.equal(res.fullName, '');
    assert.equal(res.email, '');
    assert.equal(res.country, 'in');
    assert.deepEqual(res.skills, []);
    assert.deepEqual(res.experience, []);
    assert.deepEqual(res.projects, []);
    assert.deepEqual(res.educationEntries, []);
    assert.deepEqual(res.certifications, []);
    assert.deepEqual(res.languages, []);
    assert.deepEqual(res.links, { linkedin: '', github: '', portfolio: '', other: [] });
  });

  test('validates email format and rejects invalid email with status 400', () => {
    assert.equal(isValidEmail('valid@example.com'), true);
    assert.equal(isValidEmail('not-an-email'), false);

    assert.throws(
      () => validateAndSanitizeProfile({ email: 'bad-email' }),
      (err) => err.statusCode === 400 && err.message.includes('valid email')
    );
  });

  test('trims and caps string lengths', () => {
    const longName = 'A'.repeat(300);
    const longSummary = 'S'.repeat(3000);
    const res = validateAndSanitizeProfile({
      fullName: longName,
      summary: longSummary
    });
    assert.equal(res.fullName.length, MAX_LENGTHS.name);
    assert.equal(res.summary.length, MAX_LENGTHS.summary);
  });

  test('migrates legacy education string to educationEntries and keeps education', () => {
    const res = validateAndSanitizeProfile({
      education: 'B.S. in Computer Science from MIT'
    });
    assert.equal(res.educationEntries.length, 1);
    assert.equal(res.educationEntries[0].degree, 'B.S. in Computer Science from MIT');
    assert.ok(res.educationEntries[0].id.startsWith('edu_'));
    assert.equal(res.education, 'B.S. in Computer Science from MIT');
  });

  test('derives legacy education from educationEntries', () => {
    const entries = [
      { degree: 'B.S. CS', institution: 'MIT', year: '2020' },
      { degree: 'M.S. AI', institution: 'Stanford', year: '2022' }
    ];
    const legacy = deriveLegacyEducation(entries);
    assert.equal(legacy, 'B.S. CS, MIT, 2020 | M.S. AI, Stanford, 2022');
  });

  test('generates missing IDs and sanitizes experience entries with bullets', () => {
    const res = validateAndSanitizeProfile({
      experience: [
        {
          company: 'Acme Corp',
          role: 'Frontend Engineer',
          startDate: '2022-01',
          current: true,
          bullets: ['Built accessible React UI', 'Improved WCAG compliance']
        }
      ]
    });
    assert.equal(res.experience.length, 1);
    const exp = res.experience[0];
    assert.ok(exp.id.startsWith('exp_'));
    assert.equal(exp.company, 'Acme Corp');
    assert.equal(exp.role, 'Frontend Engineer');
    assert.equal(exp.current, true);
    assert.equal(exp.endDate, ''); // disabled/cleared because current is true
    assert.deepEqual(exp.bullets, ['Built accessible React UI', 'Improved WCAG compliance']);
  });

  test('drops unknown fields', () => {
    const res = validateAndSanitizeProfile({
      fullName: 'Test User',
      hackerField: 'should be removed',
      extraObj: { foo: 'bar' }
    });
    assert.equal(res.fullName, 'Test User');
    assert.equal(res.hackerField, undefined);
    assert.equal(res.extraObj, undefined);
  });

  test('merges partial updates with existing profile', () => {
    const existing = validateAndSanitizeProfile({
      fullName: 'Original Name',
      email: 'original@example.com',
      skills: ['React'],
      country: 'us'
    });

    const updated = validateAndSanitizeProfile(
      { skills: ['React', 'TypeScript'] },
      existing
    );

    assert.equal(updated.fullName, 'Original Name');
    assert.equal(updated.email, 'original@example.com');
    assert.equal(updated.country, 'us');
    assert.deepEqual(updated.skills, ['React', 'TypeScript']);
  });

  test('country falls back to in when invalid', () => {
    const res = validateAndSanitizeProfile({ country: 'invalid_country_xyz' });
    assert.equal(res.country, 'in');

    const validRes = validateAndSanitizeProfile({ country: 'gb' });
    assert.equal(validRes.country, 'gb');
  });
});
