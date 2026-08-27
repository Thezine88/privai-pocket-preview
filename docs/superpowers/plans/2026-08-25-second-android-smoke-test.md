# Second Android Smoke Test Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correggere gli esiti del primo smoke test e produrre un solo nuovo APK quando interfaccia, condivisione in uscita e template sono verificati.

**Architecture:** La PWA mantiene i flussi applicativi. Android gestisce gli inset di sistema e due intent distinti: condivisione generica e invio alle app IA installate. I template restano locali e deterministici; nessuna API o rete viene introdotta.

**Tech Stack:** Capacitor 8.5.0, Android Java/API 24–36, JavaScript ES modules, Node test runner, HTML/CSS.

**Spec:** `HANDOFF.md`, sezione “Incremento approvato prima del secondo APK”.

## Global Constraints

- Nessun server, relay, Firebase, Drive, analytics o API reale.
- Nessun costo operativo e nessun larger runner.
- Non promettere anonimizzazione garantita.
- Originali e mapping restano sul telefono.
- Non implementare ancora Share Target in ingresso, vault, OCR o voce.
- Non generare un nuovo APK finché tutti i gate della Task 5 non sono verdi.

---

### Task 1: Barre di sistema Android

**Files:**
- Modify: `android/app/src/main/java/app/privai/pocket/MainActivity.java`
- Test: `tests/capacitor.test.mjs`

**Interfaces:**
- Produces: contenuto nativo inset da `systemBars()` e `displayCutout()`.

- [x] **Step 1: Scrivere il test fallente** per padding sui quattro inset e icone di sistema scure.
- [x] **Step 2: Verificare RED** con `node --test tests/capacitor.test.mjs`.
- [x] **Step 3: Applicare gli inset con `WindowInsetsCompat`** senza dipendenze nuove.
- [x] **Step 4: Verificare GREEN** con la suite completa: 69 test, 0 fallimenti.
- [x] **Step 5: Commit** `fix(android): respect system bar insets` (`e0a93e0`).

### Task 2: Template realmente specializzati

**Files:**
- Modify: `src/domain/markdown.mjs`
- Modify: `src/app.mjs`
- Modify: `src/locales/it.mjs`
- Modify: `src/locales/en.mjs`
- Test: `tests/markdown.test.mjs`
- Test: `tests/i18n.test.mjs`

**Interfaces:**
- Extend: `buildPromptPack({ template, goal, constraints, content, outputLanguage })`.
- Template values: `email`, `post`, `summary`, `checklist`.

- [x] **Step 1: Scrivere quattro test fallenti** che richiedano output diversi:
  - Email: oggetto, corpo, tono professionale, richiesta finale e nessun fatto inventato.
  - Post: apertura, corpo, CTA e hashtag soltanto se utili.
  - Riassunto: punti principali, nomi/date, decisioni e informazioni incerte separate.
  - Checklist: azione, responsabile, scadenza, priorità e dipendenze; campi assenti segnalati.
- [x] **Step 2: Verificare RED** con `node --test tests/markdown.test.mjs tests/i18n.test.mjs`.
- [x] **Step 3: Implementare il minimo** aggiungendo le istruzioni del template selezionato al pacchetto Markdown; lasciare `Personalizza` facoltativo e chiuso.
- [x] **Step 4: Verificare GREEN** e controllare che ogni template mantenga integralmente il contenuto sorgente.
- [ ] **Step 5: Commit** `feat(prepare): add complete local templates`.

### Task 3: Azioni di uscita distinte su Android

**Files:**
- Create: `android/app/src/main/java/app/privai/pocket/OutboundSharePlugin.java`
- Modify: `android/app/src/main/java/app/privai/pocket/MainActivity.java`
- Modify: `android/app/src/main/AndroidManifest.xml`
- Create: `src/domain/outbound-share.mjs`
- Modify: `src/app.mjs`
- Test: `tests/share.test.mjs`
- Test: `tests/capacitor.test.mjs`

**Interfaces:**
- Native: `OutboundShare.share({ text, title })`.
- Native: `OutboundShare.shareWithAI({ text, title })`.
- Web adapter: `shareAnywhere(text, title)` and `shareWithInstalledAI(text, title)`.

- [ ] **Step 1: Scrivere test fallenti** che separino copia, condivisione generica e IA e impediscano che `Invia all’IA` usi `data-share-result`.
- [ ] **Step 2: Verificare RED** con `node --test tests/share.test.mjs tests/capacitor.test.mjs tests/ui.test.mjs`.
- [ ] **Step 3: Implementare `share`** con `ACTION_SEND`, MIME `text/plain` e chooser Android nativo.
- [ ] **Step 4: Implementare `shareWithAI`** limitando il chooser alle app installate note: ChatGPT (`com.openai.chatgpt`), Claude (`com.anthropic.claude`), Gemini (`com.google.android.apps.bard`), Copilot (`com.microsoft.copilot`) e Perplexity (`ai.perplexity.app.android`); se nessuna è presente, aprire il chooser generico con messaggio trasparente.
- [ ] **Step 5: Non scrivere testo, package o intent nei log** e non persistere il payload.
- [ ] **Step 6: Verificare GREEN** e mantenere `navigator.share` soltanto come fallback web/PWA.
- [ ] **Step 7: Commit** `feat(android): separate copy share and AI actions`.

