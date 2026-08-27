/**
 * Normalizzazione del testo e costruzione della richiesta per l'IA.
 *
 * Novità rispetto alla v1: la richiesta spiega all'IA cosa sono i segnaposto e
 * le chiede di riportarli identici. È l'accorgimento che fa la differenza fra
 * un ripristino che funziona e uno che perde metà dei dati.
 */

const compactInlineWhitespace = (line) => line.replace(/[\t ]+/g, ' ').trim();

const BULLET = /^[•·▪◦*+]\s*/u;
const NUMBERED = /^(\d{1,2})[.)]\s+/u;
const ALL_CAPS_HEADING = /^[A-ZÀ-ÖØ-Þ0-9][A-ZÀ-ÖØ-Þ0-9\s'&.,-]{3,}$/u;

/** Ripulisce testo copiato da WhatsApp, PDF o email: righe spezzate, elenchi improvvisati. */
export function normalizeToMarkdown(input) {
  const lines = String(input ?? '').replace(/\r\n?/g, '\n').split('\n');
  const out = [];

  lines.forEach((raw, index) => {
    const line = compactInlineWhitespace(raw);
    if (!line) { out.push(''); return; }

    if (BULLET.test(line)) { out.push(`- ${line.replace(BULLET, '')}`); return; }
    if (/^-\s+/u.test(line)) { out.push(`- ${line.replace(/^-\s+/u, '')}`); return; }

    const numbered = line.match(NUMBERED);
    if (numbered) { out.push(`${numbered[1]}. ${line.replace(NUMBERED, '')}`); return; }

    // Una riga tutta in maiuscolo, all'inizio o isolata, è quasi sempre un titolo.
    const isolated = index === 0 || !compactInlineWhitespace(lines[index - 1] ?? '');
    if (isolated && ALL_CAPS_HEADING.test(line) && line.length < 80) {
      const pretty = line.charAt(0) + line.slice(1).toLocaleLowerCase('it-IT');
      out.push(index === 0 ? `# ${pretty}` : `## ${pretty}`);
      return;
    }

    out.push(line);
  });

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/* ------------------------------------------------------------------ */

const COPY = {
  it: {
    request: 'Cosa ti chiedo',
    rules: 'Regole',
    language: 'Lingua della risposta',
    content: 'Contenuto',
    noInvent: 'Non inventare informazioni che non compaiono nel contenuto: se un dato manca, segnalalo.',
    keepDates: 'Mantieni le date e le scadenze così come sono scritte.',
    placeholders: 'Il contenuto contiene segnaposto fra parentesi quadre (per esempio [NOME_1], [EMAIL_2]): sostituiscono dati riservati. Riportali identici nella risposta, senza tradurli, abbreviarli, formattarli in grassetto o cambiare le parentesi.',
    onlyResult: 'Rispondi con il solo risultato richiesto, senza premesse né commenti finali.',
    askIfUnclear: 'Se il contesto non è chiaro o non basta per un risultato completo ed efficace, non procedere alla cieca: fai prima almeno 5 domande mirate su ciò che ti manca (per esempio, per un post: a chi si rivolge, con che tono, in che stile).',
    languages: { it: 'Italiano', en: 'Inglese' },
  },
  en: {
    request: 'What I need',
    rules: 'Rules',
    language: 'Response language',
    content: 'Content',
    noInvent: 'Do not invent information absent from the content: if something is missing, say so.',
    keepDates: 'Keep dates and deadlines exactly as written.',
    placeholders: 'The content contains square-bracket placeholders (for example [NOME_1], [EMAIL_2]) standing in for confidential data. Reproduce them exactly, without translating, shortening, bolding them or changing the brackets.',
    onlyResult: 'Reply with the requested result only, no preamble or closing commentary.',
    askIfUnclear: 'If the context is unclear or not enough for a complete, effective result, do not guess: first ask at least 5 targeted questions about what is missing (for a post, for example: audience, tone, writing style).',
    languages: { it: 'Italian', en: 'English' },
  },
};

const PLACEHOLDER = /\[[A-Z]{2,12}_\d+[A-Z]?\]/;

export function containsPlaceholders(text) {
  return PLACEHOLDER.test(String(text ?? ''));
}

/**
 * @param {object} input
 * @param {string[]} input.instructions righe prodotte da recipes.instructionsFor()
 * @param {string}   input.content      contenuto, già protetto
 * @param {string}   input.outputLanguage 'same' | 'it' | 'en'
 * @param {string}   input.extra        dettaglio libero facoltativo
 * @param {string}   input.locale       lingua dell'interfaccia
 */
export function buildRequest({ instructions = [], content = '', outputLanguage = 'same', extra = '', locale = 'it' }) {
  const language = String(locale).startsWith('it') ? 'it' : 'en';
  const copy = COPY[language];
  const body = normalizeToMarkdown(content);
  const sections = [];

  const asks = [...instructions];
  if (extra?.trim()) asks.push(extra.trim());
  sections.push(`# ${copy.request}\n\n${asks.map((line) => `- ${line}`).join('\n')}`);

  const rules = [copy.noInvent, copy.keepDates];
  if (containsPlaceholders(body)) rules.push(copy.placeholders);
  rules.push(copy.onlyResult, copy.askIfUnclear);
  sections.push(`# ${copy.rules}\n\n${rules.map((line) => `- ${line}`).join('\n')}`);

  if (copy.languages[outputLanguage]) {
    sections.push(`# ${copy.language}\n\n${copy.languages[outputLanguage]}`);
  }

  sections.push(`# ${copy.content}\n\n${body}`);
  return sections.join('\n\n');
}

const PLACEHOLDER_ALL = /\[[A-Z]{2,12}_\d+[A-Z]?\]/g;

/**
 * Titolo automatico per la cassaforte e la cronologia.
 *
 * Va costruito sul testo GIÀ PROTETTO: l'elenco dei lavori è la schermata che
 * resta salvata sul dispositivo, e mostrarci il nome del cliente in chiaro
 * annullerebbe il lavoro appena fatto. Se la riga migliore è fatta quasi solo
 * di segnaposto, si ripiega su un'etichetta con la data.
 */
export function titleFromText(text, fallback = 'Lavoro') {
  const lines = String(text ?? '')
    .split('\n')
    .map((line) => line.replace(/^#+\s*/, '').trim())
    .filter((line) => line.length > 3);

  const readable = lines.find((line) => {
    const masked = (line.match(PLACEHOLDER_ALL) ?? []).join('').length;
    return masked / line.length < 0.4;
  });

  const chosen = readable ?? lines[0];
  if (!chosen) return fallback;

  const words = chosen.split(/\s+/).slice(0, 7).join(' ');
  const trimmed = words.length > 52 ? `${words.slice(0, 52)}…` : words;
  // Una riga fatta solo di segnaposto non dice niente a nessuno.
  return trimmed.replace(PLACEHOLDER_ALL, '').trim().length > 3 ? trimmed : fallback;
}
