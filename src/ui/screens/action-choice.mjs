import { flowHeader, icon, stickyCta } from './flow-shared.mjs';
import { QUICK_ACTIONS, resolveQuickAction } from '../../domain/quick-actions.mjs';

const customAction = { id: 'custom', icon: 'pencil', label: 'Personalizza' };

export function renderActionChoice(job, state = {}, favourites = ['email', 'summary', 'cv']) {
  const ordered = [...favourites.map((id) => QUICK_ACTIONS.find((action) => action.id === id)).filter(Boolean), customAction];
  const selected = resolveQuickAction(state.action ?? job.action, favourites);
  const cards = ordered.map(({ id, icon: iconName, label }) => `<button class="action-card ${selected === id ? 'is-selected' : ''}" data-action="choose-action" data-value="${id}" aria-pressed="${selected === id}">${icon(iconName)}<strong>${label}</strong></button>`).join('');
  let options = '';
  if (selected === 'email') options = `<section class="choice-group"><h2>A chi scrivi?</h2><div class="choice-chips">${['Cliente', 'Fornitore', 'Collega'].map((x, i) => `<button class="chip ${i === 0 ? 'is-selected' : ''}" data-choice="recipient" data-value="${x}">${x}</button>`).join('')}</div><h2>Cosa vuoi ottenere?</h2><div class="choice-chips">${['Proporre', 'Sollecitare', 'Rispondere'].map((x, i) => `<button class="chip ${i === 0 ? 'is-selected' : ''}" data-choice="goal" data-value="${x}">${x}</button>`).join('')}</div></section>`;
  if (selected === 'translate') options = `<section class="choice-group"><h2>In quale lingua?</h2><div class="choice-chips">${['Italiano', 'Inglese', 'Spagnolo'].map((x, i) => `<button class="chip ${i === 1 ? 'is-selected' : ''}" data-choice="language" data-value="${x}">${x}</button>`).join('')}</div></section>`;
  if (selected === 'cv') options = '<label class="choice-field">Per quale ruolo? <input data-field="role" placeholder="Facoltativo"></label>';
  if (selected === 'custom') options = '<label class="choice-field">Scrivi cosa vuoi chiedere all’AI<textarea data-field="custom-prompt" placeholder="Per esempio: rendi il testo più chiaro e professionale"></textarea></label>';
  return `<div class="screen flow-screen action-screen">${flowHeader('')}<main class="flow-content"><h1 class="flow-title">Cosa vuoi fare<br>con questo testo?</h1><p class="flow-helper flow-helper--center">Scegli il risultato. RestaMio preparerà la richiesta per l’AI.</p><div class="action-grid">${cards}</div><button class="edit-actions" data-action="open-quick-actions" aria-label="Scegli e riordina le azioni rapide">${icon('sliders')} Modifica azioni rapide</button>${options}</main>${stickyCta('Continua', 'continue-action')}</div>`;
}
