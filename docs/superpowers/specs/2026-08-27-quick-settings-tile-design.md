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
      → carica la stessa WebView/bridge e segnala l'avvio headless ad app.mjs
        (stretta di mano a due vie, vedi sotto — non un parametro URL)
      → app.mjs riconosce il segnale ed esegue runQuickProtect() invece di
        disegnare l'interfaccia
      → runQuickProtect() legge gli appunti dal plugin nativo (non dal DOM:
        un'Activity mai toccata non ha mai il documento a fuoco)
      → decide fra ripristino/mascheramento/niente (sopra)
      → chiama QuickProtectPlugin.toast(messaggio) e QuickProtectPlugin.finish()
  → Activity si chiude, il riquadro torna inattivo
```

**Corretto dopo la revisione finale** — tre punti dove la prima stesura di questa sezione non reggeva:

1. **Il segnale non è un parametro URL** come previsto qui inizialmente, ma la stessa stretta di mano a due vie già provata su device per la condivisione in ingresso (`window.__privaiReady` / `ShareTargetPlugin.deliver()`): se `app.mjs` non ha ancora controllato il segnale quando l'Activity nativa lo manda, viene depositato su `window` e trovato al controllo sincrono in cima a `init()`; se `app.mjs` è già partito e si è messo in ascolto, riceve un evento invece di un deposito che nessuno rileggerebbe più. Riusare un meccanismo già verificato battendo la strada nuova (un parametro URL avrebbe richiesto override di API interne di Capacitor mai testate in questo progetto) è stata una scelta esplicita per non introdurre rischio nativo non verificabile qui.
2. **Gli appunti non passano da `readClipboard()`/`writeClipboard()` generici**: quelli si appoggiano a `navigator.clipboard.readText()`, che richiede il documento a fuoco — un'Activity invisibile e mai toccata non lo ha mai. `QuickProtectPlugin` ora espone anche `read()`/`write()` via `android.content.ClipboardManager`, che non ha questo vincolo per un'Activity in primo piano.
3. **L'Activity non era davvero invisibile**: il tema rende trasparente solo la finestra, non la WebView al suo interno. `QuickProtectActivity.onCreate` ora nasconde esplicitamente la WebView (`setVisibility(INVISIBLE)`, sfondo trasparente) prima che carichi qualunque contenuto.

## Componenti nuovi

**Nativi** (Java, stesso pacchetto `app.privai.pocket`, stesso stile dei tre plugin esistenti):

- `QuickProtectTileService.java` — estende `TileService`. Stato sempre `Tile.STATE_INACTIVE` (è un'azione istantanea, non una modalità con on/off). `onClick()` avvia `QuickProtectActivity` collassando la tendina (`startActivityAndCollapse`, con il ramo di compatibilità per le API precedenti alla 34 dove il metodo accetta un `Intent` diretto invece di un `PendingIntent`).
- `QuickProtectActivity.java` — estende `BridgeActivity` come `MainActivity`; registra gli stessi plugin necessari (`SecureStorePlugin` per leggere/scrivere la cassaforte, più il nuovo `QuickProtectPlugin`) prima di `super.onCreate()`; nasconde la WebView; manda il segnale headless con la stretta di mano a due vie. Dichiarata nel manifest con un tema `Theme.Translucent.NoDisplay`, `android:excludeFromRecents="true"`, `android:noHistory="true"`, `android:taskAffinity=""` (task separato da `MainActivity`, così non compare come schermata dell'app principale né la riporta in primo piano).
- `QuickProtectPlugin.java` — plugin Capacitor minimo, quattro metodi: `read()`/`write({value})` (appunti via `ClipboardManager`), `toast({message})` (mostra `Toast.makeText`, non richiede permessi) e `finish()` (chiude l'activity corrente, sul thread UI).
- **Manifest**: nuova voce `<service>` per il tile (`android.permission.BIND_QUICK_SETTINGS_TILE`, intent-filter `android.service.quicksettings.action.QS_TILE`, `android:icon` per il riquadro) + nuova voce `<activity>` per `QuickProtectActivity` col tema translucido.

**JS** (`src/app.mjs`, più `src/domain/quickProtect.mjs` per la decisione pura):

- `runQuickProtect()` — orchestrazione headless: legge gli appunti dal plugin nativo (con ripiego su `readClipboard()` generico solo per il ramo web/PWA), ottiene `vault.combinedMapping()`, decide fra i quattro casi sopra, scrive gli appunti, eventualmente `vault.saveJob`/`vault.markRestored`, chiama i metodi del plugin nativo. Un tocco vale una volta ogni 3 secondi (vedi Casi limite).
- In `init()`: se `globalThis.__privaiQuickProtect` è già presente, chiama `runQuickProtect()` e **non** esegue il resto dell'avvio normale. Altrimenti si mette in ascolto dell'evento `privai:quickprotect` prima di proseguire, nello stesso istante sincrono — è questo a chiudere la finestra di corsa.

## Casi limite

- **Nessun lavoro in cassaforte** (`combinedMapping` vuoto): il ramo "ripristina" non può mai attivarsi (`shouldOfferRestore` richiede una mappa non vuota, stessa regola già in test); si passa dritti al ramo "maschera / niente da nascondere".
- **Limite di piano raggiunto**: `vault.saveJob` applica lo stesso controllo già usato dal flusso manuale; il Toast può quindi diventare "{n} dati nascosti · lavoro più vecchio sostituito", riusando la stringa `toast.limitJobs` già tradotta.
- **Errore imprevisto** (lettura appunti fallita, plugin nativo assente): try/catch attorno a `runQuickProtect()`, Toast generico di errore, `finish()` comunque chiamato — l'Activity non deve mai restare aperta in caso di eccezione.
- **Tocchi ripetuti rapidi**: **correzione dopo la revisione finale — il ragionamento originale era sbagliato.** Il secondo tocco NON è idempotente: gli appunti appena mascherati contengono i NOSTRI segnaposto, quindi il secondo tocco li riconosce come una risposta da ripristinare e rimette il dato vero negli appunti — l'esatto contrario di quello che serve, proprio nel momento in cui l'utente sta per incollare in un'IA. Corretto con una guardia esplicita: un tocco vale una volta ogni 3 secondi (`QUICK_PROTECT_DEBOUNCE_MS`), il tocco successivo entro quella finestra non fa nulla e lo dice con un Toast dedicato.

## Testing

- **Testabile qui**: la funzione di decisione (`runQuickProtect` estratta come funzione pura che riceve testo + mapping e restituisce `{action, text, count}` senza toccare `document`/plugin nativi) — stesso stile di `shouldOfferRestore`/`restoreProtectedText`, con test dedicati per i quattro casi.
- **Non verificabile in questo ambiente** (nessun SDK Android/device, come già per gli altri tre plugin): compilazione del tile, comportamento reale della `Translucent.NoDisplay` Activity, comparsa del riquadro nel pannello di sistema, Toast visibile. Resta lavoro da provare sul telefono dopo il prossimo APK.

## Fuori scope (deciso ora, non dimenticato)

Notifica persistente al posto del Toast (roadmap punto 9, separata). Icona del riquadro personalizzabile dall'utente. Qualunque configurazione (che tipo di dati nascondere dal riquadro) — usa sempre e solo il default "rischio alto", coerente con la decisione presa in questa sessione.
