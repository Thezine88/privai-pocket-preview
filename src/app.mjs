import { createRouter } from './ui/router.mjs';
import { renderHome } from './ui/screens/home.mjs';

const app = document.querySelector('#app');
const router = createRouter({ name: 'home' });
let build = { channel: 'production', entitlement: 'free', billingEnabled: false };

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
  if (route.name === 'home') {
    app.innerHTML = renderHome({ plan: build.entitlement, jobs: [] });
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
});

router.subscribe(render);
await loadBuild();
render();
