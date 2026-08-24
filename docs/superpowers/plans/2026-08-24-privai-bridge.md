# PrivAI Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collegare telefono e browser desktop mantenendo mapping e dati originali sul telefono.

**Architecture:** Android custodisce mapping e chiavi; il desktop riceve solo documenti protetti. Un relay temporaneo trasporta buste cifrate end-to-end e viene implementato solo dopo i gate nativi.

**Tech Stack:** Capacitor 8, Android/Kotlin, Android Keystore, Web Crypto API, TypeScript, test Node e Android.

**Spec:** `docs/specs/2026-08-24-privai-bridge-security-spec.md`

## Global Constraints

- Nessun originale o mapping lascia il telefono nel flusso predefinito.
- Nessun segreto o contenuto in sorgenti, URL, log o analytics.
- Relay con sole buste cifrate e TTL massimo 24 ore.
- Risultato completo al computer solo dopo conferma separata.
- Android minimo API 24 e target API 36.

---

### Task 1: Vault nativo Android

**Files:** Create `android/app/src/main/java/app/privai/pocket/security/MappingVault.kt`; create `android/app/src/test/java/app/privai/pocket/security/MappingVaultTest.kt`; modify `MainActivity.java`.

**Interfaces:** `save(jobId, mappingJson, expiresAt)`, `load(jobId)`, `delete(jobId)`, `deleteExpired(now)`.

- [ ] Scrivere test fallenti per round-trip, job errato, scadenza e cancellazione con cipher/storage iniettabili.
- [ ] Eseguire `cd android && ./gradlew testDebugUnitTest` e verificare il fallimento per classe assente.
- [ ] Implementare AES-GCM con master key alias `privai_mapping_v1`; salvare solo ciphertext, IV, job ID e scadenza.
- [ ] Rieseguire i test e verificare tutti i casi.
- [ ] Commit `feat(android): add encrypted mapping vault`.

### Task 2: Share Target nativo

**Files:** Create `security/ProtectedSharePlugin.kt`; create test instrumented; modify `AndroidManifest.xml` e `src/app.mjs`.

**Interfaces:** evento `protectedShareReceived({text, jobId})`; comando `shareProtected({text, jobId})`.

- [ ] Scrivere test fallente con `ACTION_SEND text/plain` e assenza di contenuto in URL/cache.
- [ ] Eseguire `./gradlew connectedDebugAndroidTest` su dispositivo/emulatore.
- [ ] Implementare intent filter, handoff in memoria e conferma prima del ripristino.
- [ ] Eseguire test Android e `node --test tests/*.test.mjs`.
- [ ] Commit `feat(android): receive protected AI responses`.

### Task 3: Protocollo cifrato

**Files:** Create `src/domain/bridge-crypto.mjs`, `tests/bridge-crypto.test.mjs`, `docs/protocol/privai-bridge-v1.md`.

**Interfaces:** `createDeviceKeyPair`, `createPairingOffer`, `acceptPairingOffer`, `sealEnvelope`, `openEnvelope`.

- [ ] Scrivere test fallenti per scambio, ciphertext alterato, destinatario errato, scadenza e replay.
- [ ] Eseguire il test focalizzato e verificare import assente.
- [ ] Implementare ECDH P-256, HKDF-SHA-256 e AES-GCM autenticando i metadati.
- [ ] Eseguire test focalizzato e suite completa.
- [ ] Commit `feat(bridge): add encrypted envelopes`.

### Task 4: Desktop

**Files:** Create `desktop/index.html`, `desktop/styles.css`, `desktop/app.mjs`, `tests/desktop.test.mjs`.

**Interfaces:** QR pairing, editor solo protetto, `sendProtectedResponse(text, jobId)`.

- [ ] Scrivere test strutturali fallenti per QR, codice conferma, scadenza e disconnessione.
- [ ] Eseguire `node --test tests/desktop.test.mjs`.
- [ ] Implementare shell responsive che non riceve né renderizza mapping.
- [ ] Testare a 1280×800 e 768×1024 e rieseguire la suite.
- [ ] Commit `feat(desktop): add protected workspace`.

### Task 5: Relay temporaneo

**Files:** Create `relay/src/index.ts`, `relay/src/store.ts`, `relay/test/relay.test.ts`, `relay/wrangler.jsonc`.

**Interfaces:** `POST /v1/messages`, `GET /v1/messages/:recipientId`, `DELETE /v1/messages/:messageId`; massimo 2 MB e TTL 24 ore.

- [ ] Scrivere test fallenti per storage opaco, limiti, recupero singolo, cancellazione, rate limit e assenza body nei log.
- [ ] Eseguire `npm test --workspace relay`.
- [ ] Implementare endpoint con firma dispositivo, one-time retrieval e TTL.
- [ ] Eseguire test relay e repository; verificare log senza plaintext.
- [ ] Distribuire solo in beta chiusa con tetto di spesa e commit `feat(relay): add encrypted mailbox`.

### Task 6: Accettazione e Pro

**Files:** Create `tests/bridge-e2e.md`; modify `src/app.mjs`, `index.html`, `HANDOFF.md`.

- [ ] Registrare prove fallenti per primo pairing, computer ricordato/revocato, telefono sospeso, messaggio scaduto e job errato.
- [ ] Implementare gating Pro senza pagamento durante la beta e senza pairing simulato.
- [ ] Eseguire test Android, Node e sei prove su telefono reale e due browser desktop.
- [ ] Far revisionare protocollo, vault e relay; ogni finding high/critical blocca il rilascio.
- [ ] Aggiornare handoff con versioni, costi, prove e rischi; commit `docs: record bridge beta evidence`.
