import test from 'node:test';
import assert from 'node:assert/strict';
import {
  boundedOnboardingIndex,
  createOnboardingState,
  swipeStepDelta,
  tapStepDelta,
} from '../src/domain/onboarding.mjs';

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

test('swipe navigation ignores taps and maps horizontal gestures to slide steps', () => {
  assert.equal(swipeStepDelta(200, 145), 1);
  assert.equal(swipeStepDelta(145, 200), -1);
  assert.equal(swipeStepDelta(200, 170), 0);
});

test('tapping the left or right half navigates backward or forward', () => {
  assert.equal(tapStepDelta(90, 400), -1);
  assert.equal(tapStepDelta(310, 400), 1);
});

test('onboarding navigation stops at the first and last slide', () => {
  assert.equal(boundedOnboardingIndex(0, -1, 3), 0);
  assert.equal(boundedOnboardingIndex(1, 1, 3), 2);
  assert.equal(boundedOnboardingIndex(3, 1, 3), 3);
});
