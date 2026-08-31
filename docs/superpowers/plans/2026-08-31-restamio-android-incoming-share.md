# Android Incoming Share Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ricevere documenti e immagini condivisi verso RestaMio su Android, conservarli soltanto in cache privata e portarli nel flusso locale appropriato.

**Architecture:** Un plugin Capacitor Android possiede gli `Intent` e copia il contenuto `content://` nella cache privata con un limite rigido. Il livello web riceve soltanto metadati e byte richiesti esplicitamente, distingue documento e immagine e mantiene invariato il flusso testuale esistente. L’OCR resta un task successivo e consuma la stessa porta, senza inviare immagini in rete.

**Tech Stack:** Java Android/Capacitor 8, JavaScript ESM, Node test runner, Gradle/JDK 21.

**Spec:** `docs/product/RestaMio_UI_UX_Spec.md`, sezione flusso file/immagini; `docs/product/RestaMio_Project_Handoff.md`.

## Global Constraints

- Android viene completato prima di desktop e iOS.
- Nessun contenuto personale nei log, nei test o in rete.
- Accettare soltanto `ACTION_SEND` con un singolo elemento; niente `ACTION_SEND_MULTIPLE` nella prima iterazione.
- Tipi ammessi: PDF, testo, Markdown e immagini supportate dall’OCR locale.
- Limite iniziale: 20 MiB; rifiuto prima della copia quando la dimensione dichiarata lo supera e durante la copia se la supera realmente.
- Poppins locale, `#F4511E`, safe area e mockup approvati restano vincolanti.
- Nessuna nuova dipendenza JavaScript; usare API Android e Capacitor esistenti.

---

### Task 1: Contratto e filtro degli Intent

**Files:**
- Create: `android/app/src/main/java/app/privai/pocket/IncomingShare.java`
- Create: `android/app/src/test/java/app/privai/pocket/IncomingShareTest.java`
- Modify: `android/app/src/main/AndroidManifest.xml`

**Interfaces:**
- Produces: `IncomingShare.classify(String mimeType, String fileName)` → `DOCUMENT`, `IMAGE`, `UNSUPPORTED`.
- Produces: intent filter `ACTION_SEND` con `text/plain`, `application/pdf`, `image/*`.

- [ ] Scrivere test JUnit per PDF, TXT, MD, PNG/JPEG e tipo sconosciuto.
- [ ] Eseguire `gradlew testOwnerDebugUnitTest` e verificare il fallimento per classe assente.
- [ ] Implementare enum e classificazione pura senza dipendenze Android.
- [ ] Aggiungere gli intent filter senza permessi di archiviazione.
- [ ] Rieseguire test unitari Android e `npm test`.

### Task 2: Plugin Capacitor e cache privata

**Files:**
- Create: `android/app/src/main/java/app/privai/pocket/RestaMioSharePlugin.java`
- Modify: `android/app/src/main/java/app/privai/pocket/MainActivity.java`
- Create: `src/platform/android-incoming-share.mjs`
- Create: `tests/android-incoming-share.test.mjs`

**Interfaces:**
- Native event: `incomingShare` con `{ kind, mimeType, name, size, cacheId }`.
- Plugin method: `read({ cacheId })` → `{ base64 }`; `discard({ cacheId })` → `void`.
- Web port: `createAndroidIncomingShare(plugin)` con `addListener`, `read`, `discard`.

- [ ] Scrivere test della porta web per delega e normalizzazione metadati.
- [ ] Verificare RED per modulo assente.
- [ ] Implementare la porta minima.
- [ ] Implementare copia con `ContentResolver`, nome sicuro generato dall’app e limite 20 MiB.
- [ ] Registrare il plugin e gestire sia intent iniziale sia `onNewIntent`.
- [ ] Verificare GREEN con test web e build Java.

### Task 3: Stato UI specifico per tipo

**Files:**
- Create: `src/ui/screens/incoming-processing.mjs`
- Create: `tests/incoming-processing-screen.test.mjs`
- Modify: `src/app.mjs`
- Modify: `src/ui/styles/screens.css`

**Interfaces:**
- `renderIncomingProcessing({ kind, name, progress, error })` usa copy e simbolo specifici per documento o immagine.

- [ ] Scrivere test per copy distinti e nessuna schermata generica `Scegli il tipo`.
- [ ] Verificare RED.
- [ ] Implementare la schermata usando i mockup `animazione condivisione documento.png` e `animazione condivisione screenshot.png`.
- [ ] Collegare l’evento nativo al router senza bottom navigation.
- [ ] Verificare GREEN e viewport 373×768 con Riduci movimento.

### Task 4: Documento condiviso nel flusso testuale

**Files:**
- Modify: `src/application/content-import.mjs`
- Create: `tests/incoming-document.test.mjs`
- Modify: `src/app.mjs`

**Interfaces:**
- `readImportedBytes({ name, mimeType, bytes })` riusa estrazione TXT/Markdown/PDF locale e restituisce testo.

- [ ] Scrivere test con byte TXT/Markdown/PDF e file vuoto/non supportato.
- [ ] Verificare RED.
- [ ] Implementare adattatore byte senza duplicare il parser PDF.
- [ ] Aprire `Il tuo contenuto` con testo modificabile e rilevamento live già attivo.
- [ ] Eliminare sempre la copia in cache dopo successo o errore gestito.
- [ ] Verificare GREEN e annullamento senza perdita dello stato precedente.

### Task 5: Checkpoint e sicurezza

**Files:**
- Modify: `tests/capacitor.test.mjs`
- Modify: `nuovo look/confronti/2026-08-31-implementazione-onboarding-home-input.md` (backup locale esterno al repository)

- [ ] Testare manifest esportato, assenza permessi storage e limite dimensione.
- [ ] Eseguire `npm test` e `gradlew testOwnerDebugUnitTest`.
- [ ] Eseguire `npm run build:web:owner`, `npx cap sync android`, `gradlew assembleOwnerDebug`.
- [ ] Verificare application ID, label, backup disabilitato, firma debug e SHA-256.
- [ ] Verificare su Samsung con condivisione PDF/TXT/PNG reale prima di iniziare OCR.
