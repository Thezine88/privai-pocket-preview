import test from 'node:test';
import assert from 'node:assert/strict';
import { renderVault } from '../src/ui/screens/vault.mjs';

test('empty Cassaforte explains its purpose without a dead call to action', () => {
  const html = renderVault({ jobs: [] });
  assert.match(html, /Nessun lavoro da completare/);
  assert.match(html, /I lavori protetti appariranno qui/);
});

test('Cassaforte lists only safe metadata before a job is opened', () => {
  const html = renderVault({ jobs: [{
    id: 'job-1', title: 'Email al cliente', status: 'awaiting_ai', updatedAt: '2026-08-30T12:00:00Z',
    protectedCount: 3, originalText: 'Mario Rossi 338123456', mapping: { token: 'mario@example.com' },
  }] });
  assert.match(html, /Email al cliente/);
  assert.match(html, /In attesa della risposta/);
  assert.match(html, /3 dati protetti/);
  assert.doesNotMatch(html, /Mario Rossi|338123456|mario@example\.com|token/);
});
