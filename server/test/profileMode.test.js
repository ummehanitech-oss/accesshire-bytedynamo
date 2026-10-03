import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  VALID_ACCESSIBILITY_MODES,
  DEFAULT_PROFILE,
  saveProfile,
  getProfile
} from '../src/storage.js';

describe('Phase 1: Accessibility Modes Storage & Migration', () => {
  test('VALID_ACCESSIBILITY_MODES contains all 4 modes', () => {
    assert.deepEqual(VALID_ACCESSIBILITY_MODES, [
      'voice',
      'keyboard',
      'screen-reader',
      'simplified'
    ]);
  });

  test('DEFAULT_PROFILE starts with empty accessibilityModes array', () => {
    assert.deepEqual(DEFAULT_PROFILE.accessibilityModes, []);
    assert.equal(DEFAULT_PROFILE.accessibilityPreference, '');
  });

  test('saveProfile accepts array of modes, de-duplicates and filters invalid ones', async () => {
    const saved = await saveProfile({
      accessibilityModes: ['voice', 'keyboard', 'invalid_mode', 'voice', 'simplified']
    });

    assert.deepEqual(saved.accessibilityModes, ['voice', 'keyboard', 'simplified']);
    assert.equal(saved.accessibilityPreference, 'voice');
  });

  test('saveProfile handles legacy single accessibilityPreference string', async () => {
    const saved = await saveProfile({
      accessibilityPreference: 'screen-reader'
    });

    assert.deepEqual(saved.accessibilityModes, ['screen-reader']);
    assert.equal(saved.accessibilityPreference, 'screen-reader');
  });

  test('saveProfile allows empty modes array', async () => {
    const saved = await saveProfile({
      accessibilityModes: []
    });

    assert.deepEqual(saved.accessibilityModes, []);
    assert.equal(saved.accessibilityPreference, '');
  });
});
