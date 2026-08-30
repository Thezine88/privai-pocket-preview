# RestaMio — UI/UX Design Specification

Versione: 1.6  
Stato: documento vivo  
Schermate approvate: Home — stato con lavoro da completare; Home — stato iniziale/senza lavori; Home — lavoro in attesa della risposta; Onboarding — 3 passaggi; Inserimento contenuto — stato vuoto; Dati da proteggere; Scelta attività AI; Controllo finale; Rientro dal chatbot — attesa risposta; Testo ripristinato; Testo quasi pronto — segnaposto non riconosciuto; Groq — presentazione trascrizione, configurazione API key e guida; Elaborazione adattiva — audio, documento e screenshot; Risultato trascrizione; Risultato OCR screenshot/immagine  
Riferimento visivo: `256980.png` (746 × 1536 px)

## 1. Scopo del documento

Questa specifica è la fonte unica per replicare l’interfaccia di RestaMio su iOS, Android e modalità desktop. Ogni valore indicato come **vincolante** deve essere implementato senza reinterpretazioni. Le misure della Home derivano dal riferimento visivo allegato; le regole responsive permettono di mantenere la stessa gerarchia su schermi diversi.

Obiettivo UX: permettere anche a chi non conosce l’AI di comprendere immediatamente l’azione successiva e completare il flusso con il minor numero possibile di decisioni e tocchi.

## 2. Regole UX globali

1. Una sola azione primaria arancione per area o fase del flusso.
2. Le etichette descrivono l’azione concreta: verbo + oggetto, per esempio “Incolla la risposta dell’AI”.
3. Non usare termini tecnici come PII, anonimizzazione, token o redazione nell’interfaccia principale.
4. Non chiedere una scelta che l’app può compiere automaticamente.
5. Ogni azione produce feedback visivo entro 100 ms; se dura oltre 400 ms mostrare uno stato di avanzamento.
6. Area toccabile minima: 44 × 44 dp/pt.
7. Il tasto Indietro deve mantenere testo, selezioni e stato del lavoro.
8. Nessun contenuto importante deve essere coperto da safe area, tastiera o barra di navigazione.
9. Contrasto minimo del testo normale: 4.5:1.
10. Supportare dimensionamento caratteri fino al 130% senza troncare le azioni principali.
11. Le CTA inferiori devono restare interamente sopra l’inset della navigazione di sistema. Non disegnare pulsanti, testo o hitbox sotto i controlli Home/Indietro/Recenti di Android né sopra l’indicatore Home di iOS.

### 2.1 Contratto globale per safe area e barre di sistema

Queste regole prevalgono sulle coordinate indicative di ogni mockup:

- La status bar e la navigation bar appartengono al sistema operativo e non fanno parte del canvas utilizzabile dell’app.
- Ogni schermata deve leggere gli inset correnti a runtime; non usare valori fissi per produttore, modello o orientamento.
- Header e pulsanti Back iniziano sotto `systemStatusInsetTop`.
- CTA sticky: distanza minima 16 dp/pt dall’inset inferiore di sistema.
- Bottom navigation dell’app: distanza minima 8 dp/pt dall’inset inferiore di sistema; la sua hitbox termina prima dell’area riservata al sistema.
- Onboarding: il blocco indicatore + CTA termina almeno 24 dp/pt sopra l’inset inferiore di sistema.
- Schermate con tastiera: usare l’inset IME quando è maggiore dell’inset della navigation bar; non sommare entrambi.
- Quando il contenuto non entra nell’area sicura, renderlo scrollabile. Non ridurre CTA, target di tocco o font per recuperare spazio.
- Un eventuale sfondo edge-to-edge può proseguire dietro le barre di sistema; contenuti e controlli interattivi no.

Testare obbligatoriamente ogni schermata con: Android a tre pulsanti, Android a gesti, iPhone con Home Indicator, font 130% e tastiera aperta quando applicabile.

## 3. Sistema di coordinate

### 3.1 Canvas di riferimento

- Bitmap: 746 × 1536 px.
- Larghezza logica di progetto: 360 dp/pt.
- Fattore di conversione dal riferimento: `746 / 360 = 2,0722`.
- Formula: `dp = px / 2,0722`.
- Tutte le coordinate di layout sotto sono espresse in dp/pt.
- Android: disegnare edge-to-edge ma applicare gli inset di sistema.
- iOS: usare `safeAreaInsets`.
- Altezza del contenuto è fluida; larghezza e ritmo verticale determinano la replica.

### 3.2 Griglia

- Margine orizzontale pagina: 20 dp.
- Larghezza contenuto: `viewportWidth - 40 dp`.
- Griglia base: 4 dp.
- Spazi standard: 4, 8, 12, 16, 20, 24, 32 e 40 dp.
- Distanza minima tra elementi toccabili separati: 8 dp.

## 4. Design token

### 4.1 Colori

I valori derivano dal riferimento compresso e sono fissati come token operativi.

| Token | Valore | Uso |
|---|---:|---|
| `color.background` | `#FAF6F5` | Sfondo principale caldo |
| `color.surface` | `#FFFFFF` | Schede e navigazione |
| `color.surfaceWarm` | `#FFF9F6` | Scheda lavoro attivo |
| `color.primary` | `#F4511E` | Brand, CTA, icone attive |
| `color.primaryPressed` | `#D94312` | CTA premuta |
| `color.primarySoft` | `#FFF1EB` | Sfondo icone |
| `color.textPrimary` | `#111111` | Titoli e testo forte |
| `color.textSecondary` | `#737373` | Sottotitoli e metadati |
| `color.textOnPrimary` | `#FFFFFF` | Testo CTA |
| `color.border` | `#D8D3D0` | Bordi sottili |
| `color.badgeBackground` | `#E9E9E9` | Badge piano |
| `color.iconInactive` | `#707070` | Icone navigazione inattive |
| `color.shadow` | `#000000` | Ombre con opacità dedicata |

Non introdurre altri arancioni nei componenti standard. Le leggere variazioni visibili nel riferimento dipendono dall’antialiasing e dalla compressione.

### 4.2 Tipografia

Font operativo vincolante: **Poppins**. Lo screenshot non consente di identificare matematicamente il file font sorgente; Poppins è fissato come equivalente di implementazione. Usare gli stessi file font su tutte le piattaforme per evitare differenze di metrica.

| Stile | Dimensione | Peso | Altezza riga | Tracking |
|---|---:|---:|---:|---:|
| Brand | 27 sp | 500 | 32 sp | -0,6 sp |
| Hero | 25 sp | 600 | 31 sp | -0,5 sp |
| Titolo sezione | 18 sp | 600 | 24 sp | -0,2 sp |
| Titolo scheda | 17 sp | 600 | 22 sp | -0,2 sp |
| Eyebrow arancione | 15 sp | 500 | 20 sp | 0 |
| Body | 14 sp | 400 | 20 sp | 0 |
| Body strong | 14 sp | 500 | 20 sp | 0 |
| Caption | 12 sp | 400 | 17 sp | 0 |
| CTA | 16 sp | 400 | 22 sp | -0,1 sp |
| Navigation label | 12 sp | 400 | 16 sp | 0 |

Regole:

- Non usare tutto maiuscolo, eccetto il badge “GRATIS”.
- Massimo due pesi nella stessa scheda.
- Testo allineato a sinistra, eccetto CTA e label della bottom navigation.
- Il brand è composto da due span adiacenti senza spazio: `Resta` in `textPrimary`, `Mio` in `primary`.

### 4.3 Raggi, bordi e ombre

| Token | Valore |
|---|---:|
| `radius.small` | 12 dp |
| `radius.medium` | 16 dp |
| `radius.large` | 20 dp |
| `radius.pill` | 999 dp |
| `border.default` | 1 dp `color.border` |
| `shadow.card` | `0 3dp 12dp rgba(0,0,0,0.04)` |
| `shadow.cta` | `0 5dp 12dp rgba(244,81,30,0.18)` |

## 5. Componenti globali

### 5.1 Pulsante primario

- Altezza: 48 dp.
- Larghezza: 100% del contenitore.
- Raggio: 13 dp per CTA interne alle schede; `radius.pill` per CTA a tutta pagina nei flussi successivi.
- Sfondo: `color.primary`.
- Testo: stile CTA, `color.textOnPrimary`, centrato.
- Padding orizzontale: 20 dp.
- Stato premuto: `color.primaryPressed`, scala 0,985 per 90 ms.
- Stato disabilitato: sfondo `#F3B39D`, testo bianco al 90%, nessuna ombra.
- Stato caricamento: mantenere dimensioni e sostituire temporaneamente il testo con spinner bianco da 20 dp; non spostare il layout.

### 5.2 Scheda azione

- Altezza Home: 64 dp.
- Larghezza: 100%.
- Sfondo: `color.surface`.
- Bordo: `border.default`.
- Raggio: `radius.medium`.
- Padding: 12 dp.
- Icon tile: 44 × 44 dp, raggio 11 dp, `color.primarySoft`.
- Icona: 25 dp, stroke 1,8 dp, `color.primary`.
- Testi: titolo + caption, distanza verticale 1 dp.
- Chevron destra: 22 dp, stroke 1,8 dp, `color.iconInactive`; area toccabile 44 dp.
- L’intera scheda è toccabile, non soltanto il chevron.

### 5.3 Badge piano

- Testo: “GRATIS”.
- Altezza: 27 dp; larghezza minima 58 dp.
- Padding orizzontale: 13 dp.
- Raggio: `radius.pill`.
- Sfondo: `color.badgeBackground`.
- Testo: 12 sp, peso 500, `color.textPrimary`.
- Toccabile: apre la pagina del piano; hitbox minima 58 × 44 dp.

### 5.4 Bottom navigation

- Tre destinazioni fisse: **Lavora**, **Cassaforte**, **Impostazioni**.
- Non rinominare “Cassaforte”.
- Altezza visiva: 68 dp più inset inferiore di sistema.
- Margini laterali: 13 dp.
- Bordo: 1 dp `color.border`.
- Raggio superiore e inferiore: 18 dp; il riferimento la mostra come pannello flottante.
- Sfondo: `rgba(255,255,255,0.94)` con blur 14 dp se supportato; fallback `#FFFFFF`.
- Icona: 25 dp; label a 6 dp sotto l’icona.
- Attivo: icona e label `color.primary`.
- Inattivo: `color.iconInactive`.
- Nessuna ombra marcata; usare `shadow.card`.
- La barra resta ancorata sopra la system navigation.
- Wrapper inferiore: `padding-bottom = systemNavigationInsetBottom + 8 dp`; se l’inset è già consumato dal parent, applicare soltanto 8 dp.
- Né il pannello né le hitbox delle tre destinazioni possono entrare nella navigation bar di sistema.

## 6. Home — stato con lavoro da completare

### 6.1 Gerarchia

1. Identità RestaMio e stato del piano.
2. Promessa di valore.
3. Lavoro da completare con azione successiva dominante.
4. Avvio di un nuovo lavoro.
5. Metodo alternativo tramite menu Condividi.
6. Navigazione primaria.

### 6.2 Layout verticale

Coordinate riferite all’area logica larga 360 dp. `Y=0` coincide con il bordo superiore dello screenshot, inclusa la status bar.

| Elemento | X | Y indicativa | W | H |
|---|---:|---:|---:|---:|
| Brand `RestaMio` | 20 | 45 | auto | 34 |
| Badge “GRATIS” | 286 | 45 | 55 | 27 |
| “Buongiorno” | 20 | 94 | auto | 22 |
| Hero | 20 | 124 | 310 | 63 |
| Sottotitolo hero | 20 | 187 | 318 | 40 |
| Scheda lavoro attivo | 20 | 227 | 320 | 153 |
| Titolo sezione nuovo lavoro | 20 | 412 | 320 | 25 |
| Azione testo | 20 | 437 | 320 | 64 |
| Azione file | 20 | 506 | 320 | 64 |
| Suggerimento Condividi | 20 | 589 | 320 | 56 |
| Bottom navigation | 13 | viewportBottom − inset − 70 | 334 | 68 |

Su altezze inferiori, il contenuto centrale scorre verticalmente; header e bottom navigation restano stabili. Il suggerimento Condividi può scorrere, ma non deve essere coperto permanentemente dalla navigazione.

### 6.3 Header

- Brand allineato al margine sinistro.
- `Resta` e `Mio` condividono baseline, font e peso.
- Badge allineato visivamente al centro verticale del brand.
- Nessuna icona impostazioni nell’header: è già presente nella bottom navigation.

### 6.4 Blocco promessa

Testi esatti:

- Eyebrow: `Buongiorno`
- Hero: `Usa l’AI senza\ncondividere dati sensibili.`
- Supporto: `Nomi, email e altre informazioni restano sul telefono.`

Specifiche:

- Eyebrow in `color.primary`.
- Hero massimo due righe sul canvas da 360 dp.
- Distanza eyebrow → hero: 13 dp.
- Distanza hero → supporto: 10 dp.
- Supporto massimo due righe con caratteri ingranditi; una riga alla scala standard se lo spazio lo consente.

