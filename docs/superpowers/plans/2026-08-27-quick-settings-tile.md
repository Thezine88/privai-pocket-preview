# Riquadro Impostazioni Rapide "Proteggi appunti" — Piano di implementazione

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un riquadro nelle Impostazioni Rapide di Android che, toccato, protegge o ripristina il contenuto degli appunti senza mai mostrare una schermata.

**Architecture:** Un'Activity Android invisibile (`Theme.Translucent.NoDisplay`), avviata dal tile, carica la stessa WebView/bridge Capacitor dell'app con un segnale di avvio headless. `app.mjs` riconosce il segnale e, invece di disegnare l'interfaccia, chiama una funzione di decisione pura (nuovo modulo `src/domain/quickProtect.mjs`) che riusa il motore di rilevamento/mascheramento/ripristino già in produzione (`src/domain/pii.mjs`). Il risultato viene scritto negli appunti, eventualmente salvato in cassaforte, e un plugin nativo minimo mostra un Toast e chiude l'Activity.

**Tech Stack:** JavaScript (moduli ES puri, nessun bundler), Java (Capacitor 8 / Android, `TileService`/`BridgeActivity`), `node --test` per i moduli JS.

## Global Constraints

- Nessun server, nessuna API a pagamento, nessuna dipendenza che richieda un bundler — moduli ES puri (vincolo di `HANDOFF.md` §1).
- Il motore di rilevamento/mascheramento/ripristino non va duplicato in nativo: un solo posto da mantenere (deciso in sessione).
- Il riquadro nasconde di default **solo i dati ad alto rischio**, mai i "forse nomi" incerti (deciso in sessione, coerente con il comportamento già esistente del flusso manuale).
- Il Toast di conferma mostra solo il conteggio, mai un invito ad aprire l'app (deciso in sessione).
- `minSdkVersion` resta 24 (`android/variables.gradle`) — non alzarlo.
- Nessuna compilazione Gradle né test su device possibili in questo ambiente: il codice nativo va scritto completo e corretto, ma la verifica reale resta per il prossimo APK.

---

### Task 1: Funzione di decisione pura

**Files:**
- Create: `src/domain/quickProtect.mjs`
- Test: `tests/domain.test.mjs` (aggiunta, stesso file già usato per `pii.mjs`/`vault.mjs`)

**Interfaces:**
- Consumes: `detectSensitiveData`, `maskFindings`, `restoreProtectedText`, `shouldOfferRestore` da `src/domain/pii.mjs` (già esistenti, firme invariate).
- Produces: `decideQuickProtect(clipboardText, mapping, vaultEntries)` → `{ action: 'empty' } | { action: 'nothing' } | { action: 'restore', text } | { action: 'mask', text, mapping, count }`. Il Task 2 lo importa così com'è.

- [ ] **Step 1: Scrivi i test (falliscono: il modulo non esiste ancora)**

Apri `tests/domain.test.mjs`. Aggiungi l'import in cima, insieme agli altri:

```js
import { decideQuickProtect } from '../src/domain/quickProtect.mjs';
```

Poi inserisci questo blocco subito dopo il test `'senza lavori in cassaforte non si tocca mai gli appunti'` (circa riga 555, prima del test `'ogni chiave usata in index.html esiste nelle traduzioni'`):

