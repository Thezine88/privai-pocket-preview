import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkPackageSafety } from '../scripts/check-package.mjs';

test('accepts a bundle with provider names but no credentials or remote server', async () => {
  const root = await mkdtemp(join(tmpdir(), 'privai-safe-'));
  await writeFile(join(root, 'app.js'), 'const providers = ["OpenAI", "Groq"];');
  assert.deepEqual(await checkPackageSafety(root), []);
});

test('reports credential prefixes and remote Capacitor server configuration', async () => {
  const root = await mkdtemp(join(tmpdir(), 'privai-unsafe-'));
  await mkdir(join(root, 'nested'));
  await writeFile(join(root, 'nested', 'config.json'), '{"server":{"url":"https://example.test"},"key":"gsk_example"}');
  const findings = await checkPackageSafety(root);
  assert.equal(findings.length, 2);
  assert.deepEqual(findings.map((item) => item.rule).sort(), ['credential:gsk_', 'remote-server-url']);
});
