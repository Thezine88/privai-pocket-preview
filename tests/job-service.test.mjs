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

test('adds a manually selected local finding without changing the original text', async () => {
  const service = createJobService(createJobStore(createMemoryVault()), { now: () => NOW, createId: () => 'job-MAN1' });
  let job = await service.createTextJob('Contatta Mario Bianchi domani');
  job = await service.addManualFinding(job.id, { start: 9, end: 22, type: 'NAME' });
  assert.equal(job.originalText, 'Contatta Mario Bianchi domani');
  assert.deepEqual(job.findings.at(-1), {
    id: 'NAME-9-13-manual', type: 'NAME', value: 'Mario Bianchi', start: 9, end: 22, selected: true, manual: true,
  });
});

test('rejects empty, invalid, and overlapping manual selections', async () => {
  const service = createJobService(createJobStore(createMemoryVault()), { now: () => NOW, createId: () => 'job-MAN2' });
  const job = await service.createTextJob('Email mario@example.it');
  await assert.rejects(service.addManualFinding(job.id, { start: 0, end: 0, type: 'NAME' }), /seleziona/i);
  await assert.rejects(service.addManualFinding(job.id, { start: 6, end: 22, type: 'NAME' }), /già rilevato/i);
  await assert.rejects(service.addManualFinding(job.id, { start: 0, end: 5, type: 'UNKNOWN' }), /tipo/i);
});

test('reuses reviewed live findings when creating the text job', async () => {
  const service = createJobService(createJobStore(createMemoryVault()), { now: () => NOW, createId: () => 'job-L1VE' });
  const findings = [{ id: 'email-0-16', type: 'EMAIL', value: 'mario@example.it', start: 0, end: 16, selected: true }];

  const job = await service.createTextJob('mario@example.it', { findings });

  assert.deepEqual(job.findings, findings);
});

test('prepares requests for every configurable quick action', async () => {
  for (const action of ['translate', 'checklist', 'clarify']) {
    const service = createJobService(createJobStore(createMemoryVault()), { now: () => NOW, createId: () => `job-${action}` });
    let job = await service.createTextJob('Testo senza dati sensibili');
    job = await service.protect(job.id);
    job = await service.prepareRequest(job.id, { action });
    assert.equal(job.action, action);
    assert.match(job.requestText, /Testo senza dati sensibili/);
  }
});
