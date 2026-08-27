const COMPLETED_KEY = 'ai-pocket:onboarding-complete-v1';

export function swipeStepDelta(startX, endX, threshold = 48) {
  const distance = endX - startX;
  if (Math.abs(distance) < threshold) return 0;
  return distance < 0 ? 1 : -1;
}

export function createOnboardingState(storage) {
  return {
    shouldShow: () => storage.getItem(COMPLETED_KEY) !== 'true',
    complete: () => storage.setItem(COMPLETED_KEY, 'true'),
    canReplay: () => true,
  };
}
