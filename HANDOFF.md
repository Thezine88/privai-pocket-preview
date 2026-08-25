# PrivAI Pocket — Handoff operativo

**Aggiornato:** 25 agosto 2026  
**Repository:** `Thezine88/privai-pocket-preview`  
**Anteprima pubblica:** `https://thezine88.github.io/privai-pocket-preview/`  
**Fase:** validazione PWA pubblica; progetto Android/Capacitor presente, APK ancora da compilare e provare su telefono reale.

## Promessa del prodotto

PrivAI Pocket prepara testi per l'IA senza obbligare l'utente a consegnare i dati originali: il telefono crea una versione protetta, l'utente la invia all'assistente scelto e può ripristinare localmente i dati nel risultato.

La formulazione corretta è «controllo locale base» e «versione protetta». Non promettere anonimizzazione garantita, sicurezza assoluta o crittografia quando si tratta soltanto di sostituzione con segnaposto.

## Decisioni approvate

- Android prima, iOS dopo la validazione.
- Nucleo local-first, leggero e indipendente da API pagate dallo sviluppatore.
- ChatGPT Plus e Claude Pro non sono API e non finanziano il funzionamento dell'app.
- Ogni strumento è utilizzabile da solo; resta disponibile anche un percorso guidato Converti → Proteggi → Prepara → Ripristina.
- Ogni strumento mostra una sola fase alla volta: inserimento, eventuale revisione e risultato. Il risultato sostituisce il modulo lungo e mantiene Copia/Condividi subito visibili.
- Parole visibili: «Proteggi», «Nascondi», «Versione protetta» e «Ripristina»; evitare «mascheramento» nell'interfaccia.
- Copia e Condividi sono azioni primarie su ogni risultato.
- Free: tre azioni al giorno per strumento e gettoni/gamification da validare.
- Pro: convenienza e funzioni locali/desktop; nessun costo API illimitato a carico dello sviluppatore.
- «Continua sul computer» sarà Pro, ma resta bloccato finché non supera i gate di sicurezza nativi.
- Nessun relay cloud va attivato ora.
- Identità visiva: bianco caldo, arancione e nero, card arrotondate, ombre e icone 3D semplici.
- Barra inferiore fissa con effetto glass, collegamento Instagram completo, pulsante `+` e microfono visibile ma dichiarato `In arrivo`.
- Interfaccia italiano/inglese; il testo dell'utente non viene tradotto automaticamente.
- Nessuna esclusione per modello commerciale del telefono: degradazione per funzione/capacità.

## Funzioni operative nella PWA

- Conversione e normalizzazione in Markdown.
- Import indipendente di file `.txt`, `.md` e PDF con testo selezionabile nelle sezioni Converti, Proteggi e Prepara.
- Lettura PDF locale tramite PDF.js 5.6.205 incluso nell'app, fino a 15 MB e 50 pagine; nessun documento viene inviato a un servizio esterno.
- Rilevamento locale deterministico di email, telefoni, codici fiscali validi, IBAN validi, URL e date.
- Segnaposto stabili e legati al singolo lavoro.
- Ripristino esatto locale durante la sessione, con conferma e possibilità di cancellare le corrispondenze.
- Riconoscimento dei soli segnaposto appartenenti al lavoro corrente e apertura automatica di Ripristina quando una risposta nota viene incollata nel flusso Proteggi.
- Preparazione di istruzioni Markdown per assistenti IA esterni.
- Copia e condivisione; rimozione del link Instagram dal payload condiviso.
- Apertura dell'assistente IA scelto; il ritorno del risultato avviene oggi tramite incolla manuale.
- Cronologia locale limitata e cancellazione individuale.
- Contatore Free, gettoni dichiarati Beta, saluti variabili, italiano/inglese e anteprima vantaggi Pro dichiarata `In arrivo`.
- Menu animato del pulsante `+` con una sola azione «Sfoglia file»: il selettore riconosce automaticamente testo, Markdown e PDF.
- Micro-interazioni e PWA offline con cache `v15`, inclusi lettore PDF, worker e stato dei workflow.
- Le etichette tecniche dei dati sono tradotte per l'utente (`TELEPHONENUM` → `Telefono`) e ogni flusso dispone di un comando `Pulisci`.
- Aprendo Converti, Proteggi o Prepara dalla Home viene sempre mostrata la fase iniziale indipendente, senza riutilizzare la schermata risultato di un altro strumento.
- Configurazione BYOK dimostrativa, senza chiamate reali e senza persistenza di chiavi.
- Il comando per svuotare un lavoro è ora un cestino contestuale dentro ciascun editor di Converti, Proteggi, Prepara e Ripristina. Compare solo quando c'è testo; se esiste già un risultato chiede conferma.

## Limiti e problemi aperti

- È ancora una PWA di validazione: non equivale all'APK nativo definitivo.
- Le corrispondenze per il ripristino sono in memoria di sessione e possono sparire se pagina/app viene chiusa o ricaricata.
- Il Web Share Target in ingresso è disabilitato: un flusso GET potrebbe esporre testo in URL, cronologia o cache.
- La risposta di ChatGPT/Claude deve ancora essere incollata manualmente nell'app.
- Il CSS richiede esplicitamente il tema chiaro e gestisce 360–380 px, ma Chrome, Samsung Internet e PWA installata devono ancora essere verificati su dispositivi reali.
- Il rilevatore base non trova necessariamente nomi, organizzazioni, indirizzi liberi o identificatori contestuali.
- I PDF protetti da password, danneggiati o oltre i limiti vengono rifiutati senza sostituire il testo già presente.
- I PDF composti soltanto da immagini richiedono OCR locale, che non è ancora operativo.
- Non sono operativi: login Google, Drive, pagamenti, partner creator, OCR, voce, iOS e desktop bridge. Il microfono non chiede permessi e apre soltanto una spiegazione trasparente.