### 6.5 Scheda lavoro attivo

- Contenitore: larghezza 320 dp, altezza minima 153 dp, raggio 20 dp.
- Sfondo `color.surfaceWarm`; bordo `color.border`; ombra `shadow.card`.
- Padding: 14 dp.
- Riga superiore alta 66 dp.
- Icona clipboard: tile circolare 38 × 38 dp, sfondo `color.primary`, icona bianca 21 dp.
- Colonna testo: margine sinistro 12 dp rispetto all’icona.
- Chevron: centrato verticalmente nella riga superiore, a 12 dp dal bordo destro.

Testi esatti:

- Stato: `Hai un lavoro da completare`
- Titolo: `Email al cliente`
- Metadati: `Oggi · 3 dati da ripristinare`
- CTA: `Incolla la risposta dell’AI`

Stili:

- Stato: 14 sp/500, `color.primary`.
- Titolo: 17 sp/600, `color.textPrimary`.
- Metadati: 12 sp/400, `color.textSecondary`.
- CTA: altezza 48 dp, margine superiore 10 dp.

Comportamento:

- Toccare la riga superiore apre il dettaglio del lavoro.
- Toccare la CTA apre direttamente l’azione di incolla.
- Se negli appunti è presente testo, mostrare il pannello di incolla senza chiedere conferme intermedie.
- Se non è presente testo, aprire comunque il pannello con istruzione: `Incolla qui la risposta ricevuta dall’AI`.

### 6.6 Nuovo lavoro

Titolo sezione: `Inizia un nuovo lavoro`.

Prima azione:

- Titolo definitivo: `Incolla o scrivi un testo`
- Sottotitolo: `Email, messaggi, appunti`
- Icona: matita outline.

Seconda azione:

- Titolo: `Importa un file`
- Sottotitolo: `PDF, testo, Markdown`
- Icona: documento outline.

Le due schede hanno distanza verticale di 7 dp. Entrambe aprono direttamente la schermata di acquisizione pertinente; non mostrare un menu intermedio.

### 6.7 Suggerimento Condividi

- Nessun contenitore o bordo.
- Icona share: 32 dp, `color.iconInactive`, a sinistra.
- Testo: `Oppure condividi un documento con\nRestaMio dal menu del telefono.`
- Body 12 sp, line-height 18 sp, `color.textSecondary`.
- Mascotte: asset trasparente, box massimo 64 × 64 dp, allineato in basso a destra.
- La mascotte è decorativa e non toccabile; escluderla dall’albero accessibilità.
- Se la mascotte non è disponibile, mantenere il testo e non sostituirla con emoji o illustrazioni diverse.

## 7. Stati alternativi della Home

### 7.1 Nessun lavoro da completare

- Rimuovere completamente la scheda lavoro attivo; non mostrare uno spazio vuoto.
- Portare il blocco di avvio subito dopo la promessa di valore, con distanza 34–40 dp dal sottotitolo.
- Sostituire il titolo `Inizia un nuovo lavoro` con il testo esatto `Da dove vuoi iniziare?`.
- Non mostrare messaggi come “Nessun lavoro”: l’assenza non richiede spiegazione.
- Rendere `Incolla o scrivi un testo` l’unica azione primaria arancione della schermata.
- Mantenere `Importa un file` come azione secondaria bianca.
- Usare lo stesso stato sia immediatamente dopo l’onboarding sia ogni volta che non esistono lavori da completare.

Layout approvato sul canvas logico da 360 dp:

| Elemento | X | Y indicativa | W | H |
|---|---:|---:|---:|---:|
| Brand `RestaMio` | 20 | 45 | auto | 34 |
| Badge “GRATIS” | 286 | 45 | 55 | 27 |
| “Buongiorno” | 20 | 94 | auto | 22 |
| Hero | 20 | 124 | 310 | 63 |
| Sottotitolo hero | 20 | 187 | 318 | 40 |
| Titolo `Da dove vuoi iniziare?` | 20 | 278 | 320 | 25 |
| Azione primaria testo | 20 | 311 | 320 | 82 |
| Azione secondaria file | 20 | 403 | 320 | 82 |
| Suggerimento Condividi | 20 | 510 | 320 | 64 |
| Bottom navigation | 13 | viewportBottom − inset − 70 | 334 | 68 |

Specifiche dell’azione primaria:

- Sfondo pieno `color.primary`.
- Altezza 82 dp; raggio 16 dp.
- Icon tile 48 × 48 dp con bianco al 10%; icona matita bianca da 27 dp.
- Titolo `Incolla o scrivi un testo`: 17 sp/600, bianco.
- Sottotitolo `Email, messaggi, appunti`: 13 sp/400, bianco all’88%.
- Chevron bianco da 22 dp.
- Ombra `shadow.cta`.
- L’intera superficie è toccabile.

Specifiche dell’azione secondaria:

- Altezza 82 dp; raggio 16 dp.
- Sfondo `color.surface`; bordo `border.default`.
- Icon tile 48 × 48 dp, `color.primarySoft`; icona file `color.primary`.
- Titolo `Importa un file`: 17 sp/600, `color.textPrimary`.
- Sottotitolo `PDF, testo, Markdown`: 13 sp/400, `color.textSecondary`.
- Chevron `color.iconInactive`.

La grande zona libera sopra la bottom navigation è intenzionale: non aggiungere statistiche, suggerimenti, caroselli o altri contenuti per riempirla. La semplicità mantiene evidente l’azione principale.

### 7.2 Più lavori da completare

- Mostrare soltanto il lavoro aggiornato più recentemente.
- Sotto la scheda aggiungere link testuale `Vedi tutti in Cassaforte` con hitbox 44 dp.
- Non trasformare la Home in una lista.

### 7.3 Errore di caricamento locale

- Conservare le azioni per iniziare un nuovo lavoro.
- Al posto della scheda attiva mostrare messaggio inline: `Non riesco ad aprire questo lavoro.`
- Azione secondaria: `Riprova`.
- Non usare dialog modale all’avvio.

### 7.4 Lavoro in attesa della risposta dell’AI

Questo stato appare dopo l’apertura del menu di condivisione verso un chatbot e resta persistente finché la risposta non viene ripristinata o il lavoro viene annullato.

Testi esatti della scheda prioritaria:

- Stato: `Hai un lavoro da completare`
- Titolo: nome dell’attività, esempio `Email al cliente`
- Metadati: `In attesa della risposta dell’AI`
- CTA: `Incolla la risposta dell’AI`

Regole:

- Usare la stessa posizione, dimensione e gerarchia della scheda lavoro attivo della sezione 6.5.
- Icona: chatbot/risposta outline dentro tile circolare arancione; non usare loghi di servizi AI.
- Tap sulla riga superiore o sulla CTA apre `Ora recupera la risposta`.
- La CTA è l’azione visivamente dominante della Home.
- Mostrare badge arancione con numero dei lavori in attesa sull’icona `Cassaforte`; badge massimo `9+`.
- Il badge non copre icona o label e dispone di descrizione accessibile, per esempio `Cassaforte, 1 lavoro in attesa`.
- Se esistono più lavori in attesa, mostrare in Home soltanto quello aggiornato più recentemente e il link `Vedi tutti in Cassaforte`.
- Quando il risultato viene copiato o condiviso, rimuovere la scheda prioritaria; il lavoro resta in Cassaforte secondo il periodo di conservazione configurato.

## 8. Responsive

### 8.1 Telefoni compatti, larghezza 320–359 dp

- Margine pagina: 16 dp.
- Font Hero: 23 sp.
- Schede: larghezza disponibile.
- Mascotte: massimo 56 dp.
- Non ridurre le aree toccabili.

### 8.2 Telefoni standard, larghezza 360–430 dp

- Usare i valori principali.
- Sopra 390 dp, limitare il contenuto a 360 dp e centrarlo oppure aumentare soltanto i margini; non allungare eccessivamente le schede.

### 8.3 Tablet e desktop

- Contenuto Home in colonna centrale larga massimo 420 dp.
- Bottom navigation diventa una rail o sidebar soltanto nella specifica desktop futura; fino ad allora mantenere la semantica delle tre destinazioni.
- Non scalare font e icone proporzionalmente alla finestra.

## 9. Iconografia e asset

- Usare un’unica famiglia di icone outline con estremità arrotondate.
- Stroke standard: 1,8–2 dp.
- Vietati emoji come icone funzionali.
- Icone richieste per la Home: clipboard/checklist, chevron-right, pencil, file, share, briefcase, lock, settings.
- La mascotte deve usare l’asset ufficiale fornito dal progetto; non rigenerarla automaticamente.
- Tutti gli asset raster devono avere variante 2× e 3× o risoluzione equivalente.

## 10. Animazioni e feedback aptico

- Tap scheda: overlay nero 3% per massimo 120 ms.
- Tap CTA: scala 0,985 e colore `primaryPressed` per 90 ms; ritorno 140 ms ease-out.
- Cambio schermata: transizione nativa della piattaforma, 220–300 ms.
- Home caricata: nessuna animazione introduttiva che ritardi l’interazione.
- Aptica leggera sul completamento della protezione o del ripristino, non sulla semplice navigazione.
- Rispettare “Riduci movimento”.

## 11. Accessibilità e semantica Home

- Brand: label `RestaMio` unica; non leggere separatamente i due colori.
- Badge: `Piano gratuito, apri dettagli del piano`.
- Scheda lavoro: `Email al cliente, oggi, 3 dati da ripristinare`.
- CTA: `Incolla la risposta dell’intelligenza artificiale`.
- Azione testo: `Incolla o scrivi un testo. Email, messaggi o appunti.`
- Azione file: `Importa un file PDF, di testo o Markdown.`
- Bottom navigation: indicare semanticamente la destinazione selezionata.
- Mascotte e decorazioni: escluse dall’accessibilità.

## 12. Test di accettazione Home

La Home è conforme soltanto se:

1. A colpo d’occhio emerge prima la CTA del lavoro incompleto, se presente.
2. Un nuovo utente identifica le due modalità di ingresso senza scorrere su un telefono standard.
3. “Cassaforte” rimane invariato nella navigazione.
4. Il titolo della prima azione è “Incolla o scrivi un testo”.
5. Nessun testo viene troncato alla scala font 130%.
6. Tutte le azioni hanno hitbox minima 44 dp.
7. Il contenuto non viene coperto dalle barre di sistema.
8. Il contrasto del testo normale è almeno 4.5:1.
9. La schermata non mostra più di una CTA primaria arancione per gruppo di lavoro.
10. Il layout a 360 dp riproduce posizione, proporzioni e gerarchia del riferimento `256980.png`.

## 13. Onboarding di Willy — 3 passaggi

### 13.1 Obiettivo e regole comuni

L’onboarding deve spiegare il valore di RestaMio attraverso una dimostrazione, non attraverso descrizioni tecniche. Compare soltanto al primo avvio; può essere riaperto dalle Impostazioni.

- Tre passaggi totali.
- Sfondo `color.background`.
- Nessuna bottom navigation dell’app.
- Una sola CTA arancione per schermata.
- “Salta” presente nei passaggi 1 e 2; nel passaggio 3 è facoltativamente omesso.
- Dal passaggio 2, Indietro è una piccola icona in alto; non usare un secondo pulsante inferiore.
- Supportare anche swipe orizzontale, mantenendo sincronizzato l’indicatore.
- “Salta” porta direttamente alla Home iniziale senza conferma.
- “Iniziamo” conclude l’onboarding e apre la Home iniziale.

### 13.2 Struttura comune

Canvas logico: 360 dp di larghezza.

| Elemento | Specifica |
|---|---|
| Header | Altezza 64 dp dopo la status safe area |
| Wordmark | 26 sp/500; `Resta` scuro, `Mio` arancione |
| Azione “Salta” | 14 sp/400, `textSecondary`, hitbox 44 × 44 dp |
| Back | Chevron 24 dp, hitbox 44 × 44 dp, margine sinistro 16 dp |
| Area contenuto | Margini laterali 24 dp; centrata |
| CTA | Altezza 52 dp, margini laterali 24 dp, raggio pill |
| Indicatore | 18–20 dp sopra la CTA |
| CTA dal fondo | 24 dp sopra la safe area inferiore |

CTA e indicatore formano un blocco ancorato alla safe area, non a una coordinata Y assoluta. Nei telefoni bassi il contenuto centrale può comprimersi o scorrere; il blocco inferiore resta accessibile.

Indicatore:

- Tre elementi centrati, distanza 10 dp.
- Passaggio attivo: capsula 20 × 8 dp, `color.primary`.
- Passaggi inattivi: cerchi 8 × 8 dp, `#D8D5D3`.
- Transizione tra stati: larghezza e posizione animate in 220 ms ease-out.

### 13.3 Willy — asset e comportamento

