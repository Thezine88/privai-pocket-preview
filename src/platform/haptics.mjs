const successfulPrimaryActions = new Set([
  'onboarding-next', 'finish-onboarding', 'protect-text', 'confirm-protection',
  'continue-action', 'save-manual-finding', 'open-ai', 'paste-response', 'copy-result', 'share-result',
]);

export function createHaptics(vibrate) {
  return {
    success(action) {
      if (!successfulPrimaryActions.has(action) || typeof vibrate !== 'function') return false;
      vibrate(12);
      return true;
    },
  };
}
