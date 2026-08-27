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
  → avvia QuickProtectActivity (nativo, invisibile)
      → carica index.html?quickProtect=1 nella stessa WebView/bridge
      → app.mjs riconosce il parametro all'avvio ed esegue runQuickProtect()
        invece di disegnare l'interfaccia
      → runQuickProtect() decide fra ripristino/mascheramento/niente (sopra)
      → chiama QuickProtectPlugin.toast(messaggio) e QuickProtectPlugin.finish()
  → Activity si chiude, il riquadro torna inattivo
```

## Componenti nuovi

**Nativi** (Java, stesso pacchetto `app.privai.pocket`, stesso stile dei tre plugin esistenti):

- `QuickProtectTileService.java` — estende `TileService`. Stato sempre `Tile.STATE_INACTIVE` (è un'azione istantanea, non una modalità con on/off). `onClick()` avvia `QuickProtectActivity` collassando la tendina (`startActivityAndCollapse`, con il ramo di compatibilità per le API precedenti alla 34 dove il metodo accetta un `Intent` diretto invece di un `PendingIntent`).
- `QuickProtectActivity.java` — estende `BridgeActivity` come `MainActivity`; registra gli stessi plugin necessari (`SecureStorePlugin` per leggere/scrivere la cassaforte, più il nuovo `QuickProtectPlugin`) prima di `super.onCreate()`; carica l'URL con `?quickProtect=1`. Dichiarata nel manifest con un tema `Theme.Translucent.NoDisplay`, `android:excludeFromRecents="true"`, `android:noHistory="true"`, `android:taskAffinity=""` (task separato da `MainActivity`, così non compare come schermata dell'app principale né la riporta in primo piano).
- `QuickProtectPlugin.java` — plugin Capacitor minimo, due metodi: `toast({message})` (mostra `Toast.makeText`, non richiede permessi) e `finish()` (chiude l'activity corrente).
- **Manifest**: nuova voce `<service>` per il tile (`android.permission.BIND_QUICK_SETTINGS_TILE`, intent-filter `android.service.quicksettings.action.QS_TILE`, `android:icon` per il riquadro) + nuova voce `<activity>` per `QuickProtectActivity` col tema translucido.

**JS** (`src/app.mjs`, più eventualmente un piccolo modulo dedicato):

- `runQuickProtect()` — orchestrazione headless: legge gli appunti (`readClipboard`), ottiene `vault.combinedMapping()`, decide fra i quattro casi sopra, scrive `writeClipboard`, eventualmente `vault.saveJob`, chiama i due metodi del plugin nativo.
- In `init()`, prima di disegnare qualunque schermata: se `new URLSearchParams(location.search).has('quickProtect')`, chiama `runQuickProtect()` e **non** esegue il resto dell'avvio normale (niente `renderHome`, niente onboarding, niente listener di condivisione — l'Activity vive per meno di un secondo).

## Casi limite

- **Nessun lavoro in cassaforte** (`combinedMapping` vuoto): il ramo "ripristina" non può mai attivarsi (`shouldOfferRestore` richiede una mappa non vuota, stessa regola già in test); si passa dritti al ramo "maschera / niente da nascondere".
- **Limite di piano raggiunto**: `vault.saveJob` applica lo stesso controllo già usato dal flusso manuale; il Toast può quindi diventare "{n} dati nascosti · lavoro più vecchio sostituito", riusando la stringa `toast.limitJobs` già tradotta.
- **Errore imprevisto** (lettura appunti fallita, plugin nativo assente): try/catch attorno a `runQuickProtect()`, Toast generico di errore, `finish()` comunque chiamato — l'Activity non deve mai restare aperta in caso di eccezione.
- **Tocchi ripetuti rapidi**: ogni tocco avvia una nuova Activity indipendente; non serve una guardia esplicita, l'operazione è idempotente (rileggere appunti già ripristinati non trova più segnaposto, rileggere appunti già mascherati non trova più dati ad alto rischio, quindi il secondo tocco cade nel ramo "niente da nascondere").

## Testing

- **Testabile qui**: la funzione di decisione (`runQuickProtect` estratta come funzione pura che riceve testo + mapping e restituisce `{action, text, count}` senza toccare `document`/plugin nativi) — stesso stile di `shouldOfferRestore`/`restoreProtectedText`, con test dedicati per i quattro casi.
- **Non verificabile in questo ambiente** (nessun SDK Android/device, come già per gli altri tre plugin): compilazione del tile, comportamento reale della `Translucent.NoDisplay` Activity, comparsa del riquadro nel pannello di sistema, Toast visibile. Resta lavoro da provare sul telefono dopo il prossimo APK.

## Fuori scope (deciso ora, non dimenticato)

Notifica persistente al posto del Toast (roadmap punto 9, separata). Icona del riquadro personalizzabile dall'utente. Qualunque configurazione (che tipo di dati nascondere dal riquadro) — usa sempre e solo il default "rischio alto", coerente con la decisione presa in questa sessione.
