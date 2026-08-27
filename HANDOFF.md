# PrivAI Pocket — Handoff operativo

**Aggiornato:** 27 agosto 2026
**Repository:** `Thezine88/privai-pocket-preview`
**Ramo di lavoro:** `lavoro-locale-v2` — locale, **mai pushato**, main non toccato
**Fase:** riscrittura architetturale completa (v2) fatta e verificata; APK reale ancora da compilare e provare su telefono.

> **Leggi questo file per intero prima di scrivere codice.** Contiene decisioni di due sessioni diverse: quelle economiche/di naming/di sicurezza (sezioni 1-5) restano valide e non sono state ridiscusse in questa sessione; tutto il resto (sezione 6 in poi) è il lavoro appena fatto.

---

## 1 · Vincolo economico non negoziabile

Il proprietario non vuole sostenere costi operativi o abbonamenti per far funzionare l'app. Ogni proposta deve funzionare senza server obbligatori, API pagate dallo sviluppatore, database cloud a consumo o traffico finanziato dal proprietario.

Ammessi solo: elaborazione/archiviazione locale, librerie gratuite con licenza compatibile, funzioni native del sistema operativo, servizi opzionali pagati dall'utente con una propria chiave (BYOK), costi una tantum/istituzionali per gli store.

ChatGPT Plus e Claude Pro **non sono API**: gli abbonamenti personali non possono finanziare il backend dell'app. Qualunque funzione che generi un costo per richiesta va respinta o sottoposta a una nuova decisione esplicita.

**Coerenza verificata in questa sessione:** tutto il lavoro fatto rispetta il vincolo — nessun server, nessuna API a pagamento, solo Android Keystore/librerie MIT-ISC gratuite.

## 2 · Naming — stato ancora aperto

