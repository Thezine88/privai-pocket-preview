/**
 * PrivAI Pocket — orchestrazione dell'interfaccia.
 *
 * Il flusso è uno solo, non tre strumenti separati:
 *   testo → cosa ho trovato → cosa ti serve → apri in un'IA
 * e, al ritorno, ripristino dalla cassaforte.
 *
 * Regole tenute per tutto il file:
 *  - l'azione principale sta nella barra ancorata e non scorre mai;
 *  - la scansione parte da sola, l'utente non deve premere "controlla";
 *  - ogni scelta ha già una risposta preselezionata.
 */

import { detectSensitiveData, maskFindings, restoreProtectedText, displaySensitiveType,
         groupFindings, contextAround, countKnownPlaceholders, shouldOfferRestore } from './domain/pii.mjs';
import { buildRequest, titleFromText } from './domain/markdown.mjs';
import { createSecureStore, createVault, DEFAULT_RETENTION, retentionLabel, clampRetention } from './domain/vault.mjs';
import { RECIPES, getRecipe, defaultAnswers, toggleAnswer, isAnswerActive, instructionsFor } from './domain/recipes.mjs';
import { planOf, PRO_BENEFITS, createDesktopSessions, pairingCode, isUnlimited } from './domain/plan.mjs';
import { createTranslator, normalizeLocale } from './domain/i18n.mjs';
import { createOutbound, createInbound, readClipboard, writeClipboard } from './domain/intake.mjs';
import { containsWebLinks, removeWebLinks } from './domain/share.mjs';
import { extractTextFromPdf, isPdfFile, PdfImportError } from './domain/pdf.mjs';
import { greetingForHour } from './domain/greeting.mjs';
import { iconSvg } from './icons.mjs';
import { swipeOutcome, clampDrag, lockAxis, SWIPE_ACTION_WIDTH } from './domain/swipe.mjs';
import { decideQuickProtect } from './domain/quickProtect.mjs';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const store = createSecureStore();
const vault = createVault(store);
const desktop = createDesktopSessions(store);
const outbound = createOutbound();

const state = {
  locale: 'it',
  t: createTranslator('it'),
  plan: 'free',
  retention: DEFAULT_RETENTION,
  source: '',
  findings: [],
  entries: [],
  masked: '',
  mapping: {},
  jobId: null,
  recipeId: 'markdown',
  answers: {},
  showAllRecipes: false,
  view: 'home',
  phase: 'text',
  restoreJob: null,
};

/* =================================================================== */
/* Utilità                                                             */
/* =================================================================== */

const t = (key, vars) => state.t.t(key, vars);

function toast(message) {
  const node = $('#toast');
  node.textContent = message;
  node.setAttribute('data-show', '');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.removeAttribute('data-show'), 2600);
}

function escapeHtml(value) {
  const node = document.createElement('div');
  node.textContent = String(value ?? '');
  return node.innerHTML;
}

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function haptic() {
  if (reducedMotion()) return;
  navigator.vibrate?.(10);
}

/** Rigioca una micro-animazione CSS al tocco, senza toccare le librerie di animazione. */
function flourish(el, className) {
  if (!el || reducedMotion()) return;
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}

/** Le finestre dell'app al posto di confirm(): stesso linguaggio visivo ovunque. */
function ask(dialogId, setup) {
  const dialog = $(dialogId);
  setup?.(dialog);
  return new Promise((resolve) => {
    dialog.addEventListener('close', () => resolve(dialog.returnValue), { once: true });
    dialog.showModal();
  });
}

async function confirmAction(titleKey, bodyKey, okKey) {
  $('#confirm-title').textContent = t(titleKey);
  $('#confirm-body').textContent = t(bodyKey);
  $('#confirm-ok').textContent = t(okKey);
  return (await ask('#dlg-confirm')) === 'ok';
}

/* =================================================================== */
/* Aspetto: chiaro / scuro / come il sistema                          */
/* =================================================================== */

/**
 * Il CSS definisce già i tre stati (chiaro di default, scuro dietro
 * prefers-color-scheme, ed entrambi forzabili con [data-theme]): qui si
 * decide solo quale dei tre applicare, leggendo la preferenza salvata.
 * 'system' rimuove l'attributo e lascia decidere il sistema operativo.
 */
function applyTheme(preference) {
  const root = document.documentElement;
  if (preference === 'light' || preference === 'dark') root.dataset.theme = preference;
  else delete root.dataset.theme;
  const select = $('#ui-theme');
  if (select) select.value = preference;
}

/* =================================================================== */
/* Lingua                                                              */
/* =================================================================== */

