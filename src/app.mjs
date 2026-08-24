import { normalizeToMarkdown, buildPromptPack } from './domain/markdown.mjs';
import { detectSensitiveData, maskFindings } from './domain/pii.mjs';
import { createStore } from './domain/storage.mjs';
import { greetingForHour } from './domain/greeting.mjs';
import { createTranslator, normalizeLocale } from './domain/i18n.mjs';

const persistentStore = createStore(localStorage);
const sessionStore = createStore(sessionStorage);
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const initialLocale = persistentStore.getLocale() ?? navigator.language;
const state = { markdown: '', protectedText: '', findings: [], provider: '', points: Number(localStorage.getItem('ai-pocket:points') || 0), translator: createTranslator(initialLocale) };

function applyLocale(locale) {
  state.translator = createTranslator(locale);
  document.documentElement.lang = state.translator.locale;
  $$('[data-i18n]').forEach((node) => { node.textContent = state.translator.t(node.dataset.i18n); });
  $$('[data-i18n-placeholder]').forEach((node) => { node.placeholder = state.translator.t(node.dataset.i18nPlaceholder); });
  const selector = $('#language-select');
  if (selector) selector.value = state.translator.locale;
  $('#page-title').textContent = greetingForHour(new Date().getHours(), state.translator.locale);
}

function toast(message) {
  const node = $('#toast'); node.textContent = message; node.classList.add('show');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => node.classList.remove('show'), 2200);
}

function award(points) {
  state.points += points; localStorage.setItem('ai-pocket:points', state.points); $('#points-value').textContent = state.points;
}

function showView(name) {
  $$('.view').forEach((view) => view.classList.toggle('active', view.dataset.viewPanel === name));
  $('.topbar').hidden = name !== 'home';
  scrollTo({ top: 0, behavior: 'smooth' });
  if (name === 'history') renderHistory();
  if (name === 'settings') renderProviders();
}

$$('[data-view]').forEach((button) => button.addEventListener('click', () => showView(button.dataset.view)));
$('#points-value').textContent = state.points;
applyLocale(state.translator.locale);
$('#language-select').addEventListener('change', (event) => {
  const locale = normalizeLocale(event.target.value);
  persistentStore.saveLocale(locale);
  applyLocale(locale);
});

const shared = new URLSearchParams(location.search);
if (shared.get('share') === '1') {
  const received = [shared.get('title'), shared.get('text'), shared.get('url')].filter(Boolean).join('\n\n');
  if (received) { $('#source-input').value = received; showView('convert'); toast(state.translator.t('dynamic.received')); }
  history.replaceState({}, '', location.pathname);
}

$('#convert-button').addEventListener('click', () => {
  const source = $('#source-input').value;
  if (!source.trim()) return toast(state.translator.t('dynamic.insertContent'));
  state.markdown = normalizeToMarkdown(source);
  $('#markdown-output').value = state.markdown;
  $('#protect-input').value = state.markdown;
  award(5); toast(state.translator.t('dynamic.markdownCreated'));
});

$('#file-input').addEventListener('change', async (event) => {
  const [file] = event.target.files;
  if (!file) return;
  if (file.size > 2_000_000) return toast(state.translator.t('dynamic.fileTooLarge'));
  $('#source-input').value = await file.text();
  toast(state.translator.t('dynamic.fileImported'));
});

$('#to-protect').addEventListener('click', () => {
  $('#protect-input').value = $('#markdown-output').value || $('#source-input').value;
  showView('protect');
});

function renderFindings() {
  const host = $('#findings');
  const warning = `<p class="privacy-warning">${escapeHtml(state.translator.t('protect.reviewWarning'))}</p>`;
  if (!state.findings.length) { host.innerHTML = `<p class="empty-state">${escapeHtml(state.translator.t('protect.noneFound'))}</p>${warning}`; return; }
  host.innerHTML = state.findings.map((item, index) => `<label class="finding"><input type="checkbox" data-finding="${index}" ${item.selected ? 'checked' : ''}><div><strong>${item.type}</strong><p>${escapeHtml(item.value)}</p></div></label>`).join('') + warning;
  $$('[data-finding]').forEach((input) => input.addEventListener('change', () => { state.findings[Number(input.dataset.finding)].selected = input.checked; applyMask(); }));
}

function applyMask() {
  const result = maskFindings($('#protect-input').value, state.findings);
  state.protectedText = result.text; $('#protected-output').value = result.text;
}

$('#scan-button').addEventListener('click', () => {
  const text = $('#protect-input').value;
  if (!text.trim()) return toast(state.translator.t('dynamic.insertContent'));
  state.findings = detectSensitiveData(text); renderFindings(); applyMask();
  award(10); toast(state.translator.t('scan.count', { count: state.findings.length }));
});

