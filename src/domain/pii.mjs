/**
 * Rilevamento dati sensibili — tutto in locale, nessuna chiamata di rete.
 *
 * Novità rispetto alla v1:
 *  - nomi di persona (rubrica personale + titoli + dizionario nomi italiani)
 *  - indirizzi fisici, partita IVA, carte di pagamento, IBAN internazionali
 *  - livello di rischio per tipo: i dati ad alto rischio nascono selezionati,
 *    date e link no (mascherarli peggiora la risposta dell'IA)
 *  - varianti dello stesso soggetto condividono lo stesso segnaposto
 *  - segnaposto brevi e leggibili: [NOME_1], [EMAIL_2]…
 */

/* ------------------------------------------------------------------ */
/* Validatori                                                          */
/* ------------------------------------------------------------------ */

const CF_ODD = {
  0: 1, 1: 0, 2: 5, 3: 7, 4: 9, 5: 13, 6: 15, 7: 17, 8: 19, 9: 21,
  A: 1, B: 0, C: 5, D: 7, E: 9, F: 13, G: 15, H: 17, I: 19, J: 21,
  K: 2, L: 4, M: 18, N: 20, O: 11, P: 3, Q: 6, R: 8, S: 12, T: 14,
  U: 16, V: 10, W: 22, X: 25, Y: 24, Z: 23,
};

export function isValidFiscalCode(value) {
  const code = String(value).toUpperCase().replace(/\s/g, '');
  if (!/^[A-Z]{6}[0-9]{2}[A-EHLMPRST][0-9]{2}[A-Z][0-9]{3}[A-Z]$/.test(code)) return false;
  let total = 0;
  for (let index = 0; index < 15; index += 1) {
    const char = code[index];
    total += index % 2 === 0
      ? CF_ODD[char]
      : (Number.isNaN(Number(char)) ? char.charCodeAt(0) - 65 : Number(char));
  }
  return String.fromCharCode(65 + (total % 26)) === code[15];
}

/** IBAN di qualsiasi paese, non solo italiano: la fattura estera va protetta uguale. */
export function isValidIban(value) {
  const iban = String(value).replace(/[\s.-]/g, '').toUpperCase();
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$/.test(iban)) return false;
  const rearranged = `${iban.slice(4)}${iban.slice(0, 4)}`;
  let remainder = 0;
  for (const char of rearranged) {
    const chunk = /[A-Z]/.test(char) ? String(char.charCodeAt(0) - 55) : char;
    for (const digit of chunk) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}

/** Partita IVA italiana: 11 cifre con carattere di controllo. */
export function isValidVatNumber(value) {
  const digits = String(value).replace(/\D/g, '');
  if (digits.length !== 11) return false;
  let total = 0;
  for (let index = 0; index < 10; index += 1) {
    const digit = Number(digits[index]);
    if (index % 2 === 0) total += digit;
    else {
      const doubled = digit * 2;
      total += doubled > 9 ? doubled - 9 : doubled;
    }
  }
  return (10 - (total % 10)) % 10 === Number(digits[10]);
}

/** Luhn, per carte di pagamento. */
export function isValidCard(value) {
  const digits = String(value).replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let total = 0;
  let double = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (double) { digit *= 2; if (digit > 9) digit -= 9; }
    total += digit;
    double = !double;
  }
  return total % 10 === 0;
}

/* ------------------------------------------------------------------ */
/* Dizionari                                                           */
/* ------------------------------------------------------------------ */

/** Nomi propri italiani più diffusi. Serve a riconoscere "Mario Rossi" senza dizionario di cognomi. */
const FIRST_NAMES = new Set(`
alessandro andrea antonio alberto alessio alfredo angelo aldo arturo augusto
bruno biagio bernardo carlo carmine cesare christian claudio corrado cristian
daniele dario davide diego domenico donato edoardo elia emanuele enrico enzo
ettore fabio fabrizio federico felice ferdinando filippo francesco franco gabriele
gaetano gennaro giacomo gianluca gianni gioacchino giorgio giovanni giulio giuseppe
graziano gregorio guido ignazio ivan jacopo lorenzo luca luciano ludovico luigi
manuel marcello marco mario massimiliano massimo matteo maurizio mauro michele
mirko moreno nicola nicolo omar oscar osvaldo paolo pasquale patrizio piero pietro
raffaele renato riccardo roberto rocco rosario ruggero salvatore samuele sandro
sergio silvano silvio simone stefano tommaso ubaldo umberto valentino valerio
vincenzo vito vittorio walter
ada adriana alessandra alice amalia anna annalisa antonella arianna assunta aurora
barbara beatrice benedetta bianca camilla carla carlotta carmela caterina cecilia
chiara cinzia clara claudia concetta cristina daniela debora diana donatella elena
eleonora elisa elisabetta emanuela emma enrica erica ester eva federica fernanda
filomena flavia franca francesca gabriella gaia gemma giada gianna gina giorgia
giovanna giulia giuliana giuseppina grazia ida ilaria immacolata irene isabella
katia laura lea letizia lidia liliana linda lisa loredana lucia luciana ludovica
luisa maddalena manuela mara marcella margherita maria marianna marina marisa marta
martina matilde maura michela milena mirella monica nadia natalia nicoletta nives
noemi ornella paola patrizia piera pina raffaella rebecca renata rita roberta romina
rosa rosanna rosaria rossana rossella sabrina samanta sandra sara serena silvana
silvia simona sofia sonia stefania susanna teresa tiziana valentina valeria vanessa
vera veronica vittoria viviana
`.trim().split(/\s+/));