- Utilizzare l’identità del Willy dei riferimenti originali `256835.jpg` e `256837.jpg`.
- Corpo bianco con dettagli arancioni, volto nero lucido, occhi ciano, mani nere segmentate, mantello arancione e simbolo AI/strumento sul petto.
- Non sostituire Willy con la piccola mascotte utilizzata nella Home.
- Preparare asset con trasparenza e margine ottico uniforme.
- Willy è decorativo: escluso dall’albero di accessibilità; la funzione è descritta dai testi.

Animazione base:

- Fluttuazione verticale: ±4 dp, ciclo 2.4 s, ease-in-out, ripetizione alternata.
- Ombra sotto Willy: opacità 8–13% e scala 92–100% sincronizzate con la fluttuazione.
- Battito occhi: 120 ms, ogni 3.5–5 s con intervallo leggermente variabile.
- In modalità Riduci movimento: Willy resta statico; consentito soltanto il battito occhi senza traslazione.

### 13.4 Passaggio 1 — Presentazione

Testi esatti:

- Brand: `RestaMio`
- Azione: `Salta`
- Titolo: `Ciao, sono Willy`
- Corpo: `Ti aiuto a usare l’AI senza condividere dati sensibili.`
- CTA: `Continua`

Layout:

- Brand in alto a sinistra, X 20 dp.
- “Salta” in alto a destra, X finale a 340 dp.
- Willy centrato, box massimo 230 × 230 dp.
- Titolo centrato, 27 sp/600, line-height 33 sp.
- Corpo centrato, larghezza massima 290 dp, 15 sp/400, line-height 22 sp.
- Distanza Willy → titolo: 28–32 dp.
- Distanza titolo → corpo: 14 dp.

Animazione specifica:

- La mano alzata ruota di circa 8° verso l’esterno e ritorna, due volte in 700 ms.
- Avvio 250 ms dopo la comparsa della schermata.
- Ripetere il saluto una sola volta; mantenere poi la fluttuazione base.

### 13.5 Passaggio 2 — Protezione

Testi esatti:

- Brand: `RestaMio`
- Azione: `Salta`
- Titolo: `Tu condividi.\nAi dati penso io.`
- Corpo: `Nascondo nomi, email e altri dati prima che arrivino all’AI.`
- CTA: `Continua`

Layout:

- Back in alto a sinistra; wordmark centrato; “Salta” in alto a destra.
- Willy centrato con box massimo 250 × 230 dp.
- Titolo centrato, 27 sp/600, massimo due righe.
- Corpo centrato, larghezza massima 300 dp, 15 sp/400, line-height 22 sp.

Animazione specifica:

1. Willy entra con opacità 0→1 e scala 0.96→1 in 260 ms.
2. Lo scudo compare sopra la mano con scala 0.7→1 e opacità 0→1 in 300 ms.
3. Una linea luminosa percorre il bordo dello scudo in 700 ms.
4. Willy strizza un occhio quando la linea completa il giro.
5. Lo scudo resta acceso con pulsazione di opacità 88–100%, ciclo 1.8 s.

Il verde è riservato all’illustrazione dello scudo e allo stato di ripristino; non diventa un secondo colore primario dell’interfaccia.

### 13.6 Passaggio 3 — Prima e dopo

Testi esatti:

- Brand: `RestaMio`
- Titolo: `I dati tornano\nal loro posto`
- Stato 1: `Testo protetto`
- Contenuto protetto: `Ciao [NOME_1], ti confermo il preventivo.\nScrivimi a [EMAIL_1]`
- Stato 2: `Testo ripristinato`
- Contenuto ripristinato: `Ciao Luca, ti confermo il preventivo.\nScrivimi a luca@email.it`
- Rassicurazione: `Gli originali restano sempre sul tuo telefono.`
- CTA: `Iniziamo`

Layout approvato:

- Back in alto a sinistra; wordmark centrato.
- Titolo 27 sp/600, centrato.
- La rappresentazione statica di progetto mostra due schede sovrapposte verticalmente per comunicare i due keyframe; nell’app reale usare una singola scheda animata nello stesso spazio per ridurre altezza e movimento o, se si mantengono entrambe, animare l’enfasi tra le due senza spostare il layout.
- Scheda: sfondo bianco, bordo `color.border`, raggio 18 dp, padding 18 dp, ombra `shadow.card`.
- Label protetto: `color.primary`; placeholder in chip `#FFF0EA` con testo `color.primary`.
- Label ripristinato: `#15945F`; dati ripristinati in chip `#E6F5ED` con testo `#138555`.
- Rassicurazione centrata, 14 sp/400, `textSecondary`.

Sequenza animata raccomandata, ciclo 4.2 s:

1. 0–500 ms: mostrare il testo protetto; placeholder arancioni stabili.
2. 500–900 ms: breve bagliore arancione sui placeholder.
3. 900–1.350 ms: `[NOME_1]` si trasforma in `Luca` con crossfade e morph della larghezza del chip.
4. 1.450–1.950 ms: `[EMAIL_1]` si trasforma in `luca@email.it`.
5. 1.950–2.200 ms: label e icona cambiano da `Testo protetto` arancione a `Testo ripristinato` verde.
6. 2.200–3.500 ms: pausa sul risultato completo.
7. 3.500–4.200 ms: dissolvenza breve e ritorno allo stato protetto.

Ripetizione automatica finché la schermata è visibile. Interrompere il ciclo quando l’app passa in background. Con Riduci movimento usare dissolvenze da 150 ms senza morph, bagliori o frecce in movimento.

### 13.7 Navigazione e gesti

- Tap `Continua`: avanza di un passaggio con transizione orizzontale nativa da 240 ms.
- Tap Back: torna al passaggio precedente preservando la posizione dell’animazione solo se economicamente semplice; altrimenti riavvia il ciclo.
- Swipe sinistra: avanti; swipe destra: indietro.
- Soglia gesto: almeno 48 dp o velocità sufficiente; il semplice scroll verticale non deve cambiare pagina.
- Tap `Salta`: completa l’onboarding e apre la Home iniziale.
- Il pulsante fisico/gesto Back dal primo passaggio esce dall’app o segue il comportamento standard della piattaforma; non mostrare conferme.

### 13.8 Accessibilità onboarding

- Annunciare `Passaggio 1 di 3`, `Passaggio 2 di 3` o `Passaggio 3 di 3` quando cambia pagina.
- L’indicatore è un unico elemento semantico, non tre controlli separati.
- Le animazioni non devono essere necessarie per comprendere i testi.
- Descrizione semantica della demo finale: `RestaMio sostituisce i segnaposto con i dati originali conservati sul telefono.`
- `Salta`, Back e CTA hanno hitbox minima 44 dp.

### 13.9 Test di accettazione onboarding

1. Non esistono pulsanti grandi Indietro e Avanti affiancati.
2. Ogni schermata mostra una sola CTA arancione inferiore.
3. CTA e indicatore restano ancorati alla safe area inferiore.
4. Willy mantiene la stessa identità in tutti i passaggi.
5. Il passaggio 3 rende comprensibile protezione e ripristino anche con animazioni disattivate.
6. “Salta” apre la Home senza ulteriori dialoghi.
7. Il testo rimane leggibile alla scala 130% senza sovrapporre CTA o barre di sistema.
8. Tutte le animazioni rispettano Riduci movimento e si fermano quando la pagina non è visibile.
9. Su Android a tre pulsanti, tutte le CTA dell’onboarding terminano almeno 24 dp sopra Home/Indietro/Recenti.
10. Su Android a gesti e iOS, indicatore e CTA rispettano l’inset inferiore senza essere coperti dall’indicatore di sistema.

## 14. Inserimento contenuto — stato vuoto

### 14.1 Apertura e obiettivo

Questa schermata si apre toccando `Incolla o scrivi un testo` dalla Home. È un flusso concentrato: la bottom navigation dell’app viene nascosta per evitare uscite accidentali e lasciare spazio alla tastiera.

Obiettivo unico: acquisire il testo che RestaMio deve controllare e proteggere.

### 14.2 Testi esatti

- Titolo app bar: `Il tuo contenuto`
- Helper: `Incolla o scrivi il testo che vuoi usare con l’AI.`
- Azione campo: `Incolla`
- Placeholder: `Scrivi o incolla qui…`
- Titolo privacy: `Tutto sul telefono`
- Corpo privacy: `Il controllo avviene qui. Niente viene inviato a un server.`
- CTA: `Proteggi il testo`

Usare il carattere ellissi tipografico `…`, non tre punti separati.

### 14.3 Layout approvato

Canvas logico: 360 dp di larghezza.

| Elemento | X | Y indicativa | W | H |
|---|---:|---:|---:|---:|
| App bar | 0 | safeAreaTop | 360 | 60 |
| Back | 16 | safeAreaTop + 8 | 44 | 44 |
| Titolo app bar | centrato | safeAreaTop + 14 | auto | 28 |
| Helper | 16 | safeAreaTop + 93 | 328 | 44 max |
| Campo testo | 16 | safeAreaTop + 135 | 328 | 265 |
| Banner privacy | 16 | campoBottom + 16 | 328 | 72 |
| CTA senza tastiera | 16 | privacyBottom + 20–24 | 328 | 52 |

Il gruppo campo → privacy → CTA è continuo. Non ancorare la CTA al fondo dello schermo quando la tastiera è chiusa. Lo spazio residuo resta sotto il gruppo e non deve essere riempito con suggerimenti o contenuti decorativi.

### 14.4 App bar

- Altezza 60 dp dopo la safe area.
- Back: chevron 24 dp, hitbox 44 × 44 dp.
- Titolo: stile `Titolo sezione`, centrato rispetto allo schermo e non allo spazio residuo dopo il back.
- Nessuna azione a destra.
- Back con testo non salvato: tornare alla Home mantenendo una bozza locale soltanto se la funzione bozze è prevista; in assenza di bozze, chiedere conferma esclusivamente quando il testo contiene almeno un carattere non-spazio.

### 14.5 Campo di testo

- Sfondo `color.surface`.
- Bordo 1 dp `color.border`; focus: 1.5 dp `color.primary`.
- Raggio 18 dp.
- Altezza iniziale 265 dp su telefono standard.
- Padding: 16 dp superiore e laterale; 18 dp inferiore.
- Testo: 16 sp/400, line-height 23 sp, `color.textPrimary`.
- Placeholder: 16 sp/400, `color.textSecondary`.
- Multilinea, allineamento in alto.
- Se il testo supera lo spazio disponibile, scorrere internamente senza espandere indefinitamente il campo.
- Mostrare il cursore e aprire la tastiera toccando qualsiasi punto vuoto del campo.

Azione `Incolla`:

- Posizionata in alto a destra dentro il campo.
- Icona clipboard/documento 20 dp e testo 14 sp/500, entrambi `color.primary`.
- Hitbox minima 44 dp; padding destro 12 dp.
- Su iOS preferire il controllo di incolla nativo per rispettare le regole di accesso agli appunti.
- Se gli appunti non contengono testo, mostrare feedback inline `Negli appunti non c’è del testo.` senza dialog modale.
- Dopo l’incolla, posizionare il cursore alla fine e avviare il controllo locale.

Il testo digitato non deve scorrere sotto il comando `Incolla`: riservare spazio nella prima riga oppure nascondere l’azione non appena l’utente inserisce testo, sostituendola con un’azione contestuale soltanto se necessaria.

### 14.6 Banner privacy

- Altezza minima 72 dp, espandibile con font grandi.
- Sfondo `#E6F5ED`.
- Bordo facoltativo 1 dp `#B9DEC9`.
- Raggio 16 dp.
- Padding 14 dp.
- Icona shield-check 30 dp, `#167D59`.
- Titolo 14 sp/600, `#167D59`.
- Corpo 12.5 sp/400, line-height 18 sp, `#216D55`.
- Banner non toccabile e non espandibile.

Non mostrare contemporaneamente altri messaggi che ripetono che il controllo avviene durante la scrittura.

### 14.7 CTA e stati

Posizione senza tastiera:

- 20–24 dp sotto il banner privacy.
- Non fissata al fondo del display.

Posizione con tastiera:

- CTA sticky 12 dp sopra la tastiera.
- Contenitore sticky con sfondo `color.background` e padding 12 dp superiore, 16 dp laterale e 8–12 dp inferiore.
- Ridurre dinamicamente l’altezza visibile del campo per mantenere helper, almeno quattro righe di testo e CTA utilizzabili.

Stato vuoto/disabilitato:

- CTA `Proteggi il testo` disabilitata.
- Sfondo `#FFD2BF`; testo `#EFA27F`.
- Nessuna ombra e nessun feedback aptico.
- Il testo composto solo da spazi è considerato vuoto.

Stato disponibile:

- CTA `color.primary`, testo bianco.
- Attiva quando esiste almeno un carattere non-spazio e il controllo locale non segnala un errore bloccante.
- Tap: chiude la tastiera, completa il controllo locale e passa allo stato di revisione dei dati rilevati.

Stato elaborazione:

