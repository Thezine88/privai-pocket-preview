import { normalizeToMarkdown, buildPromptPack } from './domain/markdown.mjs?v=17';
import { detectSensitiveData, displaySensitiveType, maskFindings, restoreProtectedText } from './domain/pii.mjs?v=17';
import { createStore } from './domain/storage.mjs?v=17';
import { greetingForHour } from './domain/greeting.mjs?v=17';
import { createTranslator, normalizeLocale } from './domain/i18n.mjs?v=17';
import { containsWebLinks, removeWebLinks } from './domain/share.mjs?v=17';
import { createOutboundShare } from './domain/outbound-share.mjs?v=17';
import { extractTextFromPdf, isPdfFile, PdfImportError } from './domain/pdf.mjs?v=17';
import { createWorkflowState, transitionWorkflow, containsKnownPlaceholder } from './domain/workflow.mjs?v=17';
import { createOnboardingState } from './domain/onboarding.mjs?v=17';

const persistentStore = createStore(localStorage);
const sessionStore = createStore(sessionStorage);
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const initialLocale = persistentStore.getLocale() ?? navigator.language;
const state = { markdown: '', protectedText: '', findings: [], mapping: {}, maskScope: '', provider: '', selectedTemplate: 'checklist', points: Number(localStorage.getItem('ai-pocket:points') || 0), translator: createTranslator(initialLocale) };
const onboardingState = createOnboardingState(localStorage);
const outboundShare = createOutboundShare({
  isNative: () => Boolean(globalThis.Capacitor?.isNativePlatform?.()),
  nativePlugin: () => globalThis.Capacitor?.Plugins?.OutboundShare,
  webShare: navigator.share?.bind(navigator),
});
const workflows = {
  convert: createWorkflowState('convert'),
  protect: createWorkflowState('protect'),
  prepare: createWorkflowState('prepare'),
  restore: createWorkflowState('restore'),
};

function applyLocale(locale) {
  const previousTranslator = state.translator;
  state.translator = createTranslator(locale);
  document.documentElement.lang = state.translator.locale;
  $$('[data-i18n]').forEach((node) => { node.textContent = state.translator.t(node.dataset.i18n); });
  $$('[data-i18n-placeholder]').forEach((node) => { node.placeholder = state.translator.t(node.dataset.i18nPlaceholder); });
  $$('[data-i18n-aria-label]').forEach((node) => { node.setAttribute('aria-label', state.translator.t(node.dataset.i18nAriaLabel)); });
  $$('[data-i18n-value]').forEach((node) => {
    const key = node.dataset.i18nValue;
    if (!node.dataset.i18nValueReady || node.value === previousTranslator.t(key)) node.value = state.translator.t(key);
    node.dataset.i18nValueReady = 'true';
  });
  const selector = $('#language-select');
  if (selector) selector.value = state.translator.locale;
  const greeting = greetingForHour(new Date().getHours(), state.translator.locale);
  const [emoji, ...words] = greeting.split(' ');
  $('#greeting-emoji').textContent = emoji;
  $('#greeting-text').textContent = words.join(' ');
  updateRestoreStatus();
  if ($('[data-view-panel="history"]')?.classList.contains('active')) renderHistory();
  if ($('[data-view-panel="settings"]')?.classList.contains('active')) renderProviders();
}

function updateRestoreStatus() {
  const node = $('#restore-status');
  if (!node) return;
  const count = Object.keys(state.mapping).length;
  node.textContent = state.translator.t(count ? 'restore.sessionReady' : 'restore.sessionEmpty', { count });
}

function toast(message) {
  const node = $('#toast'); node.textContent = message; node.classList.add('show');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => node.classList.remove('show'), 2200);
}

let onboardingIndex = 0;
function showOnboarding(index = 0) {
  onboardingIndex = Math.max(0, Math.min(index, 3));
  $('#willy-onboarding').hidden = false;
  document.body.classList.add('onboarding-open');
  $$('[data-onboarding-slide]').forEach((slide, position) => {
    slide.hidden = position !== onboardingIndex;
    slide.classList.toggle('active', position === onboardingIndex);
  });
  $$('.onboarding-dots span').forEach((dot, position) => dot.classList.toggle('active', position === onboardingIndex));
}

function closeOnboarding() {
  onboardingState.complete();
  $('#willy-onboarding').hidden = true;
  document.body.classList.remove('onboarding-open');
}