function applyLocale(locale) {
  state.locale = normalizeLocale(locale);
  state.t = createTranslator(state.locale);
  document.documentElement.lang = state.locale;

  $$('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
  $$('[data-i18n-placeholder]').forEach((node) => { node.placeholder = t(node.dataset.i18nPlaceholder); });
  $$('[data-i18n-aria]').forEach((node) => { node.setAttribute('aria-label', t(node.dataset.i18nAria)); });

  const [emoji, ...words] = greetingForHour(new Date().getHours(), state.locale).split(' ');
  $('#greeting-emoji').textContent = emoji;
  $('#greeting-text').textContent = words.join(' ');

  $('#ui-language').value = state.locale;
  renderRetentionOptions();
  renderPlanChips();
  renderRecipes();
  renderQuestions();
  renderProBenefits();
  updateAction();
}

/* =================================================================== */
/* Navigazione                                                         */
/* =================================================================== */

const VIEW_ORDER = ['home', 'work', 'restore', 'vault', 'settings', 'plans'];

function goto(view, direction) {
  const from = VIEW_ORDER.indexOf(state.view);
  const to = VIEW_ORDER.indexOf(view);
  const dir = direction ?? (to >= from ? 'fwd' : 'back');
  state.view = view;

  $$('.view').forEach((node) => {
    const active = node.dataset.view === view;
    node.toggleAttribute('data-active', active);
    node.removeAttribute('data-enter');
    if (active) requestAnimationFrame(() => node.setAttribute('data-enter', dir));
  });

  $$('.nav-item').forEach((node) => {
    const target = node.dataset.goto;
    const wasCurrent = node.hasAttribute('aria-current');
    const current = target === view || (target === 'home' && view === 'work');
    if (current) node.setAttribute('aria-current', 'page'); else node.removeAttribute('aria-current');
    // L'animazione riparte solo quando la scheda diventa attiva davvero, non
    // a ogni chiamata di goto(): altrimenti riproverebbe anche restando fermi
    // sulla stessa scheda.
    if (current && !wasCurrent && !reducedMotion()) {
      node.classList.remove('just-selected');
      void node.offsetWidth;
      node.classList.add('just-selected');
    }
  });

  // La risalita è istantanea e viene coperta dalla transizione: due movimenti
  // separati si notano e fanno sembrare l'app lenta.
  window.scrollTo({ top: 0, behavior: 'auto' });

  if (view === 'vault') renderVault();
  if (view === 'home') renderHome();
  if (view === 'settings') renderSettings();
  if (view === 'restore') renderRestore();

  updateAction();
  if (!booting) focusHeading(view);
}

let booting = true;

function focusHeading(view) {
  const panel = $(`.view[data-view="${view}"]`);
  const heading = panel?.querySelector('.phase[data-active] h1, h1');
  if (!heading) return;
  heading.setAttribute('tabindex', '-1');
  heading.focus({ preventScroll: true });
}

function setPhase(phase) {
  state.phase = phase;
  $$('.view[data-view="work"] .phase').forEach((node) => {
    const active = node.dataset.phase === phase;
    node.toggleAttribute('data-active', active);
    node.removeAttribute('data-enter');
    if (active) requestAnimationFrame(() => node.setAttribute('data-enter', ''));
  });
  window.scrollTo({ top: 0, behavior: 'auto' });
  if (phase === 'check') renderFindings();
  if (phase === 'send') { renderRecipes(); renderQuestions(); updateRequest(); }
  updateAction();
  focusHeading('work');
}

/* =================================================================== */
/* Barra dell'azione ancorata                                          */
/* =================================================================== */

function setAction({ note = '', label = '', onClick = null, disabled = false }) {
  const bar = $('#action-bar');
  if (!label) {
    bar.removeAttribute('data-visible');
    document.body.removeAttribute('data-action');
    return;
  }
  bar.setAttribute('data-visible', '');
  document.body.setAttribute('data-action', 'on');
  const noteNode = $('#action-note');
  noteNode.innerHTML = note;
  noteNode.hidden = !note;
  const button = $('#action-main');
  // Senza nota il pulsante occupa tutta la barra: spaiato a destra sembra un errore.
  button.classList.toggle('btn-full', !note);
  button.textContent = label;
  button.disabled = disabled;
  button.onclick = () => { haptic(); onClick?.(); };
}

function updateAction() {
  if (state.view === 'home') {
    // Le card di ingresso stanno in cima, fuori dalla zona comoda per il
    // pollice su schermi grandi. Quando la home è vuota (nessun lavoro,
    // nessuna richiesta recente) è anche l'unica azione possibile: la
    // duplichiamo nella barra ancorata, stessa scorciatoia di sempre.
    if ($('#home-willy').hidden) return setAction({});
    return setAction({
      note: '',
      label: t('intake.paste'),
      onClick: () => $('#intake-paste').click(),
    });
  }

  if (state.view === 'work') {
    if (state.phase === 'text') {
      const count = state.findings.length;
      // Un solo messaggio: la scheda sopra il testo dice già quanti dati ci sono,
      // ripeterlo nella barra è rumore.
      return setAction({
        note: '',
        label: count
          ? t(count === 1 ? 'action.reviewOne' : 'action.review', { count })
          : t('send.title'),
        onClick: () => setPhase(count ? 'check' : 'send'),
        disabled: !state.source.trim(),
      });
    }
    if (state.phase === 'check') {
      const selected = state.findings.filter((item) => item.selected).length;
      return setAction({
        note: `<b>${escapeHtml(
          selected === 0 ? t('check.willHideNone')
            : t(selected === 1 ? 'check.willHideOne' : 'check.willHide', { count: selected }),
        )}</b>`,
        label: t('send.title'),
        onClick: () => applyProtection(),
      });
    }
    if (state.phase === 'send') {
      return setAction({
        note: '',
        label: t('send.openAI'),
        onClick: () => shareRequest(),
      });
    }
  }

  if (state.view === 'restore') {
    return setAction({
      note: '',
      label: t('restore.action'),
      onClick: () => runRestore(),
      disabled: !$('#reply').value.trim(),
    });
  }

  setAction({});
}

/* =================================================================== */
/* Fase 1 — testo e scansione automatica                               */
/* =================================================================== */

let scanTimer = null;

function onSourceInput() {
  state.source = $('#source').value;
  $('#source-clear').hidden = !state.source.trim();

  // Se l'utente incolla una risposta già protetta, glielo diciamo invece di
  // cambiargli schermata sotto le mani.
  detectPastedAnswer(state.source);

  clearTimeout(scanTimer);
  if (!state.source.trim()) {
    state.findings = [];
    setScanStatus('idle');
    updateAction();
    return;
  }
  setScanStatus('scanning');
  scanTimer = setTimeout(runScan, 350);
}

function setScanStatus(status, count = 0) {
  const node = $('#scan-status');
  node.dataset.state = status;
  const text = $('#scan-text');
  if (status === 'idle') text.textContent = t('scan.idle');
  if (status === 'scanning') text.textContent = t('scan.scanning');
  if (status === 'clean') text.textContent = t('scan.clean');
  if (status === 'found') text.textContent = t(count === 1 ? 'scan.foundOne' : 'scan.found', { count });
}

function runScan() {
  if (!state.source.trim()) {
    state.findings = [];
    setScanStatus('idle');
    updateAction();
    return;
  }
  state.findings = detectSensitiveData(state.source, { vault: state.entries });
  setScanStatus(state.findings.length ? 'found' : 'clean', state.findings.length);
  updateAction();
}

/* =================================================================== */
/* Rientro: da sette tocchi a uno                                      */
/* =================================================================== */

/**
 * Quando l'app torna in primo piano, guarda se negli appunti c'è una risposta
 * che contiene i NOSTRI segnaposto. Solo in quel caso propone la scorciatoia.
 *
 * Due scelte deliberate:
 *  - non ripristina da sola: agire sugli appunti senza chiedere è il tipo di
 *    cosa che in un'app di privacy fa perdere fiducia, anche quando è comoda;
 *  - non dice mai cosa c'è negli appunti se non è roba nostra: il confronto
 *    avviene in memoria e il testo non viene salvato da nessuna parte.
 */
let resumeText = '';

async function checkClipboardOnResume() {
  const mapping = await vault.combinedMapping();
  const clip = Object.keys(mapping).length ? await readClipboard() : null;
  const { offer, count } = shouldOfferRestore(clip, mapping);
  if (!offer) return hideResume();

  resumeText = clip;
  $('#resume-text').textContent = t(count === 1 ? 'resume.foundOne' : 'resume.found', { count });
  $('#resume-bar').hidden = false;
  document.body.setAttribute('data-resume', 'on');
}

function hideResume() {
  $('#resume-bar').hidden = true;
  document.body.removeAttribute('data-resume');
  resumeText = '';
}

async function resumeRestore() {
  if (!resumeText) return;
  $('#reply').value = resumeText;
  hideResume();
  goto('restore', 'fwd');
  await runRestore();
}

async function detectPastedAnswer(text) {
  const mapping = await vault.combinedMapping();
  if (!Object.keys(mapping).length) return;
  if (countKnownPlaceholders(text, mapping) < 1) return;
  toast(t('restore.detected'));
}

/* =================================================================== */
/* Fase 2 — cosa ho trovato                                            */
/* =================================================================== */

function renderFindings() {
  const host = $('#findings');
  const summary = $('#check-summary');

  if (!state.findings.length) {
    summary.textContent = t('check.none');
    host.innerHTML = '';
    return;
  }

  summary.textContent = t(state.findings.length === 1 ? 'check.summaryOne' : 'check.summary', { count: state.findings.length });

  host.innerHTML = groupFindings(state.findings).map((group) => {
    const allOn = group.items.every((item) => state.findings[item.index].selected);
    const nome = group.maybe
      ? t('check.maybe', { tipo: displaySensitiveType(group.type, state.locale).toLowerCase() })
      : displaySensitiveType(group.type, state.locale);
    const rows = group.items.map((item) => {
      const around = contextAround(state.source, item);
      return `
        <div class="finding">
          <div class="finding-main">
            <div class="finding-value">${escapeHtml(item.value)}</div>
            <div class="finding-context">${escapeHtml(around.before)}<b>${escapeHtml(item.value)}</b>${escapeHtml(around.after)}</div>
          </div>
          <label class="switch">
            <input type="checkbox" data-finding="${item.index}" ${state.findings[item.index].selected ? 'checked' : ''}
                   aria-label="${escapeHtml(item.value)}">
            <span class="track" aria-hidden="true"></span>
          </label>
        </div>`;
    }).join('');

    return `
      <div class="group"${group.maybe ? ' data-maybe' : ''}>
        <div class="group-head">
          <span class="g-name">${escapeHtml(nome)}</span>
          <span class="g-count">${group.items.length}</span>
          <label class="switch">
            <input type="checkbox" data-group="${escapeHtml(group.key)}" ${allOn ? 'checked' : ''}
                   aria-label="${escapeHtml(nome)}">
            <span class="track" aria-hidden="true"></span>
          </label>
        </div>
        ${rows}
      </div>`;
  }).join('');

  $$('[data-finding]', host).forEach((input) => input.addEventListener('change', () => {
    state.findings[Number(input.dataset.finding)].selected = input.checked;
    syncGroupSwitches();
    updateAction();
  }));

  $$('[data-group]', host).forEach((input) => input.addEventListener('change', () => {
    const [tipo, incerto] = input.dataset.group.split(':');
    state.findings.forEach((finding) => {
      if (finding.type === tipo && Boolean(finding.maybe) === (incerto === 'maybe')) finding.selected = input.checked;
    });
    renderFindings();
    updateAction();
  }));
}

function syncGroupSwitches() {
  $$('[data-group]').forEach((input) => {
    const [tipo, incerto] = input.dataset.group.split(':');
    const items = state.findings.filter((finding) => (
      finding.type === tipo && Boolean(finding.maybe) === (incerto === 'maybe')
    ));
    input.checked = items.length > 0 && items.every((finding) => finding.selected);
  });
}

function setAllFindings(selected) {
  state.findings.forEach((finding) => { finding.selected = selected; });
  renderFindings();
  updateAction();
}

/** Nascondi altro: copre i casi che nessun rilevatore automatico può prendere. */
async function addManualMask() {
  $('#manual-input').value = '';
  $('#manual-remember').checked = true;
  const result = await ask('#dlg-manual', (dialog) => {
    setTimeout(() => $('#manual-input', dialog).focus(), 60);
  });
  if (result !== 'ok') return;

  const value = $('#manual-input').value.trim();
  if (value.length < 2) return;
  if (!state.source.includes(value)) return toast(t('toast.notFound', { value }));

  if ($('#manual-remember').checked) await addVaultEntry(value, 'CUSTOM', true);

  runScan();
  renderFindings();
  updateAction();
  toast(t('toast.hidden', { value }));
}

/* =================================================================== */
/* Protezione e salvataggio in cassaforte                              */
/* =================================================================== */

async function applyProtection() {
  const result = maskFindings(state.source, state.findings);
  state.masked = result.text;
  state.mapping = result.mapping;

  const hidden = Object.keys(result.mapping).length;
  if (hidden > 0) {
    const limits = planOf(state.plan);
    const jobs = await vault.listJobs();
    if (!isUnlimited(limits.openJobs) && jobs.length >= limits.openJobs) {
      toast(t('toast.limitJobs', { count: limits.openJobs }));
    }
    const job = await vault.saveJob({
      id: state.jobId,
      // Sul testo protetto: l'elenco dei lavori non deve contenere i dati
      // che l'utente ha appena chiesto di nascondere.
      title: titleFromText(result.text, defaultJobTitle()),
      mapping: result.mapping,
      protectedText: result.text,
      findingsCount: hidden,
      retention: state.retention,
    });
    state.jobId = job.id;
    renderNavBadge();
  } else {
    state.jobId = null;
  }

  setPhase('send');
}

/* =================================================================== */
/* Fase 3 — cosa ti serve                                              */
/* =================================================================== */

function renderRecipes() {
  const host = $('#recipes');
  if (!host) return;
  const list = state.showAllRecipes ? RECIPES : RECIPES.filter((recipe) => recipe.primary);

  host.innerHTML = list.map((recipe) => `
    <button class="recipe" type="button" data-recipe="${recipe.id}"
            aria-pressed="${recipe.id === state.recipeId}">
      <span class="glyph" aria-hidden="true">${iconSvg(recipe.icon)}</span>
      <strong>${escapeHtml(recipe.label[state.locale])}</strong>
    </button>`).join('');

  $$('[data-recipe]', host).forEach((button) => button.addEventListener('click', () => {
    haptic();
    state.recipeId = button.dataset.recipe;
    state.answers = defaultAnswers(getRecipe(state.recipeId));
    renderRecipes();
    renderQuestions();
    updateRequest();
  }));

  const more = $('#recipes-more');
  if (more) more.textContent = t(state.showAllRecipes ? 'send.less' : 'send.more');
}

function renderQuestions() {
  const host = $('#questions');
  if (!host) return;
  const recipe = getRecipe(state.recipeId);
  if (!Object.keys(state.answers).length) state.answers = defaultAnswers(recipe);

  host.innerHTML = (recipe.questions ?? []).map((question) => `
    <div class="q">
      <span class="q-label">${escapeHtml(question.label[state.locale])}</span>
      <div class="chips">
        ${question.options.map((option) => `
          <button class="chip" type="button"
                  data-q="${question.id}" data-o="${option.id}"
                  aria-pressed="${isAnswerActive(state.answers, question.id, option.id)}">
            ${escapeHtml(option.label[state.locale])}
          </button>`).join('')}
      </div>
    </div>`).join('');

  $$('[data-q]', host).forEach((button) => button.addEventListener('click', () => {
    haptic();
    state.answers = toggleAnswer(recipe, state.answers, button.dataset.q, button.dataset.o);
    renderQuestions();
    updateRequest();
  }));
}

function updateRequest() {
  const recipe = getRecipe(state.recipeId);
  const content = state.masked || state.source;
  $('#request').value = buildRequest({
    instructions: instructionsFor(recipe, state.answers, state.locale),
    content,
    outputLanguage: $('#out-language').value,
    extra: $('#extra').value,
    locale: state.locale,
  });
  saveRecent();
}

function defaultJobTitle() {
  return `${t('vault.fallbackTitle')} ${new Date().toLocaleDateString(state.locale)}`;
}

let recentTimer = null;
function saveRecent() {
  clearTimeout(recentTimer);
  recentTimer = setTimeout(async () => {
    const limits = planOf(state.plan);
    const recent = (await store.get('recent')) ?? [];
    const entry = {
      id: state.jobId ?? `req-${Date.now()}`,
      title: titleFromText(state.masked || state.source, defaultJobTitle()),
      recipe: state.recipeId,
      request: $('#request').value,
      protected: Boolean(state.masked),
      updatedAt: Date.now(),
    };
    const next = [entry, ...recent.filter((item) => item.id !== entry.id)];
    await store.set('recent', isUnlimited(limits.historyItems) ? next : next.slice(0, limits.historyItems));
  }, 900);
}

/* =================================================================== */
/* Condivisione                                                        */
/* =================================================================== */

async function shareRequest() {
  let text = $('#request').value;
  if (!text.trim()) return;

  if (containsWebLinks(text)) {
    const choice = await ask('#dlg-links');
    if (choice === 'cancel' || !choice) return;
    if (choice === 'remove') text = removeWebLinks(text);
  }

  try {
    const result = await outbound.shareWithAI(text, 'PrivAI');
    if (result?.unavailable) {
      await writeClipboard(text);
      toast(t('toast.shareFallback'));
    } else if (result?.fallback) {
      toast(t('toast.noAIApps'));
    }
  } catch (error) {
    if (error?.name !== 'AbortError') toast(t('toast.shareFailed'));
  }
}

async function copyFrom(selector, button) {
  const text = $(selector).value;
  if (!text.trim()) return;
  try {
    await writeClipboard(text);
    if (button) {
      const original = button.textContent;
      button.textContent = `✓ ${t('action.copied')}`;
      setTimeout(() => { button.textContent = original; }, 1300);
    }
    toast(t('toast.copied'));
  } catch {
    toast(t('toast.copyFailed'));
  }
}

/* =================================================================== */
/* Ripristino                                                          */
/* =================================================================== */

async function renderRestore() {
  const jobs = await vault.listJobs();
  const job = state.restoreJob ? jobs.find((item) => item.id === state.restoreJob) : jobs[0];
  state.restoreJob = job?.id ?? null;

  const label = $('#restore-job');
  if (!job) {
    label.textContent = t('restore.noJobs');
  } else {
    const count = Object.keys(job.mapping).length;
    label.textContent = t('restore.job', { title: job.title, count });
  }
  $('#restore-result').hidden = true;
  $('#restore-missing').hidden = true;
}

async function runRestore() {
  const reply = $('#reply').value;
  if (!reply.trim()) return;

  const jobs = await vault.listJobs();
  const job = jobs.find((item) => item.id === state.restoreJob) ?? jobs[0];
  const mapping = job?.mapping ?? (await vault.combinedMapping());

  if (!Object.keys(mapping).length) return toast(t('restore.noJobs'));

  const result = restoreProtectedText(reply, mapping);
  if (!result.restoredCount && result.missing.length === Object.keys(mapping).length) {
    return toast(t('restore.nothing'));
  }

  $('#restored').value = result.text;
  $('#restore-result').hidden = false;

  const missing = $('#restore-missing');
  if (result.missing.length) {
    missing.hidden = false;
    missing.innerHTML = `<span class="glyph" aria-hidden="true">!</span><span><strong>${
      escapeHtml(t('restore.missingTitle', { count: result.missing.length }))
    }</strong>${
      escapeHtml(t('restore.missingBody', { list: result.missing.map((item) => item.placeholder).join(', ') }))
    }</span>`;
    toast(t('restore.okSome', { done: result.restoredCount, missing: result.missing.length }));
  } else {
    missing.hidden = true;
    toast(t('restore.okAll', { count: result.restoredCount }));
  }

  if (job) await vault.markRestored(job.id);
  renderNavBadge();
}

/* =================================================================== */
/* Cassaforte                                                          */
/* =================================================================== */

/**
 * Uno stato vuoto coerente per tutta la cassaforte: prima ognuno dei tre
 * elenchi aveva il suo stile (uno centrato senza immagine, due righe di
 * puro testo grigio) — incoerenti fra loro e, tutti insieme, una schermata
 * che sembrava solo testo su nero. L'illustrazione è facoltativa: usata sul
 * primo elenco, che è la promessa principale della schermata; gli altri due
 * restano solo testo per non ripetere la stessa immagine tre volte.
 */
function emptyStateHTML(text, image) {
  const art = image ? `<img src="${image}" alt="" class="willy-live">` : '';
  return `<div class="empty">${art}<p>${escapeHtml(text)}</p></div>`;
}

async function renderVault() {
  const jobs = await vault.listJobs();
  const host = $('#vault-jobs');

  host.innerHTML = jobs.length ? '' : emptyStateHTML(t('vault.noJobs'), 'assets/tool-prepare.webp');
  jobs.forEach((job) => {
    const count = Object.keys(job.mapping).length;
    const row = document.createElement('div');
    row.className = 'job';
    row.innerHTML = `
      <span class="lock" aria-hidden="true">${iconSvg('lock')}</span>
      <button class="job-open" type="button" data-open-job="${job.id}">
        <strong>${escapeHtml(job.title)}</strong>
        <small>${escapeHtml(t(count === 1 ? 'vault.itemsCountOne' : 'vault.itemsCount', { count }))} · ${
          escapeHtml(job.restoredAt ? t('vault.restored') : retentionLabel(job, state.locale))
        }</small>
      </button>
      <button class="icon-btn ghost" type="button" data-del-job="${job.id}"
              aria-label="${escapeHtml(t('action.delete'))}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13"/></svg>
      </button>`;
    host.append(row);
  });

  $$('[data-open-job]', host).forEach((button) => button.addEventListener('click', () => {
    state.restoreJob = button.dataset.openJob;
    goto('restore', 'fwd');
  }));
  $$('[data-del-job]', host).forEach((button) => button.addEventListener('click', async () => {
    if (!(await confirmAction('confirm.jobTitle', 'confirm.jobBody', 'confirm.jobOk'))) return;
    await vault.deleteJob(button.dataset.delJob);
    toast(t('toast.jobDeleted'));
    renderVault();
    renderNavBadge();
  }));

  renderEntries();
  renderRecent();
}

function renderEntries() {
  const host = $('#vault-entries');
  if (!state.entries.length) {
    host.innerHTML = emptyStateHTML(t('vault.noEntries'));
    return;
  }
  host.innerHTML = state.entries.map((entry) => `
    <div class="job">
      <span class="lock" aria-hidden="true">${iconSvg('formats')}</span>
      <span class="job-main"><strong>${escapeHtml(entry.value)}</strong>
        <small>${escapeHtml(displaySensitiveType(entry.type, state.locale))}</small></span>
      <button class="mini-btn" type="button" data-del-entry="${entry.id}">${escapeHtml(t('action.delete'))}</button>
    </div>`).join('');

  $$('[data-del-entry]', host).forEach((button) => button.addEventListener('click', async () => {
    await vault.deleteEntry(button.dataset.delEntry);
    state.entries = await vault.listEntries();
    renderEntries();
    toast(t('toast.entryDeleted'));
  }));
}

async function renderRecent() {
  const recent = (await store.get('recent')) ?? [];
  const host = $('#vault-recent');
  if (!recent.length) {
    host.innerHTML = emptyStateHTML(t('vault.noRecent'), 'assets/tool-history.webp');
    return;
  }
  host.innerHTML = recent.map(recentRowHTML).join('');

  $$('.swipe-row', host).forEach((row) => {
    const id = row.dataset.recentRow;
    const item = recent.find((entry) => entry.id === id);
    wireSwipeRow(row, {
      onOpen: () => {
        if (!item) return;
        $('#request').value = item.request;
        state.recipeId = item.recipe ?? state.recipeId;
        goto('work', 'fwd');
        setPhase('send');
      },
      onDelete: async () => { await deleteRecentEntry(id); toast(t('toast.recentDeleted')); renderRecent(); },
    });
  });
}

/* =================================================================== */
/* Righe swipe-to-delete: "richieste recenti"                         */
/* =================================================================== */

function recentRowHTML(item) {
  return `
    <div class="swipe-row" data-recent-row="${item.id}">
      <button class="swipe-action" type="button" data-swipe-delete
              aria-label="${escapeHtml(t('action.delete'))}">
        ${iconSvg('trash')}<span>${escapeHtml(t('action.delete'))}</span>
      </button>
      <button class="job swipe-content" type="button" data-open-recent="${item.id}">
        <span class="lock${item.protected ? '' : ' lock-off'}" aria-hidden="true">${iconSvg('lock')}</span>
        <span class="job-main"><strong>${escapeHtml(item.title)}</strong>
          <small>${new Date(item.updatedAt).toLocaleString(state.locale)}</small></span>
        <span class="chev" aria-hidden="true">›</span>
      </button>
    </div>`;
}

function closeSwipeRow(row) {
  const content = row.querySelector('.swipe-content');
  content.style.transition = 'transform 200ms cubic-bezier(.2,.8,.2,1)';
  content.style.transform = 'translateX(0px)';
  row.removeAttribute('data-open');
}

function closeOtherSwipeRows(except) {
  $$('.swipe-row[data-open]').forEach((row) => { if (row !== except) closeSwipeRow(row); });
}

/**
 * Collega un swipe da destra a sinistra a una riga "richiesta recente":
 * uno strappo deciso cancella subito, uno a metà rivela il pulsante
 * "Elimina", uno leggero torna al suo posto. La logica di soglia sta in
 * domain/swipe.mjs — qui c'è solo la lettura del puntatore.
 */
function wireSwipeRow(row, { onOpen, onDelete }) {
  const content = row.querySelector('.swipe-content');
  let base = 0;
  let startX = 0;
  let startY = 0;
  let axis = null;
  let dragging = false;
  let justDragged = false;

  const setX = (x, animate) => {
    content.style.transition = animate ? 'transform 200ms cubic-bezier(.2,.8,.2,1)' : 'none';
    content.style.transform = `translateX(${x}px)`;
  };

  const removeRow = () => {
    haptic();
    row.style.overflow = 'hidden';
    row.style.maxHeight = `${row.offsetHeight}px`;
    row.style.transition = 'max-height 220ms ease, opacity 220ms ease, margin 220ms ease';
    requestAnimationFrame(() => {
      row.style.maxHeight = '0px';
      row.style.opacity = '0';
      row.style.marginTop = '0px';
      row.style.marginBottom = '0px';
    });
    setTimeout(onDelete, reducedMotion() ? 0 : 220);
  };

  row.querySelector('[data-swipe-delete]').addEventListener('click', removeRow);

  row.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragging = true;
    axis = null;
    startX = event.clientX;
    startY = event.clientY;
    base = row.hasAttribute('data-open') ? -SWIPE_ACTION_WIDTH : 0;
  });

  row.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (axis === null) axis = lockAxis(dx, dy);
    if (axis !== 'x') return; // lascia scorrere la lista in verticale
    event.preventDefault();
    setX(clampDrag(base + dx), false);
  });

  const finish = (event) => {
    if (!dragging) return;
    dragging = false;
    if (axis !== 'x') return;
    justDragged = true;
    setTimeout(() => { justDragged = false; }, 0);
    const { x, outcome } = swipeOutcome(base + (event.clientX - startX));
    if (outcome === 'delete') { removeRow(); return; }
    setX(x, true);
    if (outcome === 'open') { closeOtherSwipeRows(row); row.setAttribute('data-open', ''); }
    else row.removeAttribute('data-open');
  };

  row.addEventListener('pointerup', finish);
  row.addEventListener('pointercancel', finish);

  content.addEventListener('click', (event) => {
    if (justDragged) { event.preventDefault(); return; }
    if (row.hasAttribute('data-open')) { closeSwipeRow(row); return; }
    onOpen();
  });
}

