import test from 'node:test';
import assert from 'node:assert/strict';
import { createHaptics } from '../src/platform/haptics.mjs';

test('primary taps request one short tactile pulse when supported', () => {
  const pulses = [];
  const haptics = createHaptics((duration) => pulses.push(duration));

  assert.equal(haptics.tap(), true);
  assert.deepEqual(pulses, [12]);
});

test('haptics remain a safe no-op when vibration is unavailable', () => {
  assert.equal(createHaptics().tap(), false);
});
