import test from 'node:test';
import assert from 'node:assert/strict';
import { createJobService } from '../src/application/job-service.mjs';
import { createJobStore } from '../src/domain/storage.mjs';
import { createMemoryVault } from '../src/platform/vault-port.mjs';

const NOW = '2026-08-31T12:00:00.000Z';

test('protects, persists, reopens and restores a complete text job', async () => {
  const vault = createMemoryVault();
  const first = createJobService(createJobStore(vault), { now: () => NOW, createId: () => 'job-A7F2' });
  let job = await first.createTextJob('Scrivi a mario@example.it e chiama 333 123 4567');
  assert.equal(job.status, 'reviewing');
  assert.equal(job.findings.length, 2);

  job = await first.protect(job.id);
  assert.equal(job.status, 'protected');
  assert.match(job.protectedText, /\[\[RESTAMIO_A7F2_EMAIL_1\]\]/);
  assert.equal(job.protectedCount, 2);

  job = await first.prepareRequest(job.id, { action: 'summary' });
  assert.match(job.requestText, /Riassumi/);
  job = await first.markAwaiting(job.id, job.requestText);
  assert.equal(job.status, 'awaiting_ai');
  assert.equal((await first.markAwaiting(job.id, `${job.requestText}\nPiù breve`)).status, 'awaiting_ai');

  const afterRestart = createJobService(createJobStore(vault), { now: () => NOW });
  assert.equal((await afterRestart.open(job.id)).status, 'awaiting_ai');
  const restored = await afterRestart.restore(job.id, 'Risposta a [[RESTAMIO_A7F2_EMAIL_1]].');
  assert.equal(restored.status, 'restored');
  assert.equal(restored.resultText, 'Risposta a mario@example.it.');
  assert.equal(restored.restoredCount, 1);
});

test('keeps unknown placeholder-like text unchanged and marks result almost ready', async () => {
  const service = createJobService(createJobStore(createMemoryVault()), { now: () => NOW, createId: () => 'job-B4C9' });
  let job = await service.createTextJob('Email mario@example.it');
  job = await service.protect(job.id);
  job = await service.prepareRequest(job.id, { action: 'custom', customPrompt: 'Rispondi con cortesia' });
  await service.markAwaiting(job.id, job.requestText);
  const result = await service.restore(job.id, 'Ciao [[RESTAMIO_ALTRO_EMAIL_1]]');
  assert.equal(result.status, 'almost_ready');
  assert.equal(result.resultText, 'Ciao [[RESTAMIO_ALTRO_EMAIL_1]]');
  assert.equal(result.unresolvedCount, 1);
});

test('updates individual finding selections before protection', async () => {
  const service = createJobService(createJobStore(createMemoryVault()), { now: () => NOW, createId: () => 'job-C3D8' });
  let job = await service.createTextJob('Email mario@example.it, data 12/06/1985');
  job = await service.setFindingSelection(job.id, job.findings.find((item) => item.type === 'DATE').id, false);
  job = await service.protect(job.id);
  assert.equal(job.protectedCount, 1);
  assert.match(job.protectedText, /12\/06\/1985/);
});
