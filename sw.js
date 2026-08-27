const CACHE = 'privai-pocket-v21';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './src/app.mjs',
  './src/domain/markdown.mjs',
  './src/domain/pii.mjs',
  './src/domain/storage.mjs',
  './src/domain/greeting.mjs',
  './src/domain/i18n.mjs',
  './src/domain/share.mjs',
  './src/domain/pdf.mjs',
  './src/domain/workflow.mjs',
  './vendor/pdf.mjs',
  './vendor/pdf.worker.mjs',
  './src/locales/it.mjs',
  './src/locales/en.mjs',
  './manifest.webmanifest',
  './assets/icon.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/reward-token.webp',
  './assets/tool-markdown.webp',
  './assets/tool-protect.webp',
  './assets/tool-prepare.webp',
  './assets/tool-history.webp',
  './assets/willy-welcome.webp',
  './assets/willy-prepare.webp',
  './assets/willy-protect-v3.webp',
  './assets/willy-control.webp',
  './assets/fonts/willy-rounded.otf',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.search) {
    event.respondWith(fetch(request));
    return;
  }
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) caches.open(CACHE).then((cache) => cache.put('./index.html', response.clone()));
      return response;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(url.pathname).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok) caches.open(CACHE).then((cache) => cache.put(url.pathname, response.clone()));
    return response;
  })));
});
