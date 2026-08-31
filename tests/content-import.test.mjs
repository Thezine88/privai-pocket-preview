import test from 'node:test';
import assert from 'node:assert/strict';
import { readImportedBytes, readImportedContent } from '../src/application/content-import.mjs';

function textFile(name, type, text) {
  return { name, type, size: Buffer.byteLength(text), text: async () => text };
}

test('imports plain text and Markdown locally', async () => {
  assert.equal(await readImportedContent(textFile('nota.txt', 'text/plain', 'Testo locale')), 'Testo locale');
  assert.equal(await readImportedContent(textFile('nota.md', 'text/markdown', '# Titolo')), '# Titolo');
});

test('delegates PDFs to the existing offline extractor', async () => {
  const file = { name: 'documento.pdf', type: 'application/pdf', size: 12 };
  const calls = [];
  const text = await readImportedContent(file, { extractPdf: async (value) => { calls.push(value); return { text: 'PDF locale' }; } });
  assert.equal(text, 'PDF locale');
  assert.deepEqual(calls, [file]);
});

test('rejects unsupported and empty local files', async () => {
  await assert.rejects(readImportedContent(textFile('foto.jpg', 'image/jpeg', 'x')), /FORMATO_NON_SUPPORTATO/);
  await assert.rejects(readImportedContent(textFile('vuoto.txt', 'text/plain', '   ')), /FILE_SENZA_TESTO/);
});

test('reads incoming text bytes through the same local import path', async () => {
  const bytes = new TextEncoder().encode('Testo condiviso');
  assert.equal(await readImportedBytes({ name: 'nota.txt', mimeType: 'text/plain', bytes }), 'Testo condiviso');
});
