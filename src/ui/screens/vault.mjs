import { escapeHtml, icon } from '../render.mjs';
import { renderBottomNav } from './home.mjs';

const STATUS = {
  draft: 'Bozza',
  reviewing: 'Controllo dati',
  protected: 'Pronto per l’AI',
  awaiting_ai: 'In attesa della risposta',
  restored: 'Testo ripristinato',
  almost_ready: 'Testo quasi pronto',
};

export function renderVault({ jobs = [], loadError = false } = {}) {
  const safeJobs = [...jobs].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  const content = loadError
    ? '<section class="vault-empty"><h2>Non riesco ad aprire la Cassaforte</h2><button data-action="retry-jobs">Riprova</button></section>'
    : safeJobs.length
      ? `<div class="vault-list">${safeJobs.map((job) => `<button class="vault-card" data-action="open-job" data-job-id="${escapeHtml(job.id)}" aria-label="${escapeHtml(job.title)}, ${escapeHtml(STATUS[job.status] ?? 'Lavoro protetto')}">
          <span class="vault-card__icon">${icon('lock')}</span><span><strong>${escapeHtml(job.title)}</strong><small>${escapeHtml(STATUS[job.status] ?? 'Lavoro protetto')} · ${Number(job.protectedCount ?? 0)} dati protetti</small></span>${icon('chevron', 'chevron')}
        </button>`).join('')}</div>`
      : '<section class="vault-empty"><div class="vault-empty__icon">' + icon('lock') + '</div><h2>Nessun lavoro da completare</h2><p>I lavori protetti appariranno qui, pronti da riprendere.</p></section>';
  return `<div class="screen screen--vault"><header class="vault-header"><h1>Cassaforte</h1></header><main class="vault-content">${content}</main>${renderBottomNav('vault', jobs.filter((job) => job.status === 'awaiting_ai').length)}</div>`;
}