```js
/* ------------------------------------------------------------------ */
/* Riquadro Impostazioni Rapide: decisione senza schermata             */
/* ------------------------------------------------------------------ */

test('appunti vuoti: il riquadro non fa nulla', () => {
  assert.deepEqual(decideQuickProtect('', {}), { action: 'empty' });
  assert.deepEqual(decideQuickProtect('   ', {}), { action: 'empty' });
  assert.deepEqual(decideQuickProtect(null, {}), { action: 'empty' });
});

test('appunti con nostri segnaposto: il riquadro ripristina invece di rimascherare', () => {
  const mapping = { '[NOME_1]': 'Marco Bianchi', '[EMAIL_1]': 'marco@studio.it' };
  const risultato = decideQuickProtect('Gentile [NOME_1], la ricontatto a [EMAIL_1].', mapping);
  assert.equal(risultato.action, 'restore');
  assert.equal(risultato.text, 'Gentile Marco Bianchi, la ricontatto a marco@studio.it.');
});

test('testo nuovo con dati ad alto rischio: il riquadro maschera', () => {
  const risultato = decideQuickProtect('Contattami a mario.rossi@email.it per il progetto.', {});
  assert.equal(risultato.action, 'mask');
  assert.equal(risultato.count, 1);
  assert.match(risultato.text, /\[EMAIL_1\]/);
  assert.equal(risultato.mapping['[EMAIL_1]'], 'mario.rossi@email.it');
});

test('testo nuovo senza nulla da nascondere: il riquadro non tocca gli appunti', () => {
  const risultato = decideQuickProtect('Comprare pane, latte, uova.', {});
  assert.deepEqual(risultato, { action: 'nothing' });
});

test('il riquadro rispetta anche la rubrica personale, non solo i pattern automatici', () => {
  const risultato = decideQuickProtect(
    'Il progetto Fenice parte lunedì.', {}, [{ value: 'Fenice', type: 'CUSTOM' }],
  );
  assert.equal(risultato.action, 'mask');
  assert.equal(risultato.mapping['[RISERVATO_1]'], 'Fenice');
});
```

- [ ] **Step 2: Esegui i test, verifica che falliscano**

Run: `node --test tests/domain.test.mjs`
Expected: FAIL — `Cannot find module '../src/domain/quickProtect.mjs'`

- [ ] **Step 3: Scrivi il modulo**

Crea `src/domain/quickProtect.mjs`:

```js
/**
 * Decisione per il riquadro Impostazioni Rapide "Proteggi appunti".
 *
 * Pura: riceve il testo degli appunti già letto e la mappa dei lavori
 * aperti, restituisce cosa fare, senza mai toccare appunti, cassaforte o
 * plugin nativi — chi la usa (src/app.mjs) si occupa degli effetti
 * collaterali. Separarla così la rende testabile come il resto del
 * rilevamento, invece di vivere solo dentro l'orchestrazione headless.
 */

import { detectSensitiveData, maskFindings, restoreProtectedText, shouldOfferRestore } from './pii.mjs';

/**
 * @param {string} clipboardText
 * @param {Record<string,string>} mapping   vault.combinedMapping()
 * @param {Array} vaultEntries              vault.listEntries() — rubrica personale
 * @returns {
 *   | { action: 'empty' }
 *   | { action: 'nothing' }
 *   | { action: 'restore', text: string }
 *   | { action: 'mask', text: string, mapping: Record<string,string>, count: number }
 * }
 */
export function decideQuickProtect(clipboardText, mapping = {}, vaultEntries = []) {
  const text = String(clipboardText ?? '').trim();
  if (!text) return { action: 'empty' };

  // Prima domanda: è già una NOSTRA risposta da ripristinare? Rimascherarla
  // per errore la romperebbe (i segnaposto non sono dati sensibili veri).
  if (shouldOfferRestore(text, mapping).offer) {
    const restored = restoreProtectedText(text, mapping);
    return { action: 'restore', text: restored.text };
  }

  // Stesso motore e stessa selezione di default del flusso manuale: solo il
  // rischio alto nasce mascherato, "forse nomi" e dati a basso rischio no.
  const findings = detectSensitiveData(text, { vault: vaultEntries });
  const result = maskFindings(text, findings);
  const count = Object.keys(result.mapping).length;
  if (count === 0) return { action: 'nothing' };
  return { action: 'mask', text: result.text, mapping: result.mapping, count };
}
```

- [ ] **Step 4: Esegui i test, verifica che passino**

Run: `node --test tests/domain.test.mjs`
Expected: PASS, tutti i test del file verdi (compresi i 5 nuovi).

- [ ] **Step 5: Commit**

```bash
git add src/domain/quickProtect.mjs tests/domain.test.mjs
git commit -m "Aggiunge la decisione pura del riquadro Proteggi appunti

Maschera/ripristina/niente da fare: stesso motore di rilevamento già
in produzione, nessuna logica duplicata. Testato nei quattro casi più
il rispetto della rubrica personale."
```

---

### Task 2: Orchestrazione headless in app.mjs

**Files:**
- Modify: `src/app.mjs` (import in cima, nuova funzione `runQuickProtect`, una guardia in `init()`)
- Modify: `src/locales/it.mjs`, `src/locales/en.mjs` (quattro nuove chiavi)
- Test: `tests/ui.test.mjs` (aggiunta)

