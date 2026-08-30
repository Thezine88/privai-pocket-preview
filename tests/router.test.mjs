import test from 'node:test';
import assert from 'node:assert/strict';
import { createRouter } from '../src/ui/router.mjs';

test('push and back preserve the state of the previous screen', () => {
  const router = createRouter({ name: 'home', state: { scrollTop: 180 } });
  router.push({ name: 'content', state: { text: 'Ciao Simone' } });
  assert.deepEqual(router.current(), { name: 'content', state: { text: 'Ciao Simone' } });
  assert.equal(router.back(), true);
  assert.deepEqual(router.current(), { name: 'home', state: { scrollTop: 180 } });
});

test('back at the root does not remove the home screen', () => {
  const router = createRouter({ name: 'home' });
  assert.equal(router.back(), false);
  assert.deepEqual(router.current(), { name: 'home', state: {} });
});

test('replace changes only the current route and notifies subscribers', () => {
  const seen = [];
  const router = createRouter({ name: 'home' });
  router.subscribe((route) => seen.push(route.name));
  router.push({ name: 'content' });
  router.replace({ name: 'findings', state: { selected: 2 } });
  assert.deepEqual(seen, ['content', 'findings']);
  assert.deepEqual(router.current(), { name: 'findings', state: { selected: 2 } });
});

test('routes require a non-empty name', () => {
  assert.throws(() => createRouter({ name: '' }), /Schermata non valida/);
});
