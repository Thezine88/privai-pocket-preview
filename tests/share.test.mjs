import test from 'node:test';
import assert from 'node:assert/strict';
import { containsWebLinks, removeWebLinks } from '../src/domain/share.mjs';
import { createOutboundShare } from '../src/domain/outbound-share.mjs';

test('detects web links before opening the native share sheet', () => {
  assert.equal(containsWebLinks('Visita https://example.com/prova.'), true);
  assert.equal(containsWebLinks('Testo senza collegamenti.'), false);
});

test('removes web links only from the explicitly requested share copy', () => {
  const original = 'Profilo: https://www.instagram.com/example/\nContinua qui.';
  assert.equal(removeWebLinks(original), 'Profilo:\nContinua qui.');
  assert.match(original, /https:\/\//);
});

test('generic sharing uses the native generic chooser with the complete text', async () => {
  const calls = [];
  const share = createOutboundShare({
    isNative: () => true,
    nativePlugin: { share: async (payload) => calls.push(['share', payload]) },
  });
  await share.shareAnywhere('Testo completo', 'Titolo');
  assert.deepEqual(calls, [['share', { text: 'Testo completo', title: 'Titolo' }]]);
});

test('AI sharing uses its dedicated native chooser instead of generic sharing', async () => {
  const calls = [];
  const share = createOutboundShare({
    isNative: () => true,
    nativePlugin: {
      share: async () => calls.push(['share']),
      shareWithAI: async (payload) => calls.push(['ai', payload]),
    },
  });
  await share.shareWithInstalledAI('Richiesta protetta', 'Scegli un’IA');
  assert.deepEqual(calls, [['ai', { text: 'Richiesta protetta', title: 'Scegli un’IA' }]]);
});

test('web sharing falls back to the platform share API without a native plugin', async () => {
  const calls = [];
  const share = createOutboundShare({
    isNative: () => false,
    webShare: async (payload) => calls.push(payload),
  });
  await share.shareAnywhere('Testo web', 'Titolo');
  assert.deepEqual(calls, [{ text: 'Testo web', title: 'Titolo' }]);
});