$('#willy-onboarding').addEventListener('click', (event) => {
  if (event.target.closest('button')) return;
  if (onboardingIndex === 3) closeOnboarding(); else showOnboarding(onboardingIndex + 1);
});
$('#onboarding-skip').addEventListener('click', closeOnboarding);
$('#onboarding-start').addEventListener('click', closeOnboarding);
$('#replay-onboarding').addEventListener('click', () => showOnboarding(0));
if (onboardingState.shouldShow()) showOnboarding(0);

function award(points) {
  state.points += points; localStorage.setItem('ai-pocket:points', state.points); $('#points-value').textContent = state.points;
  animateToken();
}

function animateToken() {
  const target = $('.token-balance');
  target.classList.remove('token-bump'); void target.offsetWidth; target.classList.add('token-bump');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const token = document.createElement('img'); token.src = 'assets/reward-token.webp'; token.alt = ''; token.className = 'token-fly'; document.body.append(token);
  const end = target.getBoundingClientRect();
  token.animate([{ transform: 'translate(0,0) scale(.7)', opacity: 0 }, { opacity: 1, offset: .2 }, { transform: `translate(${end.left - innerWidth / 2 + 24}px,${end.top - innerHeight + 90}px) scale(.35)`, opacity: 0 }], { duration: 620, easing: 'cubic-bezier(.2,.8,.2,1)' }).finished.finally(() => token.remove());
}

function showView(name, forward = false) {
  $$('.view').forEach((view) => {
    const active = view.dataset.viewPanel === name;
    view.classList.toggle('active', active); view.classList.toggle('forward', active && forward);
  });
  $('.topbar').hidden = name !== 'home';
  if (workflows[name]) {
    if (name === 'protect') setProtectMode('protect');
    showWorkflowPhase(name, 'input');
  }
  scrollTo({ top: 0, behavior: 'smooth' });
  if (name === 'history') renderHistory();
  if (name === 'settings') renderProviders();
}

function revealResult(selector) {
  const card = $(selector).closest('.editor-card.output');
  card.classList.remove('result-reveal'); void card.offsetWidth; card.classList.add('result-reveal');
}

