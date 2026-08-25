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
  assert.doesNotMatch(html, /class="example-card"/);
  assert.match(html, /Passa a Pro/);
  assert.match(html, /Condividi/);
  assert.doesNotMatch(html, /id="global-copy"/);
  assert.doesNotMatch(html, /id="global-share"/);
  assert.match(html, /class="result-actions"/);
  assert.match(html, /data-copy-result="markdown-output"/);
  assert.match(html, /data-share-result="markdown-output"/);
  assert.match(html, /id="share-links-dialog"/);
  assert.match(html, /Condividi direttamente con WhatsApp, email e le tue app/);
  assert.match(html, /Lavora su più documenti insieme/);
  assert.match(html, /Crea le tue regole di protezione/);
  assert.match(html, /Sincronizza con Drive in modo cifrato/);
});

test('tools use dedicated input review and result phases', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const app = await readFile(new URL('../src/app.mjs', import.meta.url), 'utf8');
  for (const workflow of ['convert', 'protect', 'prepare']) {
    assert.match(html, new RegExp(`data-workflow="${workflow}"`));
  }
  for (const phase of ['input', 'review', 'result']) {
    assert.match(html, new RegExp(`data-phase="${phase}"`));
  }
  assert.match(html, /data-protect-mode="restore"/);
  assert.match(html, /id="voice-entry"/);
  assert.match(html, /aria-label="Microfono, in arrivo"/);
  assert.match(app, /domain\/workflow\.mjs/);
  assert.match(app, /function showWorkflowPhase/);
});

test('theme defines the approved color system and mobile touch targets', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  for (const color of ['#FFF8F1', '#FF6B00', '#111114', '#68635F', '#20A464']) {
    assert.match(css.toUpperCase(), new RegExp(color.toUpperCase()));
  }
  assert.match(css, /min-height:\s*48px/);
  assert.match(css, /\.add-button\s*svg/);
  assert.match(css, /left:\s*50%/);
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

test('home uses visual tool cards and keeps reward tokens in the top bar', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  for (const asset of ['tool-markdown.webp', 'tool-protect.webp', 'tool-prepare.webp', 'tool-history.webp', 'reward-token.webp']) {
    assert.match(html, new RegExp(`assets/${asset}`));
  }
  assert.doesNotMatch(html, /class="hero-product"/);
  assert.match(html, /class="token-balance"/);
  assert.match(html, /id="points-info"/);
  assert.match(html, /id="points-dialog"/);
  assert.match(html, /id="quick-add-dialog"/);
  assert.match(html, /id="quick-paste"/);
  assert.match(html, /id="quick-file"/);
  assert.doesNotMatch(html, /class="points-card"/);
});

test('home forces the approved light palette and keeps tool art secondary', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(css, /color-scheme:\s*light only/);
  assert.match(css, /\.tool-card img[^}]*width:\s*96px/s);
  assert.match(css, /\.hero-card[^}]*min-height:\s*210px/s);
});

test('quick file picker keeps the original user gesture and primary targets stay touch friendly', async () => {
  const app = await readFile(new URL('../src/app.mjs', import.meta.url), 'utf8');
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.doesNotMatch(app, /quick-file[\s\S]{0,220}setTimeout/);
  assert.match(app, /quick-file[\s\S]{0,220}file-input'\)\.click\(\)/);
  assert.match(css, /\.result-actions button[^}]*min-height:\s*44px/s);
  assert.match(css, /\.dialog-close[^}]*min-width:\s*44px/s);
});

test('greeting separates the emoji from its wrapping text', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const app = await readFile(new URL('../src/app.mjs', import.meta.url), 'utf8');
  assert.match(html, /id="greeting-emoji"/);
  assert.match(html, /id="greeting-text"/);
  assert.match(app, /greeting-emoji/);
  assert.match(app, /greeting-text/);
});