async function deleteRecentEntry(id) {
  const recent = (await store.get('recent')) ?? [];
  await store.set('recent', recent.filter((item) => item.id !== id));
}

async function addVaultEntry(value, type = 'CUSTOM', silent = false) {
  const limits = planOf(state.plan);
  if (!isUnlimited(limits.vaultEntries) && state.entries.length >= limits.vaultEntries) {
    toast(t('toast.limitEntries', { count: limits.vaultEntries }));
    return false;
  }
  const entry = await vault.addEntry(value, type);
  state.entries = await vault.listEntries();
  if (!entry) { if (!silent) toast(t('toast.entryExists')); return false; }
  if (!silent) toast(t('toast.entryAdded'));
  return true;
}

function renderNavBadge() {
  vault.listJobs().then((jobs) => {
    const open = jobs.filter((job) => !job.restoredAt).length;
    $('#nav-badge').textContent = open ? String(open) : '';
  });
}

/* =================================================================== */
/* Home                                                                */
/* =================================================================== */

async function renderHome() {
  const jobs = (await vault.listJobs()).filter((job) => !job.restoredAt);
  const block = $('#home-jobs');
  const list = $('#home-jobs-list');

  block.hidden = jobs.length === 0;
  list.innerHTML = jobs.slice(0, 3).map((job) => {
    const count = Object.keys(job.mapping).length;
    return `
      <button class="job" type="button" data-home-job="${job.id}">
        <span class="lock" aria-hidden="true">${iconSvg('lock')}</span>
        <span class="job-main"><strong>${escapeHtml(job.title)}</strong>
          <small>${escapeHtml(t(count === 1 ? 'vault.itemsCountOne' : 'vault.itemsCount', { count }))} · ${
            escapeHtml(retentionLabel(job, state.locale))}</small></span>
        <span class="chev" aria-hidden="true">›</span>
      </button>`;
  }).join('');

  $$('[data-home-job]', list).forEach((button) => button.addEventListener('click', () => {
    state.restoreJob = button.dataset.homeJob;
    goto('restore', 'fwd');
  }));

  const recent = (await store.get('recent')) ?? [];
  $('#home-willy').hidden = jobs.length > 0 || recent.length > 0;
  $('#home-recent').hidden = recent.length === 0;
  const homeRecentHost = $('#home-recent-list');
  const homeRecent = recent.slice(0, 2);
  homeRecentHost.innerHTML = homeRecent.map(recentRowHTML).join('');

  $$('.swipe-row', homeRecentHost).forEach((row) => {
    const id = row.dataset.recentRow;
    const item = homeRecent.find((entry) => entry.id === id);
    wireSwipeRow(row, {
      onOpen: () => {
        if (!item) return;
        $('#request').value = item.request;
        goto('work', 'fwd');
        setPhase('send');
      },
      onDelete: async () => { await deleteRecentEntry(id); toast(t('toast.recentDeleted')); renderHome(); },
    });
  });

  renderNavBadge();
  updateAction();
}

