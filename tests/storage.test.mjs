import test from 'node:test';
import assert from 'node:assert/strict';
import { createJobStore, createStore } from '../src/domain/storage.mjs';
import { createMemoryVault } from '../src/platform/vault-port.mjs';
import { createJob } from '../src/domain/job.mjs';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

test('keeps only the configured number of recent items', () => {
  const store = createStore(memoryStorage(), { historyLimit: 2 });
  store.saveRecent({ id: '1', title: 'Uno', markdown: 'a' });
  store.saveRecent({ id: '2', title: 'Due', markdown: 'b' });
  store.saveRecent({ id: '3', title: 'Tre', markdown: 'c' });
  assert.deepEqual(store.listRecent().map((item) => item.id), ['3', '2']);
});

test('deletes one recent item without clearing the others', () => {
  const store = createStore(memoryStorage());
  store.saveRecent({ id: '1', title: 'Uno', markdown: 'a' });
  store.saveRecent({ id: '2', title: 'Due', markdown: 'b' });
  store.deleteRecent('2');
  assert.deepEqual(store.listRecent().map((item) => item.id), ['1']);
});

test('returns only a masked provider key summary', () => {
  const store = createStore(memoryStorage());
  store.saveProviderKey('groq', 'gsk_1234567890');
  assert.deepEqual(store.providerSummary('groq'), { configured: true, masked: '••••7890' });
  store.deleteProviderKey('groq');
  assert.deepEqual(store.providerSummary('groq'), { configured: false, masked: '' });
});

test('persists only supported interface locales', () => {
  const store = createStore(memoryStorage());
  assert.equal(store.getLocale(), null);
  store.saveLocale('en');
  assert.equal(store.getLocale(), 'en');
  assert.throws(() => store.saveLocale('de'), /Lingua non supportata/);
});

test('persists and reopens versioned jobs through the vault', async () => {
  const jobs = createJobStore(createMemoryVault());
  const job = createJob({ id: 'job-1', title: 'Email', now: '2026-08-30T12:00:00.000Z' });
  await jobs.save(job);
  assert.deepEqual(await jobs.open('job-1'), job);
  assert.deepEqual(await jobs.listIds(), ['job-1']);
  await jobs.remove('job-1');
  assert.equal(await jobs.open('job-1'), null);
});
