export function createHaptics(vibrate) {
  return {
    tap() {
      if (typeof vibrate !== 'function') return false;
      vibrate(12);
      return true;
    },
  };
}
