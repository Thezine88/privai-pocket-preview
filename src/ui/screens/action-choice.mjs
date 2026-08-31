import { flowHeader, icon, stickyCta } from './flow-shared.mjs';

const actions = [
  ['email', 'mail', 'Scrivi un’email'], ['summary', 'list', 'Riassumi'],
  ['cv', 'cv', 'Migliora il CV'], ['custom', 'pencil', 'Personalizza'],
];

export function renderActionChoice(job, state = {}) {
  const selected = state.action ?? job.action ?? 'email';
  const cards = actions.map(([value, iconName, label]) => `<button class="action-card ${selected === value ? 'is-selected' : ''}" data-action="choose-action" data-value="${value}" aria-pressed="${selected === value}">${icon(iconName)}<strong>${label}</strong></button>`).join('');
  let options = '';
  if (selected === 'email') options = `<section class="choice-group"><h2>A chi scrivi?</h2><div class="choice-chips">${['Cliente', 'Fornitore', 'Collega'].map((x, i) => `<button class="chip ${i === 0 ? 'is-selected' : ''}" data-choice="recipient" data-value="${x}">${x}</button>`).join('')}</div><h2>Cosa vuoi ottenere?</h2><div class="choice-chips">${['Proporre', 'Sollecitare', 'Rispondere'].map((x, i) => `<button class="chip ${i === 0 ? 'is-selected' : ''}" data-choice="goal" data-value="${x}">${x}</button>`).join('')}</div></section>`;
  if (selected === 'cv') options = '<label class="choice-field">Per quale ruolo? <input data-field="role" placeholder="Facoltativo"></label>';
  if (selected === 'custom') options = '<label class="choice-field">Scrivi cosa vuoi chiedere all’AI<textarea data-field="custom-prompt" placeholder="Per esempio: rendi il testo più chiaro e professionale"></textarea></label>';
  return `<div class="screen flow-screen action-screen">${flowHeader('')}<main class="flow-content"><h1 class="flow-title">Cosa vuoi fare<br>con questo testo?</h1><p class="flow-helper flow-helper--center">Scegli il risultato. RestaMio preparerà la richiesta per l’AI.</p><div class="action-grid">${cards}</div><button class="edit-actions">${icon('sliders')} Modifica azioni rapide</button>${options}</main>${stickyCta('Continua', 'continue-action')}</div>`;
}
