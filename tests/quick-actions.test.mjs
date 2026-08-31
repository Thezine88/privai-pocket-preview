import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_QUICK_ACTIONS, moveQuickAction, normalizeQuickActions, resolveQuickAction, toggleQuickAction } from '../src/domain/quick-actions.mjs';

test('quick actions always resolve to exactly three known unique favourites', () => {
  assert.deepEqual(normalizeQuickActions(['summary', 'email', 'summary', 'unknown', 'cv']), ['summary', 'email', 'cv']);
  assert.deepEqual(normalizeQuickActions(null), DEFAULT_QUICK_ACTIONS);
  assert.deepEqual(normalizeQuickActions(['translate']), ['translate', 'email', 'summary']);
});

test('switching on a new favourite atomically replaces the third', () => {
  assert.deepEqual(toggleQuickAction(['email', 'summary', 'cv'], 'summary'), ['email', 'summary', 'cv']);
  assert.deepEqual(toggleQuickAction(['email', 'summary', 'cv'], 'translate'), ['email', 'summary', 'translate']);
});

test('reorder controls move only selected favourites', () => {
  assert.deepEqual(moveQuickAction(['email', 'summary', 'cv'], 'summary', -1), ['summary', 'email', 'cv']);
  assert.deepEqual(moveQuickAction(['email', 'summary', 'cv'], 'email', -1), ['email', 'summary', 'cv']);
});

test('a removed selected action resolves to the first visible favourite', () => {
  assert.equal(resolveQuickAction('cv', ['email', 'summary', 'translate']), 'email');
  assert.equal(resolveQuickAction('summary', ['email', 'summary', 'translate']), 'summary');
  assert.equal(resolveQuickAction('custom', ['email', 'summary', 'translate']), 'custom');
});