**Interfaces:**
- Consumes: `decideQuickProtect(text, mapping, entries)` dal Task 1. `readClipboard()`/`writeClipboard(text)` da `src/domain/intake.mjs` (già importati). `vault.combinedMapping()`, `vault.listEntries()`, `vault.listJobs()`, `vault.saveJob({...})` da `src/domain/vault.mjs` (già importati). `planOf`, `isUnlimited`, `clampRetention`, `DEFAULT_RETENTION`, `titleFromText`, `createTranslator`, `normalizeLocale` (già importati in `app.mjs`).
- Produces: `runQuickProtect()` — nessun altro task la consuma, ma il Task 3 (nativo) si aspetta che l'app, quando parte con `globalThis.__privaiQuickProtect` valorizzato, chiami `Capacitor.Plugins.QuickProtect.toast({message})` e `Capacitor.Plugins.QuickProtect.finish()`.

- [ ] **Step 1: Aggiungi le quattro chiavi di traduzione**

In `src/locales/it.mjs`, subito dopo la riga `'toast.limitEntries': 'Nel piano gratuito puoi salvare {count} parole. Passa a Pro per non avere limiti.',`:

```js
  /* --- riquadro impostazioni rapide --- */
  'quickProtect.restored': 'Ripristinato',
  'quickProtect.nothing': 'Niente da nascondere',
  'quickProtect.empty': 'Niente da proteggere negli appunti',
  'quickProtect.error': 'Il riquadro non è riuscito a completare l’azione',
```

In `src/locales/en.mjs`, nello stesso punto (dopo la riga `'toast.limitEntries'` corrispondente):

```js
  /* --- quick settings tile --- */
  'quickProtect.restored': 'Restored',
  'quickProtect.nothing': 'Nothing to hide',
  'quickProtect.empty': 'Nothing to protect on the clipboard',
  'quickProtect.error': 'The tile could not complete the action',
```

- [ ] **Step 2: Verifica che il test di parità IT/EN sia già verde con le nuove chiavi**

Run: `node --test tests/domain.test.mjs`
Expected: PASS — il test `'italiano e inglese hanno esattamente le stesse chiavi'` copre automaticamente le chiavi nuove, non serve altro.

- [ ] **Step 3: Aggiungi l'import in cima a `src/app.mjs`**

Trova la riga:

```js
import { swipeOutcome, clampDrag, lockAxis, SWIPE_ACTION_WIDTH } from './domain/swipe.mjs';
```

e aggiungi subito dopo:

```js
import { decideQuickProtect } from './domain/quickProtect.mjs';
```

- [ ] **Step 4: Scrivi `runQuickProtect()`**

Nel file `src/app.mjs`, subito prima del commento `/* Avvio */` (cerca `/* Avvio                                                               */`), inserisci:

```js
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

```

- [ ] **Step 5: Aggiungi la guardia in `init()`**

Trova l'inizio di `init()`:

```js
async function init() {
  await vault.purgeExpired();
```

Sostituiscilo con:

```js
async function init() {
  if (globalThis.__privaiQuickProtect) {
    await runQuickProtect();
    return;
  }

  await vault.purgeExpired();
```

- [ ] **Step 6: Scrivi il test di regressione sulla sorgente**

In `tests/ui.test.mjs`, subito dopo il test `'sharing a document opens straight on the findings screen: zero taps to see what was found'` (quello che contiene `assert.match(app, /createInbound/);`), aggiungi:

```js
test('the quick-settings tile runs headless: no screen is drawn when the native flag is set', async () => {
  const app = await readFile(new URL('../src/app.mjs', import.meta.url), 'utf8');
  assert.match(app, /__privaiQuickProtect/);
  assert.match(app, /decideQuickProtect/);
  assert.match(app, /Capacitor\?\.Plugins\?\.QuickProtect/);
});
```

- [ ] **Step 7: Esegui tutta la suite**

Run: `node --test tests/*.test.mjs`
Expected: PASS — tutti i test verdi, incluso quello nuovo.

- [ ] **Step 8: Commit**

