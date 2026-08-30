import test from 'node:test';
import assert from 'node:assert/strict';
import { createJob, parseJob, serializeJob, transitionJob } from '../src/domain/job.mjs';

const NOW = '2026-08-30T12:00:00.000Z';

test('creates a versioned draft without storing undefined fields', () => {
  assert.deepEqual(createJob({ id: 'job-1', title: 'Email al cliente', now: NOW }), {
    version: 1,
    id: 'job-1',
    title: 'Email al cliente',
    status: 'draft',
    createdAt: NOW,
    updatedAt: NOW,
  });
});

test('moves through the complete protection and restoration path', () => {
  let job = createJob({ id: 'job-1', title: 'Email', now: NOW });
  for (const status of ['reviewing', 'protected', 'awaiting_ai', 'restored']) {
    job = transitionJob(job, status, { now: NOW });
    assert.equal(job.status, status);
  }
});

test('supports a recoverable almost-ready restoration', () => {
  const awaiting = { ...createJob({ id: 'job-1', title: 'Email', now: NOW }), status: 'awaiting_ai' };
  const almostReady = transitionJob(awaiting, 'almost_ready', { now: NOW });
  assert.equal(transitionJob(almostReady, 'awaiting_ai', { now: NOW }).status, 'awaiting_ai');
});

test('rejects invalid state transitions', () => {
  const draft = createJob({ id: 'job-1', title: 'Email', now: NOW });
  assert.throws(() => transitionJob(draft, 'restored', { now: NOW }), /Transizione lavoro non valida/);
});

test('round-trips a job and rejects unsupported serialized versions', () => {
  const job = createJob({ id: 'job-1', title: 'Email', now: NOW });
  assert.deepEqual(parseJob(serializeJob(job)), job);
  assert.throws(() => parseJob('{"version":2,"id":"job-1"}'), /Versione lavoro non supportata/);
});

test('rejects malformed persisted jobs', () => {
  assert.throws(() => parseJob('{"version":1,"id":"","title":"Email","status":"draft"}'), /Lavoro non valido/);
  assert.throws(() => parseJob('not-json'), /Lavoro non valido/);
});
