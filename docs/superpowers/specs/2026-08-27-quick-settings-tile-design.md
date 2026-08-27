# Riquadro Impostazioni Rapide "Proteggi appunti" — Specifica

## Obiettivo

Un riquadro (tile) nelle Impostazioni Rapide di Android che, toccato, protegge o ripristina il contenuto degli appunti senza mai aprire visibilmente l'app. È il primo punto della roadmap "salto di qualità" di `HANDOFF.md` §9: PrivAI deve comparire da sé dove l'utente già sposta contenuti verso un'IA, senza cambiare abitudine (aprire l'app, incollare, uscire).

## Comportamento, in ordine di decisione

Al tocco, l'app legge gli appunti e decide **senza mostrare nulla**:

1. **Appunti vuoti o illeggibili** → Toast "Niente da proteggere negli appunti", chiude.
2. **Il testo contiene già nostri segnaposto** (stessa regola di `shouldOfferRestore`, già in produzione per la condivisione in ingresso) → lo ripristina con `restoreProtectedText` usando `vault.combinedMapping()`, riscrive il testo ripristinato negli appunti, Toast "Ripristinato", chiude.
3. **Testo nuovo con dati sensibili ad alto rischio** (`detectSensitiveData` + `maskFindings`, stesso motore al 97,3% già in produzione, stessa selezione di default: solo il rischio alto nasce mascherato — date, link e "forse nomi" restano intatti, come nel flusso manuale) → salva il lavoro in cassaforte con `vault.saveJob` (stesso limite di piano del flusso manuale), riscrive il testo mascherato negli appunti, Toast "{n} dati nascosti", chiude.
4. **Testo nuovo senza nulla da nascondere** → non tocca gli appunti, Toast "Niente da nascondere", chiude.

