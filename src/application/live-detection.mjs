export function inputDetectionState(text, findings = [], pending = false) {
  const count = findings.length;
  return {
    ctaDisabled: !String(text ?? '').trim(),
    label: pending ? 'Controllo in corso…' : count === 1 ? '1 dato trovato' : `${count} dati trovati`,
  };
}

export function createLiveDetection({
  detect,
  onResult,
  delay = 350,
  schedule = setTimeout,
  cancel = clearTimeout,
}) {
  let pending;
  return {
    update(value) {
      if (pending !== undefined) cancel(pending);
      const text = String(value ?? '');
      if (!text.trim()) {
        pending = undefined;
        onResult({ text: '', findings: [] });
        return;
      }
      pending = schedule(() => {
        pending = undefined;
        onResult({ text, findings: detect(text) });
      }, delay);
    },
  };
}
