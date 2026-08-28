# Ponte desktop via QR/link — Specifica

## Obiettivo

Permettere di continuare un lavoro dal computer — scrivere/incollare comodamente con una tastiera vera — senza un server a pagamento, senza installare nulla sul computer, e senza che gli originali o le chiavi lascino mai il telefono in modo permanente. È il punto della roadmap "salto di qualità" con la priorità più alta dopo il riquadro Impostazioni Rapide (`HANDOFF.md` §7, §10).

## Perché questo disegno e non altri (storia delle decisioni)

Discusso in sessione, vale la pena registrarlo perché la prima idea ovvia non funziona:

1. **Un browser non può ricevere connessioni.** Nessun sito web può "ascoltare" sulla rete — è una regola di sicurezza di ogni browser. Se il computer deve restare "solo browser, zero installazioni" (deciso in sessione), **deve essere il telefono a fare da ricevente**: ha già un'app nativa, può tenere una porta in ascolto sulla rete locale.
2. **Scartato il modello WhatsApp Web/Telegram Web.** Lì il computer mostra il QR e tutti i messaggi passano dai server dell'azienda — non è un collegamento diretto fra i due dispositivi, funziona anche su reti diverse proprio perché c'è un server sempre acceso che fa da tramite. Replicarlo davvero significherebbe introdurre il server a pagamento che il vincolo economico di `HANDOFF.md` §1 esclude. Qui il QR/link lo mostra il telefono, ed è **speculare**: sostituisce l'"autenticazione verso un server" con l'"indirizzo diretto sulla rete locale".
3. **Scartato il canale senza alcun ricevente (WebRTC con segnalazione manuale).** Tecnicamente evita del tutto un server, ma richiederebbe uno scambio di QR in entrambe le direzioni per completare l'aggancio (uno dal telefono, uno di ritorno dal computer) — più scomodo, per un vantaggio (attraversare reti diverse/NAT) che non serve quando i due dispositivi sono già sulla stessa rete.
4. **Link condivisibile invece di (solo) QR.** L'utente ha fatto notare un caso reale non coperto da un QR-only: un PC fisso senza webcam. Un link normale, condiviso con lo stesso gesto già usato per condividere un documento (email a sé stessi, WhatsApp Web, note), funziona identico su fisso e portatile. Il QR resta in evidenza sullo schermo per chi preferisce scansionarlo (soprattutto da portatile), il link è la via sempre disponibile.
5. **Interfaccia completa sul computer, non solo un ponte per copia/incolla.** Deciso esplicitamente: invece di costruire una seconda interfaccia "leggera" solo per mandare/ricevere testo (più semplice ma raddoppia il lavoro di manutenzione), **il telefono serve al computer la stessa identica app** — stesso HTML/CSS/JS, stesse schermate, stesso motore di rilevamento. Zero UI duplicata, zero rischio che le due versioni si disallineino nel tempo. Unico pezzo che cambia: dove vive la cassaforte (sotto).

## Promessa, riformulata per includere il ponte

La promessa esistente ("il controllo avviene qui, niente esce dal telefono") va estesa con onestà, non aggirata:

> Gli originali e le chiavi restano sul telefono. Quando lavori dal computer, quest'ultimo è **un'estensione del tuo telefono sulla tua rete** — non un secondo posto dove i dati si fermano. Se incolli un documento nuovo direttamente dal computer, quel testo tocca per forza anche la memoria del computer per il tempo di mascherarlo, esattamente come succede oggi nella app del telefono: è la stessa promessa ("controllo locale"), estesa ai tuoi dispositivi sulla tua rete, non ristretta al solo telefono.

Non cambia: la cassaforte (mapping, chiavi, lavori) vive **solo** nel Keystore del telefono. Il computer non ne tiene mai una copia propria — ogni lettura/scrittura passa dal telefono in tempo reale, tramite un permesso che scade da solo.

## Architettura

