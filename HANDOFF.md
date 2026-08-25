# PrivAI Pocket — Handoff operativo

**Aggiornato:** 25 agosto 2026  
**Repository:** `Thezine88/privai-pocket-preview`  
**Anteprima pubblica:** `https://thezine88.github.io/privai-pocket-preview/`  
**Fase:** validazione PWA pubblica; progetto Android/Capacitor presente, APK ancora da compilare e provare su telefono reale.

## Vincolo economico non negoziabile

Il proprietario del progetto non vuole sostenere costi operativi o abbonamenti per fare funzionare l'app. Ogni proposta deve quindi funzionare senza server obbligatori, API pagate dallo sviluppatore, database cloud a consumo o traffico finanziato dal proprietario.

Sono ammessi soltanto:

- elaborazione e archiviazione locale;
- librerie gratuite con licenza compatibile;
- funzioni native del sistema operativo;
- servizi opzionali configurati e pagati direttamente dall'utente tramite una propria chiave (`BYOK`);
- spazio Google Drive o simile appartenente all'utente, solo se in futuro sarà possibile mantenere la promessa di privacy;
- costi una tantum/istituzionali per pubblicare sugli store e commissioni applicate dagli store alle vendite.

Non confondere ChatGPT Plus o Claude Pro con crediti API: gli abbonamenti personali non possono essere usati come backend dell'app. Qualunque funzione futura che generi un costo per richiesta deve essere respinta o sottoposta a una nuova decisione esplicita.

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
- Il limite Free è ancora da validare. La precedente ipotesi era tre azioni al giorno per strumento, ma la direzione più comprensibile è un'unica quota di «lavori protetti al giorno»; non implementare la monetizzazione definitiva senza test utenti.
- Pro: convenienza e funzioni locali/desktop; nessun costo API illimitato a carico dello sviluppatore.
- «Continua sul computer» sarà Pro, ma resta bloccato finché non supera i gate di sicurezza nativi.
- Nessun relay cloud va attivato ora.
- Identità visiva: bianco caldo, arancione e nero, card arrotondate, ombre e icone 3D semplici.
- Barra inferiore fissa con effetto glass, collegamento Instagram completo, pulsante `+` e microfono visibile ma dichiarato `In arrivo`.
- Interfaccia italiano/inglese; il testo dell'utente non viene tradotto automaticamente.
- Nessuna esclusione per modello commerciale del telefono: degradazione per funzione/capacità.

## Naming — stato aperto

Il nome definitivo non è stato scelto. `PrivAI Pocket` resta esclusivamente il nome operativo del progetto e non va considerato approvato come marchio commerciale.

Direzione preferita: un nome corto, memorabile e pronunciabile in italiano e inglese, possibilmente legato al concetto «i dati sono miei / restano dell'utente». Può essere una parola, un inglesismo, un modo di dire o un suono, ma non deve sacrificare chiarezza, ricercabilità e possibilità di tutela.

Screening preliminare già svolto, non equivalente a una ricerca legale:

- `Scudo`: semanticamente forte, ma già utilizzato da software di firewall/privacy e da progetti software documentali; sconsigliato.
- `Mio`: memorabile ma troppo generico e già presente in più prodotti e assistenti IA; sconsigliato da solo.
- `SoloMio`: già utilizzato storicamente da società/prodotti software e in altri settori; sconsigliato.
- `StayMine`: esiste una società `STAYMINE s.r.o.` con attività di pubblicazione software; inoltre collide semanticamente con la piattaforma privacy `Mine`; ritirato dalla shortlist.
- `Scrubit`: ritirato dopo lo screening. Esistono già un'app software attiva per sale operatorie chiamata Scrubit, il dominio `scrubit.com`, il dominio `scrubit.ai` e progetti `ScrubIT AI`/`Scrub.it` relativi a protezione PII e preparazione di testo con IA. Collisione diretta e rischio elevato.
- `Den`, `Lair`, `Psst`, `Prima`, `Tana`, `Zac`, `Cloqra`, `Cevyra`, `Pryqo`, `Terviq`, `Veyru`, `RestaTuo`, `RestaMio`, `MioPrima`, `DatiMiei` e `MioScudo`: esplorati ma non approvati.