/**
 * I titoli si scrivono sia "Dott." sia "dott.", ma il flag "i" sull'intera
 * espressione renderebbe insensibili alle maiuscole anche le parole del nome:
 * la ricerca diventerebbe avida e si mangerebbe la frase intera
 * ("Sabino Cutrì ha eseguito il sopralluogo il"). Qui l'alternanza fra
 * maiuscola e minuscola è limitata alla prima lettera del titolo.
 */
const TITLES = [
  'sig', 'sig\\.ra', 'sigg', 'sign', 'signor', 'signora', 'dott', 'dott\\.ssa', 'dr', 'dr\\.ssa',
  'avv', 'ing', 'arch', 'geom', 'rag', 'prof', 'prof\\.ssa', 'on', 'egr', 'egregio',
  'gent', 'gentile', 'gent\\.mo', 'spett', 'spett\\.le', 'notaio', 'cav', 'comm',
].map((titolo) => `[${titolo[0]}${titolo[0].toUpperCase()}]${titolo.slice(1)}`).join('|');
const STREETS = 'Via|V\\.le|Viale|Piazza|P\\.zza|Pza|Piazzale|Corso|C\\.so|Largo|Vicolo|Strada|Str\\.|Contrada|C\\.da|Località|Loc\\.|Borgo|Lungomare|Salita|Traversa|Fraz\\.|Frazione';
const COMPANY_SUFFIX = 'S\\.?r\\.?l\\.?s?|S\\.?p\\.?A\\.?|S\\.?n\\.?c\\.?|S\\.?a\\.?s\\.?|S\\.?S\\.?|Soc\\.? Coop\\.?|SRL|SPA|SNC|SAS';
/** Parole che aprono una ragione sociale anche senza forma societaria. */
const ORG_HEADS = 'Banca|Banco|Studio Legale|Studio|Assicurazioni|Comune di|Provincia di|Regione|Ospedale|Clinica|Istituto|Fondazione|Associazione|Cooperativa|Agenzia|Immobiliare|Autofficina|Farmacia|Poste|Ministero';

const WORD = '[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ’\']+';
/** Nelle vie compaiono numeri romani e ordinali: "Corso Vittorio Emanuele II". */
const STREET_TOKEN = `(?:${WORD}|[IVXL]{1,5}|[0-9]{1,3}[°ºª]?|d[ei'’]|degli|della|delle|del|dello|la|le|il|lo|san|santa|santo|sant[’'])`;

const MESI = 'gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre';

/**
 * Comuni italiani: tutti i capoluoghi di provincia più i centri maggiori.
 * Non è l'elenco completo degli 8.000 comuni — quello va nel livello neurale —
 * ma copre la larga maggioranza dei documenti reali.
 */
