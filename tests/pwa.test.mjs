import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('manifest provides standalone Android install metadata', async () => {
  const manifest = JSON.parse(await readFile(new URL('../manifest.webmanifest', import.meta.url), 'utf8'));
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.theme_color, '#FFF8F1');
  assert.equal(manifest.share_target.action, './?share=1');
  assert.ok(manifest.icons.some((icon) => icon.sizes === '512x512'));
});

test('service worker precaches the complete app shell', async () => {
  const worker = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
  for (const asset of ['./index.html', './styles.css', './src/app.mjs', './manifest.webmanifest']) {
    assert.match(worker, new RegExp(asset.replaceAll('.', '\\.')));
  }
});
