const COMPLETED_KEY = 'ai-pocket:onboarding-complete-v1';

export function createOnboardingState(storage) {
  return {
    shouldShow: () => storage.getItem(COMPLETED_KEY) !== 'true',
    complete: () => storage.setItem(COMPLETED_KEY, 'true'),
    canReplay: () => true,
  };
}
