/* Service worker: serve SOLO alla PWA. Nell'app nativa i file sono già locali
   e viene disattivato da app.mjs, per non duplicare 3 MB di pdf.js.
   I moduli non hanno più il versionamento in query string: la vecchia cache
   saltava ogni URL con "?" e quindi non serviva a nulla. */
const CACHE = 'privai-v2';
const SHELL = [
  './', './index.html', './styles.css', './manifest.webmanifest',
  './src/app.mjs', './src/icons.mjs',
  './src/domain/greeting.mjs', './src/domain/i18n.mjs', './src/domain/intake.mjs',
  './src/domain/markdown.mjs', './src/domain/pdf.mjs', './src/domain/pii.mjs',
  './src/domain/plan.mjs', './src/domain/qr.mjs', './src/domain/quickProtect.mjs', './src/domain/recipes.mjs',
  './src/domain/share.mjs', './src/domain/swipe.mjs', './src/domain/vault.mjs',
  './src/locales/it.mjs', './src/locales/en.mjs',
  './vendor/qrcode.mjs',
  './assets/icon.svg', './assets/icon-192.png', './assets/icon-512.png',
  './assets/willy-welcome.webp', './assets/willy-protect-v3.webp',
  './assets/fonts/willy-rounded.otf',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE)
    .then((cache) => cache.addAll(SHELL))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

/* Prima la rete, la cache come rete di salvataggio.
   La strategia opposta (prima la cache) lascia gli utenti sul codice vecchio
   dopo ogni aggiornamento: l'app è piccola e locale, quindi un controllo di
   rete non costa nulla e l'uso offline resta garantito dal ripiego. */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(url.pathname, copy));
        }
        return response;
      })
      .catch(() => caches.match(url.pathname)
        .then((cached) => cached || (request.mode === 'navigate' ? caches.match('./index.html') : undefined))),
  );
});
