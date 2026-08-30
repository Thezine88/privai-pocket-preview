import test from 'node:test';
import assert from 'node:assert/strict';
import { initialRoute, onboardingRoute } from '../src/application/onboarding-state.mjs';

test('first launch opens onboarding and completed setup opens Home', () => {
  assert.deepEqual(initialRoute(false), { name: 'onboarding', state: { step: 0 } });
  assert.deepEqual(initialRoute(true), { name: 'home' });
});

test('onboarding navigation stays inside its three approved steps', () => {
  assert.deepEqual(onboardingRoute(1), { name: 'onboarding', state: { step: 1 } });
  assert.throws(() => onboardingRoute(-1), /Passaggio onboarding non valido/);
  assert.throws(() => onboardingRoute(3), /Passaggio onboarding non valido/);
});