/* =================================================================== */
/* Impostazioni e piani                                                */
/* =================================================================== */

function renderRetentionOptions() {
  const select = $('#retention');
  if (!select) return;
  const limits = planOf(state.plan);
  const allowed = ['1h', '1d', '7d', 'forever'];
  const maxIndex = allowed.indexOf(limits.maxRetention);

  select.innerHTML = allowed.map((key, index) => {
    const label = t(`retention.${key}`);
    const locked = index > maxIndex;
    return `<option value="${key}" ${locked ? 'disabled' : ''}>${
      escapeHtml(locked ? t('retention.locked', { label }) : label)}</option>`;
  }).join('');
  select.value = state.retention;
}

function renderPlanChips() {
  const label = t(state.plan === 'pro' ? 'plan.pro' : 'plan.free');
  $$('#plan-chip, #vault-plan-chip').forEach((chip) => {
    chip.textContent = label;
    chip.dataset.plan = state.plan;
  });
}

async function renderSettings() {
  const limits = planOf(state.plan);
  $('#plan-title').textContent = t(state.plan === 'pro' ? 'plan.pro' : 'plan.free');
  $('#plan-body').textContent = state.plan === 'pro'
    ? t('plan.proBody')
    : t('plan.freeBody', {
        jobs: limits.openJobs, entries: limits.vaultEntries,
        desktop: limits.desktop.sessions, minutes: limits.desktop.minutes,
      });

  $('#storage-note').textContent = t(vault.secure ? 'settings.storageSecure' : 'settings.storagePlain');

  const status = await desktop.status(state.plan);
  const node = $('#desktop-status');
  if (status.active) {
    node.textContent = t('desktop.active', { minutes: Math.ceil(status.msLeft / 60000) });
  } else if (status.unlimited) {
    node.textContent = t('desktop.unlimited');
  } else if (status.remaining === 0) {
    node.textContent = t('desktop.none');
  } else {
    node.textContent = t(status.remaining === 1 ? 'desktop.remainingOne' : 'desktop.remaining',
      { count: status.remaining, minutes: status.minutes });
  }
  $('#desktop-start').disabled = !status.unlimited && status.remaining === 0 && !status.active;
}

