import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('manifest provides standalone Android install metadata', async () => {
  const manifest = JSON.parse(await readFile(new URL('../manifest.webmanifest', import.meta.url), 'utf8'));
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.theme_color, '#FFF8F1');
  assert.equal(manifest.share_target, undefined);
  assert.ok(manifest.icons.some((icon) => icon.sizes === '512x512'));
});

test('service worker never caches query-bearing requests and only falls back for navigations', async () => {
  const sw = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
  assert.match(sw, /url\.search/);
  assert.match(sw, /request\.mode === 'navigate'/);
  assert.match(sw, /cache\.put\(url\.pathname/);
});

test('service worker precaches the complete app shell', async () => {
  const worker = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
  for (const asset of ['./index.html', './styles.css', './src/app.mjs', './src/domain/share.mjs', './src/domain/pdf.mjs', './vendor/pdf.mjs', './vendor/pdf.worker.mjs', './src/locales/it.mjs', './src/locales/en.mjs', './manifest.webmanifest', './assets/reward-token.webp', './assets/tool-markdown.webp', './assets/tool-protect.webp', './assets/tool-prepare.webp', './assets/tool-history.webp']) {
    assert.match(worker, new RegExp(asset.replaceAll('.', '\\.')));
  }
});
