import test from 'node:test';
import assert from 'node:assert/strict';
import { renderHome } from '../src/ui/screens/home.mjs';

test('empty Home leads with the two immediate starting points', () => {
  const html = renderHome({ plan: 'owner', jobs: [] });
  assert.match(html, /Da dove vuoi iniziare\?/);
  assert.match(html, /Incolla o scrivi un testo/);
  assert.match(html, /Importa un file/);
  assert.doesNotMatch(html, /Nessun lavoro/);
  assert.doesNotMatch(html, /Hai un lavoro da completare/);
});

test('Home shows only the most recent incomplete job', () => {
  const html = renderHome({ jobs: [
    { id: 'old', title: 'Vecchio lavoro', status: 'awaiting_ai', updatedAt: '2026-08-29T12:00:00Z' },
    { id: 'new', title: 'Email al cliente', status: 'awaiting_ai', updatedAt: '2026-08-30T12:00:00Z', protectedCount: 3 },
  ] });
  assert.match(html, /Hai un lavoro da completare/);
  assert.match(html, /Email al cliente/);
  assert.match(html, /In attesa della risposta dell’AI/);
  assert.match(html, /Vedi tutti in Cassaforte/);
  assert.doesNotMatch(html, /Vecchio lavoro/);
});

test('Home exposes a ready restored result without calling it an AI wait', () => {
  const html = renderHome({ jobs: [{ id: 'ready', title: 'Preventivo', status: 'restored', updatedAt: '2026-08-30T12:00:00Z' }] });
  assert.match(html, /Il testo è pronto/);
  assert.match(html, /Apri il risultato/);
  assert.doesNotMatch(html, /In attesa della risposta dell’AI/);
});

test('Home keeps new-work actions available after a local loading error', () => {
  const html = renderHome({ loadError: true });
  assert.match(html, /Non riesco ad aprire questo lavoro/);
  assert.match(html, /Riprova/);
  assert.match(html, /Incolla o scrivi un testo/);
});