const COMUNI = new Set([
  // Una voce per riga, separate da virgola: la versione precedente le ricavava
  // con uno split e produceva voci spurie come "la", che marcava come città
  // ogni articolo del testo.
  'roma', 'milano', 'napoli', 'torino', 'palermo', 'genova', 'bologna', 'firenze', 'bari', 'catania',
  'venezia', 'verona', 'messina', 'padova', 'trieste', 'brescia', 'parma', 'taranto', 'prato', 'modena',
  'perugia', 'ravenna', 'livorno', 'rimini', 'cagliari', 'foggia', 'ferrara', 'salerno', 'latina', 'monza',
  'sassari', 'bergamo', 'pescara', 'trento', 'siracusa', 'vicenza', 'terni', 'bolzano', 'piacenza', 'novara',
  'ancona', 'andria', 'udine', 'arezzo', 'cesena', 'lecce', 'pesaro', 'barletta', 'alessandria', 'pisa',
  'pistoia', 'catanzaro', 'lucca', 'brindisi', 'treviso', 'como', 'marsala', 'grosseto', 'pozzuoli', 'varese',
  'fiumicino', 'casoria', 'asti', 'caserta', 'gela', 'aprilia', 'ragusa', 'pavia', 'cremona', 'carpi',
  'altamura', 'imola', 'massa', 'trapani', 'viterbo', 'cosenza', 'potenza', 'afragola', 'vittoria', 'crotone',
  'pomezia', 'vigevano', 'bitonto', 'aversa', 'velletri', 'molfetta', 'faenza', 'matera', 'acerra', 'sanremo',
  'carrara', 'viareggio', 'savona', 'benevento', 'cerignola', 'avellino', 'chieti', 'campobasso', 'rieti',
  'isernia', 'oristano', 'nuoro', 'enna', 'caltanissetta', 'agrigento', 'sondrio', 'lecco', 'lodi', 'mantova',
  'rovigo', 'belluno', 'pordenone', 'gorizia', 'biella', 'verbania', 'vercelli', 'cuneo', 'aosta', 'imperia',
  'macerata', 'fermo', 'teramo', 'frosinone', 'rovereto', 'merano', 'schio', 'conegliano', 'legnago', 'mira',
  'chioggia', 'portogruaro', 'este', 'forlì', 'siena', 'olbia', 'trani', 'scafati', 'marano', 'battipaglia',
  // Nomi composti: vanno elencati per intero.
  'reggio calabria', 'reggio emilia', 'giugliano in campania', 'la spezia', 'sesto san giovanni',
  'cinisello balsamo', 'guidonia montecelio', 'torre del greco', 'busto arsizio', "quartu sant'elena",
  'lamezia terme', "l'aquila", 'castellammare di stabia', 'vibo valentia', 'ascoli piceno',
  'bassano del grappa', 'san donà di piave', 'barletta andria trani', 'san giuliano milanese',
  'cologno monzese', 'paderno dugnano', 'settimo torinese', 'moncalieri', 'rho', 'seregno', 'desio',
]);

/**
 * Accorcia un candidato IBAN da destra finché non supera il controllo.
 * Restituisce sempre un prefisso del valore ricevuto, così la posizione
 * iniziale del riscontro resta valida.
 */