### Task 4: Riduzione del carico visivo

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `src/app.mjs`
- Modify: `src/locales/it.mjs`
- Modify: `src/locales/en.mjs`
- Test: `tests/ui.test.mjs`

**Interfaces:**
- Input visible choices: Email, Post, Riassunto, Checklist.
- Result primary action: `Scegli un’IA`.
- Result secondary actions: `Copia`, `Condividi`.

- [ ] **Step 1: Scrivere test fallenti** per una sola intestazione risultato, azione IA primaria, due azioni secondarie e opzioni avanzate chiuse.
- [ ] **Step 2: Verificare RED** con `node --test tests/ui.test.mjs`.
- [ ] **Step 3: Semplificare l’inserimento** a titolo, quattro scelte, contenuto, obiettivo breve, `Prepara` e `Opzioni` chiuso.
- [ ] **Step 4: Semplificare il risultato** a titolo `Pronto`, anteprima, `Scegli un’IA`, `Copia`, `Condividi` e link discreto `Modifica`.
- [ ] **Step 5: Eliminare ripetizioni** come doppio “Pronto per l’IA” e tre pulsanti compressi nell’intestazione della card.
- [ ] **Step 6: Applicare il linguaggio visivo approvato** senza nuove dipendenze: superfici rialzate soltanto per elementi toccabili, campi leggermente incassati, contenuti leggibili quasi piatti, un'unica azione arancione dominante e feedback di pressione discreto.
- [ ] **Step 7: Ridurre ombre e bagliori decorativi** dove non comunicano interazione; usare spaziatura e raggruppamento per la gerarchia.
- [ ] **Step 8: Verificare a 360, 390, 430 e 680 px**, in orientamento verticale e orizzontale, senza testo o azioni sotto la barra fissa.
- [ ] **Step 9: Verificare italiano/inglese, testo grande e `prefers-reduced-motion`**.
- [ ] **Step 10: Presentare l’anteprima all’utente e attendere approvazione** prima del merge.
- [ ] **Step 11: Commit** `refactor(ui): simplify prepare and result flows`.

### Task 4b: Onboarding di Willy al primo avvio

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `src/app.mjs`
- Modify: `src/locales/it.mjs`
- Modify: `src/locales/en.mjs`
- Add: quattro immagini trasparenti ottimizzate in `assets/`
- Test: `tests/ui.test.mjs`
- Test: `tests/i18n.test.mjs`

**Interfaces:**
- Persistenza locale: flag di completamento per la singola installazione.
- Interazione: tap in area libera avanza; `Salta` chiude; `Partiamo!` chiude dall'ultima schermata.

- [ ] **Step 1: Scrivere test fallenti** per primo avvio, avanzamento, skip, completamento persistente e possibilità di riapertura dalle impostazioni.
- [ ] **Step 2: Verificare RED** con `node --test tests/ui.test.mjs tests/i18n.test.mjs`.
- [ ] **Step 3: Integrare il minimo onboarding a quattro schermate** con il testo definitivo registrato in `HANDOFF.md`.
- [ ] **Step 4: Integrare le quattro pose approvate di Willy** come immagini trasparenti responsive, senza video o librerie di animazione.
- [ ] **Step 5: Implementare dissolvenza e lieve galleggiamento in CSS**, disabilitati con `prefers-reduced-motion`.
- [ ] **Step 6: Rendere `Salta`, indicatori e `Partiamo!` accessibili**, con target di tocco di almeno 44×44 px e focus visibile.
- [ ] **Step 7: Verificare GREEN**, primo avvio per installazione, riapertura dalle impostazioni, safe area e assenza di rete.
- [ ] **Step 8: Commit** `feat(onboarding): introduce Willy before the chatbot flow`.

### Task 5: Gate unico prima del secondo APK

**Files:**
- Modify: `HANDOFF.md`
- Modify: versioni cache in `sw.js`, `index.html` e import versionati soltanto dopo approvazione UI.

- [ ] **Step 1: Eseguire** `node --test tests/*.test.mjs`; atteso: 0 fallimenti.
- [ ] **Step 2: Eseguire** `npm run build:web`; atteso: bundle locale completo.
- [ ] **Step 3: Eseguire `checkPackageSafety('www')`**; atteso: `[]`.
- [ ] **Step 4: Eseguire** `npm run android:sync`; atteso: sync riuscito.
- [ ] **Step 5: Controllare il diff**: nessun Share Target in ingresso, API, segreto, relay, pagamento o nuova dipendenza non necessaria.
- [ ] **Step 6: Pubblicare e approvare la PR** soltanto dopo l’anteprima UI.
- [ ] **Step 7: Avviare una sola volta** il workflow manuale `Android debug APK` su `ubuntu-latest`.
- [ ] **Step 8: Registrare commit, run, dimensione e SHA-256** dell’APK.
- [ ] **Step 9: Smoke test reale** su navigazione a tre tasti e gesti, Copia, chooser Condividi e chooser IA installate.

## Fuori da questo incremento

- Share Target Android in ingresso da Archivio/Files.
- Vault persistente Keystore/AES-GCM.
- Revisione manuale e ricevuta privacy.
- OCR e voce.
- Desktop QR, relay, Drive, pagamenti e API reali.

La modalità voce sarà progettata in seguito come: Parla → trascrivi localmente quando disponibile → revisiona → proteggi → condividi. Prima dell’implementazione va confrontata con utenti reali e deve dichiarare quando il riconoscimento di sistema usa la rete.