```bash
git add src/app.mjs src/locales/it.mjs src/locales/en.mjs tests/ui.test.mjs
git commit -m "Aggiunge l'orchestrazione headless del riquadro Proteggi appunti

Quando l'app parte con window.__privaiQuickProtect valorizzato (dal
prossimo QuickProtectActivity nativo), salta l'interfaccia normale,
decide con decideQuickProtect(), scrive gli appunti, eventualmente
salva il lavoro, e chiama il plugin nativo per il Toast e la chiusura."
```

---

### Task 3: Componenti nativi Android

**Files:**
- Create: `android/app/src/main/java/app/privai/pocket/QuickProtectPlugin.java`
- Create: `android/app/src/main/java/app/privai/pocket/QuickProtectActivity.java`
- Create: `android/app/src/main/java/app/privai/pocket/QuickProtectTileService.java`
- Create: `android/app/src/main/res/drawable/ic_quick_protect.xml`
- Modify: `android/app/src/main/res/values/styles.xml`
- Modify: `android/app/src/main/res/values/strings.xml`
- Modify: `android/app/src/main/AndroidManifest.xml`
- Test: `tests/pwa.test.mjs` (una guardia leggera sul manifest, non sostituisce la compilazione)

**Interfaces:**
- Consumes: nessuna dipendenza da codice scritto in questa sessione oltre al fatto che `index.html`/`app.mjs` sanno reagire a `window.__privaiQuickProtect` (Task 2).
- Produces: il plugin Capacitor `QuickProtect` con i metodi `toast({message: string})` e `finish()`, richiamati da `runQuickProtect()` (Task 2). Il tile compare nel pannello Impostazioni Rapide col nome `QuickProtectTileService`.

> Nota per chi implementa: nessun SDK Android/Gradle in questo ambiente. Scrivi il codice completo e corretto — la compilazione e la prova su device restano per dopo il prossimo APK, come per gli altri tre plugin nativi già in `HANDOFF.md` §8.

- [ ] **Step 1: Icona del riquadro**

Crea `android/app/src/main/res/drawable/ic_quick_protect.xml` (stesso lucchetto usato nel web, `lock` in `src/icons.mjs`, convertito in path Android):

```xml
<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FF000000"
        android:pathData="M5,11 H19 A2,2 0 0 1 21,13 V20 A2,2 0 0 1 19,22 H5 A2,2 0 0 1 3,20 V13 A2,2 0 0 1 5,11 Z" />
    <path
        android:fillColor="#00000000"
        android:strokeColor="#FF000000"
        android:strokeWidth="2"
        android:strokeLineCap="round"
        android:pathData="M7,11 V7 A5,5 0 0 1 17,7 V11" />
</vector>
```

- [ ] **Step 2: Etichetta del riquadro**

In `android/app/src/main/res/values/strings.xml`, aggiungi dopo `share_target_label`:

```xml
    <!-- Nome del riquadro nelle Impostazioni Rapide di Android. -->
    <string name="quick_protect_tile_label">Proteggi appunti</string>
```

- [ ] **Step 3: Tema invisibile**

In `android/app/src/main/res/values/styles.xml`, aggiungi dopo `AppTheme.NoActionBarLaunch`:

```xml
    <!-- QuickProtectActivity: nessuna schermata, l'utente non deve mai
         vederla comparire. Trasparente, senza ombra, senza animazione. -->
    <style name="AppTheme.QuickProtect" parent="Theme.AppCompat.NoActionBar">
        <item name="android:windowIsTranslucent">true</item>
        <item name="android:windowBackground">@android:color/transparent</item>
        <item name="android:windowContentOverlay">@null</item>
        <item name="android:windowNoTitle">true</item>
        <item name="android:windowIsFloating">true</item>
        <item name="android:backgroundDimEnabled">false</item>
        <item name="android:windowAnimationStyle">@null</item>
    </style>
```

- [ ] **Step 4: Plugin `QuickProtect`**

Crea `android/app/src/main/java/app/privai/pocket/QuickProtectPlugin.java`:

```java
package app.privai.pocket;

import android.widget.Toast;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Il ponte minimo fra app.mjs e QuickProtectActivity: un Toast di conferma
 * (non richiede il permesso delle notifiche, a differenza di una
 * Notification vera) e la chiusura dell'Activity invisibile. La decisione
 * su cosa fare degli appunti resta tutta in JavaScript — qui non c'è
 * nessuna logica di dominio, solo i due effetti che il JS non può fare da
 * solo.
 */
@CapacitorPlugin(name = "QuickProtect")
public class QuickProtectPlugin extends Plugin {

    @PluginMethod
    public void toast(PluginCall call) {
        String message = call.getString("message", "");
        if (!message.isEmpty()) {
            getActivity().runOnUiThread(() ->
                Toast.makeText(getContext(), message, Toast.LENGTH_SHORT).show());
        }
        call.resolve();
    }

    @PluginMethod
    public void finish(PluginCall call) {
        call.resolve();
        getActivity().finish();
    }
}
```

