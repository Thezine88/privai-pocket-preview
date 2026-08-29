import test from 'node:test';
import assert from 'node:assert/strict';

import {
  detectSensitiveData, maskFindings, restoreProtectedText, groupFindings,
  countKnownPlaceholders, contextAround, riskOf, shouldOfferRestore,
  isValidFiscalCode, isValidIban, isValidVatNumber, isValidCard,
} from '../src/domain/pii.mjs';
import { decideQuickProtect } from '../src/domain/quickProtect.mjs';
import { normalizeToMarkdown, buildRequest, titleFromText, containsPlaceholders } from '../src/domain/markdown.mjs';
import { createVault, RETENTION, retentionLabel, clampRetention, WIPED_KEYS, createRemoteStore } from '../src/domain/vault.mjs';
import { getRecipe, defaultAnswers, toggleAnswer, isAnswerActive, instructionsFor, RECIPES } from '../src/domain/recipes.mjs';
import { planOf, createDesktopSessions, pairingCode, isUnlimited } from '../src/domain/plan.mjs';
import { createTranslator, normalizeLocale } from '../src/domain/i18n.mjs';
import { renderQrSvg } from '../src/domain/qr.mjs';
import { it as itDict } from '../src/locales/it.mjs';
import { en as enDict } from '../src/locales/en.mjs';
import { CASI } from './banco-di-prova.mjs';

/* ------------------------------------------------------------------ */
/* Validatori                                                          */
/* ------------------------------------------------------------------ */

test('validatori: accettano i valori corretti e rifiutano quelli sbagliati', () => {
  // Vettori pubblici noti, usati per verificare l'algoritmo del carattere di controllo.
  assert.ok(isValidFiscalCode('MRTMTT25D09F205Z'));
  assert.ok(isValidFiscalCode('MLLSNT82P65Z404U'));
  assert.ok(isValidFiscalCode('DLMCTG75B07H227Y'));
  assert.ok(!isValidFiscalCode('MRTMTT25D09F205A'), 'carattere di controllo sbagliato');
  assert.ok(!isValidFiscalCode('MRTMTT25D09F205'), 'lunghezza sbagliata');

  assert.ok(isValidIban('IT60X0542811101000000123456'));
  assert.ok(isValidIban('DE89370400440532013000'), 'un IBAN estero va protetto come uno italiano');
  assert.ok(!isValidIban('IT60X0542811101000000123457'));

  assert.ok(isValidVatNumber('00743110157'));
  assert.ok(!isValidVatNumber('00743110158'));

  assert.ok(isValidCard('4111111111111111'));
  assert.ok(!isValidCard('4111111111111112'));
});

/* ------------------------------------------------------------------ */
/* Rilevamento                                                         */
/* ------------------------------------------------------------------ */

const LETTERA = `Gentile Dott. Marco Bianchi,
come concordato con Mario Rossi il 12/03/2025, le invio i dati.
Rossi Costruzioni S.r.l. — P. IVA 00743110157 — Via Giuseppe Verdi 12/B, 20121 Milano.
Scrivimi a laura.neri@studio-neri.it o chiama il 335 1234567.
IBAN IT60X0542811101000000123456 · https://www.studio-neri.it`;

test('rileva nomi, indirizzi, partita IVA e IBAN', () => {
  const types = detectSensitiveData(LETTERA).map((finding) => finding.type);
  for (const expected of ['NAME', 'ADDRESS', 'VAT', 'IBAN', 'EMAIL', 'PHONE', 'ORG']) {
    assert.ok(types.includes(expected), `manca il tipo ${expected}`);
  }
});

test('il titolo resta leggibile: si maschera il nome, non "Gentile Dott."', () => {
  const names = detectSensitiveData(LETTERA).filter((finding) => finding.type === 'NAME');
  assert.ok(names.some((finding) => finding.value === 'Marco Bianchi'));
  assert.ok(!names.some((finding) => finding.value.includes('Gentile')));
});

test('la partita IVA maschera il numero e non l\'etichetta', () => {
  const vat = detectSensitiveData(LETTERA).find((finding) => finding.type === 'VAT');
  assert.equal(vat.value, '00743110157');
});

test('date e link nascono deselezionati: mascherarli peggiora la risposta dell\'IA', () => {
  const findings = detectSensitiveData(LETTERA);
  const date = findings.find((finding) => finding.type === 'DATE');
  const url = findings.find((finding) => finding.type === 'URL');
  const email = findings.find((finding) => finding.type === 'EMAIL');
  assert.equal(date.selected, false);
  assert.equal(url.selected, false);
  assert.equal(email.selected, true);
  assert.equal(riskOf('DATE'), 'low');
  assert.equal(riskOf('NAME'), 'high');
});

test('i riscontri non si sovrappongono mai', () => {
  const findings = detectSensitiveData(LETTERA);
  for (let i = 1; i < findings.length; i += 1) {
    assert.ok(findings[i].start >= findings[i - 1].end, 'due riscontri si sovrappongono');
  }
});

