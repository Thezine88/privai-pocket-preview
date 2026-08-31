import test from 'node:test';
import assert from 'node:assert/strict';
import { renderContentInput } from '../src/ui/screens/content-input.mjs';
import { renderFindings } from '../src/ui/screens/findings.mjs';
import { renderActionChoice } from '../src/ui/screens/action-choice.mjs';
import { renderFinalCheck } from '../src/ui/screens/final-check.mjs';
import { renderAwaitingResponse } from '../src/ui/screens/awaiting-response.mjs';
import { renderRestoredResult } from '../src/ui/screens/restored-result.mjs';

const job = {
  id: 'job-A7F2', title: 'Email al cliente', status: 'reviewing', protectedCount: 2,
  originalText: 'Email mario@example.it, telefono 333 123 4567',
  protectedText: 'Email [[RESTAMIO_A7F2_EMAIL_1]], telefono [[RESTAMIO_A7F2_PHONE_1]]',
  requestText: 'Scrivi un’email\n\nEmail [[RESTAMIO_A7F2_EMAIL_1]]',
  resultText: 'Ciao mario@example.it', restoredCount: 1, unresolvedCount: 0,
  findings: [
    { id: 'email-1', type: 'EMAIL', value: 'mario@example.it', selected: true },
    { id: 'phone-1', type: 'TELEPHONENUM', value: '333 123 4567', selected: true },
  ],
  mapping: { '[[RESTAMIO_A7F2_EMAIL_1]]': 'mario@example.it' },
};

test('text entry has one privacy promise and an inline protected CTA', () => {
  const html = renderContentInput('');
  assert.match(html, /Il tuo contenuto/);
  assert.match(html, /Scrivi o incolla qui…/);
  assert.match(html, /Tutto sul telefono/);
  assert.match(html, /Proteggi il testo/);
  assert.doesNotMatch(html, /bottom-nav/);
});

test('text entry reports live findings without applying protection', () => {
  const html = renderContentInput('mario@example.it', { findingsCount: 1 });
  assert.match(html, /1 dato trovato/);
  assert.match(html, /Controlla prima di proteggere/);
  assert.match(html, /Proteggi il testo/);
  assert.doesNotMatch(html, /\[EMAIL_1\]/);
});

test('findings use switches and the approved plain-language CTA', () => {
  const html = renderFindings(job);
  assert.match(html, /Dati da proteggere/);
  assert.match(html, /role="switch"/);
  assert.match(html, /Proteggi e continua/);
  assert.match(html, /2 dati protetti/);
});

test('action choice shows four compact quick actions and final check is editable', () => {
  const choice = renderActionChoice(job);
  for (const label of ['Scrivi un’email', 'Riassumi', 'Migliora il CV', 'Personalizza']) assert.match(choice, new RegExp(label.replace('’', '’')));
  assert.match(choice, /action-grid/);
  assert.match(choice, /data-action="open-quick-actions"/);
  const final = renderFinalCheck(job);
  assert.match(final, /Controllo finale/);
  assert.match(final, /textarea/);
  assert.match(final, /Apri nell’AI/);
});

test('configured alternative actions stay visible and Personalizza remains fourth', () => {
  const choice = renderActionChoice(job, {}, ['translate', 'checklist', 'clarify']);
  for (const label of ['Traduci', 'Crea una lista', 'Rendi più chiaro', 'Personalizza']) assert.match(choice, new RegExp(label));
  assert.ok(choice.indexOf('Rendi più chiaro') < choice.indexOf('Personalizza'));
  assert.match(choice, /data-value="translate"[^>]*aria-pressed="true"/);
  assert.match(choice, /In quale lingua\?/);
  for (const language of ['Italiano', 'Inglese', 'Spagnolo']) assert.match(choice, new RegExp(language));
});

test('awaiting and result screens provide the next obvious action', () => {
  assert.match(renderAwaitingResponse({ ...job, status: 'awaiting_ai' }), /Incolla la risposta dell’AI/);
  const restored = renderRestoredResult({ ...job, status: 'restored' });
  assert.match(restored, /Testo ripristinato/);
  assert.match(restored, /Copia il testo/);
  const almost = renderRestoredResult({ ...job, status: 'almost_ready', unresolvedCount: 1 });
  assert.match(almost, /Testo quasi pronto/);
  assert.match(almost, /Incolla un’altra risposta/);
});
