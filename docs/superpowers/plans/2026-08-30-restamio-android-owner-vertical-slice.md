# RestaMio Android Owner APK Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Creare il primo APK Android RestaMio installabile direttamente, con Pro proprietario attivo e il flusso testuale completo: onboarding, Home, protezione, invio all’AI, lavoro in sospeso, ripristino e Cassaforte.

**Architecture:** Conservare Capacitor 8 e i moduli ES esistenti, separando progressivamente dominio, persistenza e schermate. La build Owner usa un application ID distinto e un entitlement di compilazione; i lavori contenenti corrispondenze PII vengono cifrati mediante Android Keystore.

**Tech Stack:** HTML, CSS, JavaScript ES modules, Node test runner, Capacitor 8, Android/Kotlin, Gradle.

**Spec:** `docs/product/RestaMio_UI_UX_Spec.md`, `docs/product/RestaMio_Project_Handoff.md`, `docs/superpowers/specs/2026-08-30-restamio-platform-monetization-design.md`

## Global Constraints

- Android prima di iOS; APK diretto prima degli store.
- `main` non viene modificato durante lo sviluppo.
- Build Owner: `app.restamio.owner`, Pro sempre attivo, billing assente.
- Brand: `RestaMio`, colore primario esatto `#F4511E`.
- Protezione e ripristino manuali restano illimitati.
- Nessun account, backend, analytics, pubblicità o pagamento in questa milestone.
- Dati, mapping e lavori restano locali; nessun PII nei log.
- CTA e navigazione rispettano safe area, IME e barre Samsung.
- Ogni funzione di rete futura passa una verifica aggiornata delle policy ufficiali Apple App Store e Google Play prima della pubblicazione.
- Il browser sicuro è una funzione Avanzata opt-in: nessun salvataggio password, archivio web temporaneo, reset automatico e informativa prima dell’uso.
- OCR, Groq, condivisione nativa in ingresso, desktop e iOS seguono in milestone indipendenti dopo il vertical slice.

---

### Task 1: Build Owner e rebranding verificabile

**Files:**
- Create: `src/config/build.mjs`
- Create: `tests/build-config.test.mjs`
- Modify: `package.json`, `scripts/build-web.mjs`, `capacitor.config.json`
- Modify: `android/app/build.gradle`, `android/app/src/main/res/values/strings.xml`
- Modify: `manifest.webmanifest`, `sw.js`

- [x] Scrivere test che verifichino `owner -> entitlement owner`, billing sempre falso e rigetto dei canali sconosciuti.
- [x] Eseguire il test e verificare il fallimento iniziale.
- [x] Implementare `readBuildConfig(meta)` con canali `owner`, `beta`, `production`.
- [x] Aggiungere `build:web:owner` e `android:owner`.
- [x] Aggiungere flavor Gradle Owner con ID `app.restamio.owner` e label `RestaMio Owner`.
- [x] Aggiornare brand, manifest e cache senza modificare ancora il flusso.
- [x] Eseguire `npm test` e commit.

### Task 2: Modello persistente del lavoro

**Files:**
- Create: `src/domain/job.mjs`, `tests/job.test.mjs`
- Modify: `src/domain/workflow.mjs`, `tests/workflow.test.mjs`

- [x] Testare gli stati `draft`, `reviewing`, `protected`, `awaiting_ai`, `restored`, `almost_ready`.
- [x] Testare serializzazione, parsing e transizioni non valide.
- [x] Implementare modello versione 1 e tabella esplicita delle transizioni.
- [x] Eseguire test e commit.

### Task 3: Cassaforte cifrata Android

**Files:**
- Create: `src/platform/vault-port.mjs`, `src/platform/android-vault.mjs`
- Create: `android/app/src/main/java/app/restamio/mobile/RestaMioVaultPlugin.kt`
- Create: `android/app/src/androidTest/java/app/restamio/mobile/RestaMioVaultPluginTest.kt`
- Modify: `src/domain/storage.mjs`, `tests/storage.test.mjs`, Android manifest/activity.