test('la rubrica personale riconosce anche le varianti dello stesso soggetto', () => {
  const text = 'Il progetto di Rossi Costruzioni va avanti. Ho sentito Costruzioni ieri.';
  const findings = detectSensitiveData(text, { vault: [{ value: 'Rossi Costruzioni', type: 'ORG' }] });
  const masked = maskFindings(text, findings);
  // "Rossi Costruzioni" e la variante "Costruzioni" condividono il segnaposto:
  // altrimenti l'IA perde il filo di chi è chi.
  assert.equal(masked.text.match(/\[AZIENDA_1\]/g).length, 2);
  assert.equal(Object.keys(masked.mapping).length, 1);
});

test('il contesto mostra il dato dentro la frase', () => {
  const findings = detectSensitiveData(LETTERA);
  const email = findings.find((finding) => finding.type === 'EMAIL');
  const around = contextAround(LETTERA, email);
  assert.ok(around.before.includes('Scrivimi a'));
});

/* ------------------------------------------------------------------ */
/* Mascheratura e ripristino                                           */
/* ------------------------------------------------------------------ */

test('i segnaposto sono brevi e leggibili', () => {
  const findings = detectSensitiveData(LETTERA);
  const masked = maskFindings(LETTERA, findings);
  assert.match(masked.text, /\[EMAIL_1\]/);
  assert.ok(!masked.text.includes('PRIVAI_'), 'niente segnaposto lunghi come nella v1');
});

test('mascherare e ripristinare restituisce il testo originale', () => {
  const findings = detectSensitiveData(LETTERA);
  const masked = maskFindings(LETTERA, findings);
  const back = restoreProtectedText(masked.text, masked.mapping);
  assert.equal(back.missing.length, 0);
  const originali = Object.values(masked.mapping);
  for (const valore of originali) assert.ok(back.text.includes(valore));
});

test('il ripristino tollera i segnaposto riscritti dall\'IA', () => {
  const findings = detectSensitiveData(LETTERA);
  const masked = maskFindings(LETTERA, findings);
  const risposta = masked.text
    .replace('[EMAIL_1]', '**[ EMAIL_1 ]**')
    .replace('[NOME_1]', '(NOME-1)');
  const back = restoreProtectedText(risposta, masked.mapping);
  assert.equal(back.missing.length, 0, 'le varianti comuni vanno recuperate');
  assert.ok(back.recovered.length >= 2);
});

test('i segnaposto davvero persi vengono elencati, non nascosti', () => {
  const masked = { text: 'Ciao [NOME_1], scrivi a [EMAIL_1]', mapping: { '[NOME_1]': 'Marco', '[EMAIL_1]': 'a@b.it' } };
  const back = restoreProtectedText('Ciao [NOME_1], scrivi al recapito indicato', masked.mapping);
  assert.equal(back.restoredCount, 1);
  assert.equal(back.missing.length, 1);
  assert.equal(back.missing[0].placeholder, '[EMAIL_1]');
});

test('riconosce una risposta protetta incollata', () => {
  const mapping = { '[NOME_1]': 'Marco' };
  assert.equal(countKnownPlaceholders('Gentile [NOME_1], ecco', mapping), 1);
  assert.equal(countKnownPlaceholders('Nessun segnaposto qui', mapping), 0);
});

test('i riscontri si raggruppano per tipo', () => {
  const groups = groupFindings(detectSensitiveData(LETTERA));
  assert.ok(groups.length >= 5);
  assert.ok(groups.every((group) => group.items.length >= 1));
});

test('i dati delicati stanno in cima, date e link in fondo', () => {
  const groups = groupFindings(detectSensitiveData(LETTERA)).map((group) => group.type);
  const primoBasso = Math.min(groups.indexOf('DATE'), groups.indexOf('URL'));
  const ultimoAlto = Math.max(groups.indexOf('NAME'), groups.indexOf('IBAN'), groups.indexOf('EMAIL'));
  assert.ok(ultimoAlto < primoBasso,
    'i gruppi ad alto rischio devono precedere date e link: sono quelli su cui si decide');
});

/* ------------------------------------------------------------------ */
/* Markdown e richiesta                                                */
/* ------------------------------------------------------------------ */

