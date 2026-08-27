/**
 * I tipi di richiesta e le domande a risposta multipla.
 *
 * Regola di progetto: le domande sono un acceleratore, mai un pedaggio.
 * Ogni domanda ha già la risposta più comune selezionata, tutte stanno su una
 * schermata sola, e il pulsante finale è attivo dal primo istante. Chi ha
 * fretta non tocca nulla e ottiene comunque una richiesta ben scritta.
 *
 * Le opzioni sono testo fisso dell'app: non contengono mai dati dell'utente, e
 * vengono applicate dopo la protezione.
 */

const t = (it, en) => ({ it, en });

/** @param {object} option `def: true` = preselezionata */
const opt = (id, label, prompt, def = false) => ({ id, label, prompt, default: def });

export const RECIPES = [
  {
    id: 'markdown',
    primary: true,
    icon: 'markdown',
    label: t('Scrivi in Markdown', 'Write in Markdown'),
    hint: t('Testo pulito e ordinato, pronto per qualsiasi IA', 'Clean, ordered text, ready for any AI'),
    base: t(
      'Riscrivi il contenuto in Markdown pulito: titoli, elenchi ed enfasi ordinati secondo la struttura del testo originale. Non aggiungere né togliere informazioni.',
      'Rewrite the content as clean Markdown: headings, lists and emphasis ordered to match the original structure. Do not add or remove information.',
    ),
    questions: [],
  },
  {
    id: 'email',
    primary: true,
    icon: 'email',
    label: t('Scrivi un’email', 'Write an email'),
    hint: t('Con oggetto, corpo e richiesta finale', 'With subject, body and a clear ask'),
    base: t(
      'Scrivi un’email completa. Proponi un oggetto chiaro, un corpo ben strutturato e una richiesta finale esplicita.',
      'Write a complete email: a clear subject line, a well-structured body and an explicit closing ask.',
    ),
    questions: [
      {
        id: 'audience',
        label: t('A chi scrivi?', 'Who is it for?'),
        options: [
          opt('client', t('Cliente', 'Client'), t('Il destinatario è un cliente.', 'The recipient is a client.'), true),
          opt('supplier', t('Fornitore', 'Supplier'), t('Il destinatario è un fornitore.', 'The recipient is a supplier.')),
          opt('colleague', t('Collega', 'Colleague'), t('Il destinatario è un collega interno.', 'The recipient is an internal colleague.')),
          opt('public', t('Ente pubblico', 'Public body'), t('Il destinatario è un ente pubblico: usa un registro formale e riferimenti precisi.', 'The recipient is a public body: use a formal register and precise references.')),
        ],
      },
      {
        id: 'goal',
        label: t('Cosa deve ottenere?', 'What should it achieve?'),
        options: [
          opt('propose', t('Proporre', 'Propose'), t('Obiettivo: presentare una proposta e ottenere un riscontro.', 'Goal: present a proposal and get a response.'), true),
          opt('chase', t('Sollecitare', 'Chase'), t('Obiettivo: sollecitare una risposta o un adempimento in sospeso.', 'Goal: chase a pending answer or action.')),
          opt('answer', t('Rispondere', 'Answer'), t('Obiettivo: rispondere a quanto ricevuto.', 'Goal: answer what was received.')),
          opt('sorry', t('Scusarsi', 'Apologise'), t('Obiettivo: scusarsi per un disguido e proporre una soluzione.', 'Goal: apologise for an issue and propose a fix.')),
        ],
      },
      {
        id: 'length',
        label: t('Quanto lunga?', 'How long?'),
        options: [
          opt('short', t('Breve', 'Short'), t('Massimo cinque righe.', 'Five lines at most.'), true),
          opt('medium', t('Media', 'Medium'), t('Lunghezza media, due o tre paragrafi.', 'Medium length, two or three paragraphs.')),
          opt('full', t('Dettagliata', 'Detailed'), t('Dettagliata, con tutti i riferimenti utili.', 'Detailed, with every useful reference.')),
        ],
      },
    ],
  },
  {
    id: 'summary',
    primary: true,
    icon: 'summary',
    label: t('Riassumi', 'Summarise'),
    hint: t('I punti che contano, senza il resto', 'The points that matter, nothing else'),
    base: t(
      'Riassumi il contenuto restando fedele: non aggiungere nulla che non ci sia.',
      'Summarise the content faithfully: add nothing that is not there.',
    ),
    questions: [
      {
        id: 'audience',
        label: t('Per chi?', 'Who is it for?'),
        options: [
          opt('me', t('Per me', 'For me'), t('Riassunto per uso personale.', 'Summary for personal use.'), true),
          opt('absent', t('Per chi non c’era', 'For someone absent'), t('Chi legge non conosce il contesto: introducilo in una riga.', 'The reader lacks context: introduce it in one line.')),
          opt('boss', t('Per un superiore', 'For a manager'), t('Chi legge ha poco tempo: metti in cima ciò che richiede una decisione.', 'The reader is short on time: lead with what needs a decision.')),
        ],
      },
      {
        id: 'focus',
        label: t('Cosa ti serve?', 'What do you need?'),
        multi: true,
        options: [
          opt('decisions', t('Decisioni', 'Decisions'), t('Estrai le decisioni prese.', 'Extract the decisions taken.'), true),
          opt('next', t('Prossimi passi', 'Next steps'), t('Estrai i prossimi passi.', 'Extract the next steps.'), true),
          opt('open', t('Punti aperti', 'Open points'), t('Elenca separatamente i punti ancora aperti.', 'List the open points separately.')),
          opt('numbers', t('Numeri e cifre', 'Numbers'), t('Riporta i numeri e gli importi citati.', 'Report the figures and amounts mentioned.')),
        ],
      },
      {
        id: 'length',
        label: t('Quanto lungo?', 'How long?'),
        options: [
          opt('five', t('5 punti', '5 bullets'), t('Al massimo cinque punti elenco.', 'Five bullet points at most.'), true),
          opt('half', t('Mezza pagina', 'Half a page'), t('Circa mezza pagina.', 'About half a page.')),
        ],
      },
    ],
  },
  {
    id: 'reply',
    icon: 'reply',
    label: t('Rispondi a questo', 'Reply to this'),
    hint: t('Un messaggio ricevuto, una risposta da scrivere', 'A message received, a reply to write'),
    base: t(
      'Scrivi la risposta al messaggio riportato nel contenuto. Rispondi solo con il testo del messaggio, senza commenti.',
      'Write a reply to the message in the content. Return only the message text, no commentary.',
    ),
    questions: [
      {
        id: 'stance',
        label: t('Cosa vuoi rispondere?', 'What is your answer?'),
        options: [
          opt('yes', t('Accetto', 'I accept'), t('La risposta è positiva: accetta quanto proposto.', 'The answer is yes: accept what was proposed.'), true),
          opt('no', t('Declino', 'I decline'), t('La risposta è negativa: declina con cortesia e senza giustificazioni eccessive.', 'The answer is no: decline politely, without over-explaining.')),
          opt('time', t('Chiedo tempo', 'I need time'), t('Chiedi più tempo, indicando che darai una risposta definitiva a breve.', 'Ask for more time, saying a final answer will follow shortly.')),
          opt('info', t('Chiedo chiarimenti', 'I need details'), t('Chiedi i chiarimenti necessari, elencandoli come domande puntuali.', 'Ask for the clarifications needed, listed as specific questions.')),
        ],
      },
      {
        id: 'tone',
        label: t('Con che tono?', 'In what tone?'),
        options: [
          opt('formal', t('Formale', 'Formal'), t('Tono formale, con le formule di cortesia adeguate.', 'Formal tone, with appropriate courtesy formulas.')),
          opt('warm', t('Cordiale', 'Warm'), t('Tono cordiale e professionale, senza rigidità.', 'Warm and professional tone, not stiff.'), true),
          opt('direct', t('Diretto', 'Direct'), t('Tono diretto e sintetico, dritto al punto.', 'Direct and concise, straight to the point.')),
        ],
      },
    ],
  },
  {
    id: 'checklist',
    icon: 'checklist',
    label: t('Trasforma in checklist', 'Turn into a checklist'),
    hint: t('Cose da fare, con scadenze e responsabili', 'Tasks, with deadlines and owners'),
    base: t(
      'Trasforma il contenuto in una checklist operativa. Per ogni voce indica cosa fare in modo azionabile.',
      'Turn the content into an actionable checklist. Each item states clearly what to do.',
    ),
    questions: [
      {
        id: 'audience',
        label: t('Per chi?', 'Who is it for?'),
        options: [
          opt('me', t('Per me', 'For me'), t('La checklist è per uso personale: sii sintetico.', 'The checklist is for personal use: be concise.'), true),
          opt('team', t('Per il team', 'For the team'), t('La checklist è per un team: rendi espliciti i passaggi di consegna.', 'The checklist is for a team: make handovers explicit.')),
          opt('client', t('Per il cliente', 'For the client'), t('La checklist è per il cliente: usa un linguaggio comprensibile a chi non conosce il progetto.', 'The checklist is for the client: use language a non-expert understands.')),
        ],
      },
      {
        id: 'fields',
        label: t('Cosa includere?', 'What to include?'),
        multi: true,
        options: [
          opt('due', t('Scadenze', 'Deadlines'), t('Indica la scadenza di ogni voce.', 'State a deadline for each item.'), true),
          opt('owner', t('Responsabili', 'Owners'), t('Indica il responsabile di ogni voce.', 'State an owner for each item.'), true),
          opt('priority', t('Priorità', 'Priority'), t('Indica la priorità di ogni voce.', 'State a priority for each item.'), true),
          opt('deps', t('Dipendenze', 'Dependencies'), t('Indica le dipendenze fra le voci.', 'State dependencies between items.')),
        ],
      },
    ],
  },
  {
    id: 'explain',
    icon: 'explain',
    label: t('Spiegami questo', 'Explain this'),
    hint: t('Cosa dice, cosa mi vincola, cosa firmo', 'What it says, what binds me, what I sign'),
    base: t(
      'Spiega il documento a chi non è del settore, in linguaggio semplice. Non dare consulenza legale o fiscale: limitati a spiegare cosa c’è scritto e segnala quando serve un professionista.',
      'Explain the document in plain language to a non-expert. Do not give legal or financial advice: explain what it says, and flag when a professional is needed.',
    ),
    questions: [
      {
        id: 'focus',
        label: t('Cosa vuoi sapere?', 'What do you need to know?'),
        multi: true,
        options: [
          opt('gist', t('Cosa dice in breve', 'The gist'), t('Riassumi il senso generale in cinque righe.', 'Summarise the overall meaning in five lines.'), true),
          opt('duties', t('Cosa mi vincola', 'What binds me'), t('Elenca gli obblighi e le scadenze a carico di chi legge.', 'List the obligations and deadlines on the reader.'), true),
          opt('costs', t('Cosa mi costa', 'What it costs'), t('Elenca importi, penali e costi ricorrenti.', 'List amounts, penalties and recurring costs.')),
          opt('risks', t('Cosa fare attenzione', 'What to watch'), t('Segnala le clausole insolite o particolarmente sfavorevoli.', 'Flag unusual or notably unfavourable clauses.')),
        ],
      },
    ],
  },
  {
    id: 'post',
    icon: 'post',
    label: t('Post social', 'Social post'),
    hint: t('Adattato alla piattaforma', 'Adapted to the platform'),
    base: t('Trasforma il contenuto in un post pronto da pubblicare.', 'Turn the content into a post ready to publish.'),
    questions: [
      {
        id: 'platform',
        label: t('Dove lo pubblichi?', 'Where will you post?'),
        options: [
          opt('linkedin', t('LinkedIn', 'LinkedIn'), t('Per LinkedIn: registro professionale, massimo 1.300 caratteri, niente hashtag in eccesso.', 'For LinkedIn: professional register, 1,300 characters max, few hashtags.'), true),
          opt('instagram', t('Instagram', 'Instagram'), t('Per Instagram: apertura che ferma lo scorrimento, righe brevi. Massimo 4 hashtag pertinenti in fondo, scelti anche per la SEO della piattaforma (parole chiave che il pubblico cerca davvero, non slogan).', 'For Instagram: a scroll-stopping opening, short lines. At most 4 relevant hashtags at the end, chosen for the platform’s SEO too (keywords people actually search, not slogans).')),
          opt('tiktok', t('TikTok', 'TikTok'), t('Per TikTok: scrivi la didascalia del video, diretta e colloquiale. Massimo 4 hashtag pertinenti, scelti anche per la SEO della piattaforma (parole chiave che il pubblico cerca davvero, non slogan).', 'For TikTok: write the video caption, direct and conversational. At most 4 relevant hashtags, chosen for the platform’s SEO too (keywords people actually search, not slogans).')),
          opt('facebook', t('Facebook', 'Facebook'), t('Per Facebook: tono colloquiale e diretto.', 'For Facebook: conversational and direct.')),
        ],
      },
      {
        id: 'goal',
        label: t('Obiettivo?', 'Goal?'),
        options: [
          opt('inform', t('Informare', 'Inform'), t('Obiettivo informativo.', 'Informational goal.'), true),
          opt('story', t('Raccontare', 'Tell a story'), t('Racconta in forma narrativa, partendo da un fatto concreto.', 'Tell it as a story, starting from a concrete fact.')),
          opt('promote', t('Promuovere', 'Promote'), t('Obiettivo promozionale, con invito all’azione finale.', 'Promotional goal, with a closing call to action.')),
        ],
      },
    ],
  },
];