- [x] Definire contratto `list/read/write/remove/clear` e testarlo con adapter in memoria.
- [x] Implementare fallback web solo in `sessionStorage`.
- [x] Implementare AES/GCM con chiave non esportabile in Android Keystore.
- [x] Salvare solo cifrato in SharedPreferences private e mantenere backup disabilitato.
- [ ] Verificare con test strumentali che il testo originale non compaia nello storage grezzo.
- [ ] Eseguire test e commit.

### Task 4: Nuova base UI, safe area e navigazione

**Files:**
- Create: `src/ui/router.mjs`, `src/ui/render.mjs`, `tests/router.test.mjs`
- Create: `src/ui/styles/tokens.css`, `base.css`, `components.css`, `screens.css`
- Modify: `index.html`, `styles.css`, `src/app.mjs`, `scripts/build-web.mjs`

- [x] Testare stack di navigazione, back prevedibile, conservazione stato e focus sul titolo.
- [x] Introdurre token semantici e `--color-brand: #F4511E`.
- [x] Sostituire l’HTML monolitico con un application shell semantico.
- [x] Implementare inset inferiori con `env(safe-area-inset-bottom)` e contenuto non nascosto da CTA fisse.
- [x] Eseguire test/build e commit.

### Task 5: Onboarding, Home e Cassaforte

**Files:**
- Create: `src/ui/screens/onboarding.mjs`, `home.mjs`, `vault.mjs`
- Create: `tests/home-screen.test.mjs`
- Modify: locali IT/EN e composition root.

- [x] Testare Home vuota, un lavoro, più lavori, errore locale e attesa risposta AI.
- [x] Implementare onboarding Willy in tre passaggi secondo la specifica.
- [x] Implementare Home approvata con badge Pro nella build Owner.
- [x] Implementare Cassaforte mostrando metadata non sensibili prima dell’apertura.
- [x] Eseguire test e commit.

### Task 6: Flusso testuale completo

**Files:**
- Create: `src/application/job-service.mjs`
- Create: schermate `content-input`, `findings`, `action-choice`, `final-check`, `awaiting-response`, `restored-result`.
- Create: `tests/job-service.test.mjs`
- Modify: `src/domain/pii.mjs`, `tests/pii.test.mjs`, composition root.

- [x] Migrare i nuovi placeholder a `[[RESTAMIO_<scope>_<type>_<n>]]` preservando il ripristino dei job legacy.
- [x] Raggruppare valori duplicati e occorrenze per categoria.
- [x] Testare un lavoro protetto, persistito, riaperto dopo riavvio e ripristinato.
- [x] Implementare le schermate §14–§17 della specifica con copia esatta.
- [x] Persistire `awaiting_ai` prima di uscire verso il menu di condivisione.
- [x] Implementare risultato completo e `Testo quasi pronto` senza inventare sostituzioni.
- [x] Eseguire `npm test` e commit.

### Task 7: APK e accettazione sul telefono

**Files:**
- Create: `docs/testing/android-owner-apk-checklist.md`
- Modify: `README.md`

- [ ] Eseguire `npm ci`, test, build web Owner, lint e `assembleOwnerDebug`.
- [ ] Verificare application ID, label, backup disabilitato e SHA-256 APK.
- [ ] Installare via ADB senza store.
- [ ] Testare su Samsung: tre pulsanti, gesture, font 130%, tastiera, force-stop/ripresa lavoro, offline e reduced motion.
- [ ] Registrare esito senza usare dati personali reali e commit.

## Milestone successive

1. Motore PII locale per nomi, cognomi, indirizzi, organizzazioni e parole personali.
2. Ricezione nativa Android di testo, documenti, immagini e audio.
3. OCR locale e flusso adattivo immagini/documenti.
4. Groq BYOK per audio WhatsApp/Telegram.
5. Desktop pairing.
6. Limiti beta Free/Pro, Creator Partner, pubblicazione e porting iOS.
7. Browser sicuro opt-in con allowlist dei provider, sessione temporanea, reset automatico e test di isolamento.
8. Compliance gate Store: privacy disclosure, Data Safety/App Privacy, permessi minimi, billing, WebView/WKWebView e cancellazione dati.
