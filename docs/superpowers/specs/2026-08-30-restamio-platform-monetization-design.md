# RestaMio — strategia piattaforme e monetizzazione

Stato: approvato per la progettazione  
Data: 2026-08-30  
Branch: `codex/restamio-product-architecture`

## Obiettivo

Trasformare il prototipo PrivAI Pocket in RestaMio, un'app privacy-first per Android e iOS che protegge localmente i dati personali prima dell'uso di strumenti di IA e li ripristina localmente nella risposta.

La prima versione completa viene sviluppata e validata su Android. L'architettura deve però evitare dipendenze applicative irreversibili da Android, così che il successivo porting iOS possa riutilizzare motore, workflow, testi, design system e test.

## Strategia di distribuzione

1. Android è la piattaforma di sviluppo e validazione iniziale.
2. iOS viene realizzato dopo la stabilizzazione del flusso Android.
3. La modalità desktop resta un'estensione associata all'app mobile, non un prodotto indipendente nella prima fase.
4. La beta pubblica non contiene vendite attive.
5. Free e Pro esistono come entitlement interni, ma durante la beta l'acquisto rimane disattivato.
6. La monetizzazione verrà attivata soltanto tramite un soggetto commerciale idoneo, ad esempio un publisher.
7. Nessun account RestaMio è obbligatorio per l'uso ordinario dell'app.

## Principio commerciale

La protezione di base non viene usata come leva coercitiva. Inserimento manuale, rilevamento locale, selezione dei dati, protezione e ripristino del testo restano illimitati anche nel piano Free.

Il piano Pro vende capacità, velocità, personalizzazione e automazione.

## Matrice Free e Pro

| Funzione | Free | Pro una tantum |
|---|---|---|
| Protezione e ripristino manuale del testo | Illimitati | Illimitati |
| Lavori contemporaneamente presenti in Cassaforte | 2 | Illimitati entro i limiti tecnici del dispositivo |
| Parole da nascondere sempre | 8 | Illimitate entro i limiti tecnici del dispositivo |
| Trascrizione mediante chiave Groq personale | 1 al giorno | Nessun limite imposto da RestaMio |
| OCR di immagini e screenshot | 3 al giorno | Nessun limite imposto da RestaMio |
| Documento importato | Massimo 10 pagine | Fino al limite tecnico dichiarato dall'app |
| Modalità desktop | 5 sessioni mensili da 10 minuti | Illimitata |
| Azioni rapide | 4 predefinite | Personalizzabili |
| Elaborazione multipla | Non disponibile | Disponibile |

I limiti, le condizioni e la disponibilità dei servizi esterni continuano ad applicarsi. In particolare, RestaMio non promette uso illimitato di Groq: il piano Pro rimuove soltanto il limite applicato da RestaMio.

## Entitlement

L'applicazione deve usare una singola interfaccia astratta per determinare il piano corrente:

- `free`
- `pro`
- `beta_pro_preview` esclusivamente per test autorizzati

Le implementazioni future saranno:

- Google Play Billing su Android;
- StoreKit su iOS;
- modalità beta senza transazione;
- modalità di sviluppo non inclusa nelle build di produzione.

Il codice delle funzionalità non deve interrogare direttamente Google Play o StoreKit. Deve ricevere lo stato da un servizio di entitlement comune.

La fonte autorevole dell'acquisto resta lo store. Una cache locale può migliorare l'avvio offline, ma deve poter essere riconciliata con lo store e non deve trasformarsi in un sistema di licenza inventato da RestaMio.

## Acquisto tra piattaforme

Nella prima versione commerciale, Android e iOS hanno acquisti separati, legati al rispettivo account dello store. Non viene introdotto un account RestaMio soltanto per sincronizzare gli acquisti.

Un telefono con Pro può abilitare la modalità desktop secondo il protocollo di associazione previsto. I dettagli tecnici del pairing desktop saranno definiti in una specifica separata prima dell'implementazione.

## Esperienza dei limiti

- Nessun blocco interrompe protezione o ripristino manuale.
- Il contatore viene mostrato soltanto vicino a una funzione limitata.
- Prima dell'esaurimento si usa un messaggio informativo, non allarmistico.
- Al raggiungimento del limite si spiega cosa è successo e quando il limite si rinnova.
- Durante la beta, ogni CTA di acquisto è nascosta o sostituita da un'informazione esplicita; non deve simulare un pagamento.
- Il ripristino di un acquisto deve essere sempre accessibile nella futura versione commerciale.
- L'interfaccia non deve dichiarare “illimitato” quando esistono limiti del dispositivo o di servizi esterni.

## Persistenza dei contatori

I contatori Free devono essere locali, minimali e indipendenti dai contenuti elaborati. Non devono registrare testo, immagini, audio o dati personali per misurare l'uso.

Dati ammessi:

- identificatore della funzione;
- quantità utilizzata;
- periodo di riferimento;
- istante dell'ultimo ripristino del periodo;
- piano corrente.

La protezione contro la manomissione non deve introdurre account, tracciamento o server nella beta. Una protezione commerciale più robusta richiederà una valutazione separata con il publisher.

## Privacy

- Il motore PII e il ripristino restano locali.
- OCR rimane locale nella prima versione prevista.
- La trascrizione audio usa direttamente la chiave Groq dell'utente.
- Le chiavi sono conservate in Android Keystore o iOS Keychain.
- I contatori non contengono materiali dell'utente.
- Telemetria commerciale o analytics non sono introdotte implicitamente da questa specifica.

## Errori e recupero

- Se lo stato dello store non è disponibile, l'app usa con cautela l'ultimo entitlement verificato e riprova senza bloccare i lavori locali già esistenti.
- Un errore di acquisto non elimina dati o lavori.
- Un errore Groq non consuma la quota giornaliera se la trascrizione non viene completata.
- Un errore OCR non consuma la quota se non viene prodotto testo utilizzabile.
- Una sessione desktop viene conteggiata solo dopo la connessione riuscita.
- Il cambio di data o fuso orario non deve duplicare arbitrariamente le quote.

## Test richiesti

- piano Free e Pro su ogni funzione limitata;
- confini giornalieri e mensili;
- fallimento e ripetizione di OCR, Groq e pairing desktop;
- avvio offline con entitlement memorizzato;
- riconciliazione con acquisto ripristinato, rimborsato o revocato;
- nessun accesso accidentale al billing nella beta;
- nessun contenuto utente nei contatori;
- accessibilità dei messaggi di limite;
- safe area e Dynamic Type nelle schermate commerciali.

## Fuori ambito

Questa specifica non stabilisce:

- prezzo finale di Pro;
- contratto con il publisher;
- protocollo definitivo della modalità desktop;
- backend commerciale;
- politiche promozionali;
- grafica definitiva della schermata Pro.

Questi elementi richiedono decisioni separate prima dell'implementazione commerciale.
