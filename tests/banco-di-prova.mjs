/**
 * Banco di prova per il rilevamento.
 *
 * Frasi realistiche di documenti professionali italiani, annotate a mano.
 * Serve a rispondere con dei numeri, non a occhio, alla domanda: quanto ci
 * perdiamo per strada?
 *
 * Regola di onestà: le frasi NON sono scelte per far bella figura. Contengono
 * apposta i casi che un rilevatore a espressioni regolari sbaglia — nomi non
 * italiani, cognomi da soli, aziende senza forma societaria — perché sono
 * esattamente quelli che un commercialista o un avvocato incontra ogni giorno.
 */

export const CASI = [
  {
    testo: 'Gentile Dott. Marco Bianchi, le confermo l’appuntamento di lunedì.',
    atteso: [['Marco Bianchi', 'NAME']],
  },
  {
    testo: 'Ho parlato con Mario Rossi e con la sig.ra Anna Verdi.',
    atteso: [['Mario Rossi', 'NAME'], ['Anna Verdi', 'NAME']],
  },
  {
    testo: 'Il ricorso è stato depositato dall’avv. Yassine El Amrani per conto del cliente.',
    atteso: [['Yassine El Amrani', 'NAME']],
  },
  {
    testo: 'La perizia è firmata dall’ing. Ludmilla Petrova, iscritta all’albo di Torino.',
    atteso: [['Ludmilla Petrova', 'NAME'], ['Torino', 'CITY']],
  },
  {
    testo: 'Come anticipato, Pellegrini ha rifiutato la proposta transattiva.',
    atteso: [['Pellegrini', 'NAME']],
  },
  {
    testo: 'Il geom. Sabino Cutrì ha eseguito il sopralluogo il 15 marzo 2025.',
    atteso: [['Sabino Cutrì', 'NAME'], ['15 marzo 2025', 'DATE']],
  },
  {
    testo: 'Scrivere a laura.neri@studio-neri.it oppure alla PEC studio.neri@pec.it',
    atteso: [['laura.neri@studio-neri.it', 'EMAIL'], ['studio.neri@pec.it', 'EMAIL']],
  },
  {
    testo: 'Recapiti: 335 1234567, ufficio 02 4567890, fax +39 02 4567891.',
    atteso: [['335 1234567', 'PHONE'], ['02 4567890', 'PHONE'], ['+39 02 4567891', 'PHONE']],
  },
  {
    testo: 'Codice fiscale MRTMTT25D09F205Z e partita IVA 00743110157.',
    atteso: [['MRTMTT25D09F205Z', 'CF'], ['00743110157', 'VAT']],
  },
  {
    testo: 'Bonifico su IT60X0542811101000000123456 entro il 30/09/2026.',
    atteso: [['IT60X0542811101000000123456', 'IBAN'], ['30/09/2026', 'DATE']],
  },
  {
    testo: 'Fornitore estero: IBAN DE89370400440532013000, pagamento a 60 giorni.',
    atteso: [['DE89370400440532013000', 'IBAN']],
  },
  {
    testo: 'Addebito sulla carta 4111 1111 1111 1111 intestata al cliente.',
    atteso: [['4111 1111 1111 1111', 'CARD']],
  },
  {
    testo: 'Residenza in Via Giuseppe Verdi 12/B, 20121 Milano.',
    atteso: [['Via Giuseppe Verdi 12/B, 20121 Milano', 'ADDRESS']],
  },
  {
    testo: 'Sede operativa: Piazza Aldo Moro, 4 - 70121 Bari (BA).',
    atteso: [['Piazza Aldo Moro, 4', 'ADDRESS'], ['70121 Bari', 'ADDRESS']],
  },
  {
    testo: 'L’immobile si trova in Corso Vittorio Emanuele II 145, Napoli.',
    atteso: [['Corso Vittorio Emanuele II 145', 'ADDRESS'], ['Napoli', 'CITY']],
  },
  {
    testo: 'Il contratto è con Rossi Costruzioni S.r.l. dal 2019.',
    atteso: [['Rossi Costruzioni S.r.l.', 'ORG']],
  },
  {
    testo: 'Abbiamo aperto il conto presso Banca Intesa la settimana scorsa.',
    atteso: [['Banca Intesa', 'ORG']],
  },
  {
    testo: 'La controparte è assistita da Studio Legale Bianchi & Associati.',
    atteso: [['Studio Legale Bianchi & Associati', 'ORG']],
  },
  {
    testo: 'Importo dovuto: € 12.500,00 oltre IVA di legge.',
    atteso: [['€ 12.500,00', 'AMOUNT']],
  },
  {
    testo: 'Il veicolo targato AB123CD era parcheggiato in divieto.',
    atteso: [['AB123CD', 'PLATE']],
  },
  {
    testo: 'Allego copia della carta d’identità n. AX1234567 rilasciata dal Comune.',
    atteso: [['AX1234567', 'DOCID']],
  },
  {
    testo: 'Dati catastali: foglio 12, particella 345, subalterno 6.',
    atteso: [['foglio 12, particella 345, subalterno 6', 'CATASTO']],
  },
  {
    testo: 'Il paziente, nato il 09/04/1978, risiede a Reggio Calabria.',
    atteso: [['09/04/1978', 'DATE'], ['Reggio Calabria', 'CITY']],
  },
  {
    testo: 'Verbale redatto a Sesto San Giovanni alla presenza di Ilenia Zappalà.',
    atteso: [['Sesto San Giovanni', 'CITY'], ['Ilenia Zappalà', 'NAME']],
  },
  {
    testo: 'Il progetto Fenice è seguito da Wanda Sgarbi per la parte tecnica.',
    atteso: [['Wanda Sgarbi', 'NAME']],
  },
  // Controprove: qui NON deve trovare nulla di sensibile.
  {
    testo: 'Il Consiglio di Stato ha chiarito il punto con la sentenza n. 1234.',
    atteso: [],
    tolleraExtra: true,
  },
  {
    testo: 'Allego il preventivo aggiornato come da accordi telefonici.',
    atteso: [],
  },
  {
    testo: 'La riunione si terrà in sala grande al secondo piano.',
    atteso: [],
  },
];

/**
 * Tipi ancora scoperti. Da quando città, importi, targhe, documenti e dati
 * catastali sono stati aggiunti, l'elenco è vuoto: resta qui perché il giorno
 * che se ne aggiunge uno nuovo si sappia dove dichiararlo.
 */
export const TIPI_NON_SUPPORTATI = new Set([]);