$('#to-prepare').addEventListener('click', () => { showView('prepare'); });
$$('#template-chips button').forEach((button) => button.addEventListener('click', () => {
  $$('#template-chips button').forEach((item) => item.classList.remove('active')); button.classList.add('active'); $('#goal-input').value = button.dataset.goal;
}));

$('#prepare-button').addEventListener('click', () => {
  const content = state.protectedText || $('#protected-output').value || state.markdown || $('#markdown-output').value;
  if (!content.trim()) return toast(state.translator.t('dynamic.convertFirst'));
  const result = buildPromptPack({ goal: $('#goal-input').value, constraints: $('#constraints-input').value.split('\n'), content, outputLanguage: $('#output-language-select').value });
  $('#prompt-output').value = result;
  const id = String(Date.now());
  persistentStore.saveRecent({ id, title: $('#goal-input').value || 'Contenuto preparato', markdown: result });
  award(15); toast(state.translator.t('dynamic.packSaved'));
});

$('#copy-button').addEventListener('click', async () => {
  const text = $('#prompt-output').value; if (!text) return toast(state.translator.t('dynamic.noCopy'));
  await navigator.clipboard.writeText(text); toast(state.translator.t('dynamic.copied'));
});

async function shareText(text) {
  if (navigator.share) await navigator.share({ title: state.translator.t('dynamic.shareTitle'), text });
  else { await navigator.clipboard.writeText(text); toast(state.translator.t('dynamic.shareFallback')); }
}

$('#share-button').addEventListener('click', async () => {
  const text = $('#prompt-output').value; if (!text) return toast(state.translator.t('dynamic.noShare'));
  await shareText(text);
});

$('#global-share').addEventListener('click', async () => {
  const text = $('#prompt-output').value || state.protectedText || $('#protected-output').value || state.markdown || $('#markdown-output').value || $('#source-input').value;
  if (!text.trim()) { showView('convert'); return toast(state.translator.t('dynamic.prepareShare')); }
  await shareText(text);
});

$('#global-copy').addEventListener('click', async () => {
  const text = $('#prompt-output').value || state.protectedText || $('#protected-output').value || state.markdown || $('#markdown-output').value || $('#source-input').value;
  if (!text.trim()) { showView('convert'); return toast(state.translator.t('dynamic.prepareCopy')); }
  await navigator.clipboard.writeText(text); toast(state.translator.t('dynamic.contentCopied'));
});

function renderHistory() {
  const items = persistentStore.listRecent(); const host = $('#history-list');
  if (!items.length) { host.innerHTML = `<p class="empty-state">${escapeHtml(state.translator.t('dynamic.noHistory'))}</p>`; return; }
  host.innerHTML = items.map((item) => `<article class="history-item"><div><h3>${escapeHtml(item.title)}</h3><p>${new Date(item.updatedAt).toLocaleString(state.translator.locale)}</p></div><span>›</span><div class="history-actions"><button data-open="${item.id}">${state.translator.locale === 'it' ? 'Apri' : 'Open'}</button><button data-delete="${item.id}">${state.translator.locale === 'it' ? 'Elimina' : 'Delete'}</button></div></article>`).join('');
  $$('[data-open]').forEach((button) => button.addEventListener('click', () => { const item = items.find((entry) => entry.id === button.dataset.open); $('#prompt-output').value = item.markdown; showView('prepare'); }));
  $$('[data-delete]').forEach((button) => button.addEventListener('click', () => { persistentStore.deleteRecent(button.dataset.delete); renderHistory(); toast(state.translator.t('dynamic.deleted')); }));
}

const dialog = $('#api-dialog');
$$('[data-provider]').forEach((button) => button.addEventListener('click', () => {
  state.provider = button.dataset.provider; $('#api-title').textContent = `Collega ${button.querySelector('strong').textContent}`; $('#api-key-input').value = sessionStore.getProviderKey(state.provider); dialog.showModal();
}));
$('#api-save').addEventListener('click', () => { const key = $('#api-key-input').value.trim(); if (!key) return toast(state.translator.t('dynamic.insertApi')); sessionStore.saveProviderKey(state.provider, key); dialog.close(); renderProviders(); toast(state.translator.t('dynamic.apiSaved')); });
$('#api-delete').addEventListener('click', () => { sessionStore.deleteProviderKey(state.provider); $('#api-key-input').value = ''; dialog.close(); renderProviders(); toast(state.translator.t('dynamic.apiRemoved')); });
function renderProviders() { $$('[data-provider]').forEach((row) => { const summary = sessionStore.providerSummary(row.dataset.provider); row.querySelector('small').textContent = summary.configured ? `${state.translator.locale === 'it' ? 'Configurata' : 'Configured'} ${summary.masked}` : state.translator.t('dynamic.notConfigured'); }); }
function escapeHtml(value) { const node = document.createElement('div'); node.textContent = String(value); return node.innerHTML; }

$('#pro-interest').addEventListener('click', () => toast(state.translator.t('dynamic.proInterest')));

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