function renderProBenefits() {
  const host = $('#pro-benefits');
  if (!host) return;
  host.innerHTML = PRO_BENEFITS.map((benefit) => `
    <div class="benefit">
      <span class="glyph" aria-hidden="true">${iconSvg(benefit.icon)}</span>
      <span><strong>${escapeHtml(benefit.title[state.locale])}</strong>
        <small>${escapeHtml(benefit.body[state.locale])}</small></span>
    </div>`).join('');
}

/* --- desktop via QR --- */

let desktopTimer = null;

async function startDesktop() {
  const code = pairingCode();
  const result = await desktop.start(state.plan, code);
  if (!result.ok) return toast(t('desktop.none'));

  $('#pairing-code').textContent = result.session.code;
  drawQr(`https://privai.app/desk#${result.session.code}`);
  tickDesktop(result.session);
  await ask('#dlg-desktop');
  clearInterval(desktopTimer);
  renderSettings();
}

function tickDesktop(session) {
  clearInterval(desktopTimer);
  const node = $('#desktop-timer');
  const update = () => {
    if (!Number.isFinite(session.endsAt)) { node.textContent = t('desktop.unlimited'); return; }
    const left = Math.max(0, session.endsAt - Date.now());
    const minutes = Math.floor(left / 60000);
    const seconds = String(Math.floor((left % 60000) / 1000)).padStart(2, '0');
    node.textContent = t('desktop.timer', { minutes, seconds });
    if (left <= 0) { clearInterval(desktopTimer); desktop.stop(); $('#dlg-desktop').close(); }
  };
  update();
  desktopTimer = setInterval(update, 1000);
}

