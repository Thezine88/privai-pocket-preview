import test from 'node:test';
import assert from 'node:assert/strict';
import { renderIncomingProcessing } from '../src/ui/screens/incoming-processing.mjs';

test('shared documents and images have distinct processing messages', () => {
  const document = renderIncomingProcessing({ kind: 'document', name: 'nota.pdf' });
  assert.match(document, /Sto leggendo il documento/);
  assert.match(document, /nota\.pdf/);
  assert.doesNotMatch(document, /Scegli il tipo/);
  const image = renderIncomingProcessing({ kind: 'image', name: 'screen.png' });
  assert.match(image, /Sto analizzando l’immagine/);
  assert.match(image, /screen\.png/);
});

test('processing errors preserve a clear recovery action', () => {
  const html = renderIncomingProcessing({ kind: 'document', name: 'vuoto.pdf', error: 'Non trovo testo leggibile.' });
  assert.match(html, /role="alert"/);
  assert.match(html, /Torna alla Home/);
});
