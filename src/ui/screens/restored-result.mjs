import { escapeHtml, flowHeader, stickyCta } from './flow-shared.mjs';

export function renderRestoredResult(job) {
  const warning = job.status === 'almost_ready';
  const count = warning ? job.unresolvedCount : job.restoredCount;
  const title = warning ? 'Testo quasi pronto' : 'Testo ripristinato';
  const helper = warning ? `${count === 1 ? 'Un dato non è stato ripristinato.' : `${count} dati non sono stati ripristinati.`}` : 'I tuoi dati sono tornati al loro posto.';
  const pill = warning ? `${count} ${count === 1 ? 'dato da controllare' : 'dati da controllare'}` : `${count} ${count === 1 ? 'dato ripristinato' : 'dati ripristinati'}`;
  const actions = warning ? `<button class="button button--secondary" data-action="retry-response">Incolla un’altra risposta</button><button class="button button--primary flow-cta" data-action="copy-result">Copia comunque</button>` : `<button class="button button--secondary" data-action="share-result">Condividi</button><button class="button button--primary flow-cta" data-action="copy-result">Copia il testo</button>`;
  return `<div class="screen flow-screen result-screen">${flowHeader('', { wordmark: true })}<main class="flow-content"><h1 class="flow-title">${title}</h1><p class="flow-helper flow-helper--center">${helper}</p><p class="status-pill ${warning ? 'status-pill--warning' : 'status-pill--safe'}">${warning ? '!' : '✓'} ${pill}</p><section class="result-card"><strong>Il risultato</strong><p>${escapeHtml(job.resultText)}</p></section>${warning ? '<p class="warning-note">Puoi usare comunque il testo oppure incollare un’altra risposta.</p>' : '<button class="comparison-row">Vedi cosa è cambiato <span>›</span></button>'}</main><footer class="flow-footer flow-footer--two">${actions}</footer></div>`;
}