/**
 * QR minimo disegnato a mano: qui serve solo la cornice riconoscibile e il
 * codice leggibile sotto. La generazione reale va fatta con una libreria
 * quando il canale di accoppiamento sarà definito.
 */
function drawQr(payload) {
  const size = 168;
  const cells = 21;
  const cell = size / cells;
  let hash = 0;
  for (const char of payload) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;

  const rects = [];
  for (let y = 0; y < cells; y += 1) {
    for (let x = 0; x < cells; x += 1) {
      const corner = (x < 7 && y < 7) || (x > cells - 8 && y < 7) || (x < 7 && y > cells - 8);
      const ring = corner && (x === 0 || y === 0 || x === 6 || y === 6
        || x === cells - 1 || y === cells - 1 || x === cells - 7 || y === cells - 7
        || (x > 1 && x < 5 && y > 1 && y < 5));
      const on = corner ? ring : (((hash >>> ((x * 7 + y * 3) % 30)) ^ (x * y)) & 1) === 1;
      if (on) rects.push(`<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}"/>`);
    }
  }
  $('#qr-holder').innerHTML =
    `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="QR">
       <rect width="${size}" height="${size}" fill="#fff"/>
       <g fill="#16151A">${rects.join('')}</g>
     </svg>`;
}

/* =================================================================== */
/* File                                                                */
/* =================================================================== */

