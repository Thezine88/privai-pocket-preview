# PrivAI Pocket — Handoff operativo

**Aggiornato:** 28 agosto 2026
**Repository:** `Thezine88/privai-pocket-preview`
**Ramo di lavoro:** `lavoro-locale-v2` — **pushato** su GitHub (main non toccato)
**Fase:** riscrittura v2 provata su telefono vero e corretta; riquadro Impostazioni Rapide scritto e revisionato tre volte, **mai compilato né provato su device**.

> **Leggi questo file per intero prima di scrivere codice.** Contiene decisioni di tre sessioni diverse: quelle economiche/di naming/di sicurezza (sezioni 1-5) restano valide; la sezione 6 è la riscrittura v2; la sezione 7 è il lavoro dell'ultima sessione (correzioni da device reale, audit UX, riquadro Impostazioni Rapide).

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

Non è più «tre strumenti da scegliere» ma **un flusso unico**: condividi un documento → l'app mostra subito cosa nasconde → scegli cosa ti serve (7 tipi di richiesta, ridotti dopo la prova su device) → apri in un'IA → torni e ripristini con un tocco.

Formulazione corretta: «controllo locale» e «versione protetta». **Mai** «anonimizzazione garantita», «sicurezza assoluta» o simili — il meccanismo è sostituzione con segnaposto, non crittografia dei contenuti.

**Nota da non perdere:** il tema **non è più forzato al chiaro** come nella v1 (che dichiarava `color-scheme: only light` nel codice). In Impostazioni c'è un selettore **Sistema / Chiaro / Scuro** — l'utente sceglie, l'app non decide per lui. La preferenza è salvata e applicata prima ancora che il CSS venga valutato, senza lampi del tema sbagliato al riavvio. Dettagli tecnici in §6.11 punto 5.

## 4 · Sicurezza richiesta per Android (dalla sessione precedente — ora scritta, non ancora verificata su device)

1. Corrispondenze e chiavi con Android Keystore/AES-GCM → **scritto**: `SecureStorePlugin.java`.
2. Escludere dati/mapping/segreti da URL, log, analytics, backup → rispettato nel codice; da riverificare con uno strumento reale su APK compilato.
3. Share Target Android nativo, senza query string/cache web → **scritto**: `ShareTargetPlugin.java` + `<queries>`/intent-filter nel manifest.
4. Separare ogni lavoro con un id, impedire ripristino incrociato → **fatto**: ogni lavoro in cassaforte ha un id proprio, `combinedMapping()` unisce le mappe solo per riconoscere una risposta, non per confonderle.
5. Cancellazione immediata e scadenza automatica → **fatto**: scadenza scelta dall'utente (1h/1g/7g/per sempre), «Cancella tutto» in Impostazioni.
6. Testare installazione/sospensione/riavvio/cancellazione/condivisione su device reale → **parzialmente fatto** (27/08): condivisione e ciclo completo provati sul telefono, sei correzioni raccolte (§7.1). Restano da provare il riquadro Impostazioni Rapide, «Elabora testo» e la cassaforte dopo giorni.

Malware, root/jailbreak, tastiere compromesse, app destinatarie: fuori dal perimetro di PrivAI, dichiarato esplicitamente.

## 5 · Collegamento desktop via QR — decisione architetturale (invariata)

Nessun relay cloud. Telefono e computer sulla stessa rete (o hotspot dal telefono); il QR contiene solo indirizzo locale + credenziali effimere, mai dati; originali/mapping/chiavi permanenti restano sul telefono; il computer riceve di default solo la versione protetta. Ordine obbligatorio: **APK reale → Keystore → Share Target nativo → threat review → protocollo locale cifrato → desktop QR.**

Documenti vincolanti (precedenti al vincolo di zero costi — dove parlano di relay cloud sono superati da questa sezione): `docs/specs/2026-08-24-privai-bridge-security-spec.md`, `docs/superpowers/plans/2026-08-24-privai-bridge.md`.

