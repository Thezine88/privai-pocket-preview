import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('application shell is semantic and branded only as RestaMio', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /<main id="app"/);
  assert.match(html, /<title>RestaMio<\/title>/);
  assert.doesNotMatch(html, /PrivAI Pocket/);
});

test('new design tokens keep the approved orange and system safe areas', async () => {
  const tokens = await readFile(new URL('../src/ui/styles/tokens.css', import.meta.url), 'utf8');
  const base = await readFile(new URL('../src/ui/styles/base.css', import.meta.url), 'utf8');
  const screens = await readFile(new URL('../src/ui/styles/screens.css', import.meta.url), 'utf8');
  assert.match(tokens, /--color-brand:\s*#F4511E/i);
  assert.match(base, /safe-area-inset-top/);
  assert.match(screens, /safe-area-inset-bottom/);
  assert.match(screens, /prefers-reduced-motion:\s*reduce/);
});

test('fixed navigation reserves content space above Samsung controls', async () => {
  const screens = await readFile(new URL('../src/ui/styles/screens.css', import.meta.url), 'utf8');
  assert.match(screens, /--bottom-nav-space/);
  assert.match(screens, /padding-bottom:\s*calc\(var\(--bottom-nav-space\)/);
});

test('screen changes move accessibility focus to the visible title', async () => {
  const app = await readFile(new URL('../src/app.mjs', import.meta.url), 'utf8');
  assert.match(app, /querySelector\('h1'\)/);
  assert.match(app, /\.focus\(\{ preventScroll: true \}\)/);
});