Il riquadro non finisce mai in "Richieste recenti" (quella lista è per bozze di richieste IA con domande/risposte; qui non ce n'è nessuna). Finisce **solo** in "Lavori da ripristinare" quando ha effettivamente mascherato qualcosa (caso 3), esattamente come il flusso manuale.

## Architettura

Il motore di decisione (rilevamento, mascheramento, ripristino) è **lo stesso identico codice JS già testato** (`src/domain/pii.mjs`, `src/domain/vault.mjs`) — nessuna duplicazione nativa. Per farlo girare senza mostrare l'interfaccia normale, serve un secondo punto d'ingresso headless nella stessa WebView/bridge Capacitor già esistente.

```
Riquadro toccato
  → QuickProtectTileService.onClick() (nativo)
  → avvia QuickProtectActivity (nativo, invisibile — WebView nascosta esplicitamente)
      → registra QuickProtectPlugin prima di super.onCreate(); nessun segnale
        da iniettare nella pagina
      → app.mjs riconosce l'avvio headless dalla sola presenza del plugin
        (Capacitor.Plugins.QuickProtect) ed esegue runQuickProtect() invece
        di disegnare l'interfaccia
      → runQuickProtect() legge gli appunti dal plugin nativo (non dal DOM:
        un'Activity mai toccata non ha mai il documento a fuoco)
      → decide fra ripristino/mascheramento/niente (sopra)
      → chiama QuickProtectPlugin.toast(messaggio) e QuickProtectPlugin.finish()
  → Activity si chiude, il riquadro torna inattivo
```

**Storia delle due revisioni** (per chi legge questo file più avanti — il codice riflette solo l'ultima riga di ciascun punto):

1. **Il segnale d'avvio ha cambiato meccanismo due volte.** Prima stesura: un parametro nell'URL, mai implementato. Prima correzione: un deposito su `window` iniettato con `evaluateJavascript`, con la motivazione che ricalcasse la stretta di mano già provata su device per la condivisione in ingresso (`window.__privaiReady`) — motivazione in parte sbagliata, perché `HANDOFF.md` non riporta alcun test su device per **questo** meccanismo, solo per quello della condivisione. La revisione finale ha inoltre trovato che l'iniezione aveva comunque una finestra di corsa residua (poteva eseguire contro un documento non ancora navigato, perdendo il segnale senza nessun ripiego). **Soluzione definitiva**: nessun segnale iniettato. `QuickProtectPlugin` è registrato solo da `QuickProtectActivity`, mai da `MainActivity`; `app.mjs` riconosce l'avvio headless controllando `Capacitor?.Plugins?.QuickProtect` — lo stesso modo, già consolidato altrove nel codebase (`nativePlugin()` in `vault.mjs`), in cui ogni plugin nativo viene rilevato. Nessuna corsa possibile per costruzione, nessun meccanismo nuovo da mantenere.
2. **Gli appunti non passano da `readClipboard()`/`writeClipboard()` generici**: quelli si appoggiano a `navigator.clipboard.readText()`, che richiede il documento a fuoco — un'Activity invisibile e mai toccata non lo ha mai. `QuickProtectPlugin` espone anche `read()`/`write()` via `android.content.ClipboardManager`. Da Android 10 anche `ClipboardManager` può tornare vuoto finché la finestra non ha davvero il fuoco (la tendina delle Impostazioni Rapide potrebbe non essersi ancora chiusa): `runQuickProtect()` riprova una volta dopo una breve pausa se il primo giro torna vuoto.
3. **L'Activity non era davvero invisibile**: il tema rende trasparente solo la finestra, non la WebView al suo interno. `QuickProtectActivity.onCreate` nasconde esplicitamente la WebView (`setVisibility(INVISIBLE)`, sfondo trasparente) prima che carichi qualunque contenuto.

## Componenti nuovi

**Nativi** (Java, stesso pacchetto `app.privai.pocket`, stesso stile dei tre plugin esistenti):

- `QuickProtectTileService.java` — estende `TileService`. Stato sempre `Tile.STATE_INACTIVE` (è un'azione istantanea, non una modalità con on/off). `onClick()` avvia `QuickProtectActivity` collassando la tendina (`startActivityAndCollapse`, con il ramo di compatibilità per le API precedenti alla 34 dove il metodo accetta un `Intent` diretto invece di un `PendingIntent`).
- `QuickProtectActivity.java` — estende `BridgeActivity` come `MainActivity`; registra gli stessi plugin necessari (`SecureStorePlugin` per leggere/scrivere la cassaforte, più il nuovo `QuickProtectPlugin`) prima di `super.onCreate()`; nasconde la WebView. Nessun'altra istruzione: la sua sola presenza sul bridge è il segnale. Dichiarata nel manifest con un tema `AppTheme.QuickProtect` (finestra translucida — non `Theme.Translucent.NoDisplay`, che non potrebbe ospitare una WebView), `android:excludeFromRecents="true"`, `android:noHistory="true"`, `android:taskAffinity=""` (task separato da `MainActivity`, così non compare come schermata dell'app principale né la riporta in primo piano).
- `QuickProtectPlugin.java` — plugin Capacitor minimo, quattro metodi: `read()`/`write({value})` (appunti via `ClipboardManager`, scrittura marcata `EXTRA_IS_SENSITIVE` su Android 13+ per sopprimere l'anteprima di sistema), `toast({message})` (mostra `Toast.makeText`, non richiede permessi) e `finish()` (chiude l'activity corrente, sul thread UI).
- **Manifest**: nuova voce `<service>` per il tile (`android.permission.BIND_QUICK_SETTINGS_TILE`, intent-filter `android.service.quicksettings.action.QS_TILE`, `android:icon` per il riquadro) + nuova voce `<activity>` per `QuickProtectActivity` col tema translucido.

**JS** (`src/app.mjs`, più `src/domain/quickProtect.mjs` per la decisione pura):

- `runQuickProtect()` — orchestrazione headless: legge gli appunti dal plugin nativo (con ripiego su `readClipboard()` generico solo per il ramo web/PWA), ottiene `vault.combinedMapping()`, decide fra i quattro casi sopra, scrive gli appunti, eventualmente `vault.saveJob`/`vault.markRestored`, chiama i metodi del plugin nativo. Vedi Casi limite per le due guardie contro i tocchi ripetuti.
- In `init()`: se `Capacitor?.Plugins?.QuickProtect` esiste, chiama `runQuickProtect()` e **non** esegue il resto dell'avvio normale (niente `renderHome`, niente onboarding, niente listener di condivisione — l'Activity vive per meno di un secondo).

## Casi limite

- **Nessun lavoro in cassaforte** (`combinedMapping` vuoto): il ramo "ripristina" non può mai attivarsi (`shouldOfferRestore` richiede una mappa non vuota, stessa regola già in test); si passa dritti al ramo "maschera / niente da nascondere".
- **Limite di piano raggiunto**: `vault.saveJob` applica lo stesso controllo già usato dal flusso manuale; il Toast può quindi diventare "{n} dati nascosti · lavoro più vecchio sostituito", riusando la stringa `toast.limitJobs` già tradotta.
- **Errore imprevisto** (lettura appunti fallita, plugin nativo assente): try/catch attorno a `runQuickProtect()`, Toast generico di errore, `finish()` comunque chiamato — l'Activity non deve mai restare aperta in caso di eccezione.
- **Tocchi ripetuti rapidi**: **corretto tre volte** — vale la pena leggere tutta la storia, perché ogni correzione ha scoperto che la precedente era incompleta in un modo diverso. Il ragionamento originale ("è idempotente, il secondo tocco non trova nulla da fare") era sbagliato: gli appunti appena mascherati contengono i NOSTRI segnaposto, quindi un secondo tocco li riconosce come una risposta da ripristinare e rimette il dato vero negli appunti — l'esatto contrario di quello che serve, proprio nel momento in cui l'utente sta per incollare in un'IA. Una prima correzione ha aggiunto solo una finestra di 3 secondi (`QUICK_PROTECT_DEBOUNCE_MS`), che sposta il problema invece di risolverlo (un tocco oltre i 3 secondi lo riapre). Una seconda correzione ha aggiunto il confronto col contenuto — giusto — ma applicandolo a *qualunque* azione, e questo ha creato un guasto peggiore del problema di partenza: dopo un ripristino, l'utente che vuole rimascherare lo stesso testo per una domanda di seguito si sentiva rispondere «niente da nascondere» **su un testo pieno di dati veri**, e incollava dati in chiaro credendoli protetti. Un falso negativo che afferma il contrario del vero è più pericoloso del rischio che voleva evitare.

**Guardia definitiva** (tre pezzi, ognuno con un compito preciso):
  1. La decisione (`decideQuickProtect`) viene presa **prima** di ogni guardia.
  2. Il confronto col contenuto si applica **solo al ramo "ripristina"** — l'unico dove il rischio esiste, perché un testo appena mascherato da noi contiene i nostri segnaposto e quindi decide sempre "ripristina". Il mascheramento non viene mai bloccato: se c'è qualcosa da nascondere, si nasconde.
  3. Il confronto usa un'**impronta SHA-256** (`quickProtectLastWritten`), non il testo. Serve solo a rispondere "l'ho scritto io?", e conservare il contenuto vero significherebbe lasciare sul dispositivo una copia in chiaro dei dati appena ripristinati — esattamente ciò che questa app esiste per evitare.
  4. La finestra di 3 secondi resta come guardia più grezza contro due tocchi quasi simultanei (due Activity concorrenti). Viene riaperta subito se gli appunti risultano vuoti: la lettura può fallire su Android 10+ finché la finestra non ha il fuoco, e chi ritocca per riprovare avrebbe ragione a insistere.

- **Limite noto, non risolto**: la guardia riconosce solo ciò che ha scritto *il riquadro*. Un testo mascherato dal flusso manuale e copiato negli appunti, se il riquadro viene toccato, viene riconosciuto come "risposta da ripristinare" e i dati veri tornano negli appunti. È lo stesso rischio dall'altra porta. Non è risolto perché distinguere "risposta dell'IA con i nostri segnaposto" da "nostro testo mascherato con i nostri segnaposto" non è possibile in modo affidabile: sono la stessa cosa. Da valutare dopo la prova su device, se si rivela un caso reale e non teorico.

## Cancellazione dei dati

Le due chiavi del riquadro (`quickProtectLastRun`, `quickProtectLastWritten`) sono elencate in `WIPED_KEYS` (`src/domain/vault.mjs`) e vengono cancellate da «Cancella tutto». **Ogni nuova chiave che l'app scrive va aggiunta lì**: un test ricava dal codice le chiavi realmente scritte da `app.mjs` e fallisce se una manca all'appello. Nella prima stesura non era così, e il pulsante «Cancella tutto» lasciava sul dispositivo l'ultimo testo trattato — in un'app che promette che non resta nulla.

## Testing

- **Testabile qui**: la funzione di decisione (`decideQuickProtect` in `src/domain/quickProtect.mjs`, pura, riceve testo + mapping e restituisce `{action, text, count}` senza toccare `document`/plugin nativi) — stesso stile di `shouldOfferRestore`/`restoreProtectedText`, con test dedicati per i quattro casi.
- **Non verificabile in questo ambiente** (nessun SDK Android/device, come già per gli altri tre plugin): compilazione del tile, comportamento reale dell'Activity translucida, comparsa del riquadro nel pannello di sistema, Toast visibile, se `ClipboardManager` restituisce davvero il contenuto al primo o al secondo tentativo. Resta lavoro da provare sul telefono dopo il prossimo APK — **nessuna parte nativa di questa funzione è mai stata testata su device**, a differenza della condivisione in ingresso che invece lo è stata in questa sessione.

## Fuori scope (deciso ora, non dimenticato)

Notifica persistente al posto del Toast (roadmap punto 9, separata). Icona del riquadro personalizzabile dall'utente. Qualunque configurazione (che tipo di dati nascondere dal riquadro) — usa sempre e solo il default "rischio alto", coerente con la decisione presa in questa sessione.