```
Telefono                                          Computer
--------                                          --------
Tocca "Collega al computer"
  → avvia il server locale (nativo)
  → genera token effimero + QR + link
  → mostra QR in evidenza + link da condividere

                                    Condivide il link (email a sé, WhatsApp Web, ecc.)
                                    oppure scansiona il QR con un altro dispositivo
                                                    ↓
                              Apre il link pubblico (GitHub Pages, statico, gratis)
                              → nessun dato nell'URL, solo indirizzo locale + token
                              → reindirizzamento immediato (window.location, non una
                                richiesta di rete: non viene bloccato dalla regola
                                "mixed content" che vieta a una pagina HTTPS di
                                *parlare* con un indirizzo HTTP non sicuro)
                                                    ↓
                              Il browser apre http://<ip-locale>:<porta>/?token=...
                              → il TELEFONO serve la stessa app (index.html, styles.css,
                                src/**), da questo punto tutto è sullo stesso indirizzo,
                                nessun blocco del browser
                              → app.mjs si accorge di girare in modalità ponte e usa
                                un magazzino remoto al posto del Keystore diretto
                              → layout 16:9 per schermo largo (sotto)

Il telefono mostra "PC collegato" finché la sessione è attiva.
```

**Come l'app riconosce la modalità ponte**: se l'URL con cui è stata caricata contiene `?token=...` **e** `Capacitor.isNativePlatform()` è falso (il codice gira in un browser normale, non nella WebView nativa), `app.mjs` usa `createRemoteStore(token)` al posto di `createSecureStore()`. Nessun nuovo meccanismo di segnalazione: la stessa distinzione "nativo sì/no" che il codice usa già ovunque per scegliere fra plugin nativo e ripiego web.

## Componenti nuovi

**Nativi** (Android, stesso pacchetto, stesso stile degli altri plugin):

- `BridgeServerPlugin.java` — avvia/ferma un server HTTP locale minimo (libreria leggera, licenza libera, stesso criterio già usato per `SecureStorePlugin`: niente dipendenze pesanti o instabili). Due compiti, nessuno dei quali contiene logica di dominio:
  1. Serve i file statici dell'app (`index.html`, `styles.css`, `src/**`) così com'è, esattamente il contenuto che gira sul telefono.
  2. Espone tre endpoint che rispecchiano `createSecureStore` — `GET /api/store/:key`, `PUT /api/store/:key`, `DELETE /api/store/:key` — ognuno verificato contro il token della sessione attiva (`createDesktopSessions`, già scritto in `src/domain/plan.mjs`) prima di toccare `SecureStorePlugin`. Un token scaduto o sbagliato riceve un rifiuto, mai un accesso silenzioso.
- Restituisce a JS l'indirizzo IP locale effettivo e la porta assegnata, per costruire QR e link.

**JS**:

- `createRemoteStore(token, { fetchImpl })` in `src/domain/vault.mjs` — stessa forma di `createSecureStore` (`get`/`set`/`remove`/`secure`), ma ogni chiamata è una richiesta HTTP verso il telefono con l'intestazione del token. Nessuna cache locale persistente: se la connessione cade, la sessione smette di funzionare finché non si ricollega — non "funziona a metà con dati vecchi".
- Schermata "Collega al computer" (nuova vista, coerente con le altre): QR **vero e scansionabile**, link con anteprima curata sotto (titolo, icona — vedi la paginetta pubblica), stato "PC collegato" + tempo restante della sessione, pulsante per staccare subito.
  **Correzione rispetto a quanto trovato nel codice**: `drawQr()` in `app.mjs` (usato oggi per la schermata piani) è dichiarato dal suo stesso commento come "disegnato a mano", puramente decorativo — non incoderebbe un QR leggibile da una fotocamera vera. Va aggiunta una vera libreria di generazione QR, in un file `vendor/` a modulo singolo senza dipendenze (stesso schema già usato per `pdf.mjs`: licenza libera dichiarata in un file `LICENSE` dedicato, nessun pacchetto npm, nessun bundler). `drawQr()` esistente resta per la schermata piani, che non cambia; la nuova schermata usa il generatore vero.
