import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryVault, createSessionVault } from '../src/platform/vault-port.mjs';
import { createAndroidVault } from '../src/platform/android-vault.mjs';

async function verifyVault(vault) {
  assert.deepEqual(await vault.list(), []);
  await vault.write('job-1', 'cifrato-1');
  await vault.write('job-2', 'cifrato-2');
  assert.deepEqual(await vault.list(), ['job-1', 'job-2']);
  assert.equal(await vault.read('job-1'), 'cifrato-1');
  await vault.remove('job-1');
  assert.equal(await vault.read('job-1'), null);
  await vault.clear();
  assert.deepEqual(await vault.list(), []);
}

test('memory vault implements the storage contract', async () => {
  await verifyVault(createMemoryVault());
});

test('web fallback keeps encrypted payloads in session storage only', async () => {
  const values = new Map();
  const sessionStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  await verifyVault(createSessionVault(sessionStorage));
  assert.equal([...values.keys()].every((key) => key.startsWith('restamio:vault:')), true);
});

test('Android vault delegates only the explicit vault operations', async () => {
  const calls = [];
  const plugin = new Proxy({}, {
    get: (_, operation) => async (payload) => {
      calls.push([operation, payload]);
      if (operation === 'list') return { keys: ['job-1'] };
      if (operation === 'read') return { value: 'ciphertext' };
      return {};
    },
  });
  const vault = createAndroidVault(plugin);
  assert.deepEqual(await vault.list(), ['job-1']);
  assert.equal(await vault.read('job-1'), 'ciphertext');
  await vault.write('job-1', 'ciphertext');
  await vault.remove('job-1');
  await vault.clear();
  assert.deepEqual(calls, [
    ['list', undefined],
    ['read', { key: 'job-1' }],
    ['write', { key: 'job-1', value: 'ciphertext' }],
    ['remove', { key: 'job-1' }],
    ['clear', undefined],
  ]);
});

test('vault keys cannot be empty', async () => {
  const vault = createMemoryVault();
  await assert.rejects(vault.write('', 'value'), /Chiave Cassaforte non valida/);
  await assert.rejects(vault.read(''), /Chiave Cassaforte non valida/);
});
