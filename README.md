# PrivAI Pocket — prototipo mobile

Prototipo installabile che converte testo in Markdown, rileva dati sensibili localmente e crea pacchetti pronti per qualsiasi IA.

## Avvio

```bash
npm run serve
```

Aprire `http://localhost:4173`. Per installarlo su Android, il sito deve essere servito tramite HTTPS oppure da `localhost`; in Chrome usare **Aggiungi a schermata Home / Installa app**.

## Test

```bash
npm test
```

## Stato delle funzioni

- Operative: interfaccia italiano/inglese, importazione locale di `.txt`, `.md` e PDF con testo selezionabile, conversione Markdown, rilevazione locale strutturata, protezione selettiva, preparazione prompt, scelta della lingua del risultato, copia/condivisione, cronologia locale, punti e configurazione API dimostrativa.
- Prototipo: ricezione di testo dalla condivisione Android dipende dal supporto Web Share Target del browser.
- Non ancora collegate: chiamate reali ai provider, OCR di immagini e PDF scansionati, trascrizione audio, Google Login/Drive, acquisti in-app.

## Progetto Android

Il contenitore Capacitor 8 è nella cartella `android/` con application ID `app.privai.pocket`, Android minimo API 24 e target API 36.

```bash
npm install
npm run android:sync
npm run android:debug
```

La compilazione richiede Android Studio/Android SDK e accesso al download della distribuzione Gradle indicata da `android/gradle/wrapper/gradle-wrapper.properties`. L’APK di debug, quando compilato, si trova in `android/app/build/outputs/apk/debug/app-debug.apk` e si installa con:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## Privacy

Il flusso predefinito non invia documenti a server. Questa versione non garantisce anonimizzazione: usa rilevatori deterministici e richiede sempre revisione umana. Le chiavi API sono conservate soltanto nella sessione del browser; il pacchetto nativo dovrà usare Android Keystore e iOS Keychain.

Il lettore PDF è incluso nell'app e lavora localmente. La prima versione accetta documenti fino a 15 MB e 50 pagine; i PDF protetti da password e quelli composti soltanto da immagini vengono rifiutati con una spiegazione. PDF.js 5.6.205 è incluso secondo licenza Apache-2.0, conservata in `vendor/PDFJS-LICENSE.txt`.

## Riferimenti

La tassonomia e i principi del motore privacy prendono spunto da [Rizzo-PII](https://github.com/Rizzo-AI-Academy/rizzo-pii), progetto MIT di Simone Rizzo / Rizzo AI Academy. Nessun binario Rizzo-PII, modello mmBERT o componente PyMuPDF è incluso in questo prototipo.
