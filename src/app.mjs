import { createRouter } from './ui/router.mjs';
import { renderHome } from './ui/screens/home.mjs';
import { renderOnboarding } from './ui/screens/onboarding.mjs';
import { renderVault } from './ui/screens/vault.mjs';
import { initialRoute, onboardingRoute } from './application/onboarding-state.mjs';

const app = document.querySelector('#app');
const ONBOARDING_KEY = 'restamio:onboarding-complete';
const router = createRouter(initialRoute(localStorage.getItem(ONBOARDING_KEY) === 'true'));
let build = { channel: 'production', entitlement: 'free', billingEnabled: false };
let swipeStart = null;

async function loadBuild() {
  try {
    const response = await fetch('./build-meta.json', { cache: 'no-store' });
    if (response.ok) build = await response.json();
  } catch {
    // The browser preview defaults safely to Free; Android bundles this file.
  }
}

function render() {
  const route = router.current();
  if (route.name === 'onboarding') {
    app.innerHTML = renderOnboarding(route.state.step ?? 0);
  } else if (route.name === 'home') {
    app.innerHTML = renderHome({ plan: build.entitlement, jobs: [] });
  } else if (route.name === 'vault') {
    app.innerHTML = renderVault({ jobs: [] });
  } else {
    app.innerHTML = `<section class="screen"><header class="screen-header"><button class="back-icon" data-action="back" aria-label="Indietro">‹</button><h1>${route.name === 'vault' ? 'Cassaforte' : 'Impostazioni'}</h1></header></section>`;
  }
  requestAnimationFrame(() => {
    const title = app.querySelector('h1');
    title?.setAttribute('tabindex', '-1');
    title?.focus({ preventScroll: true });
  });
}

app.addEventListener('click', (event) => {
  const nav = event.target.closest('[data-nav]');
  if (nav) router.push({ name: nav.dataset.nav });
  if (event.target.closest('[data-action="back"]')) router.back();
  if (event.target.closest('[data-action="onboarding-next"]')) {
    const step = router.current().state.step ?? 0;
    router.replace(onboardingRoute(step + 1));
  }
  if (event.target.closest('[data-action="onboarding-back"]')) {
    const step = router.current().state.step ?? 0;
    if (step > 0) router.replace(onboardingRoute(step - 1));
  }
  if (event.target.closest('[data-action="finish-onboarding"]')) {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace({ name: 'home' });
  }
});

app.addEventListener('pointerdown', (event) => {
  if (router.current().name === 'onboarding') swipeStart = { x: event.clientX, y: event.clientY };
});

app.addEventListener('pointerup', (event) => {
  if (!swipeStart || router.current().name !== 'onboarding') return;
  const dx = event.clientX - swipeStart.x;
  const dy = event.clientY - swipeStart.y;
  swipeStart = null;
  if (Math.abs(dx) < 48 || Math.abs(dx) <= Math.abs(dy)) return;
  const step = router.current().state.step ?? 0;
  if (dx < 0 && step < 2) router.replace(onboardingRoute(step + 1));
  if (dx > 0 && step > 0) router.replace(onboardingRoute(step - 1));
});

router.subscribe(render);
await loadBuild();
render();