Prima di rinominare codice, package Android, repository o materiali grafici occorre scegliere una nuova shortlist e verificare formalmente EUIPO/UIBM, classi 9 e 42, App Store, Google Play, domini e account social. Non dichiarare un nome «libero» sulla sola base di una ricerca web.

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
- Micro-interazioni e PWA offline con cache `v17`, inclusi lettore PDF, worker e stato dei workflow.
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

## Decisione aggiornata sul collegamento desktop QR

Il collegamento resta fattibile, ma deve rispettare il vincolo di zero costi operativi. L'architettura raccomandata è quindi **locale**, senza relay cloud:

1. telefono e computer sono sulla stessa rete Wi-Fi oppure il telefono crea un hotspot;
2. l'app Android avvia una sessione locale temporanea e mostra un QR;
3. il QR contiene soltanto indirizzo locale e credenziali/chiavi effimere, mai documenti o dati personali;
4. il computer apre nel browser un'interfaccia servita o autorizzata dal telefono;
5. originali, mapping e chiavi permanenti restano sul telefono; il computer riceve per impostazione predefinita soltanto la versione protetta;
6. il risultato dell'IA ancora protetto torna al telefono per il ripristino;
7. mostrare la versione ripristinata sul computer deve essere una scelta esplicita, perché in quel momento i dati personali lasciano il telefono;
8. chiudendo la sessione, token e chiavi effimere vengono eliminati.

Il QR serve all'accoppiamento, non costituisce da solo una misura di sicurezza. Servono cifratura applicativa, token casuali monouso, conferma sul telefono, scadenza per inattività, revoca immediata e chiavi locali protette con Android Keystore.

Limiti dichiarati: reti di hotel/uffici possono isolare i dispositivi; l'app può essere sospesa dal sistema; iOS richiede gestione del permesso rete locale; il comportamento deve essere provato su dispositivi reali. Non promettere che il desktop bridge funzioni su qualsiasi rete.

Documenti vincolanti:

- `docs/specs/2026-08-24-privai-bridge-security-spec.md`
- `docs/superpowers/plans/2026-08-24-privai-bridge.md`

Questi due documenti sono precedenti al vincolo definitivo di zero costi: dove prevedono relay cloud, tetto di spesa o backend remoto sono superati dalla presente sezione e devono essere aggiornati prima dell'implementazione.

Ordine obbligatorio: APK reale → Keystore → Share Target nativo → threat review → protocollo locale cifrato → desktop QR. Non creare account Cloudflare, relay o backend di produzione. Un relay remoto è fuori perimetro finché resta valido il vincolo zero costi operativi.

## Valutazione critica del prodotto — 25 agosto 2026

Valutazione prudente dello stato attuale: **6,2/10**.

- Problema affrontato: 8/10. La privacy prima di usare servizi IA è concreta e coerente.
- Differenziazione: 7/10. Il ciclo Proteggi → usa qualsiasi IA → Ripristina localmente è il vantaggio distintivo.
- Utilità quotidiana: 6/10. Markdown e preparazione prompt, isolati, non bastano come abitudine di massa.
- Semplicità: 6,5/10. La home è chiara, ma i passaggi interni e il ritorno manuale dall'IA devono essere ridotti.
- Affidabilità/privacy: 5,5/10. Il motore base e il mapping volatile non sono ancora sufficienti per una promessa commerciale forte.
- Monetizzazione: 4,5/10. Pro e gettoni mostrano intenzioni, non ancora valore operativo verificato.
- Prontezza alla pubblicazione commerciale: 5/10. È adatta a test controllati, non ancora a essere venduta come protezione completa.

La direzione strategica approvata è passare da «cassetto degli attrezzi IA» a **strato privato tra ciò che l'utente ha sul telefono e qualsiasi IA o applicazione**. La funzione principale deve vivere anche nel menu Condividi del telefono: ricevi contenuto → controlla localmente → revisione → condividi versione protetta → ricevi risposta → ripristina.

Non esistono ancora dati verificati di product-market fit per questa specifica app. Adozione generale dell'IA e timori sulla privacy sostengono l'ipotesi, ma non dimostrano uso ricorrente o disponibilità a pagare. Servono test con utenti reali.