- Mantenere dimensioni della CTA.
- Spinner bianco 20 dp e label `Controllo in corso…`.
- Se l’elaborazione supera 2 s, mostrare anche un breve stato inline senza bloccare Back.

### 14.8 Comportamento della tastiera

- Apertura automatica soltanto se l’utente tocca il campo o `Incolla`; non aprirla automaticamente all’ingresso nella schermata.
- Il layout usa inset della tastiera, non valori fissi.
- CTA resta sopra la tastiera e non viene coperta.
- La privacy può scorrere fuori dalla vista quando necessario; il contenuto e la CTA hanno precedenza.
- Tasto tastiera Invio inserisce una nuova riga; non invia il modulo.
- Supportare annulla/ripristina nativi.

### 14.9 Accessibilità

- Back: `Torna alla Home`.
- Campo: label `Testo da proteggere`; hint `Scrivi o incolla il testo che vuoi usare con l’intelligenza artificiale.`
- Incolla: `Incolla il testo dagli appunti`.
- Banner: leggere titolo e corpo come un unico elemento informativo.
- CTA disabilitata deve esporre semanticamente lo stato non disponibile.
- Non affidarsi al solo colore per comunicare focus o disabilitazione.

### 14.10 Test di accettazione

1. La bottom navigation non è visibile.
2. Il campo vuoto mostra `Scrivi o incolla qui…` e l’azione `Incolla`.
3. Esiste un solo messaggio privacy.
4. La CTA è immediatamente sotto il banner quando la tastiera è chiusa.
5. La CTA si sposta sopra la tastiera quando questa si apre.
6. Lo stato vuoto mantiene `Proteggi il testo` disabilitato.
7. Il comando Incolla funziona con un solo tocco e non sovrascrive testo esistente senza intenzione esplicita.
8. Il campo e la CTA restano utilizzabili con font al 130%.
9. Nessun testo o controllo viene coperto da safe area o tastiera.
10. Il controllo e la conservazione del testo avvengono localmente, coerentemente con la promessa mostrata.
11. Con tastiera chiusa o aperta, la CTA non invade mai la navigation bar o l’area IME.

## 15. Dati da proteggere

### 15.1 Obiettivo e ingresso

La schermata appare appena il rilevamento locale trova almeno un dato potenzialmente sensibile. Deve permettere di verificare rapidamente cosa verrà protetto senza obbligare l’utente a comprendere categorie tecniche o controllare ogni singola occorrenza.

Principi vincolanti:

- Il rilevamento, il raggruppamento e la selezione avvengono sul dispositivo.
- RestaMio attiva automaticamente i dati per i quali la protezione è consigliata.
- L’utente può modificare la scelta a livello di categoria o di singolo valore.
- Nessuna categoria, compresi date e link, viene dichiarata sempre sicura o sempre visibile.
- Non mostrare tag tecnici, placeholder o nomi interni del modello.

### 15.2 Testi esatti

- Titolo: `Dati da proteggere`
- Riepilogo: `{detectedCount} dati rilevati.`
- Spiegazione: `Ho già attivato quelli da proteggere.`
- Azioni globali: `Proteggi tutto` e `Lascia tutto visibile`
- Azione manuale: `Aggiungi un dato`
- Stato sticky: `{protectedCount} dati protetti`
- CTA: `Proteggi e continua`

Singolare:

- `1 dato rilevato.`
- `1 dato protetto`
- `1 persona · 1 occorrenza`

### 15.3 Struttura e scorrimento

- Header con Back a sinistra e titolo centrato, sotto la status safe area.
- Intro e azioni globali nel contenuto scrollabile.
- Elenco verticale di categorie comprimibili.
- Una sola categoria può essere aperta automaticamente: la prima con protezione consigliata. Le altre partono chiuse.
- L’elenco scorre dietro una barra inferiore sticky; aggiungere padding finale pari all’altezza della barra più 16 dp/pt.
- Nessuna bottom navigation dell’app in questa fase del flusso.
- La barra sticky resta interamente sopra navigation bar Android, gesti e Home Indicator iOS.

### 15.4 Categorie visibili all’utente

Raggruppare la tassonomia tecnica nelle seguenti etichette comprensibili:

1. `Nomi e cognomi`
2. `Codice fiscale`
3. `Email`
4. `Telefono`
5. `Indirizzi`
6. `Documenti e codici`
7. `Dati finanziari`
8. `Aziende e organizzazioni`
9. `Date e orari`
10. `Link`

Mostrare soltanto le categorie rilevate nel contenuto. L’ordine privilegia i dati più immediatamente riconoscibili e rischiosi; non lasciare spazi per categorie assenti.

### 15.5 Interruttori e fisica di interazione

- Usare switch, non checkbox: ON significa `verrà protetto`; OFF significa `rimarrà visibile`.
- Switch ON: track arancione e thumb nella posizione attiva. Switch OFF: track neutro e thumb nella posizione inattiva.
- Il significato deve essere riconoscibile anche senza colore tramite posizione e geometria dello switch.
- Area toccabile minima dello switch: 44 × 44 dp/pt.
- Lo switch di categoria controlla tutti i valori contenuti.
- Se alcuni valori sono ON e altri OFF, la categoria assume stato misto visivamente distinto e semanticamente annunciato come `protezione parziale`.
- Il tap sullo switch cambia lo stato senza aprire o chiudere la categoria.
- Il tap sulla riga o sul chevron espande/comprime la categoria senza cambiare protezione.
- Chevron e switch devono avere hitbox separate, distanti almeno 8 dp/pt e mai sovrapposte.

### 15.6 Raggruppamento e deduplicazione

- Valori identici normalizzati vengono mostrati una sola volta con il numero totale di occorrenze.
- Per le persone usare nome e cognome completi quando riconosciuti; la categoria non si chiama `Nome`.
- Esempio: `Simone Lombardo` con sottotitolo `3 occorrenze nel documento`.
- La testata della categoria mostra `1 persona · 3 occorrenze`.
- Il chevron del valore apre, solo su richiesta, i contesti delle singole occorrenze.
- Attivare o disattivare il valore raggruppato modifica tutte le sue occorrenze; nel dettaglio è possibile intervenire sulla singola occorrenza.
- Non fondere valori simili se il rilevatore non ha sufficiente certezza che identifichino la stessa entità.

### 15.7 Scheda di categoria

- Superficie bianca, bordo `color.border`, raggio 18–20 dp/pt.
- Altezza minima testata: 64 dp/pt.
- Etichetta a sinistra, conteggio secondario vicino allo switch, switch e chevron a destra.
- Categoria aperta: separatore sottile e righe interne da almeno 64 dp/pt.
- Titolo valore in `textPrimary`; contesto o conteggio in `textSecondary`.
- Non usare ombre marcate: la gerarchia deriva da bordo, spazio e tipografia.

### 15.8 Azioni globali e manuali

- `Proteggi tutto` porta tutti gli switch a ON.
- `Lascia tutto visibile` porta tutti gli switch a OFF, aggiorna subito il conteggio e non richiede conferma modale.
- `Aggiungi un dato` apre la selezione manuale di una porzione del testo originale; il testo e la selezione restano locali.
- Dopo ogni azione globale consentire Undo tramite snackbar accessibile per almeno 5 secondi.
- Non usare pill sovradimensionate: le due azioni globali sono controlli testuali con hitbox minima 44 dp/pt.

### 15.9 CTA e stati

- La CTA resta attiva quando `protectedCount > 0`.
- Con zero dati protetti, sostituire la CTA con `Continua senza proteggere`; al tap mostrare una conferma breve che spiega che il testo potrà contenere dati personali.
- Durante la sostituzione locale: disabilitare gli input, mostrare feedback di avanzamento nella CTA e impedire doppi tap.
- Al successo, aprire `Cosa vuoi fare con questo testo?` con il testo protetto e la mappatura reversibile conservata localmente.
- Back ripristina contenuto e scelte senza perdere il lavoro.

### 15.10 Accessibilità

- Ogni switch espone etichetta, stato e conseguenza, per esempio: `Simone Lombardo, 3 occorrenze, protezione attiva`.
- La categoria espone stato `aperta`/`chiusa` separatamente dallo stato di protezione.
- I conteggi devono essere letti nel contesto e non come numeri isolati.
- Dopo `Proteggi tutto` o `Lascia tutto visibile`, annunciare il nuovo conteggio.
- Supportare testo al 130% senza sovrapporre conteggio, switch e chevron; se necessario spostare i metadati su una seconda riga.

### 15.11 Test di accettazione

1. Tutti i dati consigliati risultano ON al primo ingresso.
2. Uno switch comunica chiaramente ON/OFF anche in scala di grigi.
3. Il tap sul chevron non modifica lo switch e viceversa.
4. Tre occorrenze certe di `Simone Lombardo` producono una sola riga con conteggio 3.
5. Date e link possono essere esaminati e protetti; non esistono esenzioni rigide.
6. Con 25 o più rilevamenti, CTA e conteggio restano visibili mentre l’elenco scorre.
7. Nessun controllo interseca la navigazione di sistema sui dispositivi di test obbligatori.
8. Il conteggio sticky coincide sempre con gli elementi effettivamente attivi.
9. Lo stato misto di una categoria è visibile e annunciato semanticamente.
10. Nessun dato originale o mappatura viene inviato in rete.

## 16. Scelta attività AI — “Cosa vuoi fare con questo testo?”

### 16.1 Obiettivo e ingresso

Questa schermata segue la revisione e la protezione dei dati sensibili. Serve a trasformare l’intenzione dell’utente in una richiesta strutturata per l’AI, senza obbligarlo a conoscere i prompt.

- La bottom navigation dell’app non è visibile.
- Back torna alla revisione dei dati mantenendo testo, dati selezionati e scelte di questa schermata.
- La schermata contiene quattro azioni rapide e un massimo di due gruppi contestuali visibili contemporaneamente.
- La CTA non apre direttamente un servizio AI: conduce al successivo `Controllo finale`.

### 16.2 Testi esatti dello stato Email

- Titolo: `Cosa vuoi fare con questo testo?`
- Helper: `Scegli il risultato. RestaMio preparerà la richiesta per l’AI.`
- Azioni rapide predefinite: `Scrivi un’email`, `Riassumi`, `Migliora il CV`, `Personalizza`
- Gestione preferiti: `Modifica azioni rapide`
- Primo gruppo: `A chi scrivi?`
- Scelte primo gruppo: `Cliente`, `Fornitore`, `Collega`
- Secondo gruppo: `Cosa vuoi ottenere?`
- Scelte secondo gruppo: `Proporre`, `Sollecitare`, `Rispondere`
- CTA: `Continua`

### 16.3 Layout approvato

Canvas logico: 360 dp di larghezza. Le coordinate verticali sono indicative e devono adattarsi alla safe area e al dimensionamento del testo.

| Elemento | X | Y indicativa | W | H |
|---|---:|---:|---:|---:|
| Back | 16 | safeAreaTop + 8 | 44 | 44 |
| Titolo | 40 | safeAreaTop + 68 | 280 | 64 max |
| Helper | 30 | titoloBottom + 14 | 300 | 42 max |
| Griglia azioni | 54 | helperBottom + 28 | 252 | 252 circa |
| `Modifica azioni rapide` | centrato | grigliaBottom + 18 | auto | 44 |
| Gruppo contestuale 1 | 20 | gestioneBottom + 28 | 320 | 84 min |
| Gruppo contestuale 2 | 20 | gruppo1Bottom + 22 | 320 | 84 min |
| CTA | 20 | contenutoBottom + 24 | 320 | 52 |

Regole:

- Contenuto centrato con larghezza massima 360 dp sui telefoni larghi.
- La pagina scorre verticalmente quando altezza o scala font non consentono di mostrare tutto.
- La CTA è contenuta in un’area inferiore separata e può restare sticky mentre il contenuto centrale scorre.
- Il bordo inferiore della CTA deve trovarsi almeno 16 dp sopra l’inset della navigazione di sistema.
- Padding inferiore del contenitore CTA: `systemNavigationInsetBottom + 16 dp`; se l’inset è già consumato dal contenitore padre, applicare soltanto 16 dp e non sommarlo due volte.
- Il contenitore inferiore usa `color.background` e può avere un separatore superiore 1 dp `color.border`; non deve coprire le opzioni durante lo scroll.
- Non ridurre la griglia sotto le misure accessibili per evitare lo scroll.

### 16.4 Azioni rapide quadrate

Griglia:

- Due colonne e due righe.
- Schede quadrate o quasi quadrate: 120–126 dp per lato sul canvas da 360 dp.
- Spazio tra colonne e righe: 14–16 dp.
- Raggio: 16 dp.
- Sfondo inattivo: `color.surface`.
- Bordo inattivo: 1 dp `color.border`.
- Nessuna ombra marcata; usare al massimo `shadow.card`.
- Intera scheda toccabile, con stato premuto coerente con le altre schede.

Contenuto scheda:

