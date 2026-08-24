import { normalizeToMarkdown, buildPromptPack } from './domain/markdown.mjs';
import { detectSensitiveData, maskFindings, restoreProtectedText } from './domain/pii.mjs';
import { createStore } from './domain/storage.mjs';
import { greetingForHour } from './domain/greeting.mjs';
import { createTranslator, normalizeLocale } from './domain/i18n.mjs';
import { containsWebLinks, removeWebLinks } from './domain/share.mjs';

const persistentStore = createStore(localStorage);
const sessionStore = createStore(sessionStorage);
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const initialLocale = persistentStore.getLocale() ?? navigator.language;
const state = { markdown: '', protectedText: '', findings: [], mapping: {}, maskScope: '', provider: '', points: Number(localStorage.getItem('ai-pocket:points') || 0), translator: createTranslator(initialLocale) };

function applyLocale(locale) {
  state.translator = createTranslator(locale);
  document.documentElement.lang = state.translator.locale;
  $$('[data-i18n]').forEach((node) => { node.textContent = state.translator.t(node.dataset.i18n); });
  $$('[data-i18n-placeholder]').forEach((node) => { node.placeholder = state.translator.t(node.dataset.i18nPlaceholder); });
  const selector = $('#language-select');
  if (selector) selector.value = state.translator.locale;
  const greeting = greetingForHour(new Date().getHours(), state.translator.locale);
  const [emoji, ...words] = greeting.split(' ');
  $('#greeting-emoji').textContent = emoji;
  $('#greeting-text').textContent = words.join(' ');
}

function toast(message) {
  const node = $('#toast'); node.textContent = message; node.classList.add('show');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => node.classList.remove('show'), 2200);
}

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
  scrollTo({ top: 0, behavior: 'smooth' });
  if (name === 'history') renderHistory();
  if (name === 'settings') renderProviders();
}

function revealResult(selector) {
  const card = $(selector).closest('.editor-card.output');
  card.classList.remove('result-reveal'); void card.offsetWidth; card.classList.add('result-reveal');
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
$('#quick-paste').addEventListener('click', () => {
  showView('convert');
  setTimeout(() => $('#source-input').focus(), 0);
});
$('#quick-file').addEventListener('click', () => {
  showView('convert');
  $('#quick-add-dialog').close();
  $('#file-input').click();
});

$('#convert-button').addEventListener('click', () => {
  const source = $('#source-input').value;
  if (!source.trim()) return toast(state.translator.t('dynamic.insertContent'));
  state.markdown = normalizeToMarkdown(source);
  $('#markdown-output').value = state.markdown;
  $('#protect-input').value = state.markdown;
  revealResult('#markdown-output');
  award(5); toast(state.translator.t('dynamic.markdownCreated'));
});

async function importLocalFile(event, targetSelector) {
  const [file] = event.target.files;
  if (!file) return;
  if (file.size > 2_000_000) return toast(state.translator.t('dynamic.fileTooLarge'));
  $(targetSelector).value = await file.text();
  toast(state.translator.t('dynamic.fileImported'));
}

$('#file-input').addEventListener('change', (event) => importLocalFile(event, '#source-input'));
$('#protect-file-input').addEventListener('change', (event) => importLocalFile(event, '#protect-input'));
$('#prepare-file-input').addEventListener('change', (event) => importLocalFile(event, '#prepare-input'));

$('#to-protect').addEventListener('click', () => {
  $('#protect-input').value = $('#markdown-output').value || $('#source-input').value;
  showView('protect', true);
});

function renderFindings() {
  const host = $('#findings');
  const warning = `<p class="privacy-warning">${escapeHtml(state.translator.t('protect.reviewWarning'))}</p>`;
  if (!state.findings.length) { host.innerHTML = `<p class="empty-state">${escapeHtml(state.translator.t('protect.noneFound'))}</p>${warning}`; return; }
  host.innerHTML = state.findings.map((item, index) => `<label class="finding"><input type="checkbox" data-finding="${index}" ${item.selected ? 'checked' : ''}><div><strong>${item.type}</strong><p>${escapeHtml(item.value)}</p></div></label>`).join('') + warning;
  $$('[data-finding]').forEach((input) => input.addEventListener('change', () => { state.findings[Number(input.dataset.finding)].selected = input.checked; applyMask(); }));
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
  state.findings = detectSensitiveData(text); renderFindings(); applyMask();
  revealResult('#protected-output');
  const banner = $('.local-banner'); banner.classList.remove('privacy-success'); void banner.offsetWidth; banner.classList.add('privacy-success');
  award(10); toast(state.translator.t('scan.count', { count: state.findings.length }));
});

$('#restore-button').addEventListener('click', () => {
  const response = $('#restore-input').value;
  if (!response.trim()) return toast(state.translator.locale === 'it' ? 'Incolla prima la risposta dell’IA' : 'Paste the AI response first');
  if (!Object.keys(state.mapping).length) return toast(state.translator.locale === 'it' ? 'Prima proteggi un testo in questa sessione' : 'Protect some text in this session first');
  const restored = restoreProtectedText(response, state.mapping);
  if (!restored.restoredCount) return toast(state.translator.locale === 'it' ? 'Nessun dato da ripristinare trovato' : 'No restorable data found');
  $('#restored-output').value = restored.text;
  revealResult('#restored-output');
  toast(state.translator.locale === 'it' ? `${restored.restoredCount} dati ripristinati sul telefono` : `${restored.restoredCount} items restored on your phone`);
});

$('#clear-mapping').addEventListener('click', () => {
  state.mapping = {}; state.maskScope = ''; state.findings = [];
  $('#restore-input').value = ''; $('#restored-output').value = '';
  toast(state.translator.locale === 'it' ? 'Corrispondenze locali eliminate' : 'Local matches deleted');
});

$('#to-prepare').addEventListener('click', () => { $('#prepare-input').value = $('#protected-output').value || $('#protect-input').value; showView('prepare', true); });
$$('#template-chips button').forEach((button) => button.addEventListener('click', () => {
  $$('#template-chips button').forEach((item) => item.classList.remove('active')); button.classList.add('active'); $('#goal-input').value = button.dataset.goal;
}));

$('#prepare-button').addEventListener('click', () => {
  const content = $('#prepare-input').value || state.protectedText || $('#protected-output').value || state.markdown || $('#markdown-output').value;
  if (!content.trim()) return toast(state.translator.t('dynamic.convertFirst'));
  const result = buildPromptPack({ goal: $('#goal-input').value, constraints: $('#constraints-input').value.split('\n'), content, outputLanguage: $('#output-language-select').value });
  $('#prompt-output').value = result;
  revealResult('#prompt-output');
  const id = String(Date.now());
  persistentStore.saveRecent({ id, title: $('#goal-input').value || 'Contenuto preparato', markdown: result });
  award(15); toast(state.translator.t('dynamic.packSaved'));
});

async function shareText(text) {
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
    if (navigator.share) await navigator.share({ title: state.translator.t('dynamic.shareTitle'), text: shareCopy });
    else { await copyText(shareCopy); toast(state.translator.t('dynamic.shareFallback')); }
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
