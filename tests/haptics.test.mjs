import test from 'node:test';
import assert from 'node:assert/strict';
import { createHaptics } from '../src/platform/haptics.mjs';

test('successful primary actions request one short tactile pulse when supported', () => {
  const pulses = [];
  const haptics = createHaptics((duration) => pulses.push(duration));

  assert.equal(haptics.success('protect-text'), true);
  assert.equal(haptics.success('toggle-category'), false);
  assert.deepEqual(pulses, [12]);
});

test('haptics remain a safe no-op when vibration is unavailable', () => {
  assert.equal(createHaptics().success('copy-result'), false);
});