function showWorkflowPhase(tool, phase) {
  const root = document.querySelector(`[data-workflow="${tool}"]`);
  if (!root) return;
  root.querySelectorAll('[data-phase]').forEach((panel) => {
    const active = panel.dataset.phase === phase;
    panel.hidden = !active;
    panel.toggleAttribute('data-phase-active', active);
  });
  workflows[tool] = transitionWorkflow(workflows[tool], phase === 'review' ? 'REVIEW' : phase === 'result' ? 'COMPLETE' : 'EDIT');
  const heading = root.querySelector(`[data-phase="${phase}"] h2, [data-phase="${phase}"] h3`);
  heading?.setAttribute('tabindex', '-1');
  heading?.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

function setProtectMode(mode) {
  $$('[data-protect-mode]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.protectMode === mode)));
  $('[data-workflow="protect"]').hidden = mode !== 'protect';
  $('[data-workflow="restore"]').hidden = mode !== 'restore';
  if (mode === 'restore') {
    updateRestoreStatus();
  }
}

$$('[data-view]').forEach((button) => button.addEventListener('click', () => showView(button.dataset.view)));
$('#points-value').textContent = state.points;
applyLocale(state.translator.locale);
$('#language-select').addEventListener('change', (event) => {
  const locale = normalizeLocale(event.target.value);
  persistentStore.saveLocale(locale);
  applyLocale(locale);
});
$('#points-info').addEventListener('click', () => $('#points-dialog').showModal());
$('#add-button').addEventListener('click', () => $('#quick-add-dialog').showModal());
$('#voice-entry').addEventListener('click', () => $('#voice-dialog').showModal());
$$('[data-protect-mode]').forEach((button) => button.addEventListener('click', () => setProtectMode(button.dataset.protectMode)));
$$('[data-workflow-edit]').forEach((button) => button.addEventListener('click', () => showWorkflowPhase(button.dataset.workflowEdit, 'input')));

function clearWorkflow(tool) {
  const fields = {
    convert: ['source-input', 'markdown-output', 'file-input'],
    protect: ['protect-input', 'protected-output', 'protect-file-input'],
    prepare: ['prepare-input', 'prompt-output', 'prepare-file-input'],
    restore: ['restore-input', 'restored-output'],
  }[tool] ?? [];
  const processed = {
    convert: Boolean($('#markdown-output').value),
    protect: Boolean($('#protected-output').value || state.findings.length || Object.keys(state.mapping).length),
    prepare: Boolean($('#prompt-output').value),
    restore: Boolean($('#restored-output').value),
  }[tool] ?? false;
  if (processed && !window.confirm(state.translator.t('action.clearConfirm'))) return;
  fields.forEach((id) => { const field = $(`#${id}`); if (field) field.value = ''; });
  if (tool === 'convert') state.markdown = '';
  if (tool === 'protect') {
    state.protectedText = ''; state.findings = []; state.mapping = {}; state.maskScope = '';
    $('#findings').innerHTML = `<p class="empty-state">${escapeHtml(state.translator.t('protect.notScanned'))}</p>`;
  }
  syncClearButton($(`[data-clear-workflow="${tool}"]`));
  showWorkflowPhase(tool, 'input');
  toast(state.translator.t('dynamic.cleared'));
}

function syncClearButton(button) {
  if (!button) return;
  const input = $(`#${button.dataset.clearTarget}`);
  button.hidden = !input?.value.trim();
}

$$('[data-clear-workflow]').forEach((button) => {
  const input = $(`#${button.dataset.clearTarget}`);
  input?.addEventListener('input', () => syncClearButton(button));
  button.addEventListener('click', () => clearWorkflow(button.dataset.clearWorkflow));
  syncClearButton(button);
});
$('#quick-paste').addEventListener('click', () => {
  showView('convert');
  showWorkflowPhase('convert', 'input');
  $('#quick-add-dialog').close();
  setTimeout(() => $('#source-input').focus(), 0);
});
$('#quick-file').addEventListener('click', () => {
  showView('convert');
  showWorkflowPhase('convert', 'input');
  $('#quick-add-dialog').close();
  $('#file-input').click();
});

$('#convert-button').addEventListener('click', () => {
  const source = $('#source-input').value;
  if (!source.trim()) return toast(state.translator.t('dynamic.insertContent'));
  state.markdown = normalizeToMarkdown(source);
  $('#markdown-output').value = state.markdown;
  $('#protect-input').value = state.markdown;
  showWorkflowPhase('convert', 'result');
  revealResult('#markdown-output');
  award(5); toast(state.translator.t('dynamic.markdownCreated'));
});

async function importLocalFile(event, targetSelector) {
  const [file] = event.target.files;
  if (!file) return;
  try {
    if (isPdfFile(file)) {
      toast(state.translator.t('pdf.reading'));
      const result = await extractTextFromPdf(file);
      $(targetSelector).value = result.text;
      $(targetSelector).dispatchEvent(new Event('input'));
      toast(state.translator.t('pdf.imported', { count: result.pages }));
      return;
    }
    if (file.size > 2_000_000) return toast(state.translator.t('dynamic.fileTooLarge'));
    $(targetSelector).value = await file.text();
    $(targetSelector).dispatchEvent(new Event('input'));
    toast(state.translator.t('dynamic.fileImported'));
  } catch (error) {
    const code = error instanceof PdfImportError ? error.code : 'PDF_INVALID';
    toast(state.translator.t(`pdf.error.${code}`));
  } finally {
    event.target.value = '';
  }
}

$('#file-input').addEventListener('change', (event) => importLocalFile(event, '#source-input'));
$('#protect-file-input').addEventListener('change', (event) => importLocalFile(event, '#protect-input'));
$('#prepare-file-input').addEventListener('change', (event) => importLocalFile(event, '#prepare-input'));

$('#to-protect').addEventListener('click', () => {
  $('#protect-input').value = $('#markdown-output').value || $('#source-input').value;
  showView('protect', true);
  setProtectMode('protect');
  showWorkflowPhase('protect', 'input');
});

function renderFindings() {
  const host = $('#findings');
  const warning = `<p class="privacy-warning">${escapeHtml(state.translator.t('protect.reviewWarning'))}</p>`;
  if (!state.findings.length) { host.innerHTML = `<p class="empty-state">${escapeHtml(state.translator.t('protect.noneFound'))}</p>${warning}`; return; }
  host.innerHTML = state.findings.map((item, index) => `<label class="finding"><input type="checkbox" data-finding="${index}" ${item.selected ? 'checked' : ''}><div><strong>${escapeHtml(displaySensitiveType(item.type, state.translator.locale))}</strong><p>${escapeHtml(item.value)}</p></div></label>`).join('') + warning;
  $$('[data-finding]').forEach((input) => input.addEventListener('change', () => { state.findings[Number(input.dataset.finding)].selected = input.checked; }));
}

function applyMask() {
  const result = maskFindings($('#protect-input').value, state.findings, { scope: state.maskScope });
  state.mapping = result.mapping;
  state.protectedText = result.text; $('#protected-output').value = result.text;
}

$('#scan-button').addEventListener('click', () => {
  const text = $('#protect-input').value;
  if (!text.trim()) return toast(state.translator.t('dynamic.insertContent'));
  state.maskScope = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase();
  state.findings = detectSensitiveData(text); renderFindings();
  $('#findings-summary').textContent = state.translator.t(state.findings.length ? 'protect.foundSummary' : 'protect.noneSummary', { count: state.findings.length });
  showWorkflowPhase('protect', 'review');
  const banner = $('.local-banner'); banner.classList.remove('privacy-success'); void banner.offsetWidth; banner.classList.add('privacy-success');
  toast(state.translator.t('scan.count', { count: state.findings.length }));
});

$('#apply-protection').addEventListener('click', () => {
  applyMask();
  const selected = state.findings.filter((finding) => finding.selected).length;
  $('#protected-summary').textContent = state.translator.t('protect.replacedSummary', { count: selected });
  showWorkflowPhase('protect', 'result');
  revealResult('#protected-output');
  award(10);
});

$('#restore-button').addEventListener('click', () => {
  const response = $('#restore-input').value;
  if (!response.trim()) return toast(state.translator.locale === 'it' ? 'Incolla prima la risposta dell’IA' : 'Paste the AI response first');
  if (!Object.keys(state.mapping).length) return toast(state.translator.locale === 'it' ? 'Prima proteggi un testo in questa sessione' : 'Protect some text in this session first');
  const restored = restoreProtectedText(response, state.mapping);
  if (!restored.restoredCount) return toast(state.translator.locale === 'it' ? 'Nessun dato da ripristinare trovato' : 'No restorable data found');
  $('#restored-output').value = restored.text;
  showWorkflowPhase('restore', 'result');
  revealResult('#restored-output');
  toast(state.translator.locale === 'it' ? `${restored.restoredCount} dati ripristinati sul telefono` : `${restored.restoredCount} items restored on your phone`);
});

$('#clear-mapping').addEventListener('click', () => {
  state.mapping = {}; state.maskScope = ''; state.findings = [];
  $('#restore-input').value = ''; $('#restored-output').value = '';
  toast(state.translator.locale === 'it' ? 'Corrispondenze locali eliminate' : 'Local matches deleted');
});

$('#to-prepare').addEventListener('click', () => {
  $('#prepare-input').value = $('#protected-output').value || $('#protect-input').value;
  showView('prepare', true);
  showWorkflowPhase('prepare', 'input');
});

$('#protect-input').addEventListener('input', (event) => {
  if (!containsKnownPlaceholder(event.target.value, state.mapping)) return;
  $('#restore-input').value = event.target.value;
  setProtectMode('restore');
  showWorkflowPhase('restore', 'input');
  toast(state.translator.locale === 'it' ? 'Risposta riconosciuta: puoi ripristinare i dati.' : 'Response recognised: you can restore your data.');
});
$$('#template-chips button').forEach((button) => button.addEventListener('click', () => {
  $$('#template-chips button').forEach((item) => item.classList.remove('active')); button.classList.add('active'); state.selectedTemplate = button.dataset.template; $('#goal-input').value = state.translator.t(button.dataset.goalKey);
}));

$('#prepare-button').addEventListener('click', () => {
  const content = $('#prepare-input').value || state.protectedText || $('#protected-output').value || state.markdown || $('#markdown-output').value;
  if (!content.trim()) return toast(state.translator.t('dynamic.convertFirst'));
  const result = buildPromptPack({ template: state.selectedTemplate, goal: $('#goal-input').value, constraints: $('#constraints-input').value.split('\n'), content, outputLanguage: $('#output-language-select').value });
  $('#prompt-output').value = result;
  showWorkflowPhase('prepare', 'result');
  revealResult('#prompt-output');
  const id = String(Date.now());
  persistentStore.saveRecent({ id, title: $('#goal-input').value || 'Contenuto preparato', markdown: result });
  award(15); toast(state.translator.t('dynamic.packSaved'));
});

async function shareText(text, aiOnly = false) {
  let shareCopy = text;
  if (containsWebLinks(text)) {
    const dialog = $('#share-links-dialog');
    dialog.returnValue = '';
    const choice = await new Promise((resolve) => {
      dialog.addEventListener('close', () => resolve(dialog.returnValue), { once: true });
      dialog.showModal();
    });
    if (choice === 'cancel' || !choice) return;
    if (choice === 'remove') shareCopy = removeWebLinks(text);
  }
  try {
    const title = state.translator.t('dynamic.shareTitle');
    const result = aiOnly
      ? await outboundShare.shareWithInstalledAI(shareCopy, title)
      : await outboundShare.shareAnywhere(shareCopy, title);
    if (result?.unavailable) { await copyText(shareCopy); toast(state.translator.t('dynamic.shareFallback')); }
    else if (result?.fallback) toast(state.translator.t('dynamic.noAIApps'));
  } catch (error) {
    if (error?.name !== 'AbortError') toast(state.translator.locale === 'it' ? 'Condivisione non riuscita. Il testo resta qui.' : 'Sharing failed. Your text is still here.');
  }
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const area = document.createElement('textarea');
  area.value = text; area.style.position = 'fixed'; area.style.opacity = '0';
  document.body.append(area); area.select();
  const copied = document.execCommand('copy'); area.remove();
  if (!copied) throw new Error('Clipboard unavailable');
}

$$('[data-copy-result]').forEach((button) => button.addEventListener('click', async () => {
  const text = $(`#${button.dataset.copyResult}`).value;
  if (!text.trim()) return toast(state.translator.t('dynamic.noCopy'));
  try {
    await copyText(text); button.classList.add('copied');
    const original = button.textContent; button.textContent = state.translator.locale === 'it' ? '✓ Copiato' : '✓ Copied';
    setTimeout(() => { button.classList.remove('copied'); button.textContent = original; }, 1200);
    toast(state.translator.t('dynamic.contentCopied'));
  }
  catch { toast(state.translator.locale === 'it' ? 'Copia non riuscita. Il testo resta visibile.' : 'Copy failed. Your text is still visible.'); }
}));

$$('[data-share-result]').forEach((button) => button.addEventListener('click', async () => {
  const text = $(`#${button.dataset.shareResult}`).value;
  if (!text.trim()) return toast(state.translator.t('dynamic.noShare'));
  await shareText(text);
}));

$$('[data-ai-share-result]').forEach((button) => button.addEventListener('click', async () => {
  const text = $(`#${button.dataset.aiShareResult}`).value;
  if (!text.trim()) return toast(state.translator.t('dynamic.noShare'));
  await shareText(text, true);
}));

function renderHistory() {
  const items = persistentStore.listRecent(); const host = $('#history-list');
  if (!items.length) { host.innerHTML = `<p class="empty-state">${escapeHtml(state.translator.t('dynamic.noHistory'))}</p>`; return; }
  host.innerHTML = items.map((item) => `<article class="history-item"><div><h3>${escapeHtml(item.title)}</h3><p>${new Date(item.updatedAt).toLocaleString(state.translator.locale)}</p></div><span>›</span><div class="history-actions"><button data-open="${item.id}">${escapeHtml(state.translator.t('history.open'))}</button><button data-delete="${item.id}">${escapeHtml(state.translator.t('history.delete'))}</button></div></article>`).join('');
  $$('[data-open]').forEach((button) => button.addEventListener('click', () => {
    const item = items.find((entry) => entry.id === button.dataset.open);
    $('#prompt-output').value = item.markdown;
    showView('prepare');
    showWorkflowPhase('prepare', 'result');
  }));
  $$('[data-delete]').forEach((button) => button.addEventListener('click', () => { persistentStore.deleteRecent(button.dataset.delete); renderHistory(); toast(state.translator.t('dynamic.deleted')); }));
}

const dialog = $('#api-dialog');
$$('[data-provider]').forEach((button) => button.addEventListener('click', () => {
  state.provider = button.dataset.provider; $('#api-title').textContent = state.translator.t('settings.connectProvider', { provider: button.querySelector('strong').textContent }); $('#api-key-input').value = sessionStore.getProviderKey(state.provider); dialog.showModal();
}));
$('#api-save').addEventListener('click', () => { const key = $('#api-key-input').value.trim(); if (!key) return toast(state.translator.t('dynamic.insertApi')); sessionStore.saveProviderKey(state.provider, key); dialog.close(); renderProviders(); toast(state.translator.t('dynamic.apiSaved')); });
$('#api-delete').addEventListener('click', () => { sessionStore.deleteProviderKey(state.provider); $('#api-key-input').value = ''; dialog.close(); renderProviders(); toast(state.translator.t('dynamic.apiRemoved')); });
function renderProviders() { $$('[data-provider]').forEach((row) => { const summary = sessionStore.providerSummary(row.dataset.provider); row.querySelector('small').textContent = summary.configured ? `${state.translator.t('dynamic.configured')} ${summary.masked}` : state.translator.t('dynamic.notConfigured'); }); }
function escapeHtml(value) { const node = document.createElement('div'); node.textContent = String(value); return node.innerHTML; }

$('#pro-interest').addEventListener('click', () => toast(state.translator.t('dynamic.proInterest')));

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
