import test from 'node:test';
import assert from 'node:assert/strict';
import { containsWebLinks, removeWebLinks } from '../src/domain/share.mjs';

test('detects web links before opening the native share sheet', () => {
  assert.equal(containsWebLinks('Visita https://example.com/prova.'), true);
  assert.equal(containsWebLinks('Testo senza collegamenti.'), false);
});

test('removes web links only from the explicitly requested share copy', () => {
  const original = 'Profilo: https://www.instagram.com/example/\nContinua qui.';
  assert.equal(removeWebLinks(original), 'Profilo:\nContinua qui.');
  assert.match(original, /https:\/\//);
});
