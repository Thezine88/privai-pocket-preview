import test from 'node:test';
import assert from 'node:assert/strict';
import { routeForJob } from '../src/application/job-route.mjs';

test('reopens each persisted job at its real workflow step', () => {
  assert.equal(routeForJob({ status: 'reviewing' }), 'findings');
  assert.equal(routeForJob({ status: 'protected' }), 'action-choice');
  assert.equal(routeForJob({ status: 'protected', requestText: 'Richiesta pronta' }), 'final-check');
  assert.equal(routeForJob({ status: 'awaiting_ai' }), 'awaiting-response');
  assert.equal(routeForJob({ status: 'restored' }), 'result');
  assert.equal(routeForJob({ status: 'almost_ready' }), 'result');
});

test('rejects jobs that cannot yet be resumed', () => {
  assert.throws(() => routeForJob({ status: 'draft' }), /non riprendibile/i);
  assert.throws(() => routeForJob({ status: 'unknown' }), /non riprendibile/i);
});
