# RestaMio — Project Handoff

Data handoff: 30 agosto 2026  
Stato: UX/UI in progettazione progressiva  
Brand di lavoro approvato: **RestaMio** (`Resta` scuro, `Mio` arancione)

## 1. Fonte autorevole

La specifica tecnica principale è `RestaMio_UI_UX_Spec.md`, versione **1.7**. Le immagini esplicitamente approvate in chat sono riferimenti visivi vincolanti; in caso di conflitto visivo prevale l’immagine approvata più recente. Se un punto è ancora aperto, chiedere conferma prima di implementarlo.

Metodo concordato:

1. progettare una schermata alla volta;
2. mostrare prima un mockup;
3. raccogliere l’approvazione esplicita;
4. solo dopo aggiornare la specifica tecnica;
5. non reinterpretare testi o layout già approvati.

## 2. Prodotto e pubblico

RestaMio è un’app privacy-first per iOS e Android, con futura modalità desktop. Aiuta professionisti, freelance e persone poco esperte di AI a:

1. incollare, scrivere, importare o condividere contenuti;
2. rilevare localmente dati personali e sensibili;
3. scegliere in modo semplice cosa proteggere;
4. sostituire localmente i dati con segnaposto reversibili;
5. usare il testo protetto con un chatbot esterno;
6. riportare la risposta in RestaMio;
7. ripristinare localmente i dati originali.

Promessa centrale: **i dati originali e la mappatura restano sul dispositivo**. Ogni eccezione online deve essere esplicita e facoltativa.

## 3. Priorità decisionali

Ordine non negoziabile:

1. comprensibilità immediata;
2. pochi tocchi e nessuna scelta inutile;
3. sicurezza e affidabilità;
4. trasparenza sulle operazioni online;
5. coerenza visiva;
6. funzioni avanzate solo fuori dal percorso principale.

Non esporre termini come PII, NER, anonimizzazione, token, mapping o modelli. Usare verbi concreti: `Proteggi`, `Incolla`, `Copia`, `Condividi`, `Continua`.

## 4. Direzione visiva

- Tema chiaro caldo e minimale.
- Sfondo principale `#FAF6F5`.
- Superfici bianche, bordi sottili caldi, ombre molto leggere.
- Arancione primario `#F4511E`; pressed `#D94312`.
- Testo primario quasi nero `#111111`; secondario `#737373`.
- Una sola azione primaria arancione per fase.
- Raggi ampi ma non giocattolosi; icone outline coerenti.
- Target di tocco minimo 44 × 44 dp/pt.
- Font scalabile fino al 130% senza troncare CTA o informazioni essenziali.
- Font vincolante: **Poppins**, incorporato nell’app e identico su Android, iOS e desktop; non sostituirlo con Inter o font di sistema negli screen di approvazione.

## 5. Safe area — vincolo globale

La safe area è una regola di sistema, non una correzione locale.

- Tutti i controlli interattivi terminano sopra gli inset reali del sistema.
- CTA sticky: almeno 16 dp/pt sopra l’inset inferiore.
- Con tastiera aperta usare l’inset IME, senza sommarlo alla navigation bar.
- Il contenuto scrollabile riceve padding inferiore pari alla barra sticky + 16 dp/pt.
- Nessun testo secondario sotto la CTA quando potrebbe avvicinarsi alla barra Samsung.
- Test obbligatori: Samsung tre pulsanti, Android a gesti, iPhone Home Indicator, tastiera aperta e font 130%.
- La guida Groq ha una sola azione inferiore: `Ho copiato la chiave`. `Torna indietro` è stato eliminato perché ridondante e troppo vicino alla barra Samsung.

## 6. Schermate approvate

### Home

- Home con lavoro da completare.
- Home senza lavori/primo utilizzo.
- Home con risposta AI in attesa.
- Stato esatto: `Hai un lavoro da completare`.
- CTA esatta: `Incolla la risposta dell’AI`.
- `Cassaforte` resta il nome della destinazione centrale.

### Onboarding Willy

- Tre passaggi.
- Willy presenta l’app e il flusso protetto → risposta → ripristino.
- Navigazione compatta; evitare grandi pulsanti `Avanti`/`Indietro` affiancati.
- La demo prima/dopo può essere animata.
- Il terzo passaggio mantiene sempre visibili le due schede approvate, con freccia centrale; non convertirlo in una singola scheda.
- Willy non coincide con la piccola mascotte provvisoria della Home.

### Inserimento contenuto

- Campo per scrivere o incollare.
- Rilevamento immediato mentre l’utente scrive/incolla.
- Elaborazione locale chiaramente comunicata.
- CTA collegata allo stato del contenuto e posizionata sopra gli inset.

### Dati da proteggere

- Categorie comprimibili.
- Switch a destra: ON = protegge; OFF = lascia visibile.
- Categoria e singolo valore hanno switch separati dal chevron.
- Stato misto quando solo alcuni elementi della categoria sono attivi.
- Valori identici raggruppati: `Simone Lombardo — 3 occorrenze`.
- Categoria corretta: `Nomi e cognomi`, riferita a persone.
- Date e link sono verificabili/proteggibili; nessuna esenzione rigida.
- Azioni globali: `Proteggi tutto`, `Lascia tutto visibile`, `Aggiungi un dato`.
- CTA: `Proteggi e continua`; stato: `{n} dati protetti`.

