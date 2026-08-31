import { createRouter } from './ui/router.mjs';
import { renderHome } from './ui/screens/home.mjs';
import { renderOnboarding } from './ui/screens/onboarding.mjs';
import { renderVault } from './ui/screens/vault.mjs';
import { renderContentInput } from './ui/screens/content-input.mjs';
import { renderFindings } from './ui/screens/findings.mjs';
import { renderActionChoice } from './ui/screens/action-choice.mjs';
import { renderFinalCheck } from './ui/screens/final-check.mjs';
import { renderAwaitingResponse } from './ui/screens/awaiting-response.mjs';
import { renderRestoredResult } from './ui/screens/restored-result.mjs';
import { initialRoute, onboardingRoute } from './application/onboarding-state.mjs';
import { createJobService } from './application/job-service.mjs';
import { createJobStore } from './domain/storage.mjs';
import { createSessionVault } from './platform/vault-port.mjs';
import { createAndroidVault } from './platform/android-vault.mjs';

const app = document.querySelector('#app');
const ONBOARDING_KEY = 'restamio:onboarding-complete';
const SHARE_HELP_KEY = 'restamio:share-help-seen';
const router = createRouter(initialRoute(localStorage.getItem(ONBOARDING_KEY) === 'true'));
const nativeVault = window.Capacitor?.Plugins?.RestaMioVault;
const jobs = createJobService(createJobStore(nativeVault ? createAndroidVault(nativeVault) : createSessionVault(sessionStorage)));
let build = { channel: 'production', entitlement: 'free', billingEnabled: false };
let allJobs = [];
let swipeStart = null;
let feedback = '';

async function loadBuild() {
  try { const response = await fetch('./build-meta.json', { cache: 'no-store' }); if (response.ok) build = await response.json(); } catch { /* Free preview. */ }
}
async function loadJobs() { allJobs = (await Promise.all((await jobs.listIds()).map((id) => jobs.open(id)))).filter(Boolean); }
async function currentJob() { const id = router.current().state.jobId; return id ? jobs.open(id) : null; }

async function render() {
  const route = router.current();
  let html;
  if (route.name === 'onboarding') html = renderOnboarding(route.state.step ?? 0);
  else if (route.name === 'home') { await loadJobs(); html = renderHome({ plan: build.entitlement, jobs: allJobs }); }
  else if (route.name === 'vault') { await loadJobs(); html = renderVault({ jobs: allJobs }); }
  else if (route.name === 'content-input') html = renderContentInput(route.state.text ?? '', { error: feedback });
  else {
    const job = await currentJob();
    if (!job) { router.replace({ name: 'home' }); return; }
    if (route.name === 'findings') html = renderFindings(job);
    else if (route.name === 'action-choice') html = renderActionChoice(job, route.state);
    else if (route.name === 'final-check') html = renderFinalCheck(job);
    else if (route.name === 'awaiting-response') html = renderAwaitingResponse(job, { error: feedback });
    else if (route.name === 'result') html = renderRestoredResult(job);
  }
  app.innerHTML = html ?? `<section class="screen">${route.name}</section>`;
  requestAnimationFrame(() => { const title = app.querySelector('h1'); title?.setAttribute('tabindex', '-1'); title?.focus({ preventScroll: true }); });
}

async function setSelections(ids, selected) {
  const jobId = router.current().state.jobId;
  for (const id of ids) await jobs.setFindingSelection(jobId, id, selected);
  await render();
}
async function readClipboard(message) {
  try { const text = await navigator.clipboard.readText(); if (!text.trim()) throw new Error(message); return text; }
  catch { feedback = message; await render(); return null; }
}

app.addEventListener('input', (event) => {
  if (event.target.id === 'content-text') app.querySelector('[data-action="protect-text"]')?.toggleAttribute('disabled', !event.target.value.trim());
});

