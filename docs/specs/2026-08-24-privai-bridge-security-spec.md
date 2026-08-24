# PrivAI Bridge — Specifica di sicurezza e prodotto

## Decisione

Non attivare ancora un relay cloud. Prima completare Android con Keystore, Share Target e test reali. Il collegamento desktop arriverà come funzione Pro dopo il gate nativo.

## Promessa verificabile

> I dati originali restano sul telefono. Al computer e all’IA viene inviata soltanto la versione protetta. Il ripristino avviene localmente e su richiesta.

Non usare «anonimizzazione garantita», «sicurezza al 100%» o «crittografia» per descrivere la sola sostituzione con segnaposto.

## Esperienza

1. Il computer mostra un QR monouso.
2. Il telefono scansiona e conferma nome del computer e codice breve.
3. Il telefono invia solo testo protetto; il mapping resta locale.
4. Il computer restituisce la risposta ancora protetta.
5. Il telefono mostra i segnaposto riconosciuti e chiede conferma prima del ripristino.
6. Inviare il risultato completo al computer richiede una seconda conferma.

## Architettura

- Cifratura end-to-end tra telefono e desktop.
- Chiavi dispositivo nel Keystore/Keychain.
- Relay come casella temporanea di sole buste cifrate, senza chiavi di decifratura.
- Pairing QR senza documenti, mapping o testo sensibile nell’URL.
- Buste con versione, ID, mittente, destinatario, sequenza, scadenza, nonce e ciphertext autenticato.
- Mapping escluso da relay e computer.
- Eliminazione del messaggio entro 15 minuti dal ritiro o 24 ore dalla creazione.

## Minacce coperte

- Lettura del contenuto da parte del relay.
- Riutilizzo di QR e messaggi.
- Computer non confermati o revocati.
- Ripristino con mapping di un altro lavoro.
- Contenuti sensibili in URL, log, analytics, crash report o backup.
- Conservazione indefinita di messaggi e associazioni dispositivo.

## Limiti

- Un computer che riceve esplicitamente il risultato completo diventa fidato.
- Malware, root/jailbreak e tastiere compromesse non rientrano nella garanzia.
- Il rilevatore base può non trovare nomi, indirizzi liberi e riferimenti contestuali.
- I servizi IA applicano le proprie condizioni a ciò che l’utente condivide.

## Gate prima del relay

1. APK installato su dispositivo reale.
2. Mapping cifrato con Keystore e cancellazione verificata.
3. Share Target nativo senza query URL o cache web.
4. Nessun documento, mapping o chiave in log o backup.
5. Test di ripristino tra lavori diversi e revisione del modello di minaccia.
6. Provider relay scelto con retention, limiti economici e tetto di spesa documentati.

## Modello economico

«Continua sul computer» sarà Pro. Il prototipo non deve simulare una sincronizzazione attiva. Costi e prezzo vengono validati in beta chiusa.
