import test from 'node:test';
import assert from 'node:assert/strict';
import { createTranslator, normalizeLocale, SUPPORTED_LOCALES } from '../src/domain/i18n.mjs';
import { en } from '../src/locales/en.mjs';
import { it } from '../src/locales/it.mjs';

test('normalizes Italian locales and falls back to English for unsupported languages', () => {
  assert.equal(normalizeLocale('it-IT'), 'it');
  assert.equal(normalizeLocale('en-US'), 'en');
  assert.equal(normalizeLocale('fr-FR'), 'en');
  assert.deepEqual(SUPPORTED_LOCALES, ['it', 'en']);
});

test('falls back to English when an Italian translation is missing', () => {
  assert.equal(createTranslator('it').t('test.englishOnly'), 'English fallback');
});

test('interpolates variables without interpreting their contents', () => {
  assert.equal(createTranslator('it').t('scan.count', { count: '<3>' }), '<3> elementi rilevati');
});

test('makes missing keys visible instead of returning an empty label', () => {
  assert.equal(createTranslator('en').t('missing.key'), '[missing.key]');
});

test('Italian and English expose the same complete interface keys', () => {
  assert.deepEqual(Object.keys(it).sort(), Object.keys(en).sort());
});

test('Willy onboarding keeps the two promises in slides two and three separate', () => {
  assert.equal(it['onboarding.body2a'], 'Prima di iniziare un lavoro con un chatbot, passa da qui.');
  assert.equal(it['onboarding.body2b'], 'In pochi tocchi trasformeremo i tuoi contenuti in richieste utili per l’IA.');
  assert.equal(it['onboarding.body3a'], 'Proteggeremo i dati sensibili: deciderai sempre tu cosa nascondere.');
  assert.equal(it['onboarding.body3b'], 'Alla fine del lavoro torni qui e ripristiniamo tutto.');
});