## Sicurezza richiesta per Android

Prima di dichiarare il flusso sicuro e prima di introdurre il desktop:

1. Conservare corrispondenze e chiavi con Android Keystore e AES-GCM.
2. Escludere dati, mapping e segreti da URL, log, analytics, crash report e backup.
3. Implementare un Share Target Android nativo con conferma, senza query string o cache web.
4. Separare ogni lavoro con un `jobId`; impedire il ripristino con mapping di un altro lavoro.
5. Offrire cancellazione immediata e scadenza automatica.
6. Testare installazione, sospensione, riavvio, cancellazione e condivisione su dispositivo reale.

Malware, root/jailbreak, tastiere compromesse e applicazioni destinatarie non sono controllabili da PrivAI Pocket e devono essere dichiarati fuori dal perimetro.

## Decisione sul collegamento desktop

Architettura scelta: il telefono custodisce originali, mapping e chiavi; il desktop riceve soltanto la versione protetta. Il pairing usa un QR monouso e conferma del computer. Un futuro relay trasporta esclusivamente buste cifrate end-to-end con scadenza e recupero singolo.

Documenti vincolanti:

- `docs/specs/2026-08-24-privai-bridge-security-spec.md`
- `docs/superpowers/plans/2026-08-24-privai-bridge.md`

Ordine obbligatorio: APK reale → Keystore → Share Target nativo → threat review → protocollo cifrato → desktop → relay beta con tetto di spesa. Non creare ora account Cloudflare o un backend di produzione.

## Android corrente

- Capacitor 8.5.0; application ID `app.privai.pocket`.
- `minSdkVersion = 24`, `compileSdkVersion = 36`, `targetSdkVersion = 36`.
- Asset web sincronizzabili in `android/app/src/main/assets/public/`.
- La compilazione locale è stata bloccata dal download di `gradle-8.14.3-all.zip` non raggiungibile nell'ambiente usato.
- Nessun APK installabile è stato ancora validato.

## Ultima verifica nota — 25 agosto 2026

- `node --test`: 61 test superati, 0 falliti.
- Test d'integrazione PDF: estrazione reale riuscita con il motore offline incluso.
- `node scripts/build-web.mjs`: build web completata in `www/`.
- `checkPackageSafety('www')`: `[]`; nessuna credenziale nota o configurazione di server remoto trovata nel pacchetto.
- Sorgenti PWA pubblicati sul branch `main` con il cestino contestuale e cache `v16`.
- Non è disponibile un browser headless nel checkpoint: nessuna ispezione visuale reale a 360/390/430/680 px è stata eseguita in questo ambiente.
- Il checkpoint non contiene `.git`: non sono stati creati commit e non è stato modificato GitHub.
- Ultimo commit pubblico noto al momento dell'handoff: `62b985fd5818dbdc084b0611fc912c1cd92bacb4`.

Questi risultati devono essere rieseguiti: non considerarli prova dell'APK.

## Prossime attività, in ordine

- [x] Correggere localmente la barra inferiore perché il nome Instagram sia leggibile insieme a `+` e microfono.
- [x] Forzare localmente il tema chiaro; resta da provarlo su Chrome, Samsung Internet e PWA installata.
- [x] Pubblicare il cestino contestuale negli editor e invalidare la cache con `v16`.
- [ ] Verificare visivamente la build servita da GitHub Pages su Chrome, Samsung Internet e PWA installata dopo l'aggiornamento del service worker.
- [ ] Pubblicare e provare l'importazione PDF su Chrome e Samsung Internet con PDF reali semplici, multipagina e scansionati.
- [ ] Ripristinare i metadati Git o continuare tramite il repository collegato.
- [ ] Sincronizzare la PWA `v16` nel progetto Android.
- [ ] Compilare, installare e smoke-testare l'APK su telefono reale.
- [ ] Implementare il vault Keystore con test prima del codice.
- [ ] Implementare il Share Target nativo e il ritorno intuitivo dall'assistente IA.
- [ ] Eseguire la revisione delle minacce e solo dopo iniziare PrivAI Bridge.
- [ ] Validare prezzo Pro, limite Free e valore dei gettoni con utenti reali prima dei pagamenti.

## File principali

- `README.md`: avvio e quadro sintetico.
- `HANDOFF.md`: fonte di verità per stato e prossime attività.
- `docs/superpowers/specs/2026-08-24-privai-pocket-android-design.md`: perimetro Android originario.
- `docs/specs/2026-08-24-privai-bridge-security-spec.md`: decisioni di sicurezza desktop.
- `docs/superpowers/plans/2026-08-24-privai-bridge.md`: piano eseguibile e checklist.
- `src/domain/`: Markdown, PDF, rilevamento, protezione, ripristino, contatori e persistenza.
- `vendor/`: PDF.js, worker offline e licenza Apache-2.0.
- `src/app.mjs`, `index.html`, `styles.css`: flussi e interfaccia.
- `tests/`: test automatici.

## Comandi

```bash
node --test tests/*.test.mjs
npm run build:web
npm run android:sync
npm run android:debug
```

## Prompt per riprendere in una nuova conversazione

> Continua PrivAI Pocket dal repository `Thezine88/privai-pocket-preview`. Leggi prima `HANDOFF.md`, la specifica Android e la specifica/piano PrivAI Bridge. Riesegui i test e verifica il commit pubblico prima di modificare. Mantieni local-first: originali e mapping non devono lasciare il telefono. Segui le attività nell'ordine indicato, scrivi i test prima del codice e non attivare relay, pagamenti o API reali prima dei gate documentati.
