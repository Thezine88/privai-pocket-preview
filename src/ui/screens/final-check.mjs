import { escapeHtml, flowHeader, stickyCta } from './flow-shared.mjs';

export function renderFinalCheck(job) {
  const count = job.protectedCount ?? 0;
  return `<div class="screen flow-screen final-screen">${flowHeader('Controllo finale')}<main class="flow-content"><p class="flow-helper flow-helper--center">Leggi e modifica ciò che invierai all’AI.</p><p class="status-pill status-pill--safe">✓ ${count} ${count === 1 ? 'dato protetto' : 'dati protetti'}</p><label class="request-editor"><strong>La tua richiesta</strong><textarea id="request-text">${escapeHtml(job.requestText)}</textarea></label><details class="protected-details"><summary>Vedi dati protetti</summary><div>${Object.entries(job.mapping ?? {}).map(([placeholder, value]) => `<p><strong>${escapeHtml(value)}</strong><small>${escapeHtml(placeholder)}</small></p>`).join('')}</div></details></main>${stickyCta('Apri nell’AI', 'open-ai')}</div>`;
}