- Icona centrata sopra la label.
- Icona: 32–36 dp, stroke 1,8–2 dp.
- Distanza icona → label: 14–18 dp.
- Label: 14–15 sp/600, centrata; massimo due righe.
- Padding interno minimo: 12 dp.

Stato selezionato:

- Bordo 1,5 dp `color.primary`.
- Sfondo `color.primarySoft` con intensità visiva molto leggera.
- Icona `color.primary`.
- Label `color.textPrimary`.
- La selezione non deve dipendere soltanto dal colore: esporre semanticamente `selezionato`.

Icone approvate:

| Azione | Icona |
|---|---|
| Scrivi un’email | Busta outline |
| Riassumi | Elenco puntato outline |
| Migliora il CV | Documento/CV outline con piccolo accento sparkle |
| Personalizza | Matita outline |

### 16.5 Preferiti personalizzabili

- Mostrare sempre esattamente quattro azioni rapide.
- `Personalizza` è fissa, sempre visibile e non rimovibile.
- L’utente sceglie e riordina gli altri tre preferiti.
- La configurazione iniziale è: Email, Riassumi, Migliora il CV, Personalizza.
- `Modifica azioni rapide` è un’azione testuale secondaria con icona sliders da 20 dp e hitbox minima 44 dp.
- La gestione è raggiungibile sia da questa schermata sia da `Impostazioni → Azioni rapide`.
- Il pannello di gestione consente selezione, riordino e `Ripristina predefinite`.
- Le modifiche hanno effetto immediato e vengono conservate localmente.

### 16.6 Progressive disclosure

Le domande mostrate dipendono dall’azione selezionata. Non lasciare sullo schermo campi appartenenti all’azione precedente.

| Azione | Campi iniziali |
|---|---|
| Scrivi un’email | `A chi scrivi?` e `Cosa vuoi ottenere?` |
| Riassumi | Nessun campo obbligatorio nella prima versione |
| Migliora il CV | Campo facoltativo `Per quale ruolo?` |
| Personalizza | Area di testo `Scrivi cosa vuoi chiedere all’AI` |

Regole:

- Transizione dei campi: crossfade 160–200 ms senza spostamenti bruschi.
- Se una scelta ha un valore predefinito affidabile, preselezionarlo.
- Non mostrare più di due gruppi di opzioni simultaneamente.
- Le chip hanno altezza minima 48 dp, raggio pill e distanza minima 8 dp.
- Chip selezionata: sfondo `color.primary`, testo bianco.
- Chip inattiva: sfondo bianco, bordo `color.border`, testo `color.textPrimary`.
- Se le alternative non entrano con font al 130%, andare a capo; non usare testo troncato.

### 16.7 CTA e navigazione

- Label definitiva: `Continua`.
- Altezza: 52 dp; larghezza disponibile; raggio `radius.pill`.
- Attiva quando l’azione selezionata dispone di tutte le informazioni obbligatorie.
- Per `Personalizza`, attiva soltanto con almeno un carattere non-spazio.
- Tap: genera localmente la struttura della richiesta e apre `Controllo finale`.
- Non aprire un’app AI esterna da questa schermata.
- Durante la preparazione mantenere le dimensioni e mostrare spinner con label `Preparo la richiesta…`.
- Android: ricavare l’inset inferiore dalla navigation bar corrente; deve funzionare sia con navigazione a tre pulsanti sia con navigazione gestuale e modalità edge-to-edge.
- iOS: rispettare `safeAreaInsets.bottom` e mantenere almeno 12–16 pt tra CTA e area Home Indicator.
- Non usare coordinate Y assolute, altezza schermo hardcoded o rilevamento specifico del produttore.
- La hitbox della CTA coincide con la sua superficie visibile e non può estendersi nell’area riservata al sistema.

### 16.8 Accessibilità

- Annunciare il titolo una sola volta all’apertura.
- Ogni scheda espone nome, ruolo di selezione e stato selezionato/non selezionato.
- `Modifica azioni rapide`: label semantica `Scegli e riordina le azioni rapide`.
- I gruppi di chip espongono la domanda come intestazione semantica.
- Il cambio di azione porta il focus all’inizio dei nuovi campi soltanto quando avviato con tastiera o tecnologia assistiva; non spostare automaticamente il focus nei tap ordinari.
- CTA disabilitata espone il motivo tramite hint accessibile.

### 16.9 Test di accettazione

1. Sono visibili esattamente quattro azioni rapide in griglia 2 × 2.
2. Le schede sono quadrate o quasi quadrate, più piccole della prima proposta grafica e con icona sopra la label.
3. `Personalizza` è sempre presente.
4. `Modifica azioni rapide` appare come comando secondario, non come quinta scheda.
5. Se è selezionata Email, sono visibili `A chi scrivi?` e `Cosa vuoi ottenere?`.
6. Cambiando azione, i campi contestuali vengono sostituiti senza lasciare valori visibili non pertinenti.
7. La CTA riporta `Continua` e conduce a `Controllo finale`.
8. Nessuna bottom navigation è visibile.
9. Tutte le azioni restano utilizzabili con font al 130% e su larghezza 320 dp.
10. Tornando indietro e poi avanti, selezioni e valori risultano conservati.
11. Con navigazione Android a tre pulsanti, la CTA e la sua hitbox sono interamente sopra Home/Indietro/Recenti con almeno 16 dp di separazione.
12. Con navigazione gestuale Android e Home Indicator iOS, la CTA rispetta l’inset inferiore senza lasciare uno spazio eccessivo.

### 16.10 Controllo finale

Questa schermata segue `Continua` e precede l’apertura del menu AI. Permette di leggere e modificare esattamente ciò che verrà condiviso.

Testi esatti:

- Titolo: `Controllo finale`
- Helper: `Leggi e modifica ciò che invierai all’AI.`
- Stato: formato dinamico `{n} dati protetti`, esempio `3 dati protetti`
- Label editor: `La tua richiesta`
- Riga espandibile: `Vedi dati protetti`
- CTA: `Apri nell’AI`

Layout:

- Back in alto a sinistra, sotto la status safe area.
- Titolo e helper centrati.
- Pill informativa verde sotto l’helper; non toccabile.
- Editor bianco con raggio 18 dp, bordo `color.border`, padding 20 dp e altezza minima 300 dp.
- Riga `Vedi dati protetti` sotto l’editor, altezza minima 56 dp, raggio 16 dp, chevron destra.
- CTA dentro un contenitore sticky inferiore con sfondo `color.background`.
- Contenitore CTA: padding 16 dp laterale e superiore; padding inferiore `systemNavigationInsetBottom + 16 dp`, senza doppio consumo dell’inset.
- Il contenuto centrale scorre dietro/sopra il contenitore sticky quando lo spazio non basta.

Editor:

- Il testo completo è direttamente modificabile; non richiede un comando `Modifica` preliminare.
- Corpo 16 sp/400, line-height 23 sp.
- Icona matita in basso a destra come affordance visiva, esclusa dall’accessibilità se l’intero editor è già annunciato come modificabile.
- I placeholder protetti restano nel formato `[TIPO_n]`, per esempio `[NOME_1]`.
- Le modifiche non devono alterare la mappa locale dei placeholder già presenti.
- Se l’utente elimina un placeholder, aggiornare il conteggio e spiegare inline che quel dato non potrà essere ripristinato nella risposta.

Pannello `Vedi dati protetti`:

- Chiuso per impostazione predefinita.
- Espanso mostra tipo, valore originale e placeholder per ogni dato, senza rendere i valori copiabili accidentalmente.
- Espansione/collasso 180–220 ms; il layout scorre e la CTA resta accessibile.
- Label accessibile include stato `espanso` o `compresso`.

CTA:

- Altezza 52 dp, raggio pill, `color.primary`.
- Tap salva la versione corrente della richiesta, prepara lo stato di rientro e apre il menu di condivisione nativo.
- Stato di preparazione: spinner e label `Preparo la condivisione…`.
- La CTA e la sua hitbox terminano almeno 16 dp sopra l’inset della navigazione di sistema.

Test di accettazione:

1. L’utente può leggere l’intera richiesta prima di condividerla.
2. Il testo è modificabile direttamente.
3. Il conteggio dei dati protetti è coerente con i placeholder presenti.
4. `Vedi dati protetti` è compresso all’apertura ed espandibile.
5. La CTA riporta `Apri nell’AI`.
6. CTA e hitbox non si sovrappongono ai tre pulsanti Samsung, ai gesti Android o all’Home Indicator iOS.
7. Con font al 130% o schermo basso scorre il contenuto centrale, senza ridurre editor o target di tocco.

## 17. Uscita verso il chatbot e rientro

### 17.1 Principio UX

L’utente non deve ricordare autonomamente cosa fare dopo aver usato il chatbot. Prima di aprire il menu di condivisione, RestaMio prepara e salva lo stato di rientro. Quando il menu viene chiuso o l’utente torna nell’app, la schermata sottostante è già `Ora recupera la risposta`.

Non aggiungere `Ripristina` alla bottom navigation: è una fase temporanea del lavoro, non una destinazione primaria.

### 17.2 Istruzione al primo utilizzo

Mostrare una sola volta, immediatamente prima del primo menu di condivisione:

`Invia al chatbot il testo protetto. Quando ricevi la risposta, copiala o condividila con RestaMio.`

CTA: `Ho capito, scegli l’AI`.

- Dal secondo utilizzo aprire direttamente il menu di condivisione.
- Rendere l’istruzione nuovamente consultabile dalle Impostazioni o da un aiuto contestuale.
- Non mostrare il messaggio dopo ogni lavoro.

### 17.3 Apertura del menu AI

- L’azione finale del `Controllo finale` apre il menu di condivisione nativo.
- Il menu può mostrare chatbot installati e l’azione Copia secondo le capacità del sistema operativo.
- Prima di aprire il menu, creare o aggiornare il lavoro locale nello stato `awaiting_ai_response`.
- La schermata sottostante deve cambiare in `Ora recupera la risposta` prima che il menu diventi visibile.
- Se il menu viene annullato, l’utente può usare `Non ho ancora inviato il testo` per tornare al passaggio precedente senza perdere dati o scelte.

### 17.4 Schermata “Ora recupera la risposta”

Testi esatti:

- Titolo: `Ora recupera la risposta`
- Istruzione: `Invia al chatbot il testo protetto. Quando ricevi la risposta, copiala o condividila con RestaMio.`
- Stato lavoro: `In attesa della risposta dell’AI`
- CTA: `Incolla la risposta dell’AI`
- Azione secondaria: `Non ho ancora inviato il testo`

Header:

- Back a sinistra, wordmark `RestaMio` centrato.
- Nessuna bottom navigation dell’app.
- Back conserva il lavoro e torna alla Home, dove resta visibile la scheda in attesa.

Indicatore di avanzamento:

- Tre passaggi: `Protetto`, `Inviato`, `Ripristina`.
- `Protetto` e `Inviato`: completati con check arancione.
- `Ripristina`: corrente, bordo e label `color.primary`.
- È un indicatore informativo, non una navigazione; gli step non sono toccabili.
- Descrizione accessibile unica: `Passaggio 3 di 3, ripristina i dati`.

Scheda lavoro:

- Sfondo bianco, bordo `color.border`, raggio 18 dp, padding 16 dp.
- Icon tile 64 × 64 dp `color.primarySoft`; icona chatbot/arrow outline.
- Titolo attività 17 sp/600.
- Stato 13 sp/400 `color.textSecondary`.
- Intera scheda non necessita di un’azione separata: è riepilogativa.

CTA e sicurezza:

- CTA pill 52 dp, margini laterali 20 dp.
- Posizionata dopo la scheda con 28–32 dp; non spingerla artificialmente sul bordo inferiore.
- Deve rispettare il contratto globale della sezione 2.1 e rimanere almeno 16 dp sopra l’inset di sistema.
- Tap usa il controllo di incolla nativo quando richiesto dalla piattaforma; non leggere automaticamente gli appunti senza gesto esplicito.
- Se gli appunti non contengono testo: feedback inline `Non trovo una risposta da incollare.` e nessuna perdita di stato.
- Durante il ripristino: spinner e label `Ripristino in corso…`, dimensioni invariate.

Azione secondaria:

- Link testuale centrato, hitbox minima 44 dp.
- Tap torna al `Controllo finale` e consente di riaprire il menu AI.
- Non elimina il lavoro protetto.

### 17.5 Condivisione diretta della risposta verso RestaMio

- RestaMio deve apparire tra le destinazioni di condivisione per contenuti testuali compatibili.
- Se esiste un solo lavoro in stato `awaiting_ai_response`, associare automaticamente la risposta e aprire direttamente il risultato ripristinato.
- Se esistono più lavori compatibili, chiedere `A quale lavoro appartiene questa risposta?` e mostrare un elenco breve con titolo e data; non scegliere in modo silenzioso.
- Se non esiste un lavoro compatibile, offrire la creazione di un nuovo ripristino senza sovrascrivere lavori esistenti.
- Un errore di ripristino mantiene intatta la risposta ricevuta e consente `Riprova` o `Scegli un altro lavoro`.

