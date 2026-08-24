import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('mobile shell exposes the core workflows and corrected collaboration link', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  for (const label of ['Converti', 'Proteggi', 'Prepara', 'Cronologia', 'API personali']) {
    assert.match(html, new RegExp(label));
  }
  assert.match(html, /https:\/\/www\.instagram\.com\/notizieartificiali\.ai\//);
  assert.match(html, /@notizieartificiali\.ai/);
  assert.match(html, /Esempio pratico/);
  assert.match(html, /Passa a Pro/);
  assert.match(html, /Prima → Dopo/);
  assert.match(html, /Condividi/);
  assert.match(html, /id="global-copy"/);
  assert.match(html, /id="global-share"/);
  assert.match(html, /Condividi direttamente con WhatsApp, email e le tue app/);
  assert.match(html, /Lavora su più documenti insieme/);
  assert.match(html, /Crea le tue regole di protezione/);
  assert.match(html, /Sincronizza con Drive in modo cifrato/);
});

test('theme defines the approved color system and mobile touch targets', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  for (const color of ['#FFF8F1', '#FF6B00', '#111114', '#68635F', '#20A464']) {
    assert.match(css.toUpperCase(), new RegExp(color.toUpperCase()));
  }
  assert.match(css, /min-height:\s*48px/);
});

test('interface exposes runtime language and output-language controls', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const app = await readFile(new URL('../src/app.mjs', import.meta.url), 'utf8');
  assert.match(html, /id="language-select"/);
  assert.match(html, /id="output-language-select"/);
  assert.match(html, /data-i18n="home\.tools"/);
  assert.match(html, /data-i18n-placeholder=/);
  assert.match(app, /domain\/i18n\.mjs/);
});