## Funzioni prioritarie per il salto di qualità

### P0 — necessarie prima della promessa commerciale

1. **Share Target Android nativo:** ricevere testo, file, foto e PDF dal menu Condividi senza URL/query string.
2. **Vault locale cifrato:** mapping persistente per lavoro, AES-GCM, Android Keystore, scadenza, cancellazione e opzionale biometria.
3. **Revisione manuale semplice:** evidenziare risultati; aggiungere ciò che il rilevatore non ha trovato; rimuovere falsi positivi; rinominare segnaposto.
4. **Ritorno e ripristino immediato:** condividere la risposta dell'IA nuovamente nell'app, associare il `jobId` corretto e ripristinare senza cercare la schermata.
5. **Ricevuta privacy prima dell'uscita:** mostrare cosa è stato trovato, cosa è stato sostituito, cosa potrebbe non essere stato riconosciuto e quale app riceverà il contenuto.

### P1 — funzioni quotidiane senza API pagate

1. **OCR locale:** screenshot, fotografie e PDF scansionati. Valutare ML Kit bundled/gratuito su Android e Vision su iOS; controllare licenze, dimensione e comportamento offline prima dell'integrazione.
2. **Voce orientata al risultato:** trasforma il parlato in messaggio, email, nota, checklist o richiesta per l'IA, poi protegge e condivide. Usare riconoscimento on-device quando disponibile; dichiarare con trasparenza quando il motore di sistema potrebbe usare la rete.
3. **Pulizia link:** rimuovere parametri di tracciamento comuni mantenendo intatta la destinazione.
4. **Pulizia metadati:** rimuovere localmente EXIF/geolocalizzazione dalle immagini e metadati supportati dai documenti prima della condivisione.
5. **Azioni rapide:** widget/shortcut per Proteggi appunti, Scansiona, Nota vocale e Ripristina ultimo lavoro.

### P2 — dopo sicurezza e validazione

1. Desktop QR locale cifrato.
2. Elaborazione batch e regole personalizzate Pro.
3. Progetti e cronologia cifrati.
4. Eventuale sincronizzazione cifrata nello spazio cloud dell'utente, solo dopo una specifica privacy dedicata.

### Da non costruire ora

- chatbot generico finanziato dallo sviluppatore;
- directory Discover, community/chat e video Learn;
- monitoraggio continuo degli appunti;
- login Google/Drive prima del vault cifrato;
- gamification complessa prima di dimostrare la retention;
- claim «100% anonimo», «anonimizzazione garantita» o «sicurezza assoluta»;
- qualsiasi funzione con API a consumo pagate dal proprietario.

## Ipotesi di home futura da validare

Per il pubblico generalista, le azioni dovrebbero esprimere obiettivi e non tecnologie:

1. **Proteggi e condividi** — azione principale.
2. **Scansiona** — foto, screenshot, PDF e documenti.
3. **Parla** — messaggio, email, nota, checklist o richiesta IA.
4. **Cronologia** — accesso secondario.

Converti in Markdown, Prepara per l'IA e Ripristina rimangono funzioni, ma possono diventare modalità o passaggi interni invece di quattro prodotti equivalenti in home. Questa modifica non è ancora approvata per l'implementazione: va prima prototipata e confrontata con l'interfaccia corrente.

## Android corrente

- Capacitor 8.5.0; application ID `app.privai.pocket`.
- `minSdkVersion = 24`, `compileSdkVersion = 36`, `targetSdkVersion = 36`.
- Asset web sincronizzabili in `android/app/src/main/assets/public/`.
- La compilazione locale è stata bloccata dal download di `gradle-8.14.3-all.zip` non raggiungibile nell'ambiente usato.
- Nessun APK installabile è stato ancora validato.

## Ultima verifica nota — 25 agosto 2026

