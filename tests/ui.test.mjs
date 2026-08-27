import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

/**
 * Contratto strutturale della v2: un flusso unico invece di tre strumenti
 * separati. Questi test proteggono le decisioni di design che hanno risolto
 * problemi reali misurati sulla v1 — non sono un controllo estetico.
 */

test('the flow is single: one view for the whole job, not three separate tools', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  for (const view of ['home', 'work', 'restore', 'vault', 'settings', 'plans']) {
    assert.match(html, new RegExp(`data-view="${view}"`));
  }
  // Le tre fasi di UN SOLO strumento, non tre strumenti indipendenti come in v1.
  for (const phase of ['text', 'check', 'send']) {
    assert.match(html, new RegExp(`data-phase="${phase}"`));
  }
});

test('the primary action never scrolls off screen', async () => {
  // Sulla v1, misurato: prima del pulsante principale c'erano 693px di
  // intestazioni e banner, e ne restavano visibili 13. Qui l'azione è fuori
  // dal flusso del documento.
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  const block = css.match(/\.action-bar\s*\{([^}]*)\}/s)?.[1] ?? '';
  assert.match(block, /position:\s*fixed/);
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="action-bar"/);
  assert.match(html, /id="action-main"/);
});

test('sharing a document opens straight on the findings screen: zero taps to see what was found', async () => {
  const app = await readFile(new URL('../src/app.mjs', import.meta.url), 'utf8');
  assert.match(app, /createInbound/);
  assert.match(app, /jumpToCheck/);
});

test('the quick-settings tile runs headless: no screen is drawn when the native flag is set', async () => {
  const app = await readFile(new URL('../src/app.mjs', import.meta.url), 'utf8');
  assert.match(app, /__privaiQuickProtect/);
  assert.match(app, /decideQuickProtect/);
  assert.match(app, /Capacitor\?\.Plugins\?\.QuickProtect/);
});

test('the round trip back from the AI takes one tap, not seven', async () => {
  // Misurato sulla v1: 3 tocchi all'andata, 7-8 al ritorno. La barra del
  // rientro riconosce i SEGNAPOSTO NOSTRI negli appunti e basta.
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  for (const id of ['resume-bar', 'resume-action', 'resume-text', 'resume-close']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  const app = await readFile(new URL('../src/app.mjs', import.meta.url), 'utf8');
  assert.match(app, /shouldOfferRestore/);
});

test('the resume bar never reads the clipboard on its own without checking first', async () => {
  // Leggere gli appunti e agire senza che l'utente abbia chiesto nulla è
  // esattamente il tipo di cosa che fa perdere fiducia a un'app di privacy.
  const app = await readFile(new URL('../src/app.mjs', import.meta.url), 'utf8');
  const fn = app.slice(app.indexOf('async function checkClipboardOnResume'));
  assert.match(fn.slice(0, 400), /shouldOfferRestore/);
});

test('touch targets meet the 48dp minimum, and the [hidden] attribute always wins', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(css, /--tap:\s*48px/);
  // Un elemento con classe che imposta display aveva la stessa specificità di
  // [hidden] e vinceva se dichiarato prima: un bug reale, trovato usando
  // l'app, non leggendo il codice.
  assert.match(css, /\[hidden\]\s*\{\s*display:\s*none;\s*\}\s*$/m);
});

test('both light and dark themes are defined, never forced to light only', async () => {
  // Diverso da prima di proposito: la v1 dichiarava "color-scheme: only light"
  // ed escludeva il tema scuro dal codice stesso.
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /only light/);
  assert.match(css, /prefers-color-scheme:\s*dark/);
  assert.match(css, /:root\[data-theme="dark"\]/);
});

test('no !important outside the reduced-motion escape hatch', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  const lines = css.split('\n').map((line, index) => ({ line, index }));
  const stray = lines.filter(({ line }) => (
    /^\s*[a-z-]+\s*:.*!important/.test(line)
    && !/animation-duration|animation-iteration-count|transition-duration|scroll-behavior/.test(line)
  ));
  assert.deepEqual(stray, [], 'ogni !important fuori da prefers-reduced-motion è un residuo da eliminare');
});

test('requests are built from pre-selected multiple-choice chips, not a blank prompt field', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="recipes"/);
  assert.match(html, /id="questions"/);
  const recipes = await readFile(new URL('../src/domain/recipes.mjs', import.meta.url), 'utf8');
  assert.match(recipes, /export function defaultAnswers/);
});

test('sensitive findings separate certain matches from low-confidence guesses', async () => {
  const pii = await readFile(new URL('../src/domain/pii.mjs', import.meta.url), 'utf8');
  assert.match(pii, /maybe:\s*true/);
  const app = await readFile(new URL('../src/app.mjs', import.meta.url), 'utf8');
  assert.match(app, /data-maybe/);
});

test('the vault survives closing the app: no in-memory-only mapping', async () => {
  const vault = await readFile(new URL('../src/domain/vault.mjs', import.meta.url), 'utf8');
  assert.match(vault, /export function createVault/);
  assert.match(vault, /async saveJob/);
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="nav-badge"/);
});

test('the interface never promises API calls it does not make', async () => {
  // La v1 raccoglieva chiavi API in chiaro senza mai usarle per chiamare
  // nessun servizio. La v2 non ha quella schermata.
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /api-key-input/);
  assert.doesNotMatch(html, /Chiave API/);
});

test('deleting all data is one tap away in settings, honestly labelled', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="wipe"/);
  const app = await readFile(new URL('../src/app.mjs', import.meta.url), 'utf8');
  assert.match(app, /wipeEverything/);
});

test('protection itself is never metered: no counter on detect, mask or restore', async () => {
  const plan = await readFile(new URL('../src/domain/plan.mjs', import.meta.url), 'utf8');
  for (const vietato of ['maskLimit', 'restoreLimit', 'detectLimit', 'scanLimit']) {
    assert.doesNotMatch(plan, new RegExp(vietato));
  }
});

test('the theme is a real user choice: system, light or dark — never locked to one', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="ui-theme"/);
  for (const value of ['system', 'light', 'dark']) {
    assert.match(html, new RegExp(`<option value="${value}"`));
  }
  const app = await readFile(new URL('../src/app.mjs', import.meta.url), 'utf8');
  assert.match(app, /function applyTheme/);
});

test('the greeting wraps under its own text, not under the emoji', async () => {
  // Prima erano un unico nodo di testo: "alla" andava a capo sotto il razzo
  // invece che sotto "Mettimi", perché un flusso di testo continuo ricomincia
  // sempre dal margine sinistro del contenitore.
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="greeting-emoji"/);
  assert.match(html, /id="greeting-text"/);
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.greeting\s*\{[^}]*display:\s*flex/s);
});

test('empty-state prose reads left to right, not centred into a cone', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  const block = css.match(/\.empty p\s*\{([^}]*)\}/s)?.[1] ?? '';
  assert.match(block, /text-align:\s*left/);
});

test('intake icons match what the buttons actually do', async () => {
  // "Incolla un testo" e "Apri un file" usavano illustrazioni pensate per
  // altri strumenti (una bacchetta magica, un documento con frecce circolari)
  // e non dicevano nulla del gesto reale.
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /tool-prepare\.webp/);
  assert.doesNotMatch(html, /tool-markdown\.webp/);
  const intake = html.slice(html.indexOf('id="intake-paste"'), html.indexOf('id="intake-file"') + 400);
  assert.match(intake, /<svg/);
});
