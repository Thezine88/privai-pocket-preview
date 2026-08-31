import { icon } from '../render.mjs';
import { flowHeader } from './flow-shared.mjs';
import { QUICK_ACTIONS } from '../../domain/quick-actions.mjs';

export function renderQuickActions(selected = []) {
  const row = (action) => {
    const position = selected.indexOf(action.id);
    const active = position >= 0;
    return `<article class="quick-action-row ${active ? 'is-selected' : ''}">${active ? `<span class="quick-action-rank">${position + 1}</span>` : ''}<span class="quick-action-icon">${icon(action.icon)}</span><strong>${action.label}</strong><button class="switch ${active ? 'is-on' : ''}" role="switch" aria-checked="${active}" data-action="toggle-quick-action" data-value="${action.id}" aria-label="${active ? `${action.label}, selezionata` : `Sostituisci la terza con ${action.label}`}"><span></span></button>${active ? `<span class="quick-action-order"><button data-action="move-quick-action" data-value="${action.id}" data-direction="-1" aria-label="Sposta ${action.label} in alto">${icon('chevron')}</button><button data-action="move-quick-action" data-value="${action.id}" data-direction="1" aria-label="Sposta ${action.label} in basso">${icon('chevron')}</button></span>` : ''}</article>`;
  };
  const favourites = selected.map((id) => QUICK_ACTIONS.find((action) => action.id === id)).filter(Boolean).map(row).join('');
  const others = QUICK_ACTIONS.filter((action) => !selected.includes(action.id)).map(row).join('');
  return `<div class="screen flow-screen quick-actions-screen">${flowHeader('Azioni rapide')}<main class="flow-content"><p class="quick-actions-helper">Scegli le tre azioni che vuoi trovare subito.<br>Puoi cambiarne l’ordine; una nuova sostituisce la terza.</p><p class="autosave-note"><span aria-hidden="true">✓</span> Le modifiche vengono salvate automaticamente</p><h2>I tuoi preferiti <span>· ${selected.length} di 3</span></h2><div class="quick-actions-list">${favourites}<article class="quick-action-row quick-action-fixed"><span class="quick-action-icon">${icon('pencil')}</span><span><strong>Personalizza</strong><small>Sempre quarta</small></span><span class="fixed-lock">${icon('lock')}</span></article></div><h2 class="quick-actions-other-title">Altre azioni</h2><div class="quick-actions-list">${others}</div><button class="reset-actions" data-action="reset-quick-actions">Ripristina predefinite</button></main></div>`;
}