### 17.6 Stato condiviso tra schermate

Home, Cassaforte e schermata di rientro leggono la stessa entità lavoro locale. Stati minimi:

| Stato | Home | Cassaforte | Apertura lavoro |
|---|---|---|---|
| `protected_ready` | Nessuna scheda in attesa | Lavoro protetto | Controllo finale |
| `awaiting_ai_response` | Scheda prioritaria + CTA Incolla | Badge e stato `In attesa della risposta` | Ora recupera la risposta |
| `restoring` | Scheda disabilitata con progresso | Stato `Ripristino…` | Progresso non bloccante |
| `restored_unconsumed` | Scheda `Il testo è pronto` | Badge e stato `Testo ripristinato` | Risultato ripristinato |
| `completed` | Nessuna scheda prioritaria | Lavoro conservato fino alla scadenza | Dettaglio lavoro |

Transizioni:

- Apertura menu AI: `protected_ready → awaiting_ai_response`.
- Incolla o share-in riuscito: `awaiting_ai_response → restoring → restored_unconsumed`.
- Copia o condivisione del risultato: `restored_unconsumed → completed`.
- Ogni transizione aggiorna Home e Cassaforte immediatamente, senza richiedere riavvio o refresh manuale.

### 17.7 Test di accettazione

1. Quando si apre il menu AI, la schermata sottostante è già `Ora recupera la risposta`.
2. Tornando dal chatbot, l’azione dominante è `Incolla la risposta dell’AI`.
3. La Home mostra `Hai un lavoro da completare` e lo stato `In attesa della risposta dell’AI`.
4. Cassaforte mostra un badge coerente con il numero dei lavori in attesa.
5. La CTA e le relative hitbox non invadono mai la navigazione di sistema.
6. L’annullamento del menu di condivisione non perde testo protetto o configurazione.
7. La condivisione diretta verso RestaMio salta l’incolla manuale quando l’associazione al lavoro è univoca.
8. Con più lavori aperti, l’app chiede esplicitamente a quale lavoro appartiene la risposta.
9. Dopo copia o condivisione del risultato, il badge in attesa scompare.
10. Tutti gli stati sopravvivono a chiusura e riapertura dell’app.

### 17.8 Schermata “Testo ripristinato”

Questa schermata appare al termine di un ripristino riuscito. Deve rendere evidente il risultato, permettere di utilizzarlo immediatamente e offrire il confronto soltanto su richiesta.

Testi esatti:

- Titolo: `Testo ripristinato`
- Helper: `I tuoi dati sono tornati al loro posto.`
- Stato: formato dinamico `{n} dati ripristinati`, esempio `3 dati ripristinati`
- Label risultato: `Il risultato`
- Riga confronto: `Vedi cosa è cambiato`
- CTA primaria: `Copia il testo`
- CTA secondaria: `Condividi`

Header e layout:

- Back a sinistra e wordmark `RestaMio` centrato, sotto la status safe area.
- Nessuna bottom navigation dell’app.
- Titolo e helper centrati.
- Pill verde di successo sotto l’helper.
- Scheda risultato bianca, raggio 18 dp, bordo `color.border`, padding 20 dp, altezza minima 280 dp.
- Riga confronto sotto la scheda, altezza minima 56 dp, raggio 16 dp e chevron destra.
- Azioni in contenitore inferiore con sfondo `color.background`, separato dal contenuto scrollabile.
- Su schermi bassi scorre il contenuto centrale; azioni e safe area restano disponibili.

Risultato:

- Testo in sola lettura, selezionabile, 16 sp/400, line-height 24 sp.
- Evidenziare esclusivamente i valori reinseriti con chip inline `#E6F5ED`, testo `#137A52`, raggio 6–8 dp.
- Non modificare spaziatura, punteggiatura o a capo della risposta AI oltre alla sostituzione dei placeholder.
- La selezione e copia parziale nativa restano abilitate.
- I valori ripristinati non sono controlli separati e non ricevono focus individuale.

Pill di successo:

- Icona shield-check verde 28–30 dp.
- Sfondo `#F4FAF6`, bordo 1 dp `#C6E3D0`, testo `color.textPrimary`.
- Informativa e non toccabile.
- Se zero dati vengono ripristinati, non usare uno stato di successo ingannevole; seguire gli stati di errore/attenzione.

`Vedi cosa è cambiato`:

- Compresso per impostazione predefinita.
- Espanso mostra per ogni sostituzione: placeholder ricevuto → valore ripristinato.
- Non mostrare il testo originale completo una seconda volta.
- Espansione 180–220 ms; preservare la posizione di lettura.
- Annunciare semanticamente stato compresso/espanso.

Azioni:

- `Copia il testo`: CTA primaria piena `color.primary`, altezza 52 dp, raggio pill, icona clipboard bianca.
- Tap copia esclusivamente il risultato finale senza label o metadati; mostra feedback `Testo copiato` per 1,5–2 s e aptica leggera.
- `Condividi`: pulsante secondario bianco con bordo 1,5 dp `color.primary`, altezza 52 dp, raggio pill, icona share arancione.
- Tap apre il menu di condivisione nativo con il solo risultato finale.
- Il contenitore azioni applica padding inferiore `systemNavigationInsetBottom + 16 dp`, evitando il doppio consumo dell’inset.
- Le hitbox non entrano nell’area di navigazione di sistema.

Completamento lavoro:

- Dopo una copia o una condivisione riuscita: `restored_unconsumed → completed`.
- Rimuovere il badge dei lavori in attesa dalla Cassaforte se non esistono altri lavori aperti.
- Rimuovere dalla Home la scheda prioritaria relativa a questo lavoro.
- Conservare il lavoro in Cassaforte fino alla scadenza impostata.
- Se l’utente torna indietro senza copiare o condividere, mantenere `restored_unconsumed` e mostrare in Home la scheda `Il testo è pronto`.

Accessibilità:

- Annuncio all’apertura: `Testo ripristinato. 3 dati ripristinati.` con conteggio dinamico.
- Scheda risultato: label `Risultato ripristinato`, valore uguale al testo completo.
- CTA copia: `Copia il testo ripristinato`.
- CTA share: `Condividi il testo ripristinato`.
- Non affidarsi al verde per comunicare il successo: usare anche icona e testo.

Test di accettazione:

1. Il risultato finale è completamente leggibile e selezionabile.
2. Soltanto i dati reinseriti sono evidenziati in verde.
3. Il numero nella pill coincide con le sostituzioni effettive.
4. `Copia il testo` copia soltanto il risultato finale.
5. `Condividi` condivide soltanto il risultato finale.
6. `Vedi cosa è cambiato` è compresso all’apertura ed espandibile.
7. Le azioni non si sovrappongono alla navigazione di sistema.
8. Copia o condivisione aggiornano immediatamente Home e Cassaforte.
9. Uscendo senza usare il risultato, il lavoro resta recuperabile.
10. Testo al 130% e schermi bassi usano lo scroll senza troncare risultato o azioni.

### 17.9 Strategia automatica e stato “Testo quasi pronto”

Principio vincolante: RestaMio ripristina automaticamente tutto ciò che può associare con certezza e non chiede all’utente di comprendere, scegliere o mappare manualmente i segnaposto.

Normalizzazione automatica ammessa:

- Differenze tra maiuscole e minuscole.
- Spazi o separatori equivalenti.
- Traduzioni note e univoche del tipo, per esempio `NOME` ↔ `NAME`.
- Punteggiatura adiacente al segnaposto.
- Varianti che mantengono un identificatore numerico univoco.

Regole di sicurezza:

- Applicare una sostituzione soltanto quando la corrispondenza è univoca.
- Non usare similarità probabilistica per reinserire un dato originale in una posizione ambigua.
- Se un dato protetto non compare nella risposta, non considerarlo un errore: il chatbot può legittimamente non averlo utilizzato.
- Se la risposta non contiene alcun dato da ripristinare e non contiene pattern sospetti, mostrare il risultato normalmente con stato neutro `Nessun dato da ripristinare`.
- Se rimane almeno un pattern simile a un segnaposto ma non associabile con certezza, lasciare invariato quel testo e mostrare `Testo quasi pronto`.
- Non mostrare mai all’utente schermate di mappatura manuale come `Scegli un altro dato`.

Testi esatti dello stato di attenzione:

- Titolo: `Testo quasi pronto`
- Helper: `Un dato non è stato ripristinato.` oppure forma plurale dinamica
- Pill: `{n} dato da controllare` / `{n} dati da controllare`
- Label risultato: `Il risultato`
- Messaggio: `Puoi usare comunque il testo oppure incollare un’altra risposta.`
- CTA primaria: `Copia comunque`
- CTA secondaria: `Incolla un’altra risposta`

Layout e stile:

- Stessa struttura della schermata `Testo ripristinato`.
- Usare ambra per attenzione, mai rosso distruttivo.
- Pill: sfondo ambra molto chiaro, bordo ambra tenue, icona shield/info e testo scuro.
- Evidenziare in ambra soltanto i segnaposto non risolti.
- Valori ripristinati con certezza restano evidenziati in verde.
- Banner informativo compatto sotto il risultato.
- Azioni in contenitore inferiore conforme alla safe area globale.
- Contenuto centrale scrollabile su schermi bassi.

Comportamento:

- `Copia comunque` copia il risultato nello stato corrente, mantenendo i segnaposto non risolti; nessun dato originale viene esposto per errore.
- Dopo la copia, segnare il lavoro `completed_with_unresolved` e conservarne l’avviso nel dettaglio Cassaforte.
- `Incolla un’altra risposta` torna a `Ora recupera la risposta`, preservando testo protetto e lavoro.
- Il nuovo incolla sostituisce la risposta precedente soltanto dopo che il testo è stato acquisito correttamente.
- Back mantiene il lavoro recuperabile nello stato `restored_unresolved`.

Accessibilità:

- Annuncio: `Testo quasi pronto. Un dato non è stato ripristinato.` con conteggio dinamico.
- Il segnaposto evidenziato espone anche `dato non ripristinato` nella descrizione semantica.
- Il significato non dipende dal colore ambra.

Test di accettazione:

1. I casi certi vengono ripristinati senza domande.
2. Un dato assente dalla risposta non produce un falso errore.
3. Una corrispondenza ambigua non provoca mai il reinserimento automatico del valore originale.
4. La schermata non richiede associazioni o conoscenze tecniche.
5. Sono presenti soltanto `Copia comunque` e `Incolla un’altra risposta`.
6. Copiare comunque mantiene il segnaposto irrisolto e non espone il dato originale.
7. Un nuovo tentativo non elimina la risposta precedente prima dell’acquisizione riuscita.
8. CTA e hitbox rispettano navigation bar, gesti e Home Indicator.

## 18. Modulo Groq — trascrizione vocale facoltativa

### 18.1 Confine funzionale e responsabilità

- Groq viene usato esclusivamente per trascrivere vocali condivisi da WhatsApp, Telegram o altre app compatibili e, se richiesta, per la traduzione audio supportata dal servizio.
- La funzione è facoltativa e disattivata finché l’utente non configura la propria API key.
- Modello BYOK: ogni utente utilizza il proprio account e la propria chiave Groq.
- RestaMio non fornisce una chiave condivisa, non sostiene i costi delle richieste e non gestisce il piano Groq dell’utente.
- Le richieste partono direttamente dal dispositivo verso gli endpoint ufficiali Groq; non transitano da server RestaMio.
- Non usare Groq per screenshot o immagini nella prima versione. OCR e rilevamento dei dati nelle immagini restano locali.
- Non promettere che Groq sia gratuito senza scadenza né fissare nell’interfaccia un limite permanente di ore.

### 18.2 Ingresso nel flusso

Quando RestaMio riceve un file audio e Groq non è configurato, mostrare la schermata di presentazione. `Non ora` chiude il modulo senza bloccare le altre funzioni dell’app. Non mostrare richieste di configurazione durante flussi testuali o importazioni non audio.

### 18.3 Schermata “Trascrivi i vocali”

Testi esatti:

- Titolo: `Trascrivi i vocali`
- Badge: `FUNZIONE ONLINE`
- Headline: `Trasforma un vocale in testo`
- Descrizione: `Funziona con i vocali di WhatsApp e Telegram usando il tuo account Groq.`
- Card piano — titolo: `Un piano gratuito generoso`
- Card piano — testo: `Groq offre un piano gratuito adatto all’uso quotidiano. Limiti e condizioni possono cambiare: verifica sempre il piano aggiornato sul sito ufficiale.`
- Link: `Verifica il piano gratuito`
- Card scelta — titolo: `Decidi tu se usarlo`
- Card scelta — testo: `La funzione è facoltativa. Userai la tua API key, salvata solo sul dispositivo. L’audio viene inviato direttamente a Groq e non passa da server RestaMio.`
- Nota: `RestaMio non applica costi e non gestisce il tuo piano Groq.`
- CTA: `Configura Groq`
- Secondaria: `Non ora`