test('normalizza elenchi, numerazioni e titoli', () => {
  const out = normalizeToMarkdown('RIUNIONE SETTIMANALE\n\n• primo punto\n1) secondo punto');
  assert.match(out, /^# Riunione settimanale/);
  assert.match(out, /- primo punto/);
  assert.match(out, /1\. secondo punto/);
});

test('la richiesta spiega all\'IA come trattare i segnaposto, ma solo se ce ne sono', () => {
  const conSegnaposto = buildRequest({ instructions: ['Scrivi una email.'], content: 'Ciao [NOME_1]' });
  assert.match(conSegnaposto, /Riportali identici/);

  const senza = buildRequest({ instructions: ['Scrivi una email.'], content: 'Ciao Marco' });
  assert.ok(!senza.includes('Riportali identici'));
});

test('la richiesta include obiettivo, regole e contenuto', () => {
  const out = buildRequest({ instructions: ['Scrivi una email.'], content: 'Testo', outputLanguage: 'it' });
  assert.match(out, /# Cosa ti chiedo/);
  assert.match(out, /# Regole/);
  assert.match(out, /# Lingua della risposta/);
  assert.match(out, /# Contenuto/);
});

test('containsPlaceholders e titleFromText', () => {
  assert.ok(containsPlaceholders('ciao [NOME_1]'));
  assert.ok(!containsPlaceholders('ciao [nome]'));
  assert.equal(titleFromText('# Preventivo per il nuovo sito\naltro'), 'Preventivo per il nuovo sito');
});

/* ------------------------------------------------------------------ */
/* Cassaforte                                                          */
/* ------------------------------------------------------------------ */

function fakeStore() {
  const data = new Map();
  return {
    secure: false,
    async get(key) { return data.has(key) ? JSON.parse(data.get(key)) : null; },
    async set(key, value) { data.set(key, JSON.stringify(value)); },
    async remove(key) { data.delete(key); },
  };
}

test('la cassaforte conserva il lavoro e sopravvive alla chiusura dell\'app', async () => {
  const store = fakeStore();
  const vault = createVault(store);
  await vault.saveJob({ title: 'Preventivo', mapping: { '[NOME_1]': 'Marco' }, findingsCount: 1, retention: '7d' });

  // Nuova istanza = app riaperta da zero.
  const dopo = createVault(store);
  const jobs = await dopo.listJobs();
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].mapping['[NOME_1]'], 'Marco');
});

test('i lavori scaduti spariscono da soli', async () => {
  const store = fakeStore();
  const vault = createVault(store);
  const job = await vault.saveJob({ title: 'Vecchio', mapping: {}, retention: '1h' });
  const dopoDueOre = job.createdAt + 2 * 60 * 60 * 1000;
  assert.equal((await vault.listJobs(dopoDueOre)).length, 0);
  assert.equal(await vault.purgeExpired(dopoDueOre), 1);
});

test('la scadenza "per sempre" non scade', async () => {
  const vault = createVault(fakeStore());
  const job = await vault.saveJob({ title: 'X', mapping: {}, retention: 'forever' });
  assert.equal(job.expiresAt, Number.POSITIVE_INFINITY);
  assert.equal((await vault.listJobs(Date.now() + RETENTION['7d'] * 100)).length, 1);
});

test('la rubrica non accetta duplicati e la cancellazione totale funziona', async () => {
  const vault = createVault(fakeStore());
  assert.ok(await vault.addEntry('Rossi Costruzioni'));
  assert.equal(await vault.addEntry('rossi costruzioni'), null);
  await vault.saveJob({ title: 'X', mapping: { '[A_1]': 'x' } });
  await vault.wipeEverything();
  assert.equal((await vault.listJobs()).length, 0);
  assert.equal((await vault.listEntries()).length, 0);
});

test('«Cancella tutto» non lascia indietro nessuna chiave che l\'app scrive', async () => {
  // Il riquadro delle Impostazioni Rapide ha aggiunto due chiavi proprie, e
  // la prima versione non le cancellava: chi svuotava l'app prima di
  // prestare il telefono si portava dietro l'ultimo testo trattato. In
  // un'app che promette «non resta nulla», «tutto» deve voler dire tutto.
  //
  // Le chiavi attese si ricavano dal codice, non da WIPED_KEYS: un test che
  // scorresse la lista stessa passerebbe anche togliendone una voce, ed è
  // esattamente la regressione da cui vogliamo difenderci.
  const { readFile } = await import('node:fs/promises');
  const app = await readFile(new URL('../src/app.mjs', import.meta.url), 'utf8');

  const scritte = new Set([...app.matchAll(/store\.set\(\s*'([^']+)'/g)].map((m) => m[1]));
  scritte.delete('onboarded');   // non è un dato dell'utente: vedi WIPED_KEYS

  const dimenticate = [...scritte].filter((key) => !WIPED_KEYS.includes(key));
  assert.deepEqual(dimenticate, [],
    `chiavi scritte da app.mjs ma non cancellate da «Cancella tutto»: ${dimenticate.join(', ')}`);

  // E la cancellazione deve funzionare davvero, non solo elencarle.
  const store = fakeStore();
  const vault = createVault(store);
  for (const key of WIPED_KEYS) await store.set(key, 'roba');
  await vault.wipeEverything();
  const rimaste = [];
  for (const key of WIPED_KEYS) if ((await store.get(key)) !== null) rimaste.push(key);
  assert.deepEqual(rimaste, [], `chiavi sopravvissute alla cancellazione: ${rimaste.join(', ')}`);
});

test('le mappe di più lavori si combinano per riconoscere qualsiasi risposta', async () => {
  const vault = createVault(fakeStore());
  await vault.saveJob({ id: 'a', title: 'A', mapping: { '[NOME_1]': 'Marco' } });
  await vault.saveJob({ id: 'b', title: 'B', mapping: { '[EMAIL_1]': 'a@b.it' } });
  const combined = await vault.combinedMapping();
  assert.equal(Object.keys(combined).length, 2);
});

test('l\'etichetta della scadenza è leggibile', () => {
  const now = Date.now();
  assert.match(retentionLabel({ expiresAt: now + 3 * 3_600_000 }, 'it', now), /3 h/);
  assert.match(retentionLabel({ expiresAt: Number.POSITIVE_INFINITY }, 'it', now), /Nessuna scadenza/);
});

/* ------------------------------------------------------------------ */
/* Domande a chip                                                      */
/* ------------------------------------------------------------------ */

test('ogni tipo di richiesta ha già tutte le risposte preselezionate', () => {
  for (const recipe of RECIPES) {
    const answers = defaultAnswers(recipe);
    for (const question of recipe.questions ?? []) {
      const value = answers[question.id];
      const chosen = Array.isArray(value) ? value : [value];
      assert.ok(chosen.filter(Boolean).length > 0,
        `${recipe.id}/${question.id} deve avere una risposta predefinita: il pulsante finale è attivo da subito`);
    }
  }
});

test('le risposte a scelta singola si sostituiscono, quelle multiple si accumulano', () => {
  const recipe = getRecipe('checklist');
  let answers = defaultAnswers(recipe);

  answers = toggleAnswer(recipe, answers, 'audience', 'team');
  assert.equal(answers.audience, 'team');
  assert.ok(isAnswerActive(answers, 'audience', 'team'));

  const prima = answers.fields.length;
  answers = toggleAnswer(recipe, answers, 'fields', 'deps');
  assert.equal(answers.fields.length, prima + 1);
  answers = toggleAnswer(recipe, answers, 'fields', 'deps');
  assert.equal(answers.fields.length, prima);
});

test('le istruzioni cambiano davvero in base alle chip', () => {
  const recipe = getRecipe('email');
  const base = instructionsFor(recipe, defaultAnswers(recipe), 'it');
  const formale = instructionsFor(recipe, { ...defaultAnswers(recipe), audience: 'public' }, 'it');
  assert.notDeepEqual(base, formale);
  assert.ok(formale.some((line) => line.includes('ente pubblico')));
});

test('ogni tipo di richiesta è tradotto in entrambe le lingue', () => {
  for (const recipe of RECIPES) {
    assert.ok(recipe.label.it && recipe.label.en, `${recipe.id}: etichetta mancante`);
    // La richiesta personalizzata non ha base fissa di proposito: la scrive
    // l'utente, non l'app.
    if (!recipe.custom) assert.ok(recipe.base.it && recipe.base.en, `${recipe.id}: istruzione base mancante`);
    for (const question of recipe.questions ?? []) {
      assert.ok(question.label.it && question.label.en);
      for (const option of question.options) {
        assert.ok(option.label.it && option.label.en && option.prompt.it && option.prompt.en);
      }
    }
  }
});

/* ------------------------------------------------------------------ */
/* Piani                                                               */
/* ------------------------------------------------------------------ */

test('il piano gratuito non limita mai la protezione', () => {
  const free = planOf('free');
  assert.ok(free.openJobs >= 1);
  // Non esiste alcun contatore su rilevamento, mascheratura o ripristino: è una
  // scelta di prodotto, e questo test la protegge dalle regressioni. Se un
  // domani qualcuno aggiunge uno di questi limiti, il test si accorge.
  for (const vietato of ['maskLimit', 'restoreLimit', 'detectLimit', 'scanLimit', 'dailyActions']) {
    assert.equal(free[vietato], undefined, `il piano gratuito non deve avere ${vietato}`);
  }
});

test('desktop: 5 sessioni da 10 minuti nel piano gratuito, poi si ferma', async () => {
  const store = fakeStore();
  const sessions = createDesktopSessions(store);
  for (let i = 0; i < 5; i += 1) {
    const result = await sessions.start('free', pairingCode());
    assert.ok(result.ok, `sessione ${i + 1} deve partire`);
    await sessions.stop();
  }
  const sesta = await sessions.start('free', pairingCode());
  assert.equal(sesta.ok, false);
  assert.equal(sesta.reason, 'no-sessions-left');
});

test('desktop: una sessione già attiva viene ripresa, non consumata due volte', async () => {
  const sessions = createDesktopSessions(fakeStore());
  await sessions.start('free', pairingCode());
  const seconda = await sessions.start('free', pairingCode());
  assert.equal(seconda.resumed, true);
  const status = await sessions.status('free');
  assert.equal(status.used, 1);
});

test('desktop: con Pro le sessioni non si contano', async () => {
  const sessions = createDesktopSessions(fakeStore());
  const status = await sessions.status('pro');
  assert.ok(status.unlimited);
  assert.ok(isUnlimited(planOf('pro').desktop.sessions));
});

test('il codice di accoppiamento evita i caratteri ambigui', () => {
  const code = pairingCode();
  assert.equal(code.length, 6);
  assert.ok(!/[01OI]/.test(code), 'niente 0/O/1/I: il codice si detta a voce');
});

/* ------------------------------------------------------------------ */
/* Lingua                                                              */
/* ------------------------------------------------------------------ */

test('l\'app parte in italiano e passa all\'inglese solo su richiesta', () => {
  assert.equal(normalizeLocale('it-IT'), 'it');
  assert.equal(normalizeLocale('fr-FR'), 'it', 'il pubblico principale è italiano');
  assert.equal(normalizeLocale('en-GB'), 'en');
});

test('italiano e inglese hanno esattamente le stesse chiavi', () => {
  const itKeys = Object.keys(itDict).sort();
  const enKeys = Object.keys(enDict).sort();
  assert.deepEqual(itKeys, enKeys);
});

test('nessun testo tradotto è vuoto', () => {
  for (const [key, value] of Object.entries(itDict)) assert.ok(String(value).trim(), `it: ${key} vuoto`);
  for (const [key, value] of Object.entries(enDict)) assert.ok(String(value).trim(), `en: ${key} vuoto`);
});

test('le variabili nei testi coincidono fra le due lingue', () => {
  const vars = (value) => (String(value).match(/\{[a-z]+\}/gi) ?? []).sort().join(',');
  for (const key of Object.keys(itDict)) {
    assert.equal(vars(itDict[key]), vars(enDict[key]), `variabili diverse per ${key}`);
  }
});

test('il traduttore sostituisce le variabili', () => {
  const translator = createTranslator('it');
  assert.match(translator.t('scan.found', { count: 3 }), /3/);
  assert.equal(translator.locale, 'it');
});

test('il titolo del lavoro non contiene i dati che stiamo proteggendo', () => {
  const originale = 'Gentile Dott. Marco Bianchi,\nle invio i dati richiesti.';
  const findings = detectSensitiveData(originale);
  const masked = maskFindings(originale, findings);
  const titolo = titleFromText(masked.text, 'Lavoro del 27/08');
  assert.ok(!titolo.includes('Marco'), 'il nome non deve finire nell\'elenco della cassaforte');
  assert.ok(!titolo.includes('Bianchi'));
  assert.ok(titolo.length > 3);
});

test('se la riga è quasi tutta segnaposto si usa l\'etichetta di ripiego', () => {
  assert.equal(titleFromText('[NOME_1] [EMAIL_1]', 'Lavoro del 27/08'), 'Lavoro del 27/08');
});

test('un IBAN seguito da una parola viene comunque riconosciuto', () => {
  // Il quantificatore avido inghiottiva le parole successive e la validazione
  // scartava tutto: l'IBAN spariva proprio nella frase più comune di tutte.
  const casi = [
    'Fattura da saldare su IBAN IT60X0542811101000000123456 entro il 30/09/2026.',
    'IBAN IT60X0542811101000000123456 · fine',
    'Bonifico su DE89370400440532013000 PAGAMENTO URGENTE',
  ];
  for (const testo of casi) {
    const iban = detectSensitiveData(testo).find((finding) => finding.type === 'IBAN');
    assert.ok(iban, `IBAN non rilevato in: ${testo}`);
    assert.ok(isValidIban(iban.value));
    assert.equal(testo.slice(iban.start, iban.end), iban.value, 'la posizione deve restare corretta');
  }
});

test('non inventa IBAN dove non ce ne sono', () => {
  assert.equal(detectSensitiveData('Nessun iban qui, solo testo AB12 normale')
    .filter((finding) => finding.type === 'IBAN').length, 0);
});

test('la scadenza predefinita rientra nel piano: niente opzioni Pro preselezionate', () => {
  assert.equal(clampRetention('7d', '1d'), '1d');
  assert.equal(clampRetention('forever', '1d'), '1d');
  assert.equal(clampRetention('1h', '1d'), '1h', 'una scelta più stretta resta valida');
  assert.equal(clampRetention('7d', 'forever'), '7d');
});

/* ------------------------------------------------------------------ */
/* Banco di prova: la sicurezza è il cuore dell'app, quindi il         */
/* rilevamento ha una soglia minima che fa fallire la build.           */
/* ------------------------------------------------------------------ */

test('banco di prova italiano: recupero sopra la soglia e nessun rumore', () => {
  let attesi = 0;
  let trovati = 0;
  const mancati = [];
  const rumore = [];

  for (const caso of CASI) {
    const findings = detectSensitiveData(caso.testo);
    const usati = new Set();

    for (const [valore, tipo] of caso.atteso) {
      attesi += 1;
      const match = findings.find((f, i) => (
        !usati.has(i) && (f.value.includes(valore) || valore.includes(f.value))
      ));
      if (match) { usati.add(findings.indexOf(match)); trovati += 1; }
      else mancati.push(`${tipo} ${JSON.stringify(valore)}`);
    }

    if (caso.tolleraExtra) continue;
    findings.forEach((f, i) => {
      if (usati.has(i)) return;
      if (caso.atteso.some(([v]) => v.includes(f.value) || f.value.includes(v))) return;
      rumore.push(`${f.type} ${JSON.stringify(f.value)}`);
    });
  }

  const recupero = trovati / attesi;
  assert.ok(recupero >= 0.95,
    `recupero sceso a ${(recupero * 100).toFixed(1)}%: non trovati → ${mancati.join(' · ')}`);
  assert.ok(rumore.length <= 1,
    `troppi falsi positivi: ${rumore.join(' · ')}`);
});

test('mascherare e ripristinare restituisce il testo identico, su ogni frase del banco', () => {
  // È la proprietà che non può mai rompersi: se il ripristino non ricompone
  // esattamente l'originale, l'utente si ritrova un documento sbagliato in mano.
  for (const caso of CASI) {
    const findings = detectSensitiveData(caso.testo).map((f) => ({ ...f, selected: true }));
    const masked = maskFindings(caso.testo, findings);
    const back = restoreProtectedText(masked.text, masked.mapping);
    assert.equal(back.text, caso.testo, `andata e ritorno rotta su: ${caso.testo}`);
  }
});

test('i riscontri incerti non vengono mai nascosti di nascosto', () => {
  const findings = detectSensitiveData('Ho parlato ieri con Ilenia Zappalà del contratto.');
  const incerto = findings.find((f) => f.maybe);
  assert.ok(incerto, 'il livello debole deve proporre il nome');
  assert.equal(incerto.selected, false, 'un riscontro incerto non può essere preselezionato');
  assert.equal(incerto.value, 'Ilenia Zappalà', 'il nome non deve essere troncato');
});

test('il cognome da solo eredita il segnaposto del nome completo', () => {
  const testo = 'Gentile Dott. Marco Bianchi, come da accordi Bianchi ci ha scritto.';
  const findings = detectSensitiveData(testo);
  const masked = maskFindings(testo, findings);
  assert.equal((masked.text.match(/\[NOME_1\]/g) ?? []).length, 2,
    'nome completo e cognome da solo devono ricevere lo stesso segnaposto');
});

test('il nome dopo il titolo si ferma al nome, non si mangia la frase', () => {
  // Regressione: con il flag di insensibilità alle maiuscole sull'intera
  // espressione, la ricerca diventava avida e catturava
  // "Sabino Cutrì ha eseguito il sopralluogo il".
  const testo = 'Il geom. Sabino Cutrì ha eseguito il sopralluogo il 15 marzo 2025.';
  const nome = detectSensitiveData(testo).find((f) => f.type === 'NAME' && !f.maybe);
  assert.equal(nome.value, 'Sabino Cutrì');
});

test('nessun riscontro può contenere parole tutte minuscole di seguito', () => {
  // Rete di sicurezza generica contro la stessa classe di errore ovunque:
  // un dato sensibile non è mai una sequenza di parole comuni.
  for (const caso of CASI) {
    for (const finding of detectSensitiveData(caso.testo)) {
      if (['URL', 'EMAIL', 'CATASTO', 'ADDRESS', 'DOCID'].includes(finding.type)) continue;
      assert.ok(!/\s[a-zà-ÿ]{2,}\s+[a-zà-ÿ]{2,}\s/.test(` ${finding.value} `),
        `${finding.type} ha inghiottito del testo comune: ${JSON.stringify(finding.value)}`);
    }
  }
});

/* ------------------------------------------------------------------ */
/* Rientro dall'IA: la scorciatoia che vale sei tocchi                 */
/* ------------------------------------------------------------------ */

test('propone il ripristino solo se negli appunti ci sono i nostri segnaposto', () => {
  const mapping = { '[NOME_1]': 'Marco Bianchi', '[EMAIL_1]': 'marco@studio.it' };

  const risposta = shouldOfferRestore('Gentile [NOME_1], la ricontatto a [EMAIL_1].', mapping);
  assert.equal(risposta.offer, true);
  assert.equal(risposta.count, 2);

  // Anche se l'IA li ha riscritti in grassetto.
  assert.equal(shouldOfferRestore('Ciao **[NOME_1]**', mapping).offer, true);
});

test('non propone nulla sugli appunti che non ci riguardano', () => {
  const mapping = { '[NOME_1]': 'Marco Bianchi' };
  // È la garanzia di riservatezza: se negli appunti c'è la lista della spesa,
  // l'app non se ne accorge nemmeno.
  assert.equal(shouldOfferRestore('pane latte uova', mapping).offer, false);
  assert.equal(shouldOfferRestore('', mapping).offer, false);
  assert.equal(shouldOfferRestore(null, mapping).offer, false);
});

test('senza lavori in cassaforte non si tocca mai gli appunti', () => {
  assert.equal(shouldOfferRestore('Gentile [NOME_1]', {}).offer, false);
  assert.equal(shouldOfferRestore('Gentile [NOME_1]', null).offer, false);
});

/* ------------------------------------------------------------------ */
/* Riquadro Impostazioni Rapide: decisione senza schermata             */
/* ------------------------------------------------------------------ */

test('appunti vuoti: il riquadro non fa nulla', () => {
  assert.deepEqual(decideQuickProtect('', {}), { action: 'empty' });
  assert.deepEqual(decideQuickProtect('   ', {}), { action: 'empty' });
  assert.deepEqual(decideQuickProtect(null, {}), { action: 'empty' });
});

test('appunti con nostri segnaposto: il riquadro ripristina invece di rimascherare', () => {
  const mapping = { '[NOME_1]': 'Marco Bianchi', '[EMAIL_1]': 'marco@studio.it' };
  const risultato = decideQuickProtect('Gentile [NOME_1], la ricontatto a [EMAIL_1].', mapping);
  assert.equal(risultato.action, 'restore');
  assert.equal(risultato.text, 'Gentile Marco Bianchi, la ricontatto a marco@studio.it.');
});

test('testo nuovo con dati ad alto rischio: il riquadro maschera', () => {
  const risultato = decideQuickProtect('Contattami a mario.rossi@email.it per il progetto.', {});
  assert.equal(risultato.action, 'mask');
  assert.equal(risultato.count, 1);
  assert.match(risultato.text, /\[EMAIL_1\]/);
  assert.equal(risultato.mapping['[EMAIL_1]'], 'mario.rossi@email.it');
});

test('testo nuovo senza nulla da nascondere: il riquadro non tocca gli appunti', () => {
  const risultato = decideQuickProtect('Comprare pane, latte, uova.', {});
  assert.deepEqual(risultato, { action: 'nothing' });
});

test('il riquadro rispetta anche la rubrica personale, non solo i pattern automatici', () => {
  const risultato = decideQuickProtect(
    'Il progetto Fenice parte lunedì.', {}, [{ value: 'Fenice', type: 'CUSTOM' }],
  );
  assert.equal(risultato.action, 'mask');
  assert.equal(risultato.mapping['[RISERVATO_1]'], 'Fenice');
});

test('ogni chiave usata in index.html esiste nelle traduzioni', async () => {
  // Due volte è capitato di aggiungere un elemento con data-i18n e di scordare
  // la chiave: a schermo compariva "[home.willy]". Questo test lo impedisce.
  const { readFile } = await import('node:fs/promises');
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  const usate = new Set([
    ...html.matchAll(/data-i18n(?:-placeholder|-aria)?="([^"]+)"/g),
  ].map((m) => m[1]));

  const mancanti = [...usate].filter((chiave) => !(chiave in itDict));
  assert.deepEqual(mancanti, [], `chiavi usate nell'HTML e assenti dalle traduzioni: ${mancanti.join(', ')}`);
});

test('il testo scritto in index.html coincide con la traduzione italiana', async () => {
  // La v1 aveva due livelli di testo in conflitto, e a schermo vinceva sempre
  // il peggiore. Qui l'HTML può solo anticipare ciò che dirà il traduttore.
  const { readFile } = await import('node:fs/promises');
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  const divergenti = [];
  for (const match of html.matchAll(/data-i18n="([^"]+)"[^>]*>([^<]*)</g)) {
    const [, chiave, testo] = match;
    const atteso = itDict[chiave];
    if (!atteso) continue;
    if (testo.trim() && testo.trim() !== atteso.trim()) divergenti.push(`${chiave}: "${testo.trim()}" ≠ "${atteso.trim()}"`);
  }
  assert.deepEqual(divergenti, [], `testi divergenti:\n  ${divergenti.join('\n  ')}`);
});

/* ------------------------------------------------------------------ */
/* Swipe da destra a sinistra per eliminare                            */
/* ------------------------------------------------------------------ */

test('uno swipe leggero torna al suo posto, uno a metà resta aperto, uno deciso cancella', async () => {
  const { swipeOutcome, SWIPE_ACTION_WIDTH, SWIPE_DELETE_DISTANCE } = await import('../src/domain/swipe.mjs');
  assert.equal(swipeOutcome(-10).outcome, 'closed', 'un trascinamento minimo non deve restare aperto');
  assert.equal(swipeOutcome(-(SWIPE_ACTION_WIDTH / 2 + 5)).outcome, 'open');
  assert.equal(swipeOutcome(-SWIPE_DELETE_DISTANCE).outcome, 'delete');
  assert.equal(swipeOutcome(-SWIPE_DELETE_DISTANCE - 50).outcome, 'delete', 'oltre la soglia resta "delete"');
});

test('lo swipe non si apre mai verso destra', async () => {
  const { swipeOutcome } = await import('../src/domain/swipe.mjs');
  assert.equal(swipeOutcome(40).outcome, 'closed');
  assert.equal(swipeOutcome(40).x, 0);
});

test('il fermo elastico non permette mai di trascinare a destra dello zero', async () => {
  const { clampDrag } = await import('../src/domain/swipe.mjs');
  assert.equal(clampDrag(60), 0);
  assert.equal(clampDrag(-40), -40);
  assert.ok(clampDrag(-9999) > -10000, 'anche uno strappo estremo resta un numero limitato');
});

test('la direzione del gesto si blocca una sola volta, verticale se lo scorrimento prevale', async () => {
  const { lockAxis } = await import('../src/domain/swipe.mjs');
  assert.equal(lockAxis(2, 2), null, 'sotto soglia: ancora indeciso');
  assert.equal(lockAxis(20, 3), 'x');
  assert.equal(lockAxis(3, 20), 'y', 'lo scorrimento verticale della lista deve restare libero');
});

/* ------------------------------------------------------------------ */
/* Ordine delle richieste in home                                      */
/* ------------------------------------------------------------------ */

test('le prime richieste visibili sono Markdown, Email, Riassumi, Richiesta personalizzata, nell\'ordine scelto', () => {
  const primarie = RECIPES.filter((recipe) => recipe.primary).map((recipe) => recipe.id);
  assert.deepEqual(primarie, ['markdown', 'email', 'summary', 'custom']);
});

test('la richiesta personalizzata non ha una base fissa: la scrive l\'utente, non l\'app', () => {
  const recipe = getRecipe('custom');
  assert.equal(recipe.custom, true);
  assert.deepEqual(recipe.questions, []);
});

test('la richiesta "Scrivi in Markdown" non inventa domande: è un\'unica trasformazione', () => {
  const recipe = getRecipe('markdown');
  assert.deepEqual(recipe.questions, []);
  assert.ok(recipe.base.it.length > 0 && recipe.base.en.length > 0);
});

test('il markdown è la richiesta selezionata di default: è la prima voce visibile', () => {
  // Prima l'app apriva su "reply", che dopo il riordino non è più fra le
  // primarie: la scheda selezionata sarebbe apparsa senza alcun riscontro
  // visivo nella vista predefinita.
  const primarie = RECIPES.filter((recipe) => recipe.primary).map((recipe) => recipe.id);
  assert.ok(primarie.includes('markdown'));
});

/* ------------------------------------------------------------------ */
/* Ponte desktop: il magazzino remoto                                  */
/* ------------------------------------------------------------------ */

test('createRemoteStore legge un valore, col token nell\'intestazione', async () => {
  const chiamate = [];
  const fetchFinto = async (url, opts) => {
    chiamate.push({ url, opts });
    return { ok: true, status: 200, json: async () => ({ value: { ciao: 'mondo' } }) };
  };
  const store = createRemoteStore('TOKEN123', { fetchImpl: fetchFinto });
  const valore = await store.get('prefs');
  assert.deepEqual(valore, { ciao: 'mondo' });
  assert.equal(chiamate.length, 1);
  assert.equal(chiamate[0].url, '/api/store/prefs');
  assert.equal(chiamate[0].opts.headers.Authorization, 'Bearer TOKEN123');
});

test('createRemoteStore restituisce null su una chiave assente (404), non un errore', async () => {
  const fetchFinto = async () => ({ ok: false, status: 404 });
  const store = createRemoteStore('TOKEN123', { fetchImpl: fetchFinto });
  assert.equal(await store.get('assente'), null);
});

test('createRemoteStore scrive un valore, serializzato nel corpo della richiesta', async () => {
  const chiamate = [];
  const fetchFinto = async (url, opts) => { chiamate.push({ url, opts }); return { ok: true, status: 200 }; };
  const store = createRemoteStore('TOKEN123', { fetchImpl: fetchFinto });
  await store.set('jobs', [{ id: 1 }]);
  assert.equal(chiamate[0].url, '/api/store/jobs');
  assert.equal(chiamate[0].opts.method, 'PUT');
  assert.equal(chiamate[0].opts.headers.Authorization, 'Bearer TOKEN123');
  assert.deepEqual(JSON.parse(chiamate[0].opts.body), { value: [{ id: 1 }] });
});

test('createRemoteStore elimina una chiave', async () => {
  const chiamate = [];
  const fetchFinto = async (url, opts) => { chiamate.push({ url, opts }); return { ok: true, status: 200 }; };
  const store = createRemoteStore('TOKEN123', { fetchImpl: fetchFinto });
  await store.remove('jobs');
  assert.equal(chiamate[0].url, '/api/store/jobs');
  assert.equal(chiamate[0].opts.method, 'DELETE');
});

test('createRemoteStore lancia un errore su una risposta non-ok diversa da 404: mai dati vecchi in silenzio', async () => {
  const fetchFinto = async () => ({ ok: false, status: 401 });
  const store = createRemoteStore('TOKEN123', { fetchImpl: fetchFinto });
  await assert.rejects(() => store.get('prefs'), /bridge-store-error-401/);
});

test('createRemoteStore si dichiara secure, come il Keystore: la UI non deve trattarlo come un ripiego meno sicuro', () => {
  const store = createRemoteStore('TOKEN123', { fetchImpl: async () => ({ ok: true, status: 200 }) });
  assert.equal(store.secure, true);
});

/* ------------------------------------------------------------------ */
/* Ponte desktop: il QR vero                                           */
/* ------------------------------------------------------------------ */

test('renderQrSvg produce un vero SVG scansionabile, non un disegno decorativo a griglia fissa', () => {
  const svg = renderQrSvg('https://esempio.test/bridge?token=ABC123');
  assert.match(svg, /^<svg/);
  assert.match(svg, /<\/svg>\s*$/);
  assert.match(svg, /viewBox="0 0 \d+ \d+"/);
});

test('renderQrSvg gestisce un link lungo (indirizzo + porta + token) senza lanciare', () => {
  const lungo = 'https://thezine88.github.io/privai-pocket-preview/bridge/#ip=192.168.1.42&porta=45231&token=AB3XK9QZLM';
  assert.doesNotThrow(() => renderQrSvg(lungo));
});

test('renderQrSvg produce contenuto diverso per testi diversi (non è un placeholder statico)', () => {
  const uno = renderQrSvg('https://esempio.test/a');
  const due = renderQrSvg('https://esempio.test/completamente-diverso-e-piu-lungo-di-prima');
  assert.notEqual(uno, due);
});
