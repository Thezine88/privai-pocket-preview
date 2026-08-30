export function onboardingRoute(step) {
  if (!Number.isInteger(step) || step < 0 || step > 2) throw new RangeError('Passaggio onboarding non valido');
  return { name: 'onboarding', state: { step } };
}

export function initialRoute(isComplete) {
  return isComplete ? { name: 'home' } : onboardingRoute(0);
}