Regole:

- Il badge online deve precedere qualsiasi invio e non dipendere soltanto dal colore.
- `Verifica il piano gratuito` apre la documentazione ufficiale Groq in un browser di sistema sicuro.
- Tutto il contenuto scorre su schermi bassi; il blocco azioni resta sopra gli inset di sistema.

### 18.4 Schermata “Configura Groq”

Testi esatti:

- Titolo: `Configura Groq`
- Badge: `FUNZIONE ONLINE`
- Headline: `Collega la tua API key`
- Descrizione: `La chiave serve solo per trascrivere i vocali con il tuo account Groq.`
- Label persistente: `API key Groq`
- Helper: `Viene salvata in modo sicuro solo su questo dispositivo.`
- Azione campo: `Incolla`
- Domanda: `Non hai ancora una chiave?`
- Link: `Scopri come fare`
- Supporto: `Ti guideremo nella creazione dell’account e della API key con i link ufficiali Groq.`
- Privacy: `RestaMio non può vedere la tua password Groq e non invia la chiave ai propri server.`
- CTA: `Verifica e salva`
- Secondaria: `Annulla`

Campo e sicurezza:

- Mascherare la chiave per impostazione predefinita; mostrare soltanto il prefisso riconoscibile e pallini.
- `Mostra/Nascondi` e `Incolla` hanno hitbox separate di almeno 44 × 44 dp/pt.
- Non registrare la chiave in log, analytics, crash report, backup, clipboard interna o stato serializzato.
- iOS: archiviare in Keychain con protezione disponibile solo dopo sblocco e senza sincronizzazione iCloud.
- Android: cifrare tramite Android Keystore; escludere il segreto da backup e trasferimento dispositivo.
- Non inviare la chiave a server RestaMio. Usarla soltanto nell'header di autorizzazione delle chiamate Groq.
- Quando l’app passa in background, rimaskerare immediatamente il campo e cancellare le copie temporanee in memoria appena possibile.
- `Verifica e salva` resta disabilitato finché il campo è vuoto o palesemente malformato.
- Con tastiera aperta, usare l’inset IME e mantenere la CTA sopra la tastiera.

Verifica:

- Eseguire una richiesta minima consentita da Groq che autentichi la chiave senza caricare audio personale.
- Successo: salvare nel deposito sicuro, mostrare `Groq è pronto` e tornare al vocale in attesa.
- `401/403`: `La API key non è valida o non dispone dei permessi necessari.`
- `429`: `Hai raggiunto un limite del tuo piano Groq. Verifica i limiti aggiornati e riprova più tardi.`
- Rete assente: `Connessione assente. La configurazione non è stata completata.`
- Errore non classificato: non salvare una nuova chiave non verificata; preservare quella valida precedente, se esiste.

### 18.5 Guida “Crea la tua API key”

Testi esatti:

- Titolo: `Crea la tua API key`
- Intro: `Ti bastano pochi minuti. Usa sempre e solo il sito ufficiale Groq.`
- Passaggio 1: `Crea o accedi al tuo account`
- Passaggio 1 — testo: `Apri Groq e completa l’accesso direttamente sul sito ufficiale.`
- Link: `Apri Groq`
- Passaggio 2: `Genera una API key`
- Passaggio 2 — testo: `Nella sezione API Keys scegli Create API Key e assegna un nome alla chiave.`
- Link: `Apri API Keys`
- Passaggio 3: `Copia e torna su RestaMio`
- Passaggio 3 — testo: `Copia la chiave appena creata. Potrai incollarla nella schermata precedente.`
- Card privacy — titolo: `Più privacy`
- Card privacy — testo: `Nelle impostazioni Groq puoi attivare Zero Data Retention.`
- Link: `Apri Data Controls`
- Nota: `RestaMio non ti chiederà mai la password Groq.`
- CTA: `Ho copiato la chiave`

Comportamento:

- Tutti i link esterni mostrano l’icona external-link e puntano esclusivamente a domini ufficiali Groq.
- Non incorporare form di login Groq né intercettare password, cookie o contenuto delle pagine.
- `Ho copiato la chiave` torna a `Configura Groq`, porta il focus sul campo e rende immediatamente disponibile `Incolla`.
- La freccia Back superiore è l’unica navigazione secondaria. Non mostrare `Torna indietro` vicino alla barra di sistema.

URL operativi da mantenere in configurazione remota e validare prima di ogni release:

- Account/console: `https://console.groq.com/`
- API keys: `https://console.groq.com/keys`
- Limiti: `https://console.groq.com/docs/rate-limits`
- Gestione dati: `https://console.groq.com/docs/your-data`

Se Groq modifica un percorso, aggiornare la configurazione e non il layout.

### 18.6 Safe area delle tre schermate

- Applicare il contratto globale degli inset senza eccezioni.
- Il contenitore sticky termina almeno 16 dp/pt sopra l’inset inferiore di sistema.
- Nessun testo secondario deve essere collocato sotto la CTA o vicino ai controlli Samsung.
- Nella guida, eliminare `Torna indietro`: è ridondante con Back e causava sovrapposizione con la barra Samsung.
- Il contenuto scrollabile riceve padding inferiore pari ad altezza del contenitore sticky + 16 dp/pt.
- Test obbligatori: Samsung tre pulsanti, Android gesture navigation, iPhone Home Indicator e tastiera visibile nella schermata API key.

### 18.7 Gestione della chiave nelle Impostazioni

Dopo la configurazione, la futura sezione Impostazioni deve mostrare soltanto:

- Stato: `Groq collegato`
- Azione: `Verifica connessione`
- Azione: `Sostituisci API key`
- Azione distruttiva: `Rimuovi API key`

Non mostrare mai la chiave completa. La rimozione cancella immediatamente il segreto dal deposito sicuro e disattiva la trascrizione, senza eliminare trascrizioni già salvate dall’utente.

### 18.8 Test di accettazione

1. È possibile usare tutta l’app tranne la trascrizione senza configurare Groq.
2. Nessuna richiesta Groq utilizza credenziali o fondi di RestaMio.
3. La chiave non appare in log, backup, analytics o crash report.
4. Una chiave non valida non sostituisce una chiave valida già salvata.
5. Il raggiungimento del rate limit non viene presentato come errore di RestaMio.
6. L’utente vede che l’audio lascerà il dispositivo prima del primo invio.
7. Tutti i link della guida portano a domini Groq ufficiali.
8. `Ho copiato la chiave` torna al campo corretto senza perdere il vocale in attesa.
9. CTA e hitbox non intersecano mai la barra Samsung, i gesti Android o l’Home Indicator.
10. Rimuovere la chiave disattiva Groq e rende il segreto irrecuperabile dall’interfaccia.

## 19. Elaborazione adattiva dei contenuti condivisi

### 19.1 Principio

Audio, documento e screenshot usano lo stesso scheletro di schermata, ma simboli, animazioni, stati, metadati e messaggi privacy cambiano in base al tipo riconosciuto. Non chiedere all’utente di selezionare manualmente il tipo se il sistema può determinarlo da MIME type, estensione e contenuto.

Se l’elaborazione locale termina entro 400 ms, saltare la schermata di caricamento e aprire direttamente il risultato successivo. Non introdurre ritardi artificiali per mostrare l’animazione.

### 19.2 Struttura comune

- Header centrato e controllo `X` a sinistra con hitbox minima 44 × 44 dp/pt.
- Badge di modalità sotto il titolo.
- Grande card centrale con simbolo animato specifico.
- Stato corrente, testo breve e progressione a tre fasi.
- Barra di avanzamento reale quando misurabile; animazione indeterminata nella fase senza percentuale affidabile.
- Nota privacy coerente con il percorso locale/online.
- Riga metadati del contenuto.
- Unica azione inferiore: annullamento, in contenitore sticky sopra la safe area.
- Nessuna bottom navigation durante l’elaborazione.

### 19.3 Variante audio

Testi:

- Titolo: `Trascrivo il vocale`
- Badge: `FUNZIONE ONLINE`
- Stato: `Creo la trascrizione`
- Supporto: `La trascrizione può richiedere qualche istante.`
- Fasi: `Preparo`, `Invio`, `Trascrivo`
- Privacy: `Il vocale viene inviato direttamente a Groq. Non passa da server RestaMio.`
- Azione: `Annulla trascrizione`

Animazione:

- Forma d’onda arancione con barre che cambiano altezza e pulsano dolcemente.
- Non dichiarare che la forma d’onda rappresenta l’audio reale durante l’elaborazione.
- `Preparo` usa avanzamento locale reale; `Invio` usa byte caricati/byte totali; `Trascrivo` usa stato indeterminato finché Groq non risponde.
- Nessuna percentuale numerica se non deriva da misurazione reale.

Metadati: origine leggibile e durata, per esempio `Vocale WhatsApp` e `0:42`.

### 19.4 Variante documento

Testi:

- Titolo: `Leggo il documento`
- Badge: `SOLO SUL DISPOSITIVO`
- Stato: `Cerco i dati da proteggere`
- Supporto: `L’analisi può richiedere qualche istante.`
- Fasi: `Apro`, `Leggo`, `Controllo`
- Privacy: `Il documento viene elaborato solo sul telefono.`
- Azione: `Annulla analisi`

Animazione:

- Foglio outline arancione con righe che si illuminano dall’alto verso il basso.
- Nei documenti multipagina, suggerire il cambio pagina senza animazioni 3D complesse.
- La progressione usa pagine lette/pagine totali quando disponibili; il controllo PII può essere indeterminato se non stimabile.

Metadati: nome file, pagine e dimensione, per esempio `Preventivo_cliente.pdf` e `6 pagine · 1,8 MB`.

### 19.5 Variante screenshot o immagine

Testi:

- Titolo: `Leggo lo screenshot` quando l’origine è identificabile; altrimenti `Leggo l’immagine`.
- Badge: `SOLO SUL DISPOSITIVO`
- Stato: `Cerco i dati da proteggere`
- Supporto: `L’analisi può richiedere qualche istante.`
- Fasi: `Preparo`, `Leggo`, `Controllo`
- Privacy: `L’immagine viene elaborata solo sul telefono.`
- Azione: `Annulla analisi`

Animazione:

- Cornice immagine con angoli di scansione e linea arancione che procede dall’alto verso il basso.
- Il movimento rappresenta l’OCR locale; non usare icone cloud o upload.
- Se OCR e controllo terminano quasi immediatamente, passare direttamente al risultato senza completare forzatamente il ciclo visivo.

Metadati: origine/nome, formato e dimensioni pixel, per esempio `Screenshot WhatsApp` e `PNG · 1080 × 2400`.

### 19.6 Stati e annullamento

- Il passaggio di fase aggiorna testo, semantica e feedback aptico leggero; non dipende solo dal colore.
- Un’azione completata mostra check; quella attiva mostra punto pulsante; quella futura resta neutra.
- `Annulla` interrompe il lavoro annullabile, elimina copie temporanee e torna alla schermata precedente preservando l’originale dell’utente.
- Durante l’upload audio, tentare la cancellazione della richiesta; non dichiarare cancellazione lato provider se non confermata.
- File non supportato: `Non riesco a leggere questo formato.` con azioni `Scegli un altro file` e `Chiudi`.
- File danneggiato: `Il file sembra danneggiato o incompleto.`
- OCR senza testo: `Non ho trovato testo leggibile in questa immagine.` con `Scegli un’altra immagine`.
- Nessuna rete nell’audio: non eliminare il file; mostrare `Connessione assente` e `Riprova`.
- Rate limit Groq: mantenere il vocale e mostrare il messaggio definito nel modulo Groq.

### 19.7 Duplicati e privacy

- Calcolare localmente un’impronta del contenuto per riconoscere duplicati senza caricare il file.
- Se esiste un risultato locale identico, aprirlo e mostrare un banner non bloccante: `Questo contenuto era già stato elaborato.`
- Non mostrare nuovamente l’animazione né ripetere una chiamata Groq senza necessità.
- Eliminare file temporanei appena non servono; la conservazione in Cassaforte segue la policy scelta dall’utente.

### 19.8 Motion e accessibilità

- Frequenza visiva morbida, senza flash; nessun elemento supera tre lampeggi al secondo.
- Supportare `Riduci movimento`: sostituire waveform/scan/pulse con cambi di stato e barra statica indeterminata.
- Annunciare ogni nuova fase una sola volta agli screen reader.
- Non spostare il focus automaticamente a ogni frame o aggiornamento della barra.
- L’animazione non può bloccare Back/Annulla.

### 19.9 Safe area

- Il contenitore di annullamento termina almeno 16 dp/pt sopra l’inset inferiore.
- Nessun metadato o testo viene collocato sotto l’azione.
- Il contenuto centrale scorre su schermi bassi e riceve padding inferiore pari al contenitore sticky + 16 dp/pt.
- Verificare tutte e tre le varianti su Samsung tre pulsanti, Android gesti e iPhone Home Indicator.

### 19.10 Test di accettazione