### Cosa vuoi fare con questo testo?

Quattro azioni rapide quadrate e compatte:

- `Scrivi un’email`
- `Riassumi`
- `Migliora il CV`
- `Personalizza`

`Personalizza` è fissa; le altre tre sono configurabili nelle Impostazioni. Sotto possono apparire domande contestuali come `A chi scrivi?` e `Cosa vuoi ottenere?`. CTA: `Continua`.

### Controllo finale

- La richiesta generata è leggibile e direttamente modificabile.
- Riepilogo dei dati protetti comprimibile.
- CTA sticky: `Apri nell’AI`.

### Uscita e rientro dal chatbot

Istruzione approvata:

> Invia al chatbot il testo protetto. Quando ricevi la risposta, copiala o condividila con RestaMio.

- Stepper: `Protetto / Inviato / Ripristina`.
- CTA al rientro: `Incolla la risposta dell’AI`.
- Home e Cassaforte si aggiornano allo stato in attesa.

### Risultato

- Titolo: `Testo ripristinato`.
- Messaggio: `I tuoi dati sono tornati al loro posto.`
- Evidenziare in verde solo i valori ripristinati.
- Azioni: `Copia il testo`, `Condividi`, `Vedi cosa è cambiato`.
- Caso raro non risolto: `Testo quasi pronto`, evidenza ambra, `Copia comunque`, `Incolla un’altra risposta`.
- Non chiedere mapping manuali; normalizzare automaticamente solo con certezza e non indovinare mai.

## 7. Modulo Groq approvato

### Perimetro

- Funzione facoltativa BYOK per trascrivere vocali WhatsApp/Telegram.
- Ogni utente usa il proprio account e la propria API key Groq.
- Nessuna chiave, quota o costo a carico di RestaMio.
- Richieste dirette dispositivo → Groq; nessun server RestaMio.
- Chiave in Keychain/Android Keystore, esclusa da log, backup, analytics e crash report.
- L’audio lascia il dispositivo: mostrarlo prima del primo invio.
- Groq offre attualmente un piano gratuito con limiti; non promettere gratuità permanente o `senza scadenza`.
- Testo marketing approvato: `Un piano gratuito generoso`, sempre accompagnato dall’invito a verificare condizioni e limiti aggiornati.
- Non usare Groq per screenshot nella prima versione; preferire OCR locale.

### Tre schermate

1. `Trascrivi i vocali`: spiega funzione online, piano, facoltatività e responsabilità del piano.
2. `Configura Groq`: campo API key mascherato, `Incolla`, mostra/nascondi, `Scopri come fare`, `Verifica e salva`.
3. `Crea la tua API key`: tre passaggi con link ufficiali Groq e suggerimento Zero Data Retention; CTA unica `Ho copiato la chiave`.

### Errori

- Chiave non valida/permessi insufficienti.
- Rate limit raggiunto, presentato come limite Groq e non come errore RestaMio.
- Connessione assente.
- Una nuova chiave non verificata non sostituisce una chiave valida precedente.

## 8. Browser AI avanzato — decisione architetturale, non ancora mockuppata

- Percorso principale: app AI installate e già autenticate.
- Opzione futura: `Browser AI privato`, nella sezione Avanzate.
- Sessione temporanea; nessuna credenziale salvata da RestaMio.
- Reset automatico di cookie, cache, cronologia e dati della sessione.
- Il login sarà necessario a ogni nuova sessione privata.
- Se il reset non è garantibile sul dispositivo, non mostrare la funzione.
- Non chiamare questa funzione `Associa account`.
- Non è ancora una schermata approvata: mostrarne il mockup prima di inserirla nella specifica.

## 8A. Elaborazione adattiva approvata

Quando l’utente condivide un contenuto, il tipo viene riconosciuto automaticamente e cambia soltanto il linguaggio visivo necessario:

- audio: waveform arancione animata, badge `FUNZIONE ONLINE`, fasi `Preparo · Invio · Trascrivo`;
- documento: foglio con righe illuminate, badge `SOLO SUL DISPOSITIVO`, fasi `Apro · Leggo · Controllo`;
- screenshot/immagine: linea di scansione, badge `SOLO SUL DISPOSITIVO`, fasi `Preparo · Leggo · Controllo`.

Usare progresso reale quando misurabile e stato indeterminato negli altri casi; mai inventare percentuali. Se il lavoro locale dura meno di circa 400 ms, saltare la schermata invece di rallentare l’utente. Annullamento sempre disponibile sopra la safe area. Supportare `Riduci movimento`.

Risultato audio approvato: `Trascrizione pronta`, player locale, testo direttamente modificabile, banner con conteggio dati rilevati, azioni secondarie `Copia testo`/`Condividi` e CTA primaria `Proteggi e continua`. Il rilevamento parte localmente appena arriva la trascrizione e si aggiorna dopo le modifiche.