export function getRecipe(id) {
  return RECIPES.find((recipe) => recipe.id === id) ?? RECIPES[0];
}

/** Risposte predefinite: è ciò che rende il pulsante finale attivo da subito. */
export function defaultAnswers(recipe) {
  const answers = {};
  for (const question of recipe.questions ?? []) {
    const chosen = question.options.filter((option) => option.default).map((option) => option.id);
    answers[question.id] = question.multi ? chosen : (chosen[0] ?? question.options[0].id);
  }
  return answers;
}

export function toggleAnswer(recipe, answers, questionId, optionId) {
  const question = (recipe.questions ?? []).find((item) => item.id === questionId);
  if (!question) return answers;
  if (!question.multi) return { ...answers, [questionId]: optionId };
  const current = new Set(answers[questionId] ?? []);
  if (current.has(optionId)) current.delete(optionId); else current.add(optionId);
  return { ...answers, [questionId]: [...current] };
}

export function isAnswerActive(answers, questionId, optionId) {
  const value = answers?.[questionId];
  return Array.isArray(value) ? value.includes(optionId) : value === optionId;
}

/** Le righe di istruzione che finiranno nella richiesta. */
export function instructionsFor(recipe, answers, locale = 'it') {
  const language = String(locale).startsWith('it') ? 'it' : 'en';
  const lines = [recipe.base[language]];
  for (const question of recipe.questions ?? []) {
    const value = answers?.[question.id];
    const chosen = Array.isArray(value) ? value : [value];
    for (const option of question.options) {
      if (chosen.includes(option.id)) lines.push(option.prompt[language]);
    }
  }
  return lines.filter(Boolean);
}
