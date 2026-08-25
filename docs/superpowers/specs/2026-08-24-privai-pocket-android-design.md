# PrivAI Pocket Android — Specifiche dell’MVP

## Obiettivo

Creare un APK Android che permetta anche a un utente poco esperto di trasformare un testo in Markdown ordinato, controllare e mascherare localmente i dati personali strutturati più comuni e infine copiare o condividere il risultato con qualsiasi applicazione compatibile.

## Funzioni operative nella prima APK

- Incollare un testo o importare un file locale `.txt` o `.md`.
- Trasformare il contenuto in Markdown leggibile direttamente sul telefono.
- Individuare con regole locali email, numeri di telefono, valori simili a codici fiscali italiani, IBAN, indirizzi web e date.
- Permettere all’utente di scegliere i dati trovati e sostituirli con segnaposto coerenti, come `[EMAIL_1]`.
- Creare un pacchetto di istruzioni Markdown pronto per un assistente IA esterno.
- Copiare il risultato e aprire il menu di condivisione Android.
- Conservare sul telefono una cronologia limitata, con possibilità di eliminare ogni elemento.
- Mostrare il contatore locale del piano Free: tre azioni giornaliere per ogni strumento, oltre a un prototipo dei punti.
- Mostrare una pagina informativa con tutti i vantaggi Pro, senza acquisto attivo.
- Mostrare la configurazione delle API personali senza effettuare chiamate finché le chiavi non potranno essere protette con Android Keystore.
- Mostrare il collegamento cliccabile «in collaborazione con @notizieartificiali.ai» verso `https://www.instagram.com/notizieartificiali.ai/`.

## Italiano e inglese

- Al primo avvio l’app legge la lingua del telefono: italiano per `it`, inglese per tutte le altre lingue.
- In Impostazioni è sempre disponibile il selettore `Italiano / English`.
- La scelta viene conservata esclusivamente sul dispositivo e applicata immediatamente.
- Devono essere tradotti navigazione, pulsanti, esempi, errori, privacy, Free/Pro e onboarding.
- Il testo inserito dall’utente non viene tradotto automaticamente.
- In «Prepara per l’IA» l’utente sceglie separatamente la lingua del risultato: stessa lingua del contenuto, italiano oppure inglese.
- Una chiave di traduzione mancante deve mostrare il testo inglese, senza lasciare etichette vuote.

## Funzioni rimandate

- OCR di immagini e PDF.
- Trascrizione audio.
- Riconoscimento contestuale di nomi, organizzazioni, indirizzi scritti liberamente e altri identificativi semantici.
- Accesso Google, sincronizzazione Drive, acquisti, abbonamenti e gestione del programma creator.
- Chiamate reali alle API e trattamento cloud dei documenti.
- Pacchetto iOS.

Queste funzioni non devono sembrare attive. Possono apparire soltanto in un’area chiaramente indicata come sviluppi futuri.

## Architettura

La PWA esistente rimane il livello applicativo. Capacitor aggiunge un contenitore Android leggero e inserisce le risorse web nell’APK. I moduli JavaScript puri continuano a gestire Markdown, rilevamento, mascheramento, saluti, contatori e memoria locale. Le future integrazioni Android saranno isolate dietro adattatori.

La localizzazione usa dizionari JavaScript `it` ed `en`, richiamati con chiavi stabili. Non vengono duplicate pagine o logica applicativa.

La prima APK non elabora documenti su server remoti e non contiene chiavi OpenAI, Anthropic, Groq, Google o di altri fornitori.

## Compatibilità

L’app non viene limitata in base al nome commerciale del telefono. Gli strumenti essenziali sono deterministici e devono rimanere disponibili sulle versioni Android supportate, anche senza NPU. Le future funzioni pesanti useranno controlli delle capacità del dispositivo: potrà essere disabilitata una singola funzione, non l’intera app.

Il pacchetto usa Capacitor 8, che supporta ufficialmente Android 7/API 24 o successivi e richiede una WebView aggiornata. Il target di pubblicazione è API 36. La compatibilità effettiva dovrà comunque essere verificata su dispositivi reali.

## Privacy e fiducia

- Il flusso predefinito non invia il contenuto dei documenti a un server.
- L’interfaccia deve parlare di «controllo locale base», «protezione» o «mascheramento» e non deve promettere anonimizzazione garantita.
- Dopo il controllo deve avvertire che nomi, indirizzi e riferimenti contestuali insoliti potrebbero non essere riconosciuti.
- L’utente deve controllare il risultato prima della condivisione.
- La cronologia rimane locale e può essere eliminata.
- I campi BYOK sono dimostrativi in questa release; la memorizzazione reale delle chiavi è bloccata fino all’integrazione con Android Keystore.

## Esperienza utente

La grafica usa bianco caldo `#FFF8F1`, arancione `#FF6B00`, nero `#111114`, grigio `#68635F` e verde privacy `#20A464`. Prevede titoli grandi, schede arrotondate, ombre morbide, pulsanti comodi e un esempio semplice in ogni sezione.

Il saluto iniziale cambia in base all’orario e alla sessione tra le frasi già approvate. Copia e Condividi sono azioni principali in ogni risultato. La mascotte presenta brevemente l’app e sottolinea che il controllo base avviene sul telefono.

## Free e Pro in questa release

I limiti Free sono salvati localmente e servono a testare comprensione e attrito; non costituiscono ancora un sistema commerciale sicuro. Pro è soltanto un’anteprima dei vantaggi. Non viene riscosso alcun pagamento.

Il prodotto a pagamento dovrà monetizzare comodità e funzioni locali, non token API sostenuti dallo sviluppatore. Quando verrà introdotta, l’IA cloud sarà facoltativa e BYOK, salvo l’approvazione futura di un diverso modello economico finanziato.

## Gestione degli errori

- Un testo vuoto mostra un invito comprensibile invece di avviare l’elaborazione.
- I file non supportati vengono rifiutati prima della lettura.
- Se copia o condivisione falliscono, il risultato resta visibile e viene proposta l’altra azione.
- Una cronologia locale danneggiata viene ignorata senza bloccare l’avvio.
- Ogni funzione non disponibile o rimandata spiega il proprio stato e non simula mai un successo.

## Verifica

- Tutti i test esistenti devono continuare a passare.
- Nuovi test devono controllare entrambe le lingue, fallback inglese, persistenza della scelta, configurazione Android, copia/condivisione, linguaggio privacy e disattivazione delle funzioni rimandate.
- Le risorse web devono essere preparate e sincronizzate nel progetto Android.
- La compilazione deve produrre un APK di debug.
- L’APK deve essere controllato a larghezza smartphone e, quando è disponibile un emulatore o un dispositivo fisico, avviato su Android.
- L’handoff deve registrare comandi, risultati, limiti conosciuti e percorsi degli artefatti.

## Criteri di accettazione

1. L’APK di debug può essere installato su uno smartphone Android compatibile.
2. Dopo l’installazione, l’app si avvia senza richiedere una connessione.
3. Conversione Markdown e mascheramento strutturato non effettuano richieste di rete.
4. Copia e Condividi sono visibili per ogni risultato generato.
5. L’interfaccia passa tra italiano e inglese senza riavvio.
6. Nel codice e nell’APK non è presente alcun segreto di provider.
7. L’interfaccia non presenta mai il rilevatore base come anonimizzazione completa.
8. Le funzioni rimandate sono disabilitate o indicate chiaramente come future.
9. Lo ZIP del progetto e `HANDOFF.md` permettono di riprendere il lavoro in una nuova conversazione.
