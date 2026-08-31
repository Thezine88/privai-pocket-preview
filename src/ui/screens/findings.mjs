import { groupFindings } from '../../domain/pii.mjs';
import { escapeHtml, flowHeader, stickyCta } from './flow-shared.mjs';

function plural(value, one, many) { return `${value} ${value === 1 ? one : many}`; }

export function renderFindings(job) {
  const groups = groupFindings(job.findings);
  const detected = job.findings.length;
  const selected = job.findings.filter((item) => item.selected !== false).length;
  const cards = groups.map((group, index) => `<section class="finding-card ${index === 0 ? 'is-open' : ''}"><header><button class="finding-title" data-action="toggle-category"><strong>${escapeHtml(group.label)}</strong><small>${plural(group.occurrenceCount, 'occorrenza', 'occorrenze')}</small></button><button class="switch ${group.selectedCount ? 'is-on' : ''}" role="switch" aria-checked="${group.selectedCount === group.occurrenceCount}" data-action="toggle-category-selection" data-finding-ids="${group.values.flatMap((value) => value.findingIds).join(',')}"><span></span></button></header><div class="finding-values">${group.values.map((value) => `<div class="finding-row"><span><strong>${escapeHtml(value.value)}</strong><small>${plural(value.occurrenceCount, 'occorrenza nel testo', 'occorrenze nel testo')}</small></span><button class="switch ${value.selectedCount ? 'is-on' : ''}" role="switch" aria-checked="${value.selectedCount === value.occurrenceCount}" data-action="toggle-finding-selection" data-finding-ids="${value.findingIds.join(',')}"><span></span></button></div>`).join('')}</div></section>`).join('');
  return `<div class="screen flow-screen findings-screen">${flowHeader('Dati da proteggere')}<main class="flow-content"><section class="findings-intro"><p><strong>${plural(detected, 'dato rilevato.', 'dati rilevati.')}</strong><br>Ho già attivato quelli da proteggere.</p><div><button data-action="select-all">Proteggi tutto</button><button data-action="select-none">Lascia tutto visibile</button><button data-action="add-finding">Aggiungi un dato</button></div></section><div class="finding-list">${cards}</div></main>${stickyCta('Proteggi e continua', 'confirm-protection', `<span class="footer-count">${plural(selected, 'dato protetto', 'dati protetti')}</span>`)}</div>`;
}
