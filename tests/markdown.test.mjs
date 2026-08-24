import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeToMarkdown, buildPromptPack } from '../src/domain/markdown.mjs';

test('normalizes headings, bullets, and repeated blank lines', () => {
  const input = 'RIUNIONE CLIENTE\n\n\n• chiamare Mario\n-  inviare preventivo   domani';
  assert.equal(
    normalizeToMarkdown(input),
    '# Riunione cliente\n\n- chiamare Mario\n- inviare preventivo domani',
  );
});

test('preserves existing markdown and removes surrounding whitespace', () => {
  assert.equal(normalizeToMarkdown('  ## Nota\n\n**testo**  '), '## Nota\n\n**testo**');
});

test('builds an AI-ready markdown pack without empty optional sections', () => {
  assert.equal(
    buildPromptPack({
      goal: 'Crea una checklist',
      constraints: ['Non inventare dati', 'Mantieni le date'],
      content: 'Appuntamento il 2 settembre.',
    }),
    '# Obiettivo\n\nCrea una checklist\n\n# Vincoli\n\n- Non inventare dati\n- Mantieni le date\n\n# Contenuto\n\nAppuntamento il 2 settembre.',
  );
});

test('requests an output language without translating the supplied content', () => {
  const result = buildPromptPack({
    goal: 'Summarize',
    constraints: [],
    content: 'Ciao mondo',
    outputLanguage: 'en',
  });
  assert.match(result, /# Output language\n\nEnglish/);
  assert.match(result, /Ciao mondo/);
});

test('omits output language instructions when keeping the content language', () => {
  const result = buildPromptPack({ goal: 'Riassumi', content: 'Hello', outputLanguage: 'same' });
  assert.doesNotMatch(result, /Output language|Lingua del risultato/);
});