- [ ] **Step 5: Activity invisibile**

Crea `android/app/src/main/java/app/privai/pocket/QuickProtectActivity.java`:

```java
package app.privai.pocket;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

/**
 * Host invisibile per il riquadro "Proteggi appunti": nessuna schermata,
 * tema Theme.AppCompat.QuickProtect dichiarato nel manifest. Carica la
 * stessa WebView/bridge dell'app e deposita window.__privaiQuickProtect
 * prima che app.mjs decida cosa disegnare — stesso meccanismo già usato da
 * ShareTargetPlugin per l'avvio a freddo della condivisione (vedi
 * ShareTargetPlugin.deliver()): il deposito arriva mentre lo script del
 * modulo principale è ancora in coda, non dopo.
 *
 * Si chiude da sola tramite QuickProtectPlugin.finish(), mai restando
 * aperta più di quanto serve a decidere cosa fare degli appunti.
 */
public class QuickProtectActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SecureStorePlugin.class);
        registerPlugin(QuickProtectPlugin.class);
        super.onCreate(savedInstanceState);
        getBridge().getWebView().post(() -> getBridge().getWebView()
            .evaluateJavascript("window.__privaiQuickProtect=true;", null));
    }
}
```

- [ ] **Step 6: Il tile**

Crea `android/app/src/main/java/app/privai/pocket/QuickProtectTileService.java`:

```java
package app.privai.pocket;

import android.app.PendingIntent;
import android.content.Intent;
import android.os.Build;
import android.service.quicksettings.Tile;
import android.service.quicksettings.TileService;

/**
 * Il riquadro "Proteggi appunti" nelle Impostazioni Rapide. Non ha uno
 * stato acceso/spento: è un'azione istantanea, resta sempre INACTIVE.
 * Ogni tocco apre QuickProtectActivity, che decide da sola se mascherare o
 * ripristinare gli appunti e si chiude senza mai mostrarsi.
 */
public class QuickProtectTileService extends TileService {

    @Override
    public void onStartListening() {
        super.onStartListening();
        Tile tile = getQsTile();
        if (tile == null) return;
        tile.setState(Tile.STATE_INACTIVE);
        tile.updateTile();
    }

    @Override
    public void onClick() {
        super.onClick();
        Intent intent = new Intent(this, QuickProtectActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startActivityAndCollapse(PendingIntent.getActivity(
                this, 0, intent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));
        } else {
            startActivityLegacy(intent);
        }
    }

    // API precedenti alla 34: startActivityAndCollapse(Intent) è deprecato
    // ma è l'unica firma disponibile prima del PendingIntent.
    @SuppressWarnings("deprecation")
    private void startActivityLegacy(Intent intent) {
        startActivityAndCollapse(intent);
    }
}
```

- [ ] **Step 7: Manifest**

In `android/app/src/main/AndroidManifest.xml`, aggiungi subito dopo il tag di chiusura `</activity>` di `MainActivity` (prima di `<provider`):

```xml
        <!-- ▼▼▼ AGGIUNTO ▼▼▼ -->
        <!-- Host invisibile del riquadro "Proteggi appunti": nessuna
             intent-filter, si avvia solo dal tile della stessa app. -->
        <activity
            android:name=".QuickProtectActivity"
            android:theme="@style/AppTheme.QuickProtect"
            android:excludeFromRecents="true"
            android:noHistory="true"
            android:taskAffinity=""
            android:exported="false" />
        <!-- ▲▲▲ AGGIUNTO ▲▲▲ -->
```

E, subito dopo il tag di chiusura `</provider>` (ancora dentro `<application>`):

