import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('packages the local web bundle without a remote server URL', async () => {
  const config = JSON.parse(await readFile(new URL('../capacitor.config.json', import.meta.url), 'utf8'));
  assert.equal(config.appId, 'app.privai.pocket');
  assert.equal(config.appName, 'PrivAI Pocket');
  assert.equal(config.webDir, 'www');
  assert.equal(config.server?.url, undefined);
});
