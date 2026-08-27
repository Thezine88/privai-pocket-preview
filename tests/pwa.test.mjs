import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('manifest provides standalone Android install metadata', async () => {
  const manifest = JSON.parse(await readFile(new URL('../manifest.webmanifest', import.meta.url), 'utf8'));
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.theme_color, '#FFF8F1');
  assert.ok(manifest.icons.some((icon) => icon.sizes === '512x512'));
});

test('manifest declares a share target: PrivAI must be reachable from the PWA install too', async () => {
  // Diverso da prima di proposito: la condivisione in ingresso è il gesto
  // principale dell'app, e la PWA deve poterlo ricevere come l'APK nativo.
  const manifest = JSON.parse(await readFile(new URL('../manifest.webmanifest', import.meta.url), 'utf8'));
  assert.equal(manifest.share_target?.method, 'GET');
  assert.equal(manifest.share_target?.params?.text, 'shared');
});

test('service worker never caches query-bearing requests and only falls back for navigations', async () => {
  const sw = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
  assert.match(sw, /url\.origin/);
  assert.match(sw, /request\.mode === 'navigate'/);
  assert.match(sw, /cache\.put\(url\.pathname/);
});

test('service worker tries the network first, so an update is never stuck behind a stale cache', async () => {
  // Il contrario (prima la cache) lasciava gli utenti sul codice vecchio dopo
  // ogni aggiornamento: era un difetto reale, corretto qui.
  const sw = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
  const fetchHandler = sw.slice(sw.indexOf("addEventListener('fetch'"));
  const networkIndex = fetchHandler.indexOf('fetch(request)');
  const cacheMatchIndex = fetchHandler.indexOf('caches.match(url.pathname)');
  assert.ok(networkIndex >= 0 && cacheMatchIndex > networkIndex,
    'la rete deve essere il primo tentativo, la cache il ripiego');
});

test('service worker precaches the complete app shell, module by module', async () => {
  const worker = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
  for (const asset of [
    './index.html', './styles.css', './manifest.webmanifest', './src/app.mjs',
    './src/domain/pii.mjs', './src/domain/vault.mjs', './src/domain/recipes.mjs',
    './src/domain/plan.mjs', './src/domain/intake.mjs', './src/domain/markdown.mjs',
    './src/locales/it.mjs', './src/locales/en.mjs',
  ]) {
    assert.match(worker, new RegExp(asset.replaceAll('.', '\.')));
  }
});

test('service worker precache list has no stale query-string versioning', async () => {
  // I moduli non portano più "?v=NN": la vecchia cache saltava ogni URL con
  // "?" e la lista precache non serviva a nulla.
  const worker = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
  const shell = worker.match(/const SHELL = \[([\s\S]*?)\];/)?.[1] ?? '';
  assert.doesNotMatch(shell, /\?v=\d/);
});

test('il manifest Android dichiara il tile e la sua activity invisibile', async () => {
  const manifest = await readFile(new URL('../android/app/src/main/AndroidManifest.xml', import.meta.url), 'utf8');
  assert.match(manifest, /android:name="\.QuickProtectTileService"/);
  assert.match(manifest, /android:permission="android\.permission\.BIND_QUICK_SETTINGS_TILE"/);
  assert.match(manifest, /android\.service\.quicksettings\.action\.QS_TILE/);
  assert.match(manifest, /android:name="\.QuickProtectActivity"/);
  assert.match(manifest, /android:theme="@style\/AppTheme\.QuickProtect"/);
});