```xml

        <!-- ▼▼▼ AGGIUNTO ▼▼▼ -->
        <!-- Il riquadro nel pannello Impostazioni Rapide di Android. -->
        <service
            android:name=".QuickProtectTileService"
            android:icon="@drawable/ic_quick_protect"
            android:label="@string/quick_protect_tile_label"
            android:permission="android.permission.BIND_QUICK_SETTINGS_TILE"
            android:exported="true">
            <intent-filter>
                <action android:name="android.service.quicksettings.action.QS_TILE" />
            </intent-filter>
        </service>
        <!-- ▲▲▲ AGGIUNTO ▲▲▲ -->
```

- [ ] **Step 8: Guardia leggera sul manifest**

Non sostituisce Gradle, ma impedisce refusi silenziosi (nome di classe sbagliato, permesso dimenticato). `tests/pwa.test.mjs` importa già `readFile` in cima al file: usa quello, non reimportarlo. Aggiungi in fondo al file:

```js
test('il manifest Android dichiara il tile e la sua activity invisibile', async () => {
  const manifest = await readFile(new URL('../android/app/src/main/AndroidManifest.xml', import.meta.url), 'utf8');
  assert.match(manifest, /android:name="\.QuickProtectTileService"/);
  assert.match(manifest, /android:permission="android\.permission\.BIND_QUICK_SETTINGS_TILE"/);
  assert.match(manifest, /android\.service\.quicksettings\.action\.QS_TILE/);
  assert.match(manifest, /android:name="\.QuickProtectActivity"/);
  assert.match(manifest, /android:theme="@style\/AppTheme\.QuickProtect"/);
});
```

- [ ] **Step 9: Esegui la suite JS**

Run: `node --test tests/*.test.mjs`
Expected: PASS — tutti i test verdi, incluso quello nuovo sul manifest. (Il codice Java non viene compilato qui: nessun test lo copre finché non c'è un APK reale.)

- [ ] **Step 10: Commit**

```bash
git add android/app/src/main/java/app/privai/pocket/QuickProtectPlugin.java \
        android/app/src/main/java/app/privai/pocket/QuickProtectActivity.java \
        android/app/src/main/java/app/privai/pocket/QuickProtectTileService.java \
        android/app/src/main/res/drawable/ic_quick_protect.xml \
        android/app/src/main/res/values/styles.xml \
        android/app/src/main/res/values/strings.xml \
        android/app/src/main/AndroidManifest.xml \
        tests/pwa.test.mjs
git commit -m "Aggiunge il riquadro Impostazioni Rapide 'Proteggi appunti' (nativo)

Tile + Activity invisibile (Theme.Translucent) + plugin Capacitor
minimo (Toast + chiusura). Nessuna logica di rilevamento in nativo:
carica la stessa WebView/bridge dell'app e lascia decidere app.mjs.
Non compilato in questo ambiente (nessun SDK Android) — da provare sul
prossimo APK."
```

---

### Task 4: Aggiorna HANDOFF.md

**Files:**
- Modify: `HANDOFF.md`

**Interfaces:**
- Consumes: nulla dal codice — è solo documentazione.
- Produces: nulla che altri task consumino.

- [ ] **Step 1: Segna lo stato del punto 5 della roadmap**

In `HANDOFF.md`, trova la riga:

```
5. **Riquadro nelle impostazioni rapide di Android** («Proteggi gli appunti»): copi qualcosa, scendi la tendina, tocchi — protetto senza aprire l'app. È il salto da «un'altra app» a «un riflesso».
```

Sostituiscila con:

```
5. **Riquadro nelle impostazioni rapide di Android** («Proteggi gli appunti»): copi qualcosa, scendi la tendina, tocchi — protetto senza aprire l'app. È il salto da «un'altra app» a «un riflesso». → **scritto**: `QuickProtectTileService.java` + `QuickProtectActivity.java` (invisibile, `Theme.Translucent`) + `QuickProtectPlugin.java`, orchestrato da `runQuickProtect()` in `app.mjs` e dalla decisione pura in `src/domain/quickProtect.mjs` (bidirezionale: maschera testo nuovo, ripristina risposte IA già note). Specifica in `docs/superpowers/specs/2026-08-27-quick-settings-tile-design.md`. **Non ancora compilato né provato su device** — nessun SDK Android in questa sessione.
```

- [ ] **Step 2: Commit**

```bash
git add HANDOFF.md
git commit -m "Aggiorna HANDOFF: riquadro Proteggi appunti scritto, non ancora provato"
```