1. Il tipo viene riconosciuto senza una domanda aggiuntiva all’utente.
2. Audio mostra chiaramente il passaggio online; documento e immagine mostrano elaborazione locale.
3. Le percentuali compaiono soltanto quando misurate realmente.
4. Un’elaborazione inferiore a 400 ms non viene rallentata artificialmente.
5. Annulla resta utilizzabile e sopra la safe area in ogni fase.
6. Riduci movimento elimina pulsazioni e scansioni senza perdere lo stato.
7. Un duplicato locale non viene rielaborato né reinviato a Groq.
8. Il contenuto originale non viene cancellato quando l’utente annulla.

### 19.11 Risultato della trascrizione

Obiettivo: consentire ascolto, correzione e riuso immediato della trascrizione, mantenendo come percorso primario il controllo locale dei dati prima dell’uso con l’AI.

Testi esatti:

- Titolo: `Trascrizione pronta`
- Badge: `COMPLETATA`
- Card: `Testo trascritto`
- Azione card: `Modifica`
- Banner dinamico: `Ho trovato {detectedCount} dati da proteggere`
- Banner — supporto: `Controllali prima di usare il testo con l’AI.`
- Azioni secondarie: `Copia testo` e `Condividi`
- CTA: `Proteggi e continua`

Layout:

- Header con Back a sinistra e titolo centrato sotto la status safe area.
- Player audio compatto con play/pause, waveform, posizione corrente, durata e velocità `1×`.
- Card trascrizione bianca e leggibile; il contenuto scorre internamente soltanto oltre un’altezza massima ragionevole, altrimenti cresce con il testo.
- `Modifica` è un’azione testuale con icona, non icon-only.
- Banner dati protetti interamente toccabile; il tap apre direttamente `Dati da proteggere` mantenendo audio e trascrizione.
- `Copia testo` e `Condividi` sono azioni secondarie affiancate con label visibili.
- CTA primaria in contenitore sticky sopra gli inset di sistema; nessun testo o pulsante sotto la CTA.
- Nessuna bottom navigation.

Comportamento:

- Il rilevamento dei dati parte localmente non appena Groq restituisce la trascrizione; non richiede un tap aggiuntivo.
- `Proteggi e continua` apre `Dati da proteggere` con le selezioni consigliate già attive.
- `Modifica` rende il testo direttamente editabile, mostra tastiera e aggiorna il rilevamento locale con debounce; la CTA si sposta sopra l’inset IME.
- Dopo una modifica, conteggio e banner si aggiornano senza perdere la posizione del player.
- `Copia testo` copia la trascrizione non protetta nello stato corrente e mostra feedback `Testo copiato`; questa azione deve restare secondaria e non viene presentata come sicura per l’AI.
- `Condividi` apre lo share sheet del sistema con la trascrizione non protetta; prima del primo utilizzo, se sono presenti dati rilevati, mostrare un avviso conciso che distingue questa azione da `Proteggi e continua`.
- Il player riproduce il file locale dell’utente; non effettua un nuovo download da Groq.
- Back conserva il risultato nella policy locale/Cassaforte prevista e non ripete la chiamata Groq.

Stati:

- Zero dati rilevati: banner verde `Non ho trovato dati da proteggere`; CTA diventa `Continua` e apre la scelta attività AI senza una schermata vuota intermedia.
- Trascrizione vuota: `Non sono riuscito a trascrivere questo vocale.` con `Riprova` e `Chiudi`.
- Modifica non salvata: Back chiude la tastiera al primo tap; un secondo Back conserva automaticamente il testo modificato localmente e torna indietro.

Accessibilità:

- Player espone stato play/pausa, posizione e durata.
- La waveform è decorativa e nascosta agli screen reader.
- Il banner annuncia il conteggio in forma completa, non come numero isolato.
- `Modifica`, `Copia testo`, `Condividi` e CTA hanno target di almeno 44 × 44 dp/pt.
- Con font 130%, le azioni secondarie possono impilarsi verticalmente senza ridurre font o hitbox.

Test di accettazione:

1. Il testo Groq appare senza richiedere un’ulteriore conferma.
2. Il rilevamento locale aggiorna il banner automaticamente.
3. Modificare un nome o telefono aggiorna il conteggio senza nuova chiamata Groq.
4. Il player usa il file locale e continua a funzionare offline.
5. Copia e Condividi non vengono confuse con il percorso protetto.
6. `Proteggi e continua` apre la schermata con gli stessi dati e selezioni consigliate.
7. CTA e azioni restano sopra Samsung tre pulsanti, gesti Android, Home Indicator e tastiera.

### 19.12 Risultato OCR di screenshot o immagine

Obiettivo: permettere il confronto rapido con l’originale, la correzione del testo riconosciuto e il passaggio immediato alla protezione locale dei dati.

Testi esatti:

- Titolo: `Testo estratto`
- Badge: `SOLO SUL DISPOSITIVO`
- Originale: `Screenshot originale` oppure `Immagine originale`
- Azione originale: `Vedi originale`
- Card: `Testo riconosciuto`
- Azione card: `Modifica`
- Banner dinamico: `Ho trovato {detectedCount} dati da proteggere`
- Banner — supporto: `Controllali prima di usare il testo con l’AI.`
- Azioni secondarie: `Copia testo` e `Condividi`
- CTA: `Proteggi e continua`

Layout:

- Header con Back a sinistra e titolo centrato sotto la status safe area.
- Card originale compatta con miniatura, tipo, dimensioni pixel e azione testuale `Vedi originale`.
- La miniatura aiuta il riconoscimento ma non domina la schermata.
- Card testo bianca, leggibile e direttamente modificabile.
- Banner dati interamente toccabile con chevron; apre `Dati da proteggere`.
- Azioni secondarie affiancate; con font 130% possono impilarsi.
- CTA sticky sopra gli inset; nessun controllo o testo sotto la CTA.
- Nessuna bottom navigation.

Comportamento:

- OCR e rilevamento dei dati avvengono localmente.
- `Vedi originale` apre un visualizzatore full-screen con zoom, pan e orientamento corretto; Back ritorna senza perdere testo, selezioni o scroll.
- `Modifica` abilita l’editing e aggiorna il rilevamento locale con debounce.
- `Proteggi e continua` apre `Dati da proteggere` con le selezioni consigliate già attive.
- `Copia testo` e `Condividi` operano sul testo OCR non protetto e restano secondarie; applicare lo stesso avviso del risultato audio quando sono presenti dati rilevati.
- Non includere automaticamente l’immagine originale nello share sheet quando l’utente sceglie `Condividi` dalla schermata del testo.
- Back conserva il risultato secondo la policy locale e non ripete OCR se l’impronta del file non cambia.

Affidabilità OCR:

- Non correggere silenziosamente nomi, numeri, email o codici con un modello generativo.
- Le porzioni a bassa confidenza possono essere evidenziate in modo non invasivo e annunciate come `da controllare`, senza bloccare il flusso.
- Se non viene trovato testo: `Non ho trovato testo leggibile in questa immagine.` con `Scegli un’altra immagine` e `Chiudi`.
- Se una rotazione automatica è incerta, consentire `Ruota` nel visualizzatore originale e rieseguire OCR localmente.

Stato senza dati:

- Banner verde: `Non ho trovato dati da proteggere`.
- CTA: `Continua`, collegata direttamente alla scelta attività AI.
- Non aprire una schermata Dati da proteggere vuota.

Accessibilità e safe area:

- La miniatura espone nome/tipo del contenuto, non una descrizione automatica inventata.
- `Vedi originale`, `Modifica`, `Copia testo`, `Condividi` e CTA hanno target minimi 44 × 44 dp/pt.
- Il visualizzatore supporta zoom di sistema e chiusura prevedibile.
- CTA e hitbox terminano almeno 16 dp/pt sopra l’inset inferiore; con tastiera usare l’inset IME.

Test di accettazione:

1. L’immagine non viene inviata a Groq o a server RestaMio.
2. Aprire e chiudere l’originale non perde modifiche o posizione.
3. Modificare il testo aggiorna localmente il conteggio dei dati.
4. Un’immagine senza testo produce uno stato chiaro e recuperabile.
5. Il risultato non viene ricalcolato se il file locale è identico.
6. Il percorso protetto resta visivamente primario rispetto a copia e condivisione.
7. Tutti i controlli rispettano Samsung tre pulsanti, gesti Android, Home Indicator, font 130% e tastiera.

## 20. Istruzioni per Claude

Quando si implementa questa specifica:

1. Non inventare componenti, testi, colori o comportamenti mancanti.
2. Creare token centralizzati per colori, tipografia, spaziatura, raggi e ombre.
3. Implementare prima i componenti globali, poi comporre la Home.
4. Usare unità logiche (`dp`, `pt`, constraint o equivalenti), non le coordinate pixel della bitmap.
5. Usare gli inset reali del dispositivo; non simulare status bar o system navigation nell’app.
6. Mantenere la Home scrollabile quando altezza o dimensionamento testo lo richiedono.
7. Non incorporare la mascotte finché non è disponibile l’asset ufficiale.
8. Aggiungere test/snapshot per larghezze 320, 360, 390 e 430 dp.
9. Verificare temi e modalità soltanto quando la relativa schermata verrà specificata; questa versione descrive il tema chiaro.
10. In caso di conflitto, prevalgono nell’ordine: testi definitivi, regole UX, token globali, specifica della schermata, coordinate indicative.

## 21. Registro decisioni

| Versione | Decisione |
|---|---|
| 0.1 | Nome definitivo di lavoro: RestaMio, con `Resta` scuro e `Mio` arancione. |
| 0.1 | La destinazione “Cassaforte” resta invariata. |
| 0.1 | Home chiara approvata come base grafica. |
| 0.1 | “Scrivi un testo” sostituito da “Incolla o scrivi un testo”. |
| 0.1 | Specifica Home formalizzata dal riferimento 746 × 1536 px. |
| 0.2 | Approvata la Home iniziale/senza lavori: nessun messaggio vuoto, titolo “Da dove vuoi iniziare?”, azione testo arancione e importazione secondaria. |
| 0.3 | Approvato onboarding chiaro in tre passaggi con Willy animato, navigazione compatta e demo protetto→ripristinato. |
| 0.4 | Approvato inserimento contenuto vuoto: comando Incolla nel campo, un solo banner privacy, niente bottom navigation e CTA collegata al modulo. |
| 0.5 | Approvata la scelta attività AI: quattro azioni rapide quadrate e compatte, `Personalizza` fissa, tre preferiti configurabili, campi contestuali progressivi e CTA `Continua` verso `Controllo finale`. |
| 0.6 | Corretta la CTA inferiore: area sticky sopra gli inset di sistema, senza sovrapposizioni con la navigazione Samsung a tre pulsanti, i gesti Android o l’Home Indicator iOS. |
| 0.7 | Verificate tutte le schermate approvate e introdotto un contratto globale per status bar, navigation bar, Home Indicator e tastiera, con test obbligatori multipiattaforma. |
| 0.8 | Approvati il rientro dal chatbot e la Home in attesa: schermata preparata prima dello share sheet, istruzione contestuale, CTA Incolla, badge Cassaforte e stato lavoro sincronizzato. |
| 0.9 | Approvato il Controllo finale: richiesta direttamente modificabile, riepilogo dati espandibile e CTA sticky sopra gli inset di sistema. |
| 1.0 | Approvato Testo ripristinato: valori reinseriti evidenziati, confronto progressivo, copia primaria, condivisione secondaria e completamento sincronizzato del lavoro. |
| 1.1 | Approvato Testo quasi pronto: normalizzazione automatica sicura, nessuna mappatura manuale e due sole azioni per i rari segnaposto ambigui. |
| 1.2 | Approvata la schermata Dati da proteggere: categorie comprimibili, switch ON/OFF, valori identici raggruppati per occorrenza, date e link verificabili e CTA sticky con conteggio. |
| 1.3 | Approvato il modulo Groq BYOK facoltativo: presentazione trasparente, piano gratuito descritto senza garanzia permanente, chiave locale protetta, guida con link ufficiali e CTA corrette per la safe area Samsung. |
| 1.4 | Approvato il componente di elaborazione adattiva: waveform audio online, scansione screenshot locale, lettura documento locale, progressione reale, nessun ritardo artificiale e annullamento conforme alla safe area. |
| 1.5 | Approvato il risultato della trascrizione: player locale, testo modificabile, rilevamento automatico, copia/condivisione secondarie e CTA Proteggi e continua. |
| 1.6 | Approvato il risultato OCR locale: anteprima originale con zoom, testo modificabile, rilevamento automatico e CTA Proteggi e continua. |

## 22. Prossime schermate da specificare

- Inserimento/incolla del contenuto.
- Importazione file e gestione formati non supportati.
- Copia del testo protetto.
- Risposta vuota, incolla fallito e indisponibilità temporanee.
- Cassaforte: vuoto, elenco e dettaglio.
- Impostazioni e piano.
- Collegamento e modalità desktop.