/**
 * L'estrazione di un PDF può durare più dei 2,6s di un Toast, specie su un
 * telefono modesto o un file di più pagine: senza uno stato persistente
 * l'utente si ritrova davanti a uno schermo fermo e silenzioso proprio
 * mentre l'unica cosa in corso è invisibile (il parsing, non la UI).
 */
function setFileBusy(active) {
  $('#intake-busy').hidden = !active;
  $('#intake-hint-share').hidden = active;
  $('#intake-paste').disabled = active;
  $('#intake-file').disabled = active;
}

async function importFile(event) {
  const [file] = event.target.files;
  if (!file) return;
  const pdf = isPdfFile(file);
  if (pdf) setFileBusy(true);
  try {
    if (pdf) {
      const result = await extractTextFromPdf(file);
      setSource(result.text);
      toast(t('pdf.imported', { count: result.pages }));
      return;
    }
    if (file.size > 2_000_000) return toast(t('toast.fileTooLarge'));
    setSource(await file.text());
    toast(t('toast.fileImported'));
  } catch (error) {
    const code = error instanceof PdfImportError ? error.code : 'PDF_INVALID';
    toast(t(`pdf.error.${code}`));
  } finally {
    event.target.value = '';
    if (pdf) setFileBusy(false);
  }
}

/** Punto unico di ingresso del testo, da qualunque strada arrivi. */
function setSource(text, { jumpToCheck = false } = {}) {
  state.source = String(text ?? '');
  state.jobId = null;
  state.masked = '';
  state.mapping = {};
  $('#source').value = state.source;
  $('#source-clear').hidden = !state.source.trim();

  goto('work', 'fwd');
  runScan();

  // Plug and play: se il testo arriva da una condivisione, l'utente vuole
  // vedere subito le criticità, non una casella di testo da rileggere.
  setPhase(jumpToCheck && state.findings.length ? 'check' : 'text');
}

/* =================================================================== */
/* Onboarding                                                          */
/* =================================================================== */

const DEMO_STEPS = [
  { it: 'Ciao Marco Bianchi, ti confermo il preventivo. Scrivimi a marco@studio.it',
    en: 'Hi Marco Bianchi, confirming the quote. Write to me at marco@studio.it' },
  { it: 'Ciao <mark>[NOME_1]</mark>, ti confermo il preventivo. Scrivimi a <mark>[EMAIL_1]</mark>',
    en: 'Hi <mark>[NOME_1]</mark>, confirming the quote. Write to me at <mark>[EMAIL_1]</mark>' },
];

let onbIndex = 0;

function showOnboarding(index = 0) {
  onbIndex = Math.max(0, Math.min(index, 2));
  $('#onboarding').hidden = false;
  $$('.onb-slide').forEach((slide, position) => {
    slide.toggleAttribute('data-active', position === onbIndex);
  });
  $$('.onb-dots span').forEach((dot, position) => dot.toggleAttribute('data-active', position === onbIndex));
  $('#onb-next').textContent = t(onbIndex === 2 ? 'onb.start' : 'onb.next');
  if (onbIndex === 2) playDemo();
}

function playDemo() {
  const host = $('#onb-demo');
  host.innerHTML = DEMO_STEPS[0][state.locale];
  if (reducedMotion()) { host.innerHTML = DEMO_STEPS[1][state.locale]; return; }
  setTimeout(() => { host.innerHTML = DEMO_STEPS[1][state.locale]; }, 900);
}

function closeOnboarding() {
  $('#onboarding').hidden = true;
  store.set('onboarded', true);
}

/* =================================================================== */
/* Riquadro Impostazioni Rapide — nessuna schermata                    */
/* =================================================================== */

/**
 * Punto d'ingresso headless per QuickProtectActivity: l'Activity vive meno
 * di un secondo e non deve mai disegnare nulla. Decide con la stessa
 * funzione pura di src/domain/quickProtect.mjs, poi scrive gli appunti,
 * eventualmente salva il lavoro, e chiede al plugin nativo di mostrare un
 * Toast e chiudersi — qualunque errore finisce comunque nel Toast e nella
 * chiusura, l'Activity non deve mai restare aperta.
 */
async function runQuickProtect() {
  const plugin = globalThis.Capacitor?.Plugins?.QuickProtect;
  try {
    const prefs = (await store.get('prefs')) ?? {};
    state.locale = normalizeLocale(prefs.locale ?? navigator.language);
    state.t = createTranslator(state.locale);
    state.plan = prefs.plan ?? 'free';

    const clip = await readClipboard();
    const mapping = await vault.combinedMapping();
    const entries = await vault.listEntries();
    const decision = decideQuickProtect(clip, mapping, entries);

    if (decision.action === 'restore') {
      await writeClipboard(decision.text);
      await plugin?.toast?.({ message: t('quickProtect.restored') });
    } else if (decision.action === 'mask') {
      await writeClipboard(decision.text);
      const limits = planOf(state.plan);
      const jobs = await vault.listJobs();
      const limited = !isUnlimited(limits.openJobs) && jobs.length >= limits.openJobs;
      await vault.saveJob({
        title: titleFromText(decision.text, defaultJobTitle()),
        mapping: decision.mapping,
        protectedText: decision.text,
        findingsCount: decision.count,
        retention: clampRetention(prefs.retention ?? DEFAULT_RETENTION, limits.maxRetention),
      });
      const base = t(decision.count === 1 ? 'vault.itemsCountOne' : 'vault.itemsCount', { count: decision.count });
      const message = limited ? `${base} · ${t('toast.limitJobs', { count: limits.openJobs })}` : base;
      await plugin?.toast?.({ message });
    } else if (decision.action === 'nothing') {
      await plugin?.toast?.({ message: t('quickProtect.nothing') });
    } else {
      await plugin?.toast?.({ message: t('quickProtect.empty') });
    }
  } catch {
    await plugin?.toast?.({ message: t('quickProtect.error') });
  } finally {
    await plugin?.finish?.();
  }
}

