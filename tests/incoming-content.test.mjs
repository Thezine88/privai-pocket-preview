import test from 'node:test';
import assert from 'node:assert/strict';
import { processIncomingContent } from '../src/application/incoming-content.mjs';

test('routes shared documents through the local byte importer and always discards the cache', async () => {
  const calls = [];
  const text = await processIncomingContent({
    item: { kind: 'document', cacheId: 'doc', name: 'nota.txt', mimeType: 'text/plain' },
    port: { read: async () => ({ base64: 'dGVzdG8=' }), discard: async (id) => calls.push(id) },
    decodeBase64: () => new Uint8Array([1]),
    importBytes: async ({ name }) => `letto:${name}`,
  });
  assert.equal(text, 'letto:nota.txt');
  assert.deepEqual(calls, ['doc']);
});

test('uses local OCR for images and rejects empty recognition without leaking the cache', async () => {
  const discarded = [];
  const port = { recognize: async () => ({ text: '  testo foto  ' }), discard: async (id) => discarded.push(id) };
  assert.equal(await processIncomingContent({ item: { kind: 'image', cacheId: 'img' }, port }), 'testo foto');
  port.recognize = async () => ({ text: '   ' });
  await assert.rejects(processIncomingContent({ item: { kind: 'image', cacheId: 'empty' }, port }), /leggibile/i);
  assert.deepEqual(discarded, ['img', 'empty']);
});