test('home hero stays compact and greeting text wraps within its own column', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(css, /#page-title[^}]*display:\s*flex!important/s);
  assert.match(css, /#greeting-text[^}]*display:\s*block/s);
  assert.match(css, /\.view\.active \.hero-card[^}]*min-height:\s*0!important/s);
  assert.match(css, /\.view\.active \.hero-card[^}]*padding:\s*16px 20px!important/s);
});

test('Samsung-compatible light scheme and compact collaboration stay in fixed navigation', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(html, /name="color-scheme" content="only light"/);
  assert.match(css, /color-scheme:\s*only light/);
  const fixedFooter = html.match(/<footer class="bottom-bar">([\s\S]*?)<\/footer>/)?.[1] ?? '';
  assert.match(fixedFooter, /class="collab-pill"[^>]*instagram\.com\/notizieartificiali\.ai/);
  assert.doesNotMatch(html, /class="home-collab"/);
  assert.match(css, /\.bottom-bar \.collab-pill\.collab-pill[^}]*backdrop-filter:\s*blur\(18px\) saturate\(160%\)/s);
  assert.match(css, /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto\s+auto/);
});

test('protect and prepare accept independent local documents', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const app = await readFile(new URL('../src/app.mjs', import.meta.url), 'utf8');
  for (const id of ['protect-file-input', 'prepare-file-input', 'prepare-input']) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(html, /data-i18n="source\.file"/);
  assert.match(app, /protect-file-input/);
  assert.match(app, /prepare-file-input/);
  assert.match(app, /\$\('#prepare-input'\)\.value/);
});

test('every document picker accepts local PDFs and the quick menu names them', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const app = await readFile(new URL('../src/app.mjs', import.meta.url), 'utf8');
  for (const id of ['file-input', 'protect-file-input', 'prepare-file-input']) {
    assert.match(html, new RegExp(`id="${id}"[^>]*accept="[^"]*\\.pdf`));
  }
  assert.match(html, /data-i18n="quick\.file"/);
  assert.match(app, /extractTextFromPdf/);
});

test('tool card titles share the same two-line alignment area', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.tool-card\.tool-card strong[^}]*min-height:\s*36px/s);
});

test('quick add sheet animates from the central plus button', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(css, /@keyframes quick-sheet-in/);
  assert.match(css, /\.quick-add-dialog\[open\][^}]*animation:\s*quick-sheet-in/s);
  assert.match(css, /body:has\(#quick-add-dialog\[open\]\) \.add-button svg/s);
});

test('functional micro animations cover results, privacy, tokens, progress and copy', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  const app = await readFile(new URL('../src/app.mjs', import.meta.url), 'utf8');
  for (const animation of ['result-in', 'privacy-pulse', 'view-forward', 'copy-confirm']) assert.match(css, new RegExp(`@keyframes ${animation}`));
  assert.match(app, /function revealResult/);
  assert.match(app, /function animateToken/);
  assert.match(app, /classList\.add\('copied'\)/);
  assert.match(app, /showView\('protect', true\)/);
});

test('privacy tool exposes an intuitive local restore workflow', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const app = await readFile(new URL('../src/app.mjs', import.meta.url), 'utf8');
  for (const id of ['restore-input', 'restore-button', 'restored-output', 'clear-mapping']) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(html, /Ripristina i dati/);
  assert.match(app, /restoreProtectedText/);
  assert.match(app, /state\.mapping/);
});

test('responsive redesign keeps actions visible and respects reduced motion', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /\.workflow-phase\[data-phase-active\]/);
  assert.match(css, /@media\s*\(max-width:\s*380px\)/);
  assert.match(css, /\.result-actions-sticky/);
});

test('future voice and rewards are labelled honestly without browser recording', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const app = await readFile(new URL('../src/app.mjs', import.meta.url), 'utf8');
  assert.match(html, /id="voice-dialog"/);
  assert.match(html, /IN ARRIVO/);
  assert.match(html, /GETTONI · BETA|BETA · GETTONI/);
  assert.match(html, /Non sono denaro/);
  assert.doesNotMatch(app, /getUserMedia\(/);
  assert.doesNotMatch(app, /webkitSpeechRecognition|new SpeechRecognition/);
});