**Stato:** scritto (sessione del 28/08/2026) — `BridgeServerPlugin.java` (server locale, NanoHTTPD), `createRemoteStore` in `vault.mjs`, QR vero (`vendor/qrcode.mjs`, MIT), dialogo "Continua sul computer" completato con link condivisibile e paginetta pubblica di reindirizzamento (`bridge/index.html`, GitHub Pages — repuntato a `lavoro-locale-v2` e già live). Specifica in `docs/superpowers/specs/2026-08-28-desktop-bridge-design.md`, piano in `docs/superpowers/plans/2026-08-28-desktop-bridge.md`. **Non ancora compilato né provato su device** — nessun SDK Android in questa sessione, e nessuna rete Wi-Fi reale su cui provare il collegamento vero.

---

## 6 · La riscrittura v2 (sessione precedente, in ordine)

### 6.1 — Audit della v1 e analisi UX
Analizzata la v1 (estratta dall'APK fornito) su due fronti: un audit strutturato (17 rilievi, 3 bloccanti — mappa dei segnaposto solo in memoria, nessuna condivisione in ingresso, rilevamento senza nomi/indirizzi) e cinque osservazioni dirette dell'utente (icone poco chiare, scroll eccessivo, animazioni di Willy assenti, domande a scelta multipla, transizioni). Report pubblicati come artefatti.

### 6.2 — Riscrittura completa (v2)
Da tre strumenti separati (Converti/Proteggi/Prepara) a un **flusso unico**. Moduli nuovi in `src/domain/`:
- `pii.mjs` — rilevamento a 4 livelli (checksum matematici → rubrica personale → dizionari/struttura → livello debole "forse", sempre deselezionato)
- `vault.mjs` — cassaforte persistente (sopravvive alla chiusura dell'app, a differenza della v1)
- `recipes.mjs` — tipi di richiesta con domande a scelta multipla, sempre preselezionate
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

**Stato a fine riscrittura: 102 test verdi** (oggi 112, vedi §7). Verificato anche `cap sync android` (sincronizzazione Capacitor vera, eseguita con successo più volte).

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

## 7 · Sessione del 27-28 agosto: device reale, audit UX, riquadro Impostazioni Rapide

### 7.1 — Primo APK reale, e le sei correzioni che ne sono uscite

Il ramo è stato committato e pushato, e il workflow Actions ha prodotto **il primo APK vero** (run #7). Installato su un telefono, sono emersi sei rilievi — tutti corretti (commit `c11ec57`):

1. Nota «salvato in cassaforte» ridondante nella schermata di invio → rimossa.
2. Testo sotto «Nascondi sempre queste parole» → accorciato.
3. Icone orologio/bacchetta invertite fra «Lavori da ripristinare» e «Richieste recenti» → scambiate.
4. **Bug reale nel rilevamento nomi**: la propagazione del cognome si applicava anche ai suggerimenti deboli a due parole maiuscole, marcando come *selezionati* termini come «Social», «Media», «Strategist», «Comunicazione». Ora propaga solo dai nomi certi (titolo o nome di battesimo riconosciuto), più una lista di esclusione lessicale.
5. «Cosa ti serve» ridotta alle 7 richieste utili; risolto un bug CSS che rendeva nere le icone dei chip (mancava `fill:none`/`stroke` sugli svg); aggiunta a ogni richiesta la regola fissa «fai almeno 5 domande se il contesto non basta»; per i post social aggiunto TikTok e le indicazioni su hashtag (max 4) e parole chiave SEO.
6. **Bug reale nel rientro**: condividere nell'app la risposta di un'IA la trattava come documento nuovo da scansionare. Ora controlla prima se contiene i nostri segnaposto e va dritta al ripristino.

### 7.2 — Audit UX mobile-first (commit `2116391`)

Struttura confrontata con Material 3, Apple HIG e Ant Design Mobile. **Buona notizia: quasi tutto era già conforme** — azione principale ancorata che non scorre mai, bottom nav a 3 voci con etichette sempre visibili (la configurazione consigliata da entrambe le guide), `100dvh`, `env(safe-area-inset-*)`, target da 48dp. Scartato esplicitamente lo **swipe fra le schede**: né Material 3 né HIG lo prevedono per la barra inferiore, e qui confliggerebbe con lo swipe-per-eliminare già attivo sulle liste. Tre correzioni vere:

- `interactive-widget=resizes-content` nel meta viewport: senza, su alcune combinazioni Android/WebView la barra d'azione finisce *sotto* la tastiera.
- Import PDF: il Toast a tempo spariva prima che l'estrazione finisse su file lunghi o telefoni lenti, lasciando uno schermo fermo e muto. Sostituito con un banner legato alla Promise.
- Home vuota: le card di ingresso stanno in cima, fuori dalla zona comoda per il pollice. Quando non c'è nulla in cassaforte né nelle richieste recenti, la barra ancorata mostra «Scrivi un testo».

### 7.3 — Riquadro Impostazioni Rapide (roadmap punto 5) — **scritto, mai provato**

Specifica → piano → esecuzione a sotto-agenti (un implementatore e un revisore per task) → **tre revisioni sull'intero ramo**. Ogni revisione ha trovato problemi veri; vale la pena sapere quali, perché sono il tipo di errore che i test non prendono:

| Trovato da | Problema | Correzione |
|---|---|---|
| Revisione 1 | **Gli appunti non erano leggibili.** `@capacitor/clipboard` non è installato, quindi si ricadeva su `navigator.clipboard.readText()`, che richiede il documento a fuoco — un'Activity invisibile e mai toccata non lo ha mai. Il riquadro avrebbe risposto «niente da proteggere» a ogni tocco. | `read()`/`write()` nativi con `ClipboardManager` |
| Revisione 1 | Corsa nel segnale nativo→JS; l'Activity invisibile poteva aprire l'intera interfaccia senza mai chiudersi | Prima una stretta di mano, poi (revisione 2) **eliminato ogni segnale**: il plugin è registrato solo dall'Activity del riquadro, la sua presenza *è* il segnale |
| Revisione 1 | Doppio tocco: il secondo trovava i nostri segnaposto e **ripristinava**, rimettendo i dati veri negli appunti prima di un incolla | Guardia sul contenuto (impronta SHA-256), non solo sul tempo |
| Revisione 1 | L'Activity «invisibile» nascondeva la finestra ma non la WebView | `setVisibility(INVISIBLE)` esplicito |
| Sicurezza | La guardia salvava il **testo in chiaro**, che sopravviveva a «Cancella tutto» e non scadeva mai | Impronta SHA-256 invece del testo + `WIPED_KEYS` + test che ricava dal codice le chiavi scritte |
| Revisione 3 | La guardia bloccava **anche il mascheramento**: dopo un ripristino diceva «niente da nascondere» su un testo pieno di dati veri, e chi leggeva quel messaggio incollava dati in chiaro credendoli protetti | Guardia ristretta al solo ramo «ripristina» |

**112 test verdi.** I test nuovi sono stati verificati capaci di fallire iniettando l'errore che devono cogliere — un test che non sa fallire non protegge nulla.

### 7.4 — Promemoria per il rientro

Aggiunta una riga fissa nella schermata «Cosa ti serve?», **prima** del pulsante per aprire l'IA: «Quando arriva la risposta, torna qui: la riconosco e rimetto i dati veri con un tocco.» Va lì e non dopo il tocco, perché dopo l'app IA prende lo schermo intero e qualunque messaggio non verrebbe mai letto.

---

## 8 · Stato dei file — dove guardare

```
repo-github/                    ← cartella di lavoro canonica, ramo lavoro-locale-v2
├── index.html, styles.css      ← v2 completa
├── src/app.mjs                 ← orchestrazione, ~1400 righe
├── src/icons.mjs                ← libreria icone (Lucide + 2 originali)
├── src/domain/                 ← pii, vault, recipes, plan, intake, markdown, swipe,
│                                  quickProtect, greeting, i18n, pdf, share (12 moduli)
├── src/locales/it.mjs, en.mjs   ← 100% parità di chiavi, verificata da test
├── tests/                      ← 112 test, node --test tests/*.test.mjs
├── android/app/src/main/java/app/privai/pocket/
│   ├── MainActivity.java        ← NON deve mai registrare QuickProtectPlugin (test dedicato)
│   ├── SecureStorePlugin.java   ← Keystore/AES-GCM
│   ├── ShareTargetPlugin.java   ← condivisione in ingresso — l'unico provato su device
│   ├── OutboundSharePlugin.java
│   ├── QuickProtectTileService.java  ← NUOVO — il riquadro
│   ├── QuickProtectActivity.java     ← NUOVO — host invisibile
│   └── QuickProtectPlugin.java       ← NUOVO — appunti, Toast, chiusura
├── android/app/src/main/AndroidManifest.xml  ← + <queries> + 3 intent-filter + tile + activity
└── docs/superpowers/specs/2026-08-27-quick-settings-tile-design.md
                                 ← la fonte di verità sul riquadro (il piano è superato)
```

**Tutto committato e pushato** sul ramo `lavoro-locale-v2`. `git log --oneline` per la storia.

La cartella `privai-v2/` (sorella di `repo-github/`) è la **prima bozza superata** di questa riscrittura — l'ho abbandonata a metà sessione quando ho scoperto il repo GitHub, per lavorare direttamente nel clone reale. Non serve più; se ingombra si può cancellare, ma non contiene nulla che non sia già (meglio) dentro `repo-github`.

Il server di anteprima (`.claude/launch.json` nella cartella padre) punta a `repo-github`. **Attenzione**: il browser tiene in cache i moduli ES per origine (host:porta) anche dopo aver svuotato la cache esplicitamente — se qualcosa non si aggiorna, cambiare porta nel launch.json è più affidabile di un semplice ricaricamento forzato.

## 9 · Cosa NON è stato fatto / verificato

- **Il riquadro Impostazioni Rapide non è mai stato compilato né toccato su un telefono.** È la cosa più importante da sapere di questa sessione: tre revisioni severe hanno migliorato molto il codice, ma nessuna di loro può dirti se il tile compare davvero nel pannello, se `ClipboardManager` restituisce il contenuto al primo o al secondo tentativo, se l'Activity lampeggia. **Da provare per prime**, sul prossimo APK: (a) il riquadro compare fra quelli disponibili; (b) un tocco su un testo con dati sensibili lo maschera e mostra il conteggio; (c) un tocco sulla risposta di un'IA lo ripristina; (d) **il doppio tocco** — il caso che ha generato più correzioni; (e) nessun lampo visibile.
- **Nessuna compilazione Gradle in locale.** Questa macchina non ha Java né Android SDK. Il workflow `.github/workflows/android-debug.yml` (`workflow_dispatch`) compila su GitHub Actions: basta andare su Actions → «Android debug APK» → Run workflow → ramo `lavoro-locale-v2`.
- **Provato su device (sessione del 27/08):** condivisione in ingresso, ciclo condividi→proteggi→IA→ripristina, rilevamento dati. **Non ancora provato:** «Elabora testo» dal menu di selezione, la cassaforte su Keystore alla riapertura dopo giorni, e tutto il riquadro.
- **Canale della modalità desktop** (§5): infrastruttura pronta, canale fra i due dispositivi da decidere.
- **Licenza dei pesi di rizzo-pii**: mai verificata: se fosse AGPL, incompatibile con un'app a pagamento.
- **Banco di prova del rilevamento**: 28 frasi scritte da me — bastano per accorgersi di una regressione, non per dichiarare un livello di qualità commerciale.
- **Limite noto del riquadro**: la guardia riconosce solo ciò che ha scritto il riquadro stesso. Un testo mascherato dal flusso manuale e copiato negli appunti, se il riquadro viene toccato, viene ripristinato. Distinguere «risposta dell'IA coi nostri segnaposto» da «nostro testo mascherato coi nostri segnaposto» non è possibile: sono la stessa cosa. Da valutare dopo la prova su device.

## 10 · Roadmap aggiornata, in ordine di priorità

### Bloccanti — prima di tutto il resto

1. ~~Commit locale descrittivo~~ — **fatto**, storia pulita su `lavoro-locale-v2`.
2. ~~Push del ramo + workflow Actions~~ — **fatto**, primo APK reale prodotto (run #7).
3. ~~Provare su un telefono vero il ciclo condividi→proteggi→IA→ripristina~~ — **fatto**, sei correzioni raccolte e applicate (§7.1).
4. **Nuovo APK e prova del riquadro Impostazioni Rapide.** È l'unica cosa bloccante rimasta, ed è la più importante: tre revisioni hanno reso il codice molto migliore, ma nessuna può dire se funziona davvero. Lista di prova in §9, primo punto. **Il doppio tocco è il caso da provare per primo** — ha generato più correzioni di tutti.
5. **«Elabora testo»**: verificare che PrivAI compaia nel menu che appare selezionando del testo in un'altra app — il gesto più veloce che Android permetta. Scritto da tempo, mai verificato.

### Il salto di qualità (deciso il 27/08/2026: chiudere ogni punto in cui i dati già passano, prima di aggiungerne di nuovi)

Il ragionamento: PrivAI diventa indispensabile non con una funzione in più, ma quando appare da sé in ogni posto dove le persone già spostano contenuti verso un'IA, senza cambiare abitudini. Ordine di priorità:

- ~~**Riquadro nelle impostazioni rapide di Android**~~ → **scritto e revisionato tre volte** (§7.3): `QuickProtectTileService.java` + `QuickProtectActivity.java` + `QuickProtectPlugin.java`, orchestrati da `runQuickProtect()` in `app.mjs` e dalla decisione pura in `src/domain/quickProtect.mjs`. Fonte di verità: `docs/superpowers/specs/2026-08-27-quick-settings-tile-design.md`. **Resta da provare su device** (punto 4 sopra).
- ~~**Ponte desktop via QR**~~ → **scritto, da provare** (§5): `BridgeServerPlugin.java` (server locale, NanoHTTPD) + `createRemoteStore` in `vault.mjs` + QR vero (`vendor/qrcode.mjs`) + dialogo "Continua sul computer" completato + paginetta pubblica di reindirizzamento (`bridge/index.html`, GitHub Pages già repuntato a `lavoro-locale-v2` e live). Fonte di verità: `docs/superpowers/specs/2026-08-28-desktop-bridge-design.md`. **Resta da compilare e provare su device e rete Wi-Fi reale** — nessun SDK Android in questa sessione.
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

## 11 · Comandi per riprendere

```bash
cd repo-github
git log --oneline -12           # la storia della sessione
node --test tests/*.test.mjs    # 112 test, devono restare verdi
npm run build:web               # ricostruisce www/
npx serve -l 4173 .             # anteprima locale — cambiare porta se qualcosa sembra "vecchio"
```

Per l'APK: `git push origin lavoro-locale-v2` → GitHub → Actions → `Android debug APK` → Run workflow → **ramo `lavoro-locale-v2`** (non `main`, e non uno dei rami `fix/*` più vecchi: è un errore già capitato).

**Nota su git:** le credenziali usano Git Credential Manager (`git config --global credential.helper manager`, già impostato). Se un push chiede di nuovo l'autenticazione, si apre il browser sull'account `Thezine88`.

## 12 · Prompt per riprendere in una nuova conversazione

> Continua PrivAI Pocket. La fonte di verità è `HANDOFF.md` in `repo-github/` (ramo `lavoro-locale-v2`, già pushato) — leggilo integralmente prima di scrivere codice. Le sezioni 1-5 vengono dalle sessioni precedenti e restano valide (zero costi operativi, naming ancora aperto, requisiti di sicurezza Android, architettura del ponte desktop); la 6 è la riscrittura v2; la **7 è l'ultima sessione**: primo APK reale provato su telefono con sei correzioni, audit UX mobile-first, e il riquadro Impostazioni Rapide scritto e revisionato tre volte. Stato: 112 test verdi, tutto committato e pushato. **La cosa più importante da sapere: il riquadro non è mai stato compilato né toccato su un telefono** — è il punto 4 della roadmap in §10, e la lista di cosa provare è il primo punto di §9 (il doppio tocco per primo: ha generato più correzioni di tutti). Per capire come funziona il riquadro leggi `docs/superpowers/specs/2026-08-27-quick-settings-tile-design.md`, non il piano in `docs/superpowers/plans/` che è superato. Non introdurre server, API a pagamento o dipendenze che richiedano un bundler senza discuterne prima — il progetto è deliberatamente moduli ES puri, zero build step.
