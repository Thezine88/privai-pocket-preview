import { escapeHtml, icon } from '../render.mjs';

function activeJob(jobs = []) {
  return jobs
    .filter((job) => ['awaiting_ai', 'almost_ready', 'restored'].includes(job.status))
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))[0];
}

function jobCard(job) {
  const ready = job.status === 'restored';
  const meta = ready ? 'Il testo è pronto' : job.status === 'awaiting_ai'
    ? 'In attesa della risposta dell’AI'
    : `${job.protectedCount ?? 0} dati da ripristinare`;
  return `<section class="active-job" aria-label="${escapeHtml(job.title)}, ${escapeHtml(meta)}">
    <button class="active-job__summary" data-action="open-job" data-job-id="${escapeHtml(job.id)}">
      <span class="active-job__icon">${icon('clipboard')}</span>
      <span class="active-job__copy"><span class="active-job__status">${ready ? 'Il testo è pronto' : 'Hai un lavoro da completare'}</span><strong>${escapeHtml(job.title)}</strong><small>${escapeHtml(meta)}</small></span>
      ${icon('chevron', 'chevron')}
    </button>
    <button class="button button--primary active-job__cta" data-action="${ready ? 'open-result' : 'paste-response'}" data-job-id="${escapeHtml(job.id)}">${ready ? 'Apri il risultato' : 'Incolla la risposta dell’AI'}</button>
  </section>`;
}

function startActions(hasJob) {
  return `<section class="start-work ${hasJob ? '' : 'start-work--empty'}">
    <h2>${hasJob ? 'Inizia un nuovo lavoro' : 'Da dove vuoi iniziare?'}</h2>
    <button class="start-card ${hasJob ? '' : 'start-card--primary'}" data-action="new-text" aria-label="Scrivi un testo. Email, messaggi o appunti.">
      <span class="start-card__icon">${icon('pencil')}</span><span><strong>Scrivi un testo</strong><small>Email, messaggi, appunti</small></span>${icon('chevron', 'chevron')}
    </button>
    <button class="start-card" data-action="new-file" aria-label="Importa un file PDF, di testo o Markdown.">
      <span class="start-card__icon">${icon('file')}</span><span><strong>Importa un file</strong><small>PDF, testo, Markdown</small></span>${icon('chevron', 'chevron')}
    </button>
    <input class="visually-hidden" data-file-input type="file" accept=".pdf,.txt,.md,text/plain,text/markdown,application/pdf" tabindex="-1" aria-hidden="true">
  </section>`;
}

export function renderHome({ plan = 'free', jobs = [], loadError = false } = {}) {
  const job = activeJob(jobs);
  const multiple = jobs.filter((item) => item.status === 'awaiting_ai').length > 1;
  return `<div class="screen screen--home">
    <header class="home-header"><div class="wordmark" aria-label="RestaMio"><span>Resta</span><span>Mio</span></div><button class="plan-badge" data-action="open-plan" aria-label="${plan === 'owner' ? 'Piano Pro proprietario' : 'Piano gratuito, apri dettagli del piano'}">${plan === 'owner' ? 'PRO' : 'GRATIS'}</button></header>
    <main class="home-content">
      <section class="promise"><p>Buongiorno</p><h1>Usa l’AI senza<br>condividere dati sensibili.</h1><span>Nomi, email e altre informazioni restano sul telefono.</span></section>
      ${loadError ? '<section class="load-error"><p>Non riesco ad aprire questo lavoro.</p><button data-action="retry-jobs">Riprova</button></section>' : job ? jobCard(job) : ''}
      ${multiple ? '<button class="vault-link" data-action="open-vault">Vedi tutti in Cassaforte</button>' : ''}
      ${startActions(Boolean(job))}
      <aside class="share-hint">${icon('share')}<p>Oppure condividi un documento con<br>RestaMio dal menu del telefono.</p><img class="share-hint__willy" src="assets/willy-wave.png" alt="" aria-hidden="true"></aside>
    </main>
    ${renderBottomNav('home', jobs.filter((item) => item.status === 'awaiting_ai').length)}
  </div>`;
}

export function renderBottomNav(active, pending = 0) {
  const item = (name, label, iconName) => `<button class="nav-item ${active === name ? 'is-active' : ''}" data-nav="${name}" aria-current="${active === name ? 'page' : 'false'}">${icon(iconName)}<span>${label}</span></button>`;
  return `<nav class="bottom-nav" aria-label="Navigazione principale">${item('home', 'Lavora', 'work')}<span class="nav-with-badge">${item('vault', 'Cassaforte', 'lock')}${pending ? `<span class="nav-badge" aria-label="Cassaforte, ${pending} lavori in attesa">${pending > 9 ? '9+' : pending}</span>` : ''}</span>${item('settings', 'Impostazioni', 'settings')}</nav>`;
}
