import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseJsonSafely, generateJson } from '../src/services/geminiClient.js';

describe('Gemini Client Helper (Phase 3)', () => {
  test('parseJsonSafely parses clean JSON string', () => {
    const raw = '{"fullName": "Alex Taylor", "skills": ["React", "Node.js"]}';
    const result = parseJsonSafely(raw);
    assert.equal(result.fullName, 'Alex Taylor');
    assert.deepEqual(result.skills, ['React', 'Node.js']);
  });

  test('parseJsonSafely strips ```json code fences', () => {
    const raw = '```json\n{"summary": "Experienced engineer"}\n```';
    const result = parseJsonSafely(raw);
    assert.equal(result.summary, 'Experienced engineer');
  });

  test('parseJsonSafely strips generic ``` code fences', () => {
    const raw = '```\n{"yearsExperience": 5}\n```';
    const result = parseJsonSafely(raw);
    assert.equal(result.yearsExperience, 5);
  });

  test('parseJsonSafely throws on malformed JSON', () => {
    assert.throws(() => parseJsonSafely('not valid json'), SyntaxError);
  });

  test('generateJson throws 500 when API key is not configured', async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    try {
      process.env.GEMINI_API_KEY = 'your_gemini_api_key_here';
      await assert.rejects(
        async () => await generateJson({ systemInstruction: 'test', prompt: 'test' }),
        (err) => {
          assert.equal(err.statusCode, 500);
          assert.match(err.message, /GEMINI_API_KEY is not configured/);
          return true;
        }
      );
    } finally {
      process.env.GEMINI_API_KEY = originalKey;
    }
  });
});