app.addEventListener('click', async (event) => {
  const target = event.target.closest('button, [data-nav]');
  if (!target) return;
  feedback = '';
  const nav = target.closest('[data-nav]');
  if (nav) { router.push({ name: nav.dataset.nav }); return; }
  const action = target.dataset.action;
  if (action === 'back') { router.back() || router.replace({ name: 'home' }); return; }
  if (action === 'onboarding-next') { router.replace(onboardingRoute((router.current().state.step ?? 0) + 1)); return; }
  if (action === 'onboarding-back') { const step = router.current().state.step ?? 0; if (step > 0) router.replace(onboardingRoute(step - 1)); return; }
  if (action === 'finish-onboarding') { localStorage.setItem(ONBOARDING_KEY, 'true'); router.replace({ name: 'home' }); return; }
  if (action === 'new-text') { router.push({ name: 'content-input' }); return; }
  if (action === 'paste-input') { const text = await readClipboard('Negli appunti non c’è del testo.'); if (text) router.replace({ name: 'content-input', state: { text } }); return; }
  if (action === 'protect-text') {
    const job = await jobs.createTextJob(app.querySelector('#content-text')?.value ?? '');
    if (job.findings.length) router.push({ name: 'findings', state: { jobId: job.id } });
    else { const protectedJob = await jobs.protect(job.id); router.push({ name: 'action-choice', state: { jobId: protectedJob.id, action: 'email' } }); }
    return;
  }
  if (action === 'toggle-finding-selection' || action === 'toggle-category-selection') { await setSelections(target.dataset.findingIds.split(','), target.getAttribute('aria-checked') !== 'true'); return; }
  if (action === 'select-all' || action === 'select-none') { const job = await currentJob(); await setSelections(job.findings.map((item) => item.id), action === 'select-all'); return; }
  if (action === 'toggle-category') { target.closest('.finding-card')?.classList.toggle('is-open'); return; }
  if (action === 'confirm-protection') { const job = await jobs.protect(router.current().state.jobId); router.push({ name: 'action-choice', state: { jobId: job.id, action: 'email' } }); return; }
  if (action === 'choose-action') { router.replace({ name: 'action-choice', state: { ...router.current().state, action: target.dataset.value } }); return; }
  if (target.dataset.choice) { app.querySelectorAll(`[data-choice="${target.dataset.choice}"]`).forEach((item) => item.classList.toggle('is-selected', item === target)); return; }
  if (action === 'continue-action') {
    const state = router.current().state;
    const context = { recipient: app.querySelector('[data-choice="recipient"].is-selected')?.dataset.value, goal: app.querySelector('[data-choice="goal"].is-selected')?.dataset.value, role: app.querySelector('[data-field="role"]')?.value };
    const job = await jobs.prepareRequest(state.jobId, { action: state.action, customPrompt: app.querySelector('[data-field="custom-prompt"]')?.value, context });
    router.push({ name: 'final-check', state: { jobId: job.id } }); return;
  }
  if (action === 'open-ai') {
    const id = router.current().state.jobId;
    const requestText = app.querySelector('#request-text')?.value ?? '';
    await jobs.updateRequest(id, requestText);
    const job = await jobs.markAwaiting(id, requestText);
    router.replace({ name: 'awaiting-response', state: { jobId: id } });
    if (localStorage.getItem(SHARE_HELP_KEY) !== 'true') { alert('Invia al chatbot il testo protetto. Quando ricevi la risposta, copiala o condividila con RestaMio.'); localStorage.setItem(SHARE_HELP_KEY, 'true'); }
    try { if (navigator.share) await navigator.share({ text: job.requestText }); else await navigator.clipboard.writeText(job.requestText); } catch { /* Il lavoro resta recuperabile. */ }
    return;
  }
  if (action === 'paste-response') { const text = await readClipboard('Non trovo una risposta da incollare.'); if (text) { const id = target.dataset.jobId ?? router.current().state.jobId; const job = await jobs.restore(id, text); router.push({ name: 'result', state: { jobId: job.id } }); } return; }
  if (action === 'return-final') { router.push({ name: 'final-check', state: router.current().state }); return; }
  if (action === 'retry-response') { router.push({ name: 'awaiting-response', state: router.current().state }); return; }
  if (action === 'open-job' || action === 'open-result') {
    const job = await jobs.open(target.dataset.jobId);
    const name = job.status === 'awaiting_ai' ? 'awaiting-response' : job.status === 'restored' || job.status === 'almost_ready' ? 'result' : 'final-check';
    router.push({ name, state: { jobId: job.id } }); return;
  }
  if (action === 'copy-result') { const job = await currentJob(); await navigator.clipboard.writeText(job.resultText); return; }
  if (action === 'share-result') { const job = await currentJob(); if (navigator.share) await navigator.share({ text: job.resultText }); }
});

app.addEventListener('pointerdown', (event) => { if (router.current().name === 'onboarding') swipeStart = { x: event.clientX, y: event.clientY }; });
app.addEventListener('pointerup', (event) => {
  if (!swipeStart || router.current().name !== 'onboarding') return;
  const dx = event.clientX - swipeStart.x; const dy = event.clientY - swipeStart.y; swipeStart = null;
  if (Math.abs(dx) < 48 || Math.abs(dx) <= Math.abs(dy)) return;
  const step = router.current().state.step ?? 0;
  if (dx < 0 && step < 2) router.replace(onboardingRoute(step + 1));
  if (dx > 0 && step > 0) router.replace(onboardingRoute(step - 1));
});

router.subscribe(() => { render(); });
await loadBuild();
await render();