- Layout 16:9 per la modalità ponte: quando `app.mjs` rileva di girare in modalità ponte, aggiunge un attributo (es. `document.documentElement.dataset.context = 'desktop'`) che un nuovo blocco CSS usa per passare da `.shell` centrata e stretta (pensata per un telefono in verticale) a una disposizione pensata per uno schermo largo — più spazio orizzontale, non lo stesso layout verticale semplicemente allargato. Il resto del CSS (colori, componenti, temi) resta invariato: cambia la disposizione, non l'aspetto.
  **Requisito esplicito**: deve essere un vero progetto grafico per schermo largo, non l'interfaccia da telefono allargata — niente estetica generica da IA ("AI slop"). In fase di realizzazione va usata la skill `frontend-design` (qualità professionale, distintiva) invece di partire da un layout improvvisato.

**Pubblico, statico, gratuito** (GitHub Pages):

- **Ripuntare la pubblicazione di Pages dal ramo `main` al ramo `lavoro-locale-v2`** (impostazione del repository, non un commit — reversibile con un clic, non tocca la cronologia di `main`). Deciso esplicitamente in sessione: la pagina pubblica passa a mostrare il lavoro di questa sessione invece della vecchia versione.
- Una paginetta dedicata (es. `/bridge/index.html`) che legge `ip`/`porta`/`token` dalla propria query string e reindirizza subito a `http://<ip>:<porta>/?token=<token>` — nessun dato, nessuna logica, solo instradamento. Metadati Open Graph (titolo, icona) perché condividerla come link mostri una card pulita invece di un URL nudo.

## Piano e limiti

Riusa `createDesktopSessions`/`pairingCode` già scritti in `src/domain/plan.mjs`, invariati: piano gratuito 5 sessioni da 10 minuti, Pro senza limiti. Nessuna nuova regola da inventare qui.

## Casi limite

- **Computer su una rete diversa** (non lo stesso Wi-Fi, non l'hotspot del telefono): il reindirizzamento fallisce (connessione rifiutata/scaduta). Messaggio esplicito sulla paginetta pubblica ("assicurati che computer e telefono siano sulla stessa rete Wi-Fi"), mai un errore muto.
- **Sessione scaduta mentre il computer è collegato**: gli endpoint rispondono 401, `createRemoteStore` lo riconosce e mostra sul computer un messaggio chiaro invece di un errore generico; il telefono torna allo stato "non collegato".
- **Testo nuovo incollato direttamente sul computer**: tocca la memoria del computer per il tempo di mascherarlo (vedi "Promessa" sopra) — comportamento accettato esplicitamente, non un difetto.
- **Due computer collegati alla stessa sessione**: fuori scopo per questa prima versione — un solo token attivo per volta, un secondo tentativo di collegamento con lo stesso QR/link scaduto o già usato viene rifiutato.
- **Il telefono va in sospensione mentre il computer è collegato**: il server nativo deve restare vivo finché la sessione è attiva (non è compito di questa specifica decidere il meccanismo esatto — va verificato in fase di realizzazione contro i vincoli di Android sul risparmio energetico in background).

## Testing

- **Testabile qui**: `createRemoteStore` accetta un `fetchImpl` iniettabile proprio per questo — nessun test in questo progetto mocka ancora `fetch`, quindi è un pattern nuovo da introdurre, non il riuso di uno esistente; i test gli passano una funzione finta e verificano le chiamate HTTP prodotte (metodo, percorso, intestazione del token), senza rete vera. Il riconoscimento della modalità ponte (`?token=` + non-nativo) e `createDesktopSessions`/`pairingCode` (già scritti e già coperti) restano testabili come oggi. La paginetta di reindirizzamento è JS puro senza framework, testabile con `node --test` come il resto.
- **Non verificabile in questo ambiente** (nessun SDK Android, come per gli altri plugin nativi): il server HTTP incorporato vero, la scoperta dell'IP locale reale, il comportamento in background del telefono, la resa del layout 16:9 su uno schermo vero. Da provare sul prossimo APK, su una rete Wi-Fi reale con un computer vero.

## Fuori scope (deciso ora, non dimenticato)

Più computer collegati insieme. Cronologia delle sessioni passate. Notifica push quando il collegamento cade. Qualunque forma di accesso da fuori la rete locale (mai, per costruzione — è il limite che tiene fuori i costi di un relay).
