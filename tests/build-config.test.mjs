import test from 'node:test';
import assert from 'node:assert/strict';
import { readBuildConfig } from '../src/config/build.mjs';

test('owner channel enables the owner entitlement without billing', () => {
  assert.deepEqual(readBuildConfig({ channel: 'owner' }), {
    channel: 'owner',
    entitlement: 'owner',
    billingEnabled: false,
  });
});

test('beta and production builds keep billing disabled before publication', () => {
  assert.equal(readBuildConfig({ channel: 'beta' }).billingEnabled, false);
  assert.equal(readBuildConfig({ channel: 'production' }).billingEnabled, false);
});

test('unknown build channels are rejected', () => {
  assert.throws(() => readBuildConfig({ channel: 'preview' }), /Canale build non valido/);
});