Risultato OCR approvato: `Testo estratto`, miniatura compatta e `Vedi originale` con zoom, testo riconosciuto modificabile, badge locale, banner dati e CTA `Proteggi e continua`. OCR e rilevamento restano sul dispositivo.

## 9. Riferimento tecnico PII

Repository studiata: `https://github.com/Rizzo-AI-Academy/rizzo-pii`.

Obiettivo: replicare e migliorare il meccanismo, non copiare l’interfaccia.

- rilevamento e mapping reversibile locali;
- placeholder stabili;
- valori identici condividono lo stesso placeholder;
- regex/checksum per identificatori strutturati;
- modello locale ottimizzato e fusione conservativa dei risultati;
- nessun fallback online per il rilevamento PII.

Il repository di riferimento è nato per desktop CPU. Prestazioni e memoria su Android/iPhone devono essere misurate su dispositivi reali prima di fissare modello, quantizzazione o requisiti minimi.

## 10. Mockup canonici disponibili

La specifica resta autorevole; questi file sono riferimenti visivi approvati o più recenti:

| Area | File |
|---|---|
| Scelta attività compatta | `generated_images/exec-6672096e-bbd5-4740-926e-ef31e183507a.png` |
| Controllo finale | `generated_images/exec-097d464b-6c35-4b4d-b92c-3ee16a062451.png` |
| Rientro dal chatbot | `generated_images/exec-4ffef141-7b35-4ada-857c-2272c651de83.png` |
| Home in attesa | `generated_images/exec-d66cdd1c-947c-4300-acb5-5741a1625c5c.png` |
| Testo ripristinato | `generated_images/exec-1b57f5d7-fbcf-4782-8771-5351d1c16949.png` |
| Testo quasi pronto | `generated_images/exec-9487497d-b012-4956-9b57-f2b6536050bb.png` |
| Dati da proteggere — switch | `generated_images/exec-c9af2577-57ff-4ee1-9fbc-2fc6852af762.png` |
| Groq — presentazione | `generated_images/exec-0b085134-f730-492f-a48e-f083f99f205b.png` |
| Groq — API key | `generated_images/exec-f7810899-db3b-4ede-ac1d-faf2fef49262.png` |
| Groq — guida corretta safe area | `generated_images/exec-9a112b51-8882-44e1-862c-4a4b3c77bc92.png` |
| Elaborazione audio | `generated_images/exec-786a771a-d918-4f34-bdea-ceb0aca00055.png` |
| Elaborazione documento | `generated_images/exec-a2ae54c8-e17d-4b6b-b32f-411611d78bc0.png` |
| Elaborazione screenshot | `generated_images/exec-7cd35958-c9be-4701-a6e9-29fb42b714b3.png` |
| Risultato trascrizione | `generated_images/exec-cd870680-5483-41b0-ae8d-53172f0ed154.png` |
| Risultato OCR screenshot | `generated_images/exec-cedfb13b-cc32-4c34-aa95-c0f7642a23ad.png` |

Non usare le versioni precedenti della schermata Dati da proteggere con checkbox né la guida Groq con `Torna indietro` sotto la CTA.

## 11. Questioni aperte

1. Confermare se la traduzione audio Groq farà parte della prima versione oppure se Groq servirà soltanto alla trascrizione nella lingua originale.
2. Definire il modello locale e il budget reale di RAM, spazio, latenza e batteria sui dispositivi minimi supportati.
3. Definire OCR locale per screenshot/immagini e gestione di orientamento, ritaglio e qualità insufficiente.
4. Definire formati file supportati e limiti di dimensione.
5. Definire retention locale, cifratura e cancellazione dei lavori in Cassaforte.
6. Verificare termini, limiti e URL Groq prima di ogni release; non hardcodare promesse commerciali.

## 12. Prossimo ordine di lavoro consigliato

1. **Ingresso condivisione/importazione**: validazione iniziale, consenso audio al primo utilizzo ed errori prima dell’elaborazione.
4. **Importazione file**: formati, errori e documenti non leggibili.
5. **Cassaforte**: vuoto, elenco, dettaglio, scadenza e cancellazione.
6. **Impostazioni**: Groq collegato, azioni rapide, privacy, Browser AI avanzato e piano.
7. **Modalità desktop**.

Per il prossimo passo, partire dal mockup dell’ingresso `Importa un file`/contenuto condiviso, ma separare visivamente tre casi soltanto dopo che il sistema ha riconosciuto il tipo: documento, immagine o audio. Il tap dalla Home deve aprire direttamente il selettore nativo, senza una schermata `Scegli il tipo` non necessaria.

## 13. Divieti e controlli finali

- Non introdurre server RestaMio per elaborare contenuti o chiavi.
- Non inviare dati originali o mapping ai chatbot.
- Non memorizzare password dei provider.
- Non promettere funzionalità, gratuità o limiti non verificati.
- Non aggiungere bottom navigation nelle fasi lineari del lavoro.
- Non inserire CTA o testo sotto gli inset di sistema.
- Non modificare `Cassaforte`, `Hai un lavoro da completare` o i testi già approvati.
- Non aggiornare la specifica per una schermata prima dell’approvazione visiva dell’utente.
