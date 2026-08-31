import test from 'node:test';
import assert from 'node:assert/strict';
import { createAndroidIncomingShare } from '../src/platform/android-incoming-share.mjs';

test('normalizes pending Android shares and reads only the requested cache item', async () => {
  const calls = [];
  const plugin = {
    getPending: async () => ({ item: { kind: 'DOCUMENT', mimeType: 'text/plain', name: 'nota.txt', size: 4, cacheId: 'safe-id' } }),
    read: async (args) => { calls.push(['read', args]); return { base64: 'dGVzdA==' }; },
    recognize: async (args) => { calls.push(['recognize', args]); return { text: 'testo foto' }; },
    discard: async (args) => { calls.push(['discard', args]); },
  };
  const port = createAndroidIncomingShare(plugin);
  assert.deepEqual(await port.pending(), { kind: 'document', mimeType: 'text/plain', name: 'nota.txt', size: 4, cacheId: 'safe-id' });
  assert.equal((await port.read('safe-id')).base64, 'dGVzdA==');
  assert.equal((await port.recognize('safe-id')).text, 'testo foto');
  await port.discard('safe-id');
  assert.deepEqual(calls, [['read', { cacheId: 'safe-id' }], ['recognize', { cacheId: 'safe-id' }], ['discard', { cacheId: 'safe-id' }]]);
});

test('rejects malformed native share metadata before use', async () => {
  const port = createAndroidIncomingShare({ getPending: async () => ({ item: { kind: 'OTHER', cacheId: '../bad' } }) });
  await assert.rejects(port.pending(), /non supportata/i);
  await assert.rejects(port.read(''), /cache/i);
});
