const oddMap = {
  0: 1, 1: 0, 2: 5, 3: 7, 4: 9, 5: 13, 6: 15, 7: 17, 8: 19, 9: 21,
  A: 1, B: 0, C: 5, D: 7, E: 9, F: 13, G: 15, H: 17, I: 19, J: 21,
  K: 2, L: 4, M: 18, N: 20, O: 11, P: 3, Q: 6, R: 8, S: 12, T: 14,
  U: 16, V: 10, W: 22, X: 25, Y: 24, Z: 23,
};

function isValidFiscalCode(value) {
  const code = value.toUpperCase();
  if (!/^[A-Z]{6}[0-9]{2}[A-EHLMPRST][0-9]{2}[A-Z][0-9]{3}[A-Z]$/.test(code)) return false;
  let total = 0;
  for (let index = 0; index < 15; index += 1) {
    const char = code[index];
    total += index % 2 === 0 ? oddMap[char] : Number.isNaN(Number(char)) ? char.charCodeAt(0) - 65 : Number(char);
  }
  return String.fromCharCode(65 + (total % 26)) === code[15];
}

function isValidIban(value) {
  const iban = value.replace(/\s/g, '').toUpperCase();
  if (!/^IT[0-9]{2}[A-Z][0-9]{22}$/.test(iban)) return false;
  const rearranged = `${iban.slice(4)}${iban.slice(0, 4)}`;
  const numeric = [...rearranged].map((char) => (/[A-Z]/.test(char) ? char.charCodeAt(0) - 55 : char)).join('');
  let remainder = 0;
  for (const digit of numeric) remainder = (remainder * 10 + Number(digit)) % 97;
  return remainder === 1;
}

const detectors = [
  { type: 'EMAIL', pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu },
  { type: 'URL', pattern: /\b(?:https?:\/\/|www\.)[^\s<>()]+/giu },
  { type: 'TELEPHONENUM', pattern: /(?<!\w)(?:\+39[ .-]?)?(?:3\d{2}|0\d{1,3})[ .-]?\d{3}[ .-]?\d{3,4}(?!\w)/gu },
  { type: 'CF', pattern: /\b[A-Z]{6}[0-9]{2}[A-EHLMPRST][0-9]{2}[A-Z][0-9]{3}[A-Z]\b/giu, validate: isValidFiscalCode },
  { type: 'IBAN', pattern: /\bIT[0-9]{2}[A-Z](?:[ ]?[0-9]){22}\b/giu, validate: isValidIban },
  { type: 'DATE', pattern: /\b(?:0?[1-9]|[12]\d|3[01])[\/.\-](?:0?[1-9]|1[0-2])[\/.\-](?:19|20)\d{2}\b/gu },
];

export function detectSensitiveData(text) {
  const source = String(text ?? '');
  const candidates = [];
  detectors.forEach((detector, priority) => {
    for (const match of source.matchAll(detector.pattern)) {
      if (detector.validate && !detector.validate(match[0])) continue;
      candidates.push({
        id: `${detector.type}-${match.index}-${match[0].length}`,
        type: detector.type,
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
        selected: true,
        priority,
      });
    }
  });
  candidates.sort((a, b) => a.start - b.start || a.priority - b.priority || b.end - a.end);
  const accepted = [];
  for (const item of candidates) {
    if (!accepted.some((other) => item.start < other.end && item.end > other.start)) accepted.push(item);
  }
  return accepted.map(({ priority, ...finding }) => finding);
}

export function maskFindings(text, findings, { scope = '' } = {}) {
  const source = String(text ?? '');
  const selected = findings.filter((item) => item.selected !== false).sort((a, b) => a.start - b.start);
  const counters = new Map();
  const placeholders = new Map();
  const mapping = {};
  let cursor = 0;
  let output = '';

  for (const finding of selected) {
    if (finding.start < cursor) continue;
    const identity = `${finding.type}\u0000${finding.value}`;
    if (!placeholders.has(identity)) {
      const next = (counters.get(finding.type) ?? 0) + 1;
      counters.set(finding.type, next);
      placeholders.set(identity, scope ? `[[PRIVAI_${scope}_${finding.type}_${next}]]` : `[${finding.type}_${next}]`);
    }
    const placeholder = placeholders.get(identity);
    mapping[placeholder] = finding.value;
    output += source.slice(cursor, finding.start) + placeholder;
    cursor = finding.end;
  }
  output += source.slice(cursor);
  return { text: output, mapping, maskedCount: selected.length };
}

export function restoreProtectedText(text, mapping) {
  let output = String(text ?? '');
  let restoredCount = 0;
  const missingPlaceholders = [];
  for (const [placeholder, original] of Object.entries(mapping ?? {})) {
    if (!output.includes(placeholder)) { missingPlaceholders.push(placeholder); continue; }
    const occurrences = output.split(placeholder).length - 1;
    output = output.split(placeholder).join(original);
    restoredCount += occurrences;
  }
  return { text: output, restoredCount, missingPlaceholders };
}