- `node --test`: 68 test superati, 0 falliti.
- Test d'integrazione PDF: estrazione reale riuscita con il motore offline incluso.
- `node scripts/build-web.mjs`: build web completata in `www/`.
- `checkPackageSafety('www')`: `[]`; nessuna credenziale nota o configurazione di server remoto trovata nel pacchetto.
- Localizzazione italiana/inglese completata per flussi, piani, API, cronologia, collaborazione, dialoghi e contenuti dinamici.
- I valori predefiniti di Prepara cambiano lingua senza sovrascrivere ciò che l'utente ha già scritto.
- Il segnaposto tecnico `TELEPHONENUM` è stato sostituito nell'output protetto dal leggibile `PHONE`.
- Cache portata a `v17`; CSS, entry JavaScript e relativo grafo di moduli hanno query di versione per impedire combinazioni di file vecchi e nuovi.
- Modifiche `v17` verificate e pubblicate sul branch `main`.
- Non è disponibile un browser headless nel checkpoint: nessuna ispezione visuale reale a 360/390/430/680 px è stata eseguita in questo ambiente.
- Il checkpoint non contiene `.git`: non sono stati creati commit e non è stato modificato GitHub.
- Ultimo commit dei sorgenti/test prima dell'aggiornamento finale di questo handoff: `53eef4b7c67ba07996d987dea467f6d49f773efc`.

Questi risultati devono essere rieseguiti: non considerarli prova dell'APK.

## Prossime attività, in ordine

- [x] Correggere localmente la barra inferiore perché il nome Instagram sia leggibile insieme a `+` e microfono.
- [x] Forzare localmente il tema chiaro; resta da provarlo su Chrome, Samsung Internet e PWA installata.
- [x] Pubblicare il cestino contestuale negli editor e invalidare la cache con `v16`.
- [ ] Verificare visivamente la build servita da GitHub Pages su Chrome, Samsung Internet e PWA installata dopo l'aggiornamento del service worker.
- [ ] Pubblicare e provare l'importazione PDF su Chrome e Samsung Internet con PDF reali semplici, multipagina e scansionati.
- [ ] Ripristinare i metadati Git o continuare tramite il repository collegato.
- [ ] Sincronizzare la PWA `v17` nel progetto Android.
- [ ] Compilare, installare e smoke-testare l'APK su telefono reale.
- [ ] Definire test di accettazione e implementare il vault Keystore/AES-GCM con test prima del codice.
- [ ] Implementare revisione manuale dei dati trovati e ricevuta privacy.
- [ ] Implementare il Share Target nativo e il ritorno/ripristino intuitivo dall'assistente IA.
- [ ] Eseguire la revisione delle minacce e solo dopo iniziare il desktop QR locale.
- [ ] Prototipare OCR locale su dispositivi Android di potenza diversa; misurare dimensione, velocità e affidabilità.
- [ ] Progettare la modalità voce con distinzione verificabile tra riconoscimento on-device e servizio di rete.
- [ ] Valutare pulizia link e metadati come secondo vantaggio quotidiano oltre al flusso IA.
- [ ] Prototipare la home per obiettivi e confrontarla con quella attuale usando test utenti, senza eliminare le funzioni esistenti.
- [ ] Testare con almeno un piccolo gruppo di utenti non tecnici: completamento del primo lavoro, errori, numero di tocchi, ritorno settimanale e disponibilità a pagare.
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

> Continua il progetto mobile privacy-first dal repository GitHub `Thezine88/privai-pocket-preview` e considera `HANDOFF.md` la fonte di verità. Leggilo integralmente insieme alla specifica Android e ai documenti del desktop bridge prima di modificare il codice. Il nome commerciale è ancora aperto; `PrivAI Pocket` è solo operativo e `Scrubit` è stato ritirato per collisioni. Vincolo non negoziabile: il proprietario non vuole costi operativi, server obbligatori o API pagate da lui. Mantieni originali, mapping e chiavi sul telefono; non promettere anonimizzazione garantita. Prima verifica repository/commit, riesegui i test e controlla la PWA pubblica. Procedi nell'ordine: APK reale → vault Keystore/AES-GCM → revisione manuale/ricevuta privacy → Share Target e ripristino → OCR/voce locali → desktop QR sulla rete locale. Non attivare relay, pagamenti, Google Drive o API reali prima dei gate documentati. Prima di implementare una nuova direzione UI, proponi il flusso e attendi approvazione.
