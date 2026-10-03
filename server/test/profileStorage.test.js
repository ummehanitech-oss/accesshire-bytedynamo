import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
  DEFAULT_PROFILE,
  getProfile,
  saveProfile,
  getProfilePath
} from '../src/storage.js';

describe('Profile Storage & Empty Defaults', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'accesshire-test-'));
    process.env.ACCESSHIRE_DATA_DIR = tempDir;
  });

  afterEach(async () => {
    delete process.env.ACCESSHIRE_DATA_DIR;
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  test('DEFAULT_PROFILE contains all empty values and country default', () => {
    assert.equal(DEFAULT_PROFILE.fullName, '');
    assert.equal(DEFAULT_PROFILE.email, '');
    assert.equal(DEFAULT_PROFILE.phone, '');
    assert.deepEqual(DEFAULT_PROFILE.skills, []);
    assert.equal(DEFAULT_PROFILE.yearsExperience, 0);
    assert.equal(DEFAULT_PROFILE.education, '');
    assert.equal(DEFAULT_PROFILE.summary, '');
    assert.deepEqual(DEFAULT_PROFILE.accessibilityModes, []);
    assert.equal(DEFAULT_PROFILE.accessibilityPreference, '');
    assert.equal(DEFAULT_PROFILE.country, 'in');
  });

  test('getProfile() with a missing file returns all-empty values and creates file', async () => {
    const profile = await getProfile();
    assert.equal(profile.fullName, '');
    assert.equal(profile.email, '');
    assert.equal(profile.phone, '');
    assert.deepEqual(profile.skills, []);
    assert.equal(profile.yearsExperience, 0);
    assert.equal(profile.education, '');
    assert.equal(profile.summary, '');
    assert.deepEqual(profile.accessibilityModes, []);
    assert.equal(profile.accessibilityPreference, '');
    assert.equal(profile.country, 'in');

    // Verify it created the file with empty values, not placeholders
    const raw = JSON.parse(await fs.readFile(getProfilePath(), 'utf-8'));
    assert.equal(raw.fullName, '');
    assert.deepEqual(raw.skills, []);
  });

  test('getProfile() with a file that has empty fields returns empty fields, not placeholders', async () => {
    const emptyFileContent = {
      fullName: '',
      email: '',
      phone: '',
      skills: [],
      yearsExperience: 0,
      education: '',
      summary: '',
      country: 'in',
      accessibilityModes: [],
      accessibilityPreference: ''
    };
    await fs.writeFile(getProfilePath(), JSON.stringify(emptyFileContent, null, 2), 'utf-8');

    const profile = await getProfile();
    assert.equal(profile.fullName, '');
    assert.equal(profile.email, '');
    assert.equal(profile.phone, '');
    assert.deepEqual(profile.skills, []);
    assert.equal(profile.yearsExperience, 0);
    assert.equal(profile.education, '');
    assert.equal(profile.summary, '');
    assert.deepEqual(profile.accessibilityModes, []);
    assert.equal(profile.accessibilityPreference, '');
    assert.equal(profile.country, 'in');
  });

  test('getProfile() with a file containing real values returns those values unchanged', async () => {
    const candidateData = {
      fullName: 'Sarah Connor',
      email: 'sarah@example.com',
      phone: '+1-555-0199',
      skills: ['Security', 'Leadership', 'Field Operations'],
      yearsExperience: 10,
      education: 'B.S. Cybernetics',
      summary: 'Experienced team lead with deep expertise in security.',
      country: 'us',
      accessibilityModes: ['keyboard', 'screen-reader'],
      accessibilityPreference: 'keyboard'
    };
    await fs.writeFile(getProfilePath(), JSON.stringify(candidateData, null, 2), 'utf-8');

    const profile = await getProfile();
    assert.equal(profile.fullName, 'Sarah Connor');
    assert.equal(profile.email, 'sarah@example.com');
    assert.equal(profile.phone, '+1-555-0199');
    assert.deepEqual(profile.skills, ['Security', 'Leadership', 'Field Operations']);
    assert.equal(profile.yearsExperience, 10);
    assert.equal(profile.education, 'B.S. Cybernetics');
    assert.equal(profile.summary, 'Experienced team lead with deep expertise in security.');
    assert.equal(profile.country, 'us');
    assert.deepEqual(profile.accessibilityModes, ['keyboard', 'screen-reader']);
    assert.equal(profile.accessibilityPreference, 'keyboard');
  });

  test('saveProfile() partial update keeps the other fields', async () => {
    // Initial profile save with candidate data
    await saveProfile({
      fullName: 'John Doe',
      email: 'john@example.com',
      skills: ['JavaScript', 'React'],
      yearsExperience: 5,
      education: 'Computer Science',
      summary: 'Frontend specialist'
    });

    // Partial update only updating accessibilityModes
    const updated = await saveProfile({
      accessibilityModes: ['voice', 'simplified']
    });

    assert.equal(updated.fullName, 'John Doe');
    assert.equal(updated.email, 'john@example.com');
    assert.deepEqual(updated.skills, ['JavaScript', 'React']);
    assert.equal(updated.yearsExperience, 5);
    assert.equal(updated.education, 'Computer Science');
    assert.equal(updated.summary, 'Frontend specialist');
    assert.deepEqual(updated.accessibilityModes, ['voice', 'simplified']);
    assert.equal(updated.accessibilityPreference, 'voice');

    // Reload from disk to verify persistence
    const reloaded = await getProfile();
    assert.equal(reloaded.fullName, 'John Doe');
    assert.deepEqual(reloaded.skills, ['JavaScript', 'React']);
    assert.deepEqual(reloaded.accessibilityModes, ['voice', 'simplified']);
  });

  test('legacy accessibilityPreference still migrates to accessibilityModes', async () => {
    // Save legacy format with single accessibilityPreference
    const legacyContent = {
      fullName: 'Legacy User',
      email: 'legacy@example.com',
      skills: ['Accessibility'],
      accessibilityPreference: 'screen-reader'
    };
    await fs.writeFile(getProfilePath(), JSON.stringify(legacyContent, null, 2), 'utf-8');

    const profile = await getProfile();
    assert.deepEqual(profile.accessibilityModes, ['screen-reader']);
    assert.equal(profile.accessibilityPreference, 'screen-reader');

    // Also test saveProfile with legacy accessibilityPreference
    const saved = await saveProfile({
      accessibilityPreference: 'keyboard'
    });
    assert.deepEqual(saved.accessibilityModes, ['keyboard']);
    assert.equal(saved.accessibilityPreference, 'keyboard');
  });

  test('saveProfile() preserves sections when updating individual sections', async () => {
    // 1. Save Section 1: Contact
    await saveProfile({
      fullName: 'Alice Walker',
      email: 'alice@example.com',
      location: 'London, UK',
      country: 'gb',
      links: { linkedin: 'https://linkedin.com/in/alice', github: '', portfolio: '', other: [] }
    });

    // 2. Save Section 2: Summary and skills
    await saveProfile({
      summary: 'Passionate accessibility engineer',
      skills: ['WCAG', 'ARIA', 'React'],
      yearsExperience: 4
    });

    // 3. Save Section 3: Work experience
    await saveProfile({
      experience: [
        {
          company: 'Inclusion Labs',
          role: 'Accessibility Tester',
          location: 'London',
          startDate: '2021-06',
          current: true,
          bullets: ['Conducted screen reader audits']
        }
      ]
    });

    // 4. Save Section 4: Projects
    await saveProfile({
      projects: [
        {
          name: 'Contrast Checker',
          description: 'A tool for checking color contrast ratios',
          technologies: ['JavaScript', 'Canvas'],
          link: 'https://github.com/alice/contrast-checker'
        }
      ]
    });

    // 5. Save Section 5: Education
    await saveProfile({
      educationEntries: [
        {
          degree: 'B.Sc. Software Engineering',
          institution: 'University of London',
          year: '2020',
          details: 'First Class Honours'
        }
      ]
    });

    // 6. Save Section 6: Certifications & Languages
    const finalProfile = await saveProfile({
      certifications: [
        {
          name: 'CPACC',
          issuer: 'IAAP',
          year: '2022'
        }
      ],
      languages: ['English', 'German']
    });

    // Verify ALL sections coexist seamlessly in the persisted profile
    assert.equal(finalProfile.fullName, 'Alice Walker');
    assert.equal(finalProfile.email, 'alice@example.com');
    assert.equal(finalProfile.location, 'London, UK');
    assert.equal(finalProfile.country, 'gb');
    assert.equal(finalProfile.links.linkedin, 'https://linkedin.com/in/alice');
    assert.equal(finalProfile.summary, 'Passionate accessibility engineer');
    assert.deepEqual(finalProfile.skills, ['WCAG', 'ARIA', 'React']);
    assert.equal(finalProfile.yearsExperience, 4);
    assert.equal(finalProfile.experience.length, 1);
    assert.equal(finalProfile.experience[0].company, 'Inclusion Labs');
    assert.deepEqual(finalProfile.experience[0].bullets, ['Conducted screen reader audits']);
    assert.equal(finalProfile.projects.length, 1);
    assert.equal(finalProfile.projects[0].name, 'Contrast Checker');
    assert.equal(finalProfile.educationEntries.length, 1);
    assert.equal(finalProfile.educationEntries[0].degree, 'B.Sc. Software Engineering');
    assert.equal(finalProfile.education, 'B.Sc. Software Engineering, University of London, 2020');
    assert.equal(finalProfile.certifications.length, 1);
    assert.equal(finalProfile.certifications[0].name, 'CPACC');
    assert.deepEqual(finalProfile.languages, ['English', 'German']);
  });
});
