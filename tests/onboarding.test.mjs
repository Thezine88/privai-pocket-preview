import test from 'node:test';
import assert from 'node:assert/strict';
import { createOnboardingState } from '../src/domain/onboarding.mjs';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

test('shows Willy until the onboarding is completed on this installation', () => {
  const state = createOnboardingState(memoryStorage());
  assert.equal(state.shouldShow(), true);
  state.complete();
  assert.equal(state.shouldShow(), false);
});

test('allows settings to reopen the onboarding without forgetting completion', () => {
  const state = createOnboardingState(memoryStorage());
  state.complete();
  assert.equal(state.shouldShow(), false);
  assert.equal(state.canReplay(), true);
  assert.equal(state.shouldShow(), false);
});