function refineIban(value) {
  let candidate = value;
  while (candidate.replace(/\s/g, '').length >= 15) {
    if (isValidIban(candidate)) return candidate;
    candidate = candidate.slice(0, -1).replace(/\s+$/, '');
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Tipi                                                               */
/* ------------------------------------------------------------------ */

/**
 * risk: 'high'  → nasce selezionato (dato identificativo o economico)
 *       'low'   → nasce deselezionato (mascherarlo peggiora la risposta dell'IA)
 */
export const SENSITIVE_TYPES = Object.freeze({
  NAME:     { risk: 'high', tag: 'NOME' },
  ORG:      { risk: 'high', tag: 'AZIENDA' },
  EMAIL:    { risk: 'high', tag: 'EMAIL' },
  PHONE:    { risk: 'high', tag: 'TEL' },
  ADDRESS:  { risk: 'high', tag: 'INDIRIZZO' },
  CITY:     { risk: 'high', tag: 'CITTA' },
  CF:       { risk: 'high', tag: 'CF' },
  VAT:      { risk: 'high', tag: 'PIVA' },
  IBAN:     { risk: 'high', tag: 'IBAN' },
  CARD:     { risk: 'high', tag: 'CARTA' },
  DOCID:    { risk: 'high', tag: 'DOCUMENTO' },
  PLATE:    { risk: 'high', tag: 'TARGA' },
  CATASTO:  { risk: 'high', tag: 'CATASTO' },
  CUSTOM:   { risk: 'high', tag: 'RISERVATO' },
  AMOUNT:   { risk: 'low',  tag: 'IMPORTO' },
  DATE:     { risk: 'low',  tag: 'DATA' },
  URL:      { risk: 'low',  tag: 'LINK' },
});

const LABELS = {
  it: { NAME: 'Nome', ORG: 'Azienda', EMAIL: 'Email', PHONE: 'Telefono', ADDRESS: 'Indirizzo', CITY: 'Città', CF: 'Codice fiscale', VAT: 'Partita IVA', IBAN: 'IBAN', CARD: 'Carta', DOCID: 'Documento', PLATE: 'Targa', CATASTO: 'Dati catastali', CUSTOM: 'Dalla tua rubrica', AMOUNT: 'Importo', DATE: 'Data', URL: 'Link' },
  en: { NAME: 'Name', ORG: 'Company', EMAIL: 'Email', PHONE: 'Phone', ADDRESS: 'Address', CITY: 'City', CF: 'Tax code', VAT: 'VAT number', IBAN: 'IBAN', CARD: 'Card', DOCID: 'Document no.', PLATE: 'Plate', CATASTO: 'Land registry', CUSTOM: 'From your list', AMOUNT: 'Amount', DATE: 'Date', URL: 'Link' },
};

export function displaySensitiveType(type, locale = 'it') {
  const language = String(locale).toLowerCase().startsWith('it') ? 'it' : 'en';
  return LABELS[language][type] ?? String(type ?? '');
}

/**
 * Riassunto leggibile di COSA e' stato nascosto: "1 nome, 2 email".
 *
 * Serve al riquadro delle impostazioni rapide, che agisce senza aprire
 * nulla: un numero da solo ("3 dati nascosti") non permette di accorgersi
 * che ha preso la cosa sbagliata, o che ne ha mancata una. I TIPI si
 * possono mostrare, i valori no: comparirebbero sopra qualunque app.
 *
 * @param {Record<string,string>} mapping segnaposto -> valore originale
 * @param {string} locale
 * @returns {string} elenco separato da virgole, gia' pronto da mostrare
 */
export function summariseMapping(mapping, locale = 'it') {
  const perTag = new Map();
  for (const [type, info] of Object.entries(SENSITIVE_TYPES)) perTag.set(info.tag, type);

  const conteggi = new Map();
  for (const segnaposto of Object.keys(mapping ?? {})) {
    // I segnaposto hanno forma [TAG_1], a volte [TAG_1A] quando il testo
    // conteneva gia' quella stringa: in entrambi i casi il tag e' la parte
    // prima del primo trattino basso.
    const tag = /^\[([A-Z]+)_/.exec(segnaposto)?.[1];
    const type = tag && perTag.get(tag);
    if (!type) continue;
    conteggi.set(type, (conteggi.get(type) ?? 0) + 1);
  }

  return [...conteggi.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([type, quanti]) => {
      const etichetta = displaySensitiveType(type, locale);
      // "1 nome" ma "1 IBAN": gli acronimi restano maiuscoli, abbassarli
      // ("1 iban", "1 partita iva") si legge come un refuso.
      const leggibile = etichetta === etichetta.toUpperCase() ? etichetta : etichetta.toLowerCase();
      return `${quanti} ${leggibile}`;
    })
    .join(', ');
}

export function riskOf(type) {
  return SENSITIVE_TYPES[type]?.risk ?? 'high';
}

/* ------------------------------------------------------------------ */
/* Rilevatori                                                          */
/* ------------------------------------------------------------------ */

/** L'ordine è la priorità: in caso di sovrapposizione vince il primo. */
const detectors = [
  {
    type: 'EMAIL',
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu,
  },
  {
    type: 'IBAN',
    pattern: /\b[A-Z]{2}[0-9]{2}(?:[ ]?[A-Z0-9]){10,30}\b/giu,
    // Il quantificatore è avido e la classe, con il flag "i", accetta anche le
    // minuscole: su "IBAN IT60… entro il 30/09" si mangia le parole successive
    // e la validazione scarta tutto. Si accorcia da destra finché non torna
    // valido — l'inizio non cambia, quindi la posizione resta corretta.
    refine: refineIban,
    validate: isValidIban,
  },
  {
    type: 'CF',
    pattern: /\b[A-Z]{6}[0-9]{2}[A-EHLMPRST][0-9]{2}[A-Z][0-9]{3}[A-Z]\b/giu,
    validate: isValidFiscalCode,
  },
  {
    type: 'VAT',
    // Richiede un indizio ("P. IVA", "partita iva", "VAT"), ma maschera solo il
    // numero: l'etichetta resta leggibile e l'IA capisce di che dato si tratta.
    pattern: /\b(?:p(?:artita)?\.?\s*iva|vat(?:\s*number)?|c\.?f\.?\s*\/\s*p\.?\s*iva)\b[:\s]*((?:IT\s*)?[0-9]{11})\b/gidu,
    capture: 1,
    validate: isValidVatNumber,
  },
  {
    type: 'CARD',
    pattern: /(?<!\w)(?:[0-9]{4}[ -]?){3}[0-9]{1,7}(?!\w)/gu,
    validate: isValidCard,
  },
  {
    type: 'CATASTO',
    // "foglio 12, particella 345, subalterno 6" — identifica un immobile in
    // modo univoco quanto un codice fiscale identifica una persona.
    pattern: /\bfoglio\s*n?\.?\s*[0-9]{1,4}\s*[,;]?\s*(?:particella|mapp(?:ale)?)\s*n?\.?\s*[0-9]{1,5}(?:\s*[,;]?\s*sub(?:alterno)?\s*n?\.?\s*[0-9]{1,4})?/giu,
  },
  {
    type: 'ADDRESS',
    // Via Roma 12 · Piazza Aldo Moro, 4 · Corso Vittorio Emanuele II 145
    pattern: new RegExp(
      `\\b(?:${STREETS})\\s+${STREET_TOKEN}(?:\\s+${STREET_TOKEN}){0,4}[,]?\\s*(?:n\\.?\\s*)?[0-9]{1,4}\\s*(?:[/-]?\\s*[A-Za-z])?(?:\\s*,?\\s*[0-9]{5}\\s+${WORD}(?:\\s+${WORD})?)?`,
      'gu',
    ),
  },
  {
    type: 'ADDRESS',
    // CAP + comune anche senza la via: "70121 Bari (BA)" resta identificante.
    pattern: new RegExp(`\\b[0-9]{5}\\s+${WORD}(?:[ -]${WORD}){0,2}(?:\\s*\\([A-Z]{2}\\))?`, 'gu'),
  },
  {
    type: 'PLATE',
    // Targa italiana dal 1994: due lettere, tre cifre, due lettere.
    pattern: /(?<![A-Z0-9])[A-Z]{2}\s?[0-9]{3}\s?[A-Z]{2}(?![A-Z0-9])/gu,
  },
  {
    type: 'DOCID',
    // Carta d'identità elettronica e passaporto: servono le parole d'appoggio,
    // altrimenti si prende qualsiasi sigla con numeri.
    pattern: /\b(?:carta\s+d[’']identità|c\.?i\.?|passaporto|patente|tessera\s+sanitaria|documento)\s*(?:n\.?|numero)?\s*([A-Z]{2}\s?[0-9]{5,7}[A-Z]?|[A-Z]{2}[0-9]{7})\b/gidu,
    capture: 1,
  },
  {
    type: 'AMOUNT',
    pattern: /(?:€|EUR)\s?[0-9]{1,3}(?:[.\s][0-9]{3})*(?:,[0-9]{2})?|\b[0-9]{1,3}(?:[.\s][0-9]{3})*,[0-9]{2}\s?(?:€|EUR|euro)\b/giu,
  },
  {
    type: 'PHONE',
    // Italiani e internazionali generici, con o senza separatori.
    pattern: /(?<![\w/])(?:\+[0-9]{1,3}[ .-]?)?(?:\(?0[0-9]{1,3}\)?|3[0-9]{2})[ .-]?[0-9]{3}[ .-]?[0-9]{3,4}(?![\w/])/gu,
    validate: (value) => value.replace(/\D/g, '').length >= 9,
  },
  {
    type: 'ORG',
    pattern: new RegExp(`\\b${WORD}(?:\\s+(?:${WORD}|&|e))*\\s+(?:${COMPANY_SUFFIX})`, 'gu'),
  },
  {
    type: 'ORG',
    // Ragioni sociali senza forma societaria: "Banca Intesa", "Studio Legale
    // Bianchi & Associati". Sono altrettanto identificanti.
    pattern: new RegExp(`\\b(?:${ORG_HEADS})(?:\\s+(?:${WORD}|&|e|di|del|della))+`, 'gu'),
  },
  {
    type: 'NAME',
    // Titolo (anche doppio, anche minuscolo, anche con l'elisione: "dall'avv.")
    // seguito dal nome. Il titolo resta in chiaro: aiuta l'IA a tenere il
    // registro giusto nella risposta.
    pattern: new RegExp(
      `(?:^|[\\s(«"'’])(?:${TITLES})\\.?\\s+(?:(?:${TITLES})\\.?\\s+)?(${WORD}(?:\\s+(?:${WORD}|d[ei']|de|van|von|el|al|bin))*)`,
      'gdu',
    ),
    capture: 1,
  },
  {
    type: 'NAME',
    // Nome proprio noto seguito da uno o due cognomi.
    pattern: new RegExp(`\\b${WORD}\\s+${WORD}(?:\\s+${WORD})?\\b`, 'gu'),
    validate: (value) => FIRST_NAMES.has(value.split(/\s+/)[0].toLowerCase()),
  },
  {
    type: 'CITY',
    pattern: new RegExp(`\\b${WORD}(?:[ -]${WORD}){0,3}\\b`, 'gu'),
    validate: (value) => COMUNI.has(value.toLowerCase()),
  },
  {
    type: 'DATE',
    pattern: /\b(?:0?[1-9]|[12]\d|3[01])[\/.\-](?:0?[1-9]|1[0-2])[\/.\-](?:19|20)\d{2}\b/gu,
  },
  {
    type: 'DATE',
    // Date scritte a parole: "15 marzo 2025", "1° gennaio 2026".
    pattern: new RegExp(`\\b(?:0?[1-9]|[12][0-9]|3[01])[°ºª]?\\s+(?:${MESI})\\s+(?:19|20)[0-9]{2}\\b`, 'giu'),
  },
  {
    type: 'URL',
    pattern: /\b(?:https?:\/\/|www\.)[^\s<>()]+/giu,
  },
  {
    // Ultimo livello, il più debole: due parole maiuscole in mezzo a una frase
    // somigliano a un nome. Serve a pescare i nomi che non stanno nel
    // dizionario — "Ilenia Zappalà", "Wanda Sgarbi" — che sono la maggioranza
    // di quelli veri.
    //
    // Nasce DESELEZIONATO di proposito: la certezza non c'è, e proporre un
    // dubbio è meglio sia di nasconderlo sia di agire al posto dell'utente.
    type: 'NAME',
    maybe: true,
    // Il confine finale deve essere una NON-lettera, non "niente punto":
    // quest'ultimo faceva tornare indietro l'espressione dentro la parola e
    // "Ilenia Zappalà" diventava "Ilenia Zappal", lasciando la à in chiaro e
    // rompendo il ripristino.
    pattern: new RegExp(`(?<=[a-zà-öø-ÿ,;:]\\s)(${WORD}\\s+${WORD})(?![\\p{L}\\p{N}])`, 'gdu'),
    capture: 1,
    validate: (value) => {
      const parole = value.toLowerCase().split(/\s+/);
      if (parole.some((parola) => PAROLE_NON_NOMI.has(parola))) return false;
      return !COMUNI.has(value.toLowerCase());
    },
  },
];

/**
 * Parole maiuscole che in italiano non sono quasi mai nomi di persona.
 * Senza questo elenco l'ultimo rilevatore marcherebbe mezza pubblica
 * amministrazione.
 */
const PAROLE_NON_NOMI = new Set(`
consiglio stato corte costituzionale cassazione tribunale procura comune provincia regione ministero
agenzia entrate camera senato repubblica italia italiana italiano europa unione europea
gennaio febbraio marzo aprile maggio giugno luglio agosto settembre ottobre novembre dicembre
lunedì martedì mercoledì giovedì venerdì sabato domenica
spett spettabile egregio gentile oggetto riferimento allegato allegati cordiali distinti saluti
banca banco studio legale assicurazioni ospedale clinica istituto fondazione associazione
via viale piazza corso largo vicolo strada località iva codice fiscale partita
srl spa snc sas societa società ditta impresa
media social comunicazione marketing strategist manager digital brand content account
`.trim().split(/\s+/));

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Voci della rubrica personale.
 * Una voce "Mario Rossi" genera anche "Rossi" e "Mario", tutte con lo stesso
 * groupKey: l'IA deve vedere lo stesso segnaposto ovunque, altrimenti perde
 * il filo di chi è chi.
 */
function vaultDetectors(entries = []) {
  const built = [];
  for (const entry of entries) {
    const label = String(entry?.value ?? entry ?? '').trim();
    if (label.length < 2) continue;
    const type = entry?.type ?? 'CUSTOM';
    const group = `vault:${label.toLowerCase()}`;
    const words = label.split(/\s+/).filter((word) => word.length > 2);
    const variants = new Set([label, ...(words.length > 1 ? words : [])]);
    for (const variant of variants) {
      built.push({
        type,
        group,
        canonical: label,
        pattern: new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(variant)}(?![\\p{L}\\p{N}])`, 'giu'),
        weight: variant === label ? 0 : 1,
      });
    }
  }
  // Le voci più lunghe per prime: "Mario Rossi" deve vincere su "Rossi".
  return built.sort((a, b) => a.weight - b.weight || b.canonical.length - a.canonical.length);
}

/**
 * @param {string} text
 * @param {{ vault?: Array }} options rubrica personale dell'utente
 * @returns {Array} elenco ordinato per posizione, senza sovrapposizioni
 */
export function detectSensitiveData(text, { vault = [] } = {}) {
  const source = String(text ?? '');
  if (!source) return [];

  const candidates = [];
  const push = (detector, rawValue, start, priority) => {
    const value = detector.refine ? detector.refine(rawValue) : rawValue;
    if (!value) return;
    if (detector.validate && !detector.validate(value)) return;
    candidates.push({
      id: `${detector.type}-${start}-${value.length}`,
      type: detector.type,
      value,
      start,
      end: start + value.length,
      group: detector.group ?? `${detector.type}:${value.toLowerCase().replace(/\s+/g, ' ')}`,
      maybe: Boolean(detector.maybe),
      selected: !detector.maybe && riskOf(detector.type) === 'high',
      priority,
    });
  };

  // La rubrica personale ha sempre la precedenza: è una scelta esplicita dell'utente.
  vaultDetectors(vault).forEach((detector, index) => {
    for (const match of source.matchAll(detector.pattern)) push(detector, match[0], match.index, index - 1000);
  });

  detectors.forEach((detector, index) => {
    const capture = detector.capture ?? 0;
    for (const match of source.matchAll(detector.pattern)) {
      // Con capture > 0 mascheriamo solo una parte del riscontro: l'etichetta
      // ("P. IVA", "Gentile Dott.") resta leggibile, il dato sparisce.
      const raw = match[capture];
      if (raw === undefined) continue;
      const span = capture === 0 ? [match.index, match.index + match[0].length] : match.indices?.[capture];
      if (!span) continue;
      const trimmed = raw.replace(/\s+$/, '');
      push(detector, trimmed, span[0], index);
    }
  });

  candidates.sort((a, b) => a.start - b.start || a.priority - b.priority || b.end - a.end);

  const accepted = [];
  for (const item of candidates) {
    if (accepted.some((other) => item.start < other.end && item.end > other.start)) continue;
    accepted.push(item);
  }

  return propagateSurnames(source, accepted).map(({ priority, ...finding }) => finding);
}

/**
 * Nei documenti il nome compare per esteso una volta sola: "Gentile Dott. Marco
 * Bianchi" in apertura, e poi solo "Bianchi" per tre pagine. Senza questo
 * passaggio il cognome resta in chiaro ovunque, che è il modo più facile di
 * fallire proprio dopo aver fatto la cosa difficile.
 *
 * Le occorrenze successive ricevono lo stesso `group`, quindi lo stesso
 * segnaposto: l'IA continua a capire che si parla della stessa persona.
 */
function propagateSurnames(source, accepted) {
  const extra = [];

  // Solo i nomi certi (titolo o nome di battesimo riconosciuto) propagano il
  // cognome. Il livello "forse" è un'ipotesi debole su due parole maiuscole:
  // propagarlo vorrebbe dire mascherare ovunque anche solo "Media" o
  // "Strategist" perché comparivano una volta accanto a un'altra maiuscola —
  // esattamente il falso positivo segnalato dall'uso reale.
  for (const finding of accepted.filter((item) => item.type === 'NAME' && !item.maybe)) {
    const parti = finding.value.split(/\s+/).filter((parte) => parte.length > 2);
    if (parti.length < 2) continue;

    for (const parte of parti) {
      const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(parte)}(?![\\p{L}\\p{N}])`, 'gu');
      for (const match of source.matchAll(pattern)) {
        const start = match.index;
        const end = start + parte.length;
        const collide = (item) => start < item.end && end > item.start;
        if (accepted.some(collide) || extra.some(collide)) continue;
        extra.push({
          id: `NAME-${start}-${parte.length}`,
          type: 'NAME',
          value: parte,
          start,
          end,
          group: finding.group,       // stesso segnaposto del nome completo
          selected: true,
          priority: finding.priority,
        });
      }
    }
  }

  return [...accepted, ...extra].sort((a, b) => a.start - b.start);
}

/* ------------------------------------------------------------------ */
/* Mascheratura                                                        */
/* ------------------------------------------------------------------ */

/**
 * Segnaposto brevi e semantici: [NOME_1] invece di [[PRIVAI_7F3A2B1C_NAME_1]].
 * Le IA li conservano molto più spesso, e l'utente li riconosce a colpo d'occhio.
 */
function buildPlaceholder(type, index, source) {
  const tag = SENSITIVE_TYPES[type]?.tag ?? type;
  let placeholder = `[${tag}_${index}]`;
  let guard = 0;
  while (source.includes(placeholder) && guard < 50) {
    guard += 1;
    placeholder = `[${tag}_${index}${String.fromCharCode(96 + guard).toUpperCase()}]`;
  }
  return placeholder;
}

export function maskFindings(text, findings) {
  const source = String(text ?? '');
  const selected = (findings ?? [])
    .filter((item) => item.selected !== false)
    .sort((a, b) => a.start - b.start);

  const counters = new Map();
  const byGroup = new Map();
  const mapping = {};
  let cursor = 0;
  let output = '';

  for (const finding of selected) {
    if (finding.start < cursor) continue;
    const group = finding.group ?? `${finding.type}:${finding.value}`;
    if (!byGroup.has(group)) {
      const next = (counters.get(finding.type) ?? 0) + 1;
      counters.set(finding.type, next);
      byGroup.set(group, buildPlaceholder(finding.type, next, source));
    }
    const placeholder = byGroup.get(group);
    // Ogni variante testuale va ricordata: l'utente si aspetta di rivedere
    // esattamente quello che c'era scritto.
    mapping[placeholder] = mapping[placeholder] ?? finding.value;
    output += source.slice(cursor, finding.start) + placeholder;
    cursor = finding.end;
  }
  output += source.slice(cursor);

  return { text: output, mapping };
}

/* ------------------------------------------------------------------ */
/* Ripristino                                                          */
/* ------------------------------------------------------------------ */

/**
 * Le IA a volte riscrivono il segnaposto: lo mettono in grassetto, cambiano
 * le parentesi, aggiungono spazi. Cerchiamo anche queste varianti prima di
 * dire all'utente che un dato non è stato ritrovato.
 */
function placeholderVariants(placeholder) {
  const inner = placeholder.replace(/^\[|\]$/g, '');
  const escaped = escapeRegExp(inner).replace(/_/g, '[ _-]?');
  return new RegExp(`[\`*_]{0,2}[\\[\\(\\{【「]\\s*${escaped}\\s*[\\]\\)\\}】」][\`*_]{0,2}`, 'gi');
}

export function restoreProtectedText(text, mapping) {
  let output = String(text ?? '');
  let restoredCount = 0;
  const missing = [];
  const recovered = [];

  for (const [placeholder, original] of Object.entries(mapping ?? {})) {
    if (output.includes(placeholder)) {
      const occurrences = output.split(placeholder).length - 1;
      output = output.split(placeholder).join(original);
      restoredCount += occurrences;
      continue;
    }
    const loose = placeholderVariants(placeholder);
    if (loose.test(output)) {
      loose.lastIndex = 0;
      const occurrences = (output.match(loose) ?? []).length;
      output = output.replace(loose, original);
      restoredCount += occurrences;
      recovered.push(placeholder);
      continue;
    }
    missing.push({ placeholder, original });
  }

  return { text: output, restoredCount, missing, recovered };
}

/** Serve a capire se un testo incollato è una risposta dell'IA da ripristinare. */
export function countKnownPlaceholders(text, mapping) {
  const source = String(text ?? '');
  if (!source) return 0;
  return Object.keys(mapping ?? {}).filter((placeholder) => (
    source.includes(placeholder) || placeholderVariants(placeholder).test(source)
  )).length;
}

/**
 * Decide se, al rientro nell'app, vale la pena proporre il ripristino.
 *
 * Sta qui e non nell'interfaccia perché è la regola che tocca gli appunti
 * dell'utente: deve essere leggibile, verificabile e provata da un test.
 *
 * Condizioni, tutte necessarie:
 *  - esiste almeno un lavoro aperto in cassaforte;
 *  - negli appunti c'è del testo;
 *  - quel testo contiene almeno un segnaposto NOSTRO.
 * In ogni altro caso non si propone nulla e il contenuto degli appunti non
 * viene né mostrato né conservato.
 */
export function shouldOfferRestore(clipboardText, mapping) {
  const testo = String(clipboardText ?? '');
  if (!testo.trim()) return { offer: false, count: 0 };
  if (!mapping || !Object.keys(mapping).length) return { offer: false, count: 0 };
  const count = countKnownPlaceholders(testo, mapping);
  return { offer: count > 0, count };
}

/** Riepilogo per tipo, per la schermata di verifica. */
export function groupFindings(findings) {
  const groups = new Map();
  (findings ?? []).forEach((finding, index) => {
    // I riscontri incerti stanno in un gruppo a parte: mescolarli con quelli
    // sicuri farebbe sembrare tutto ugualmente affidabile.
    const key = finding.maybe ? `${finding.type}:maybe` : finding.type;
    if (!groups.has(key)) groups.set(key, { key, type: finding.type, maybe: Boolean(finding.maybe), items: [] });
    groups.get(key).items.push({ ...finding, index });
  });
  // Prima i dati ad alto rischio: sono quelli su cui l'utente deve decidere.
  // Date e link stanno in fondo, dove finisce chi ha voglia di scorrere.
  // Certi ad alto rischio, poi certi a basso rischio, poi gli incerti in fondo.
  const weight = (group) => (group.maybe ? 2 : (riskOf(group.type) === 'high' ? 0 : 1));
  return [...groups.values()].sort((a, b) => (
    weight(a) - weight(b) || b.items.length - a.items.length
  ));
}

/** Cinque parole attorno al dato: verificare senza rileggere tutto il documento. */
export function contextAround(text, finding, radius = 32) {
  const source = String(text ?? '');
  const before = source.slice(Math.max(0, finding.start - radius), finding.start).replace(/\s+/g, ' ');
  const after = source.slice(finding.end, finding.end + radius).replace(/\s+/g, ' ');
  return {
    before: (finding.start > radius ? '…' : '') + before,
    after: after + (finding.end + radius < source.length ? '…' : ''),
  };
}