`PrivAI Pocket` resta **solo il nome operativo**, non approvato come marchio. Nomi già esplorati e scartati per collisioni: `Scudo`, `Mio`, `SoloMio`, `StayMine`, `Scrubit` (collisione diretta con un'app sanitaria attiva e i domini scrubit.com/.ai), più una decina di altri mai approvati (`Den`, `Lair`, `Psst`, `Prima`, `Tana`, `Zac`, `Cloqra`, `Cevyra`, `Pryqo`, `Terviq`, `Veyru`, `RestaTuo`, `RestaMio`, `MioPrima`, `DatiMiei`, `MioScudo`).

Prima di rinominare codice, package Android, repository o materiali grafici: nuova shortlist + verifica formale EUIPO/UIBM (classi 9 e 42), App Store, Google Play, domini, social. **Non è successo altro su questo fronte in questa sessione.**

## 3 · Promessa del prodotto

Non è più «tre strumenti da scegliere» ma **un flusso unico**: condividi un documento → l'app mostra subito cosa nasconde → scegli cosa ti serve (10 tipi di richiesta) → apri in un'IA → torni e ripristini con un tocco.

Formulazione corretta: «controllo locale» e «versione protetta». **Mai** «anonimizzazione garantita», «sicurezza assoluta» o simili — il meccanismo è sostituzione con segnaposto, non crittografia dei contenuti.

**Nota da non perdere:** il tema **non è più forzato al chiaro** come nella v1 (che dichiarava `color-scheme: only light` nel codice). In Impostazioni c'è un selettore **Sistema / Chiaro / Scuro** — l'utente sceglie, l'app non decide per lui. La preferenza è salvata e applicata prima ancora che il CSS venga valutato, senza lampi del tema sbagliato al riavvio. Dettagli tecnici in §6.11 punto 5.

## 4 · Sicurezza richiesta per Android (dalla sessione precedente — ora scritta, non ancora verificata su device)

1. Corrispondenze e chiavi con Android Keystore/AES-GCM → **scritto**: `SecureStorePlugin.java`.
2. Escludere dati/mapping/segreti da URL, log, analytics, backup → rispettato nel codice; da riverificare con uno strumento reale su APK compilato.
3. Share Target Android nativo, senza query string/cache web → **scritto**: `ShareTargetPlugin.java` + `<queries>`/intent-filter nel manifest.
4. Separare ogni lavoro con un id, impedire ripristino incrociato → **fatto**: ogni lavoro in cassaforte ha un id proprio, `combinedMapping()` unisce le mappe solo per riconoscere una risposta, non per confonderle.
5. Cancellazione immediata e scadenza automatica → **fatto**: scadenza scelta dall'utente (1h/1g/7g/per sempre), «Cancella tutto» in Impostazioni.
6. Testare installazione/sospensione/riavvio/cancellazione/condivisione su device reale → **non fatto**, nessun ambiente con SDK Android disponibile in questa sessione.

Malware, root/jailbreak, tastiere compromesse, app destinatarie: fuori dal perimetro di PrivAI, dichiarato esplicitamente.

## 5 · Collegamento desktop via QR — decisione architetturale (invariata)

Nessun relay cloud. Telefono e computer sulla stessa rete (o hotspot dal telefono); il QR contiene solo indirizzo locale + credenziali effimere, mai dati; originali/mapping/chiavi permanenti restano sul telefono; il computer riceve di default solo la versione protetta. Ordine obbligatorio: **APK reale → Keystore → Share Target nativo → threat review → protocollo locale cifrato → desktop QR.**

Documenti vincolanti (precedenti al vincolo di zero costi — dove parlano di relay cloud sono superati da questa sezione): `docs/specs/2026-08-24-privai-bridge-security-spec.md`, `docs/superpowers/plans/2026-08-24-privai-bridge.md`.

**Stato in questa sessione:** l'infrastruttura di accoppiamento (conteggio sessioni, timer, codice a 6 lettere) è scritta in `src/domain/plan.mjs` e funziona nei test; il **canale fra i due dispositivi non esiste ancora** — resta una decisione di prodotto da prendere prima di scrivere altro codice qui.

---

## 6 · Cosa è successo in questa sessione (in ordine)

### 6.1 — Audit della v1 e analisi UX
Analizzata la v1 (estratta dall'APK fornito) su due fronti: un audit strutturato (17 rilievi, 3 bloccanti — mappa dei segnaposto solo in memoria, nessuna condivisione in ingresso, rilevamento senza nomi/indirizzi) e cinque osservazioni dirette dell'utente (icone poco chiare, scroll eccessivo, animazioni di Willy assenti, domande a scelta multipla, transizioni). Report pubblicati come artefatti.

### 6.2 — Riscrittura completa (v2)
Da tre strumenti separati (Converti/Proteggi/Prepara) a un **flusso unico**. Moduli nuovi in `src/domain/`:
- `pii.mjs` — rilevamento a 4 livelli (checksum matematici → rubrica personale → dizionari/struttura → livello debole "forse", sempre deselezionato)
- `vault.mjs` — cassaforte persistente (sopravvive alla chiusura dell'app, a differenza della v1)
- `recipes.mjs` — 10 tipi di richiesta con domande a scelta multipla, sempre preselezionate
- `plan.mjs` — piani (**la protezione non si paga mai**, protetto da un test dedicato)
- `intake.mjs` — condivisione in ingresso/uscita, lettura appunti con ripiego nativo
- `markdown.mjs`, `swipe.mjs` — normalizzazione testo, logica pura dello swipe-per-eliminare

### 6.3 — Rilevamento: da 50% a 97,3%
Confrontato con `rizzo-pii` (modello neurale, licenza dei pesi da verificare prima di un eventuale uso commerciale). Costruito un banco di prova (`tests/banco-di-prova.mjs`, 28 frasi reali) che ha fatto emergere e correggere tre bug veri: titoli con elisione non riconosciuti, un flag regex avido che «mangiava» il testo dopo un IBAN o un titolo, un nome troncato lasciando l'ultima lettera in chiaro. Ora **97,3%, zero falsi positivi**, con soglia minima che fa fallire la build se il rilevamento peggiora.

### 6.4 — Scoperta: il repository era indietro rispetto all'APK
Il repo `Thezine88/privai-pocket-preview` (ultimo commit `953c364`) **non conteneva** `onboarding.mjs`, `outbound-share.mjs`, il plugin `OutboundSharePlugin` nativo, né il blocco `<queries>` nel manifest — tutte cose presenti nell'APK compilato che l'utente ha fornito all'inizio. Quel lavoro esisteva solo dentro il binario, mai committato.

**Decisione presa:** un'unica riconciliazione invece di due lavori separati. Clonato il repo in una cartella locale, creato il ramo `lavoro-locale-v2`, e su quello:
- sostituito l'intero livello web con la v2
- riscritti da zero i tre plugin nativi (il sorgente originale di `OutboundSharePlugin` non era recuperabile, essendo solo nel `.dex` compilato)
- **`SecureStorePlugin.java`**: niente `androidx.security:security-crypto` (è ancora in alpha) — Android Keystore diretto, AES-GCM, IV distinto per ogni valore
- **`ShareTargetPlugin.java`**: gestisce sia l'avvio a freddo (`window.__privaiShared`) sia l'app già aperta (evento `privai:shared`) — coprirne solo uno fa funzionare la condivisione a giorni alterni
- **`MainActivity.java`**: registra i plugin prima di `super.onCreate()`, gestisce sia `onCreate` sia `onNewIntent`
- **`AndroidManifest.xml`**: `<queries>` con i 5 pacchetti IA + 3 intent-filter (`SEND` testo, `SEND` PDF, `PROCESS_TEXT`)

### 6.5 — Riconciliazione della suite di test (non un merge meccanico)
La suite esistente era **un test blindato sulla v1**: verificava ID, colori, testi e il vecchio flusso a tre strumenti. Confronto file per file:
- **tenuti invariati** (moduli identici/compatibili): `greeting`, `share`, `pdf`, `capacitor`, `package-safety`
- **corretto**: `build-web.test.mjs` — bug preesistente (non mio), il controllo di sicurezza sul percorso falliva sempre su Windows (confronto con `${source}/` a barra diritta contro `resolve()` che produce backslash); in CI su Ubuntu restava invisibile
- **ritirati** perché il modulo non esiste più o il test contraddiceva una scelta di prodotto esplicita: `i18n` (pretendeva fallback inglese, contro «l'app parte in italiano»), `markdown`, `pii`, `storage`, `workflow`
- **riscritti da zero** su contratti veri della v2: `ui.test.mjs`, `pwa.test.mjs`

**Stato attuale: 102 test, tutti verdi.** Verificato anche `cap sync android` (sincronizzazione Capacitor vera, eseguita con successo più volte).

### 6.6 — Bug reali trovati usando l'app, non leggendo il codice
1. Titolo del lavoro in cassaforte costruito sul testo **originale**: il nome del cliente finiva in chiaro nell'elenco proprio del lavoro appena protetto — corretto, ora si costruisce sul testo mascherato.
2. Service worker cache-first: dopo un aggiornamento gli utenti sarebbero rimasti bloccati sul codice vecchio — invertito a network-first.
3. `[hidden]` non vinceva sempre: una classe che imposta `display` con la stessa specificità lo annullava se dichiarata prima nel foglio di stile.
4. `navigator.clipboard.readText()` fallisce silenziosamente su Android **proprio al rientro da un'altra app** (documento senza fuoco) — cioè nel momento esatto in cui serve di più. Aggiunto ripiego sul plugin nativo `Clipboard`.
5. `:focus-visible` forzava un `border-radius` di 4px sull'anello di messa a fuoco, indipendentemente dalla forma dell'elemento — su una card arrotondata a 20px creava uno scontro visivo (il «bordo colorato» segnalato dall'utente). Rimosso il raggio forzato.
6. Contrasto sfondo/card in tema scuro: rapporto **1,11** (quasi impercettibile) — misurato, non solo percepito. Portato a 1,28/1,49.

### 6.7 — Il ciclo condivisione → ripristino, misurato e ridotto
Contati i tocchi reali: **3 all'andata, 7-8 al ritorno** (l'asimmetria che fa abbandonare un'app). Costruita una barra di rientro che riconosce — solo se negli appunti ci sono i **nostri** segnaposto — la risposta dell'IA e propone il ripristino con un tocco. Non legge mai gli appunti «alla cieca»: se non c'è nulla di nostro, non se ne accorge nemmeno (verificato con un test dedicato).

### 6.8 — Icone: da glifi Unicode grezzi a Lucide
Trovati 16 glifi Unicode usati come icone (`≡`, `⌕`, `⌂` per «cassaforte con blocco» che sembrava letteralmente una casa). Costruita una libreria condivisa (`src/icons.mjs`); su suggerimento dell'utente, confrontata la resa con **Lucide** (stessa famiglia dietro le icone shadcn) e adottata per **18 icone su 20** — l'ingranaggio disegnato a mano, confrontato fianco a fianco, si leggeva peggio. Licenza ISC/MIT attribuita in `vendor/LUCIDE-LICENSE.txt`, stesso schema già usato per pdf.js e il font. *Non* installato il pacchetto npm `lucide` (richiederebbe un bundler per il tree-shaking, che questo progetto evita di proposito).

### 6.9 — Swipe-per-eliminare sulle richieste recenti
Logica pura testata in `src/domain/swipe.mjs` (soglie di apertura/cancellazione, blocco dell'asse orizzontale/verticale) + collegamento DOM in `app.mjs`. Tre comportamenti verificati: tocco semplice apre la richiesta, swipe parziale rivela «Elimina», swipe deciso (>132px) cancella in un solo gesto.

### 6.10 — Micro-interazioni CSS (Lottie valutato e scartato)
L'utente ha chiesto Lottie; **declinato con motivazione tecnica**: nessun file JSON sorgente disponibile (si esportano da After Effects o si scaricano da repository terzi di provenienza incerta), e un player da 30-40KB per un rimbalzo di 300ms è sproporzionato in una WebView senza bundler. Implementate invece 4 animazioni CSS pure, verificate con `getAnimations()` non a occhio: rimbalzo dell'icona attiva nella tab bar, piccolo scarto sull'icona delle schede di ingresso al tocco, «pop» sulle chip/schede ricetta selezionate, comparsa morbida delle finestre di dialogo. Tutte rispettano già la regola globale `prefers-reduced-motion`.

### 6.11 — Cinque correzioni puntuali dell'interfaccia
1. Testo «a cono» nello stato vuoto (era `text-align:center` su una colonna troppo stretta) → allineato a sinistra dentro un blocco centrato.
2. Il saluto («Mettimi alla prova») andava a capo sotto il razzo invece che sotto «Mettimi» → diviso in due colonne flex (emoji a larghezza fissa + testo).
3. Riordinate le richieste: prime tre **Markdown → Email → Riassumi** (aggiunta «Scrivi in Markdown» come ricetta a sé, era la funzione «Converti» della v1 sparita nella riscrittura), il resto dietro «Altri tipi di richiesta».
4. Icone di ingresso non pertinenti («Incolla un testo» usava l'illustrazione della bacchetta magica) → icone Lucide dedicate; rinominato in **«Scrivi un testo»** (il campo accetta anche testo digitato, non solo incollato).
5. Tema **non più forzato**: selettore Sistema/Chiaro/Scuro in Impostazioni, con script anti-lampeggio nell'`<head>` che applica la preferenza salvata prima che il CSS venga valutato.

### 6.12 — Cassaforte: allineamento e «troppo nero»
Tre pattern diversi per lo stesso concetto di «stato vuoto» (uno centrato senza illustrazione, due righe di puro testo grigio) — unificati in un componente solo. Recuperate due illustrazioni rimaste orfane dopo le sostituzioni delle icone (l'orologio per «Lavori da ripristinare», la bacchetta per «Richieste recenti») invece di lasciarle come peso morto.

---

## 7 · Stato dei file — dove guardare

```
repo-github/                    ← cartella di lavoro canonica, ramo lavoro-locale-v2
├── index.html, styles.css      ← v2 completa
├── src/app.mjs                 ← orchestrazione, ~1300 righe
├── src/icons.mjs                ← libreria icone (Lucide + 2 originali)
├── src/domain/                 ← pii, vault, recipes, plan, intake, markdown, swipe,
│                                  greeting, i18n, pdf, share (10 moduli)
├── src/locales/it.mjs, en.mjs   ← 100% parità di chiavi, verificata da test
├── tests/                      ← 102 test, node --test tests/*.test.mjs
├── android/app/src/main/java/app/privai/pocket/
│   ├── MainActivity.java        ← NUOVO
│   ├── SecureStorePlugin.java   ← NUOVO — Keystore/AES-GCM
│   ├── ShareTargetPlugin.java   ← NUOVO — condivisione in ingresso
│   └── OutboundSharePlugin.java ← RISCRITTO (il sorgente originale non era recuperabile)
├── android/app/src/main/AndroidManifest.xml  ← + <queries> + 3 intent-filter
└── vendor/LUCIDE-LICENSE.txt    ← NUOVO
```

**48 file modificati/aggiunti, NESSUN commit creato, NESSUN push.** Tutto sul ramo locale `lavoro-locale-v2`. `git status --short` nella cartella per il diff completo.

La cartella `privai-v2/` (sorella di `repo-github/`) è la **prima bozza superata** di questa riscrittura — l'ho abbandonata a metà sessione quando ho scoperto il repo GitHub, per lavorare direttamente nel clone reale. Non serve più; se ingombra si può cancellare, ma non contiene nulla che non sia già (meglio) dentro `repo-github`.

Il server di anteprima (`.claude/launch.json` nella cartella padre) punta a `repo-github`. **Attenzione**: il browser tiene in cache i moduli ES per origine (host:porta) anche dopo aver svuotato la cache esplicitamente — se qualcosa non si aggiorna, cambiare porta nel launch.json è più affidabile di un semplice ricaricamento forzato.

## 8 · Cosa NON è stato fatto / verificato

- **Nessuna compilazione Gradle reale.** Questa macchina non ha Java né Android SDK. Il workflow `.github/workflows/android-debug.yml` (già presente nel repo, a `workflow_dispatch`) compila tutto su GitHub Actions — non serve installare nulla in locale, basta pushare il ramo e lanciarlo dalla pagina Actions.
- **Nessun test su device reale.** Condivisione in ingresso, cassaforte su Keystore, tutto il ciclo condividi→proteggi→IA→ripristina: scritto e testato via unità/DOM, mai provato su un telefono vero.
- **Nessun commit, nessun push.** Il ramo `lavoro-locale-v2` esiste solo su questa macchina.
- **Canale della modalità desktop** (§5): infrastruttura pronta, canale fra i due dispositivi da decidere.
- **Licenza dei pesi di rizzo-pii**: mai verificata: se fosse AGPL, incompatibile con un'app a pagamento.
- **Banco di prova del rilevamento**: 28 frasi scritte da me — bastano per accorgersi di una regressione, non per dichiarare un livello di qualità commerciale.

## 9 · Roadmap aggiornata, in ordine di priorità

### Bloccanti — prima di tutto il resto

1. **Rivedere il diff e fare un commit locale descrittivo.** 48 file non committati sono il rischio più concreto in questo momento — un `git stash` o un comando distruttivo per sbaglio li perderebbe. *(Non l'ho fatto da solo: creare commit non è un'azione che prendo senza che tu lo chieda esplicitamente.)*
2. **Push del ramo + lancio del workflow Actions.** Un clic sulla pagina Actions del repo, pochi minuti, e si ottiene il primo APK reale con tutto il lavoro di questa sessione dentro.
3. **Provare su un telefono vero**: installare l'APK, condividere un PDF/testo da WhatsApp o Gmail, verificare che l'app si apra già sulla schermata dei dati trovati. Poi il ciclo completo: proteggi → incolla in ChatGPT → chiudi tutto → riapri il giorno dopo → verifica che il ripristino funzioni ancora.
4. **«Elabora testo»**: verificare che PrivAI compaia nel menu che appare selezionando del testo in un'altra app — il gesto più veloce che Android permetta.

### Il salto di qualità (deciso il 27/08/2026: chiudere ogni punto in cui i dati già passano, prima di aggiungerne di nuovi)

Il ragionamento: PrivAI diventa indispensabile non con una funzione in più, ma quando appare da sé in ogni posto dove le persone già spostano contenuti verso un'IA, senza cambiare abitudini. Ordine di priorità:

5. **Riquadro nelle impostazioni rapide di Android** («Proteggi gli appunti»): copi qualcosa, scendi la tendina, tocchi — protetto senza aprire l'app. È il salto da «un'altra app» a «un riflesso». → **scritto**: `QuickProtectTileService.java` + `QuickProtectActivity.java` (invisibile, `Theme.Translucent`) + `QuickProtectPlugin.java`, orchestrato da `runQuickProtect()` in `app.mjs` e dalla decisione pura in `src/domain/quickProtect.mjs` (bidirezionale: maschera testo nuovo, ripristina risposte IA già note). Specifica in `docs/superpowers/specs/2026-08-27-quick-settings-tile-design.md`. **Non ancora compilato né provato su device** — nessun SDK Android in questa sessione.
6. **Ponte desktop via QR** (priorità alzata, era in fondo alla lista): l'infrastruttura di sessione è pronta ma il canale fra telefono e PC non esiste ancora. È il differenziale più grande e meno realizzato della visione di prodotto — chi scrive prompt lunghi lo fa spesso da desktop, non da telefono.
7. **Screenshot via OCR**: estendere lo `ShareTargetPlugin` già scritto ad accettare anche `image/*`, passare il testo estratto (Android ML Kit Text Recognition, on-device, gratuito) nella pipeline di rilevamento esistente. Prima versione: estrai e rileva come una richiesta normale, **non** redigere l'immagine — un box mal piazzato o un OCR che manca una riga darebbe una falsa sensazione di sicurezza, e qui la sicurezza è il core.
8. **Widget in home screen** («Proteggi appunti» con un tocco): complementare al riquadro nelle impostazioni rapide, ma molto più scopribile per chi non è un power user — il pubblico target dichiarato (chi usa l'IA ogni giorno ma non è pratico).

**Scartato esplicitamente**: Accessibility Service o tastiera personalizzata per leggere tutto ciò che si scrive in ogni app — tecnicamente fattibile ma somiglia troppo a uno spyware agli occhi di Play Store e degli utenti; il rischio reputazionale supera il beneficio per un'app che vende fiducia sulla privacy.

### Prossimi passi — per l'uso quotidiano

9. **Notifica persistente** mentre un lavoro è aperto in cassaforte.
10. **La rubrica si costruisce da sola**: «Hai nascosto *Rossi* tre volte: vuoi che lo faccia sempre?»
11. **Registro di ciò che esce dal telefono**: dimostra la promessa di privacy invece di limitarsi a dichiararla.

### Il piano creator (obiettivo esplicito: pubblicità tramite creator YouTube/TikTok/Instagram)

12. **Modalità dimostrazione**: un documento finto ma realistico, per chi vuole girare un video senza esporre dati veri. *Prova già raccolta*: nelle schermate della vecchia app usate per il confronto in questa sessione, il testo di esempio era un pezzo del CV del proprietario — per mostrare l'app ha dovuto mostrare i propri dati.
13. Scheda «prima → dopo» condivisibile, costruita solo sul documento dimostrativo.
14. Ricette pensate per i creator stessi («Rispondi a una proposta di sponsorizzazione»).
15. Codice creator via Google Play (nessun server, nessun account) — la revenue share va verificata prima di prometterla a qualcuno.

### Monetizzazione (dopo i primi utenti, non prima)

16. Cassaforte con blocco biometrico.
17. Più documenti insieme (batch).
18. Word (.docx) — il formato in cui arrivano contratti e verbali negli studi italiani.
19. Pagamenti con Play Billing — ultimo passo, non primo: il prezzo si decide guardando quanto tempo l'app fa risparmiare a chi la usa già.

### Qualità e fossato

20. Banco di prova del rilevamento su qualche centinaio di documenti reali, non 28 frasi scritte da me.
21. Livello neurale per i nomi mai introdotti prima (il caso che continuiamo a sbagliare) — verificare prima la licenza di rizzo-pii.

### Non fare ora (deciso esplicitamente, non dimenticato)

Chatbot generico finanziato dallo sviluppatore; login Google/Drive prima del vault cifrato (già fatto: Keystore); **economia a gettoni/sblocchi** (proposta e scartata esplicitamente: un'app di sicurezza vende fiducia, un layer di gamification rischia di farla somigliare a un gioco proprio dove deve sembrare seria, e l'azione centrale — proteggere un testo — resta a bassa frequenza a prescindere dai punti); claim «100% anonimo» o «sicurezza assoluta»; qualunque API a consumo pagata dal proprietario; rinominare il progetto senza la verifica formale del marchio (§2). L'obiettivo di fondo (uso quotidiano, non solo creator) resta perseguito dai punti 5 e 7 della roadmap sopra, non da un'economia dedicata.

---

## 10 · Comandi per riprendere

```bash
cd repo-github
git status --short              # il diff completo di questa sessione
node --test tests/*.test.mjs    # 102 test, devono restare verdi
npm run build:web               # ricostruisce www/
npx serve -l 4173 .             # anteprima locale — cambiare porta se qualcosa sembra "vecchio"
```

Per l'APK: `git push` del ramo (dopo eventuale commit) → GitHub → Actions → `Android debug APK` → Run workflow.

## 11 · Prompt per riprendere in una nuova conversazione

> Continua PrivAI Pocket. La fonte di verità è `HANDOFF.md` nella cartella `repo-github/` (ramo git `lavoro-locale-v2`, mai pushato) — leggilo integralmente prima di scrivere codice, comprese le sezioni 1-5 che vengono da una sessione precedente e restano valide (vincolo di zero costi operativi, naming ancora aperto, requisiti di sicurezza Android, architettura del desktop bridge). La sezione 6 è il log dettagliato di tutto il lavoro appena fatto: riscrittura completa in un flusso unico, tre plugin Android nativi scritti ma mai compilati né provati su device, rilevamento dati sensibili portato al 97,3%, 102 test automatici. Prima azione: rivedi il diff (`git status`) e proponi un commit locale descrittivo — non sono stati fatti commit finora, per scelta esplicita. Poi segui l'ordine della roadmap in sezione 9: push + workflow Actions per il primo APK reale, prova su un telefono vero il ciclo condividi→proteggi→IA→ripristina, poi il resto. Non introdurre server, API a pagamento o dipendenze che richiedano un bundler senza discuterne prima — il progetto è deliberatamente moduli ES puri, zero build step.
