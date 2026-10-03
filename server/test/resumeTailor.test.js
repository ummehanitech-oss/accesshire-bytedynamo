import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  containsInventedNumbers,
  validateTailoredResume,
  buildUntailoredResume
} from '../src/services/resumeTailor.js';

describe('Resume Tailoring Validation (Phase 4)', () => {
  describe('containsInventedNumbers', () => {
    test('returns false when no numbers in rewritten text', () => {
      assert.equal(containsInventedNumbers('Implemented accessible features', 'Built web forms'), false);
    });

    test('returns false when rewritten numbers match original numbers', () => {
      const orig = 'Managed team of 5 engineers across 2 timezones.';
      const rewritten = 'Led 5 software developers in 2 distinct timezones.';
      assert.equal(containsInventedNumbers(rewritten, orig), false);
    });

    test('returns true when rewritten introduces new numbers or metrics', () => {
      const orig = 'Improved performance of dashboard.';
      const rewritten = 'Improved performance of dashboard by 40 percent with 3 optimizations.';
      assert.equal(containsInventedNumbers(rewritten, orig), true);
    });
  });

  describe('validateTailoredResume', () => {
    const profile = {
      fullName: 'Alex Taylor',
      email: 'alex@example.com',
      phone: '555-123-4567',
      location: 'Bengaluru, India',
      links: { linkedin: 'https://linkedin.com/in/alex' },
      summary: 'Passionate developer focused on WCAG accessibility.',
      skills: ['React', 'JavaScript', 'Node.js', 'HTML/CSS'],
      experience: [
        {
          id: 'exp_real_1',
          company: 'Acme Corp',
          role: 'Frontend Engineer',
          location: 'Remote',
          startDate: '2022-01',
          endDate: '2023-12',
          current: false,
          bullets: ['Built 3 responsive React portals with WCAG 2.1 AA standards.']
        }
      ],
      projects: [
        {
          id: 'prj_real_1',
          name: 'AccessHire',
          description: 'Job matching assistant with keyboard navigation.',
          technologies: ['React', 'Express'],
          link: 'https://github.com/accesshire'
        }
      ],
      educationEntries: [
        {
          id: 'edu_1',
          degree: 'B.Sc Computer Science',
          institution: 'State University',
          year: '2021'
        }
      ],
      certifications: [
        {
          id: 'crt_1',
          name: 'Certified Accessibility Professional',
          issuer: 'IAAP',
          year: '2022'
        }
      ],
      languages: ['English', 'Hindi']
    };

    test('drops hallucinated/invented experience and project IDs', () => {
      const aiOutput = {
        skillsOrdered: ['React'],
        experience: [
          { id: 'exp_real_1', bullets: ['Built 3 responsive React portals with WCAG 2.1 AA standards.'] },
          { id: 'exp_fake_99', bullets: ['Invented job at Google'] }
        ],
        projects: [
          { id: 'prj_fake_99', description: 'Invented Project' }
        ]
      };

      const result = validateTailoredResume(aiOutput, profile);
      assert.equal(result.resume.experience.length, 1);
      assert.equal(result.resume.experience[0].id, 'exp_real_1');
      assert.equal(result.resume.projects.length, 1);
      assert.equal(result.resume.projects[0].id, 'prj_real_1');
    });

    test('keeps only profile skills, matching case-insensitively, and drops invented skills', () => {
      const aiOutput = {
        skillsOrdered: ['Python', 'node.js', 'react', 'Kubernetes'], // Python and Kubernetes not in profile
        experience: [],
        projects: []
      };

      const result = validateTailoredResume(aiOutput, profile);
      // 'Python' and 'Kubernetes' must NOT appear
      assert.ok(!result.resume.skills.includes('Python'));
      assert.ok(!result.resume.skills.includes('Kubernetes'));
      // Profile skills matching case-insensitively should appear first, followed by remaining
      assert.equal(result.resume.skills[0], 'Node.js');
      assert.equal(result.resume.skills[1], 'React');
      assert.ok(result.resume.skills.includes('JavaScript'));
      assert.ok(result.resume.skills.includes('HTML/CSS'));
    });

    test('reverts rewritten bullets that introduce invented numbers', () => {
      const aiOutput = {
        skillsOrdered: ['React'],
        experience: [
          {
            id: 'exp_real_1',
            bullets: ['Built 50 portals and improved load time by 75% for 1000 users.'] // numbers 50, 75, 1000 not in original
          }
        ]
      };

      const result = validateTailoredResume(aiOutput, profile);
      // Reverted to original
      assert.equal(
        result.resume.experience[0].bullets[0],
        'Built 3 responsive React portals with WCAG 2.1 AA standards.'
      );
      assert.ok(result.warnings.some(w => w.includes('unverified numbers')));
    });

    test('reverts rewritten bullets that expand more than 1.5x original length', () => {
      const originalShort = 'Built apps.';
      const profileWithShort = {
        ...profile,
        experience: [
          {
            id: 'exp_real_1',
            company: 'Acme',
            role: 'Dev',
            bullets: [originalShort]
          }
        ]
      };

      const aiOutput = {
        skillsOrdered: ['React'],
        experience: [
          {
            id: 'exp_real_1',
            // Much longer than 1.5x
            bullets: ['Spearheaded the complete end-to-end design and architecture of scalable web applications across global infrastructure.']
          }
        ]
      };

      const result = validateTailoredResume(aiOutput, profileWithShort);
      assert.equal(result.resume.experience[0].bullets[0], originalShort);
      assert.ok(result.warnings.some(w => w.includes('overly expanded bullet')));
    });

    test('accepts valid truthful rewrites without invented numbers or excessive length', () => {
      const aiOutput = {
        skillsOrdered: ['React'],
        experience: [
          {
            id: 'exp_real_1',
            bullets: ['Engineered 3 web portals adhering to WCAG 2.1 standards.']
          }
        ]
      };

      const result = validateTailoredResume(aiOutput, profile);
      assert.equal(
        result.resume.experience[0].bullets[0],
        'Engineered 3 web portals adhering to WCAG 2.1 standards.'
      );
    });

    test('strictly preserves factual profile data (company, role, dates, education)', () => {
      const aiOutput = {
        summary: 'Tailored summary for fullstack role',
        experience: [{ id: 'exp_real_1', bullets: [] }]
      };

      const result = validateTailoredResume(aiOutput, profile);
      assert.equal(result.resume.experience[0].company, 'Acme Corp');
      assert.equal(result.resume.experience[0].role, 'Frontend Engineer');
      assert.equal(result.resume.experience[0].startDate, '2022-01');
      assert.equal(result.resume.educationEntries[0].degree, 'B.Sc Computer Science');
      assert.equal(result.resume.certifications[0].name, 'Certified Accessibility Professional');
    });

    test('buildUntailoredResume returns clean profile facts without modifications', () => {
      const fallback = buildUntailoredResume(profile);
      assert.equal(fallback.fullName, profile.fullName);
      assert.deepEqual(fallback.skills, profile.skills);
      assert.equal(fallback.experience[0].bullets[0], profile.experience[0].bullets[0]);
    });
  });
});
