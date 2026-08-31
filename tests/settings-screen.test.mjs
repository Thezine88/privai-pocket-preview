import test from 'node:test';
import assert from 'node:assert/strict';
import { renderSettings } from '../src/ui/screens/settings.mjs';
import { renderQuickActions } from '../src/ui/screens/quick-actions.mjs';

test('Settings exposes the approved nested quick-actions destination', () => {
  const html = renderSettings();
  assert.match(html, /Impostazioni/);
  assert.match(html, /data-action="open-quick-actions"/);
  assert.match(html, /Azioni rapide/);
});

test('quick-actions panel explains autosave and keeps Personalizza fixed', () => {
  const html = renderQuickActions(['email', 'summary', 'cv']);
  assert.match(html, /Scegli le tre azioni che vuoi trovare subito/);
  assert.match(html, /sostituisce la terza/);
  assert.match(html, /salvate automaticamente/);
  assert.match(html, /3 di 3/);
  assert.match(html, /Personalizza/);
  assert.match(html, /Sempre quarta/);
  assert.match(html, /<h2 class="quick-actions-other-title">Altre azioni<\/h2>/);
  assert.match(html, /Ripristina predefinite/);
  assert.equal((html.match(/role="switch"/g) ?? []).length, 6);
  assert.match(html, /data-action="move-quick-action"/);
  assert.ok(html.indexOf('Personalizza') < html.indexOf('Traduci'));
});