/* =================================================================== */
/* Avvio                                                               */
/* =================================================================== */

async function init() {
  if (globalThis.__privaiQuickProtect) {
    await runQuickProtect();
    return;
  }

  await vault.purgeExpired();

  const prefs = (await store.get('prefs')) ?? {};
  state.plan = prefs.plan ?? 'free';
  state.retention = clampRetention(prefs.retention ?? DEFAULT_RETENTION, planOf(state.plan).maxRetention);
  state.entries = await vault.listEntries();
  state.answers = defaultAnswers(getRecipe(state.recipeId));

  applyLocale(prefs.locale ?? navigator.language);
  applyTheme(prefs.theme ?? 'system');
  await renderHome();
  goto('home');
  booting = false;

  if (!(await store.get('onboarded'))) showOnboarding(0);

  // Condivisione in ingresso: è la strada principale, non un extra.
  //
  // Non è detto che sia contenuto nuovo: se l'utente condivide nell'app la
  // risposta di un'IA (Gemini, ChatGPT…) invece di tornarci e incollarla, il
  // testo condiviso contiene i NOSTRI segnaposto. Va verso il ripristino, non
  // verso una nuova scansione — altrimenti l'app tratta la risposta come un
  // documento da proteggere e il ripristino non parte mai.
  createInbound(async ({ text }) => {
    const mapping = await vault.combinedMapping();
    if (shouldOfferRestore(text, mapping).offer) {
      toast(t('toast.received'));
      $('#reply').value = text;
      goto('restore', 'fwd');
      await runRestore();
      return;
    }
    toast(t('toast.received'));
    setSource(text, { jumpToCheck: true });
  }).start();

  // Rientro dall'IA: il momento in cui la v1 perdeva le persone.
  checkClipboardOnResume();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkClipboardOnResume();
  });
  globalThis.Capacitor?.Plugins?.App?.addListener?.('appStateChange', ({ isActive }) => {
    if (isActive) checkClipboardOnResume();
  });
}

/* --- eventi --- */

$$('[data-goto]').forEach((button) => button.addEventListener('click', () => {
  haptic();
  goto(button.dataset.goto);
}));

$$('[data-phase-back]').forEach((button) => button.addEventListener('click', () => setPhase(button.dataset.phaseBack)));

$('#source').addEventListener('input', onSourceInput);

$('#source-clear').addEventListener('click', async () => {
  if (state.source.trim() && !(await confirmAction('confirm.clearTitle', 'confirm.clearBody', 'confirm.clearOk'))) return;
  $('#source').value = '';
  onSourceInput();
  toast(t('toast.cleared'));
});

$('#intake-paste').addEventListener('click', async () => {
  haptic();
  flourish($('#intake-paste .glyph'), 'flourish');
  const clip = await readClipboard();
  if (clip?.trim()) {
    setSource(clip, { jumpToCheck: true });
    toast(t('toast.pasted'));
    return;
  }
  setSource('');
  setTimeout(() => $('#source').focus(), 80);
});

$('#intake-file').addEventListener('click', () => {
  haptic();
  flourish($('#intake-file .glyph'), 'flourish');
  $('#file-input').click();
});
$('#file-input').addEventListener('change', importFile);

$('#bulk-all').addEventListener('click', () => setAllFindings(true));
$('#bulk-none').addEventListener('click', () => setAllFindings(false));
$('#bulk-manual').addEventListener('click', addManualMask);

$('#recipes-more').addEventListener('click', () => {
  state.showAllRecipes = !state.showAllRecipes;
  renderRecipes();
});

$('#extra').addEventListener('input', updateRequest);
$('#out-language').addEventListener('change', updateRequest);

$$('[data-copy]').forEach((button) => button.addEventListener('click', () => {
  copyFrom(`#${button.dataset.copy}`, button);
}));

$('#reply').addEventListener('input', updateAction);
$('#reply-paste').addEventListener('click', async () => {
  const clip = await readClipboard();
  if (!clip) return toast(t('toast.pasteFailed'));
  $('#reply').value = clip;
  updateAction();
  toast(t('toast.pasted'));
});

$('#entry-add').addEventListener('click', async () => {
  $('#prompt-title').textContent = t('vault.add');
  $('#prompt-body').textContent = t('vault.listBody');
  $('#prompt-label').textContent = t('manual.label');
  $('#prompt-input').value = '';
  const result = await ask('#dlg-prompt', (dialog) => setTimeout(() => $('#prompt-input', dialog).focus(), 60));
  if (result !== 'ok') return;
  if (await addVaultEntry($('#prompt-input').value.trim())) renderEntries();
});

$('#ui-language').addEventListener('change', async (event) => {
  const locale = normalizeLocale(event.target.value);
  const prefs = (await store.get('prefs')) ?? {};
  await store.set('prefs', { ...prefs, locale });
  applyLocale(locale);
  renderSettings();
  renderHome();
});

$('#ui-theme').addEventListener('change', async (event) => {
  const theme = event.target.value;
  applyTheme(theme);
  const prefs = (await store.get('prefs')) ?? {};
  await store.set('prefs', { ...prefs, theme });
});

$('#retention').addEventListener('change', async (event) => {
  state.retention = event.target.value;
  const prefs = (await store.get('prefs')) ?? {};
  await store.set('prefs', { ...prefs, retention: state.retention });
});

$('#desktop-start').addEventListener('click', startDesktop);

$('#wipe').addEventListener('click', async () => {
  if (!(await confirmAction('confirm.wipeTitle', 'confirm.wipeBody', 'confirm.wipeOk'))) return;
  await vault.wipeEverything();
  state.entries = [];
  state.jobId = null;
  state.mapping = {};
  toast(t('toast.wiped'));
  renderNavBadge();
  renderSettings();
});

$('#resume-action').addEventListener('click', () => { haptic(); resumeRestore(); });
$('#resume-close').addEventListener('click', hideResume);

$('#pro-interest').addEventListener('click', () => toast(t('toast.proInterest')));
$('#replay-onboarding').addEventListener('click', () => showOnboarding(0));
$('#onb-skip').addEventListener('click', closeOnboarding);
$('#onb-next').addEventListener('click', () => {
  if (onbIndex === 2) closeOnboarding(); else showOnboarding(onbIndex + 1);
});

if ('serviceWorker' in navigator && !globalThis.Capacitor?.isNativePlatform?.()) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

init();
