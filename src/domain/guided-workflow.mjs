export const GUIDED_STEPS = ['input', 'review', 'purpose', 'questions', 'result'];

const copy = {
  it: {
    recipes: {
      reply: ['Rispondi a questo', 'Prepara una risposta'],
      email: ['Scrivi un’email', 'Scrivi un’email'],
      checklist: ['Trasforma in checklist', 'Crea una checklist'],
      summary: ['Riassumi', 'Crea un riassunto'],
      explain: ['Spiegami questo', 'Spiega il contenuto'],
      dispute: ['Sollecito o contestazione', 'Scrivi un sollecito o una contestazione'],
      quote: ['Preventivo', 'Prepara un preventivo'],
      minutes: ['Verbale di riunione', 'Prepara un verbale di riunione'],
      questions: ['Che domande devo fare', 'Prepara le domande da fare'],
      post: ['Post social', 'Scrivi un post social'],
      markdown: ['Trascrivi in Markdown', 'Formatta in Markdown'],
      letter: ['Lettera formale', 'Scrivi una lettera o richiesta formale'],
    },
    questions: {
      intent: ['Cosa vuoi rispondere?', ['Accetto', 'Declino', 'Chiedo tempo', 'Chiedo chiarimenti']],
      tone: ['Che tono vuoi?', ['Cortese', 'Diretto', 'Formale', 'Amichevole']],
      length: ['Quanto deve essere lungo?', ['Breve', 'Medio', 'Dettagliato']],
      recipient: ['A chi è rivolto?', ['Cliente', 'Collega', 'Responsabile', 'Ente o azienda']],
      goal: ['Qual è l’obiettivo?', ['Informare', 'Ottenere una risposta', 'Fare una richiesta', 'Confermare']],
      detail: ['Quanto dettaglio serve?', ['Essenziale', 'Operativo', 'Completo']],
      priority: ['Come ordinare i punti?', ['In ordine', 'Per priorità', 'Per scadenza']],
      audience: ['Per chi è?', ['Per me', 'Per un collega', 'Per un cliente', 'Per tutti']],
      focus: ['Cosa privilegiare?', ['Punti chiave', 'Decisioni', 'Azioni', 'Dati e numeri']],
      level: ['A quale livello?', ['Semplice', 'Intermedio', 'Esperto']],
      examples: ['Vuoi esempi?', ['Sì', 'No']],
      outcome: ['Cosa vuoi ottenere?', ['Risposta', 'Rimborso', 'Correzione', 'Intervento']],
      deadline: ['Inserire una scadenza?', ['No', 'Sì, indicativa', 'Sì, precisa']],
      subject: ['Cosa riguarda?', ['Servizio', 'Prodotto', 'Progetto', 'Consulenza']],
      validity: ['Indicare la validità?', ['No', '7 giorni', '15 giorni', '30 giorni']],
      minutesFocus: ['Cosa includere?', ['Sintesi e decisioni', 'Anche attività', 'Verbale completo']],
      owners: ['Assegnare responsabili?', ['Sì', 'No']],
      count: ['Quante domande?', ['5', '10', 'Tutte quelle utili']],
      platform: ['Per quale piattaforma?', ['Instagram', 'LinkedIn', 'Facebook', 'Generico']],
      callToAction: ['Invito all’azione?', ['Nessuno', 'Commenta', 'Contattami', 'Apri il link']],
      structure: ['Quale struttura?', ['Titoli e paragrafi', 'Elenco puntato', 'Documento completo']],
      preserve: ['Quanto cambiare il testo?', ['Solo formattazione', 'Correggi anche la forma']],
      register: ['Quale registro?', ['Formale', 'Istituzionale', 'Fermo ma cortese']],
      references: ['Includere riferimenti?', ['Solo quelli presenti', 'Mettili in evidenza']],
    },
    content: 'Contenuto da usare senza inventare informazioni:',
    preferences: 'Preferenze:',
  },
  en: {
    recipes: {
      reply: ['Reply to this', 'Prepare a reply'],
      email: ['Write an email', 'Write an email'],
      checklist: ['Turn into a checklist', 'Create a checklist'],
      summary: ['Summarize', 'Create a summary'],
      explain: ['Explain this', 'Explain the content'],
      dispute: ['Reminder or complaint', 'Write a reminder or complaint'],
      quote: ['Quote', 'Prepare a quote'],
      minutes: ['Meeting minutes', 'Prepare meeting minutes'],
      questions: ['What should I ask?', 'Prepare useful questions'],
      post: ['Social post', 'Write a social post'],
      markdown: ['Transcribe to Markdown', 'Format as Markdown'],
      letter: ['Formal letter', 'Write a formal letter or request'],
    },
    questions: {
      intent: ['What do you want to say?', ['Accept', 'Decline', 'Ask for time', 'Ask for clarification']],
      tone: ['Which tone?', ['Polite', 'Direct', 'Formal', 'Friendly']],
      length: ['How long?', ['Short', 'Medium', 'Detailed']],
      recipient: ['Who is it for?', ['Customer', 'Colleague', 'Manager', 'Organization']],
      goal: ['What is the goal?', ['Inform', 'Get an answer', 'Make a request', 'Confirm']],
      detail: ['How much detail?', ['Essential', 'Practical', 'Complete']],
      priority: ['How should points be ordered?', ['In order', 'By priority', 'By deadline']],
      audience: ['Who will read it?', ['Me', 'A colleague', 'A customer', 'Everyone']],
      focus: ['What should it emphasize?', ['Key points', 'Decisions', 'Actions', 'Facts and figures']],
      level: ['Which level?', ['Simple', 'Intermediate', 'Expert']],
      examples: ['Include examples?', ['Yes', 'No']],
      outcome: ['What outcome do you want?', ['Reply', 'Refund', 'Correction', 'Action']],
      deadline: ['Include a deadline?', ['No', 'Approximate', 'Exact']],
      subject: ['What is it about?', ['Service', 'Product', 'Project', 'Consulting']],
      validity: ['Include validity?', ['No', '7 days', '15 days', '30 days']],
      minutesFocus: ['What should it include?', ['Summary and decisions', 'Also action items', 'Full minutes']],
      owners: ['Assign owners?', ['Yes', 'No']],
      count: ['How many questions?', ['5', '10', 'All useful questions']],
      platform: ['Which platform?', ['Instagram', 'LinkedIn', 'Facebook', 'Generic']],
      callToAction: ['Call to action?', ['None', 'Comment', 'Contact me', 'Open the link']],
      structure: ['Which structure?', ['Headings and paragraphs', 'Bullet list', 'Full document']],
      preserve: ['How much may change?', ['Formatting only', 'Also improve wording']],
      register: ['Which register?', ['Formal', 'Institutional', 'Firm but polite']],
      references: ['Include references?', ['Only existing ones', 'Highlight them']],
    },
    content: 'Use this content without inventing information:',
    preferences: 'Preferences:',
  },
};

const recipeQuestionIds = {
  reply: ['intent', 'tone', 'length'],
  email: ['recipient', 'goal', 'tone', 'length'],
  checklist: ['detail', 'priority', 'deadline'],
  summary: ['audience', 'length', 'focus'],
  explain: ['level', 'detail', 'examples'],
  dispute: ['outcome', 'tone', 'deadline'],
  quote: ['subject', 'detail', 'validity'],
  minutes: ['minutesFocus', 'owners', 'detail'],
  questions: ['goal', 'recipient', 'count'],
  post: ['platform', 'goal', 'tone', 'callToAction'],
  markdown: ['structure', 'preserve'],
  letter: ['recipient', 'goal', 'register', 'references'],
};

function language(locale) {
  return String(locale).toLowerCase().startsWith('it') ? 'it' : 'en';
}

function requireRecipe(recipeId) {
  if (!recipeQuestionIds[recipeId]) throw new Error(`Unknown recipe: ${recipeId}`);
}

export function listGuidedRecipes(locale = 'it') {
  const localized = copy[language(locale)].recipes;
  return Object.entries(localized).map(([id, [label]]) => ({ id, label }));
}

export function getRecipeQuestions(recipeId, locale = 'it') {
  requireRecipe(recipeId);
  const localized = copy[language(locale)].questions;
  return recipeQuestionIds[recipeId].map((id) => {
    const [label, labels] = localized[id];
    return { id, label, options: labels.map((option) => ({ value: option, label: option })) };
  });
}

export function buildGuidedPrompt({ recipeId, answers = {}, content = '', locale = 'it' }) {
  requireRecipe(recipeId);
  const localized = copy[language(locale)];
  const [, instruction] = localized.recipes[recipeId];
  const preferences = getRecipeQuestions(recipeId, locale).map((question) => {
    const selected = answers[question.id] || question.options[0].value;
    return `- ${question.label} ${selected}`;
  });
  return [`# ${instruction}`, '', localized.preferences, ...preferences, '', localized.content, String(content).trim()].join('\n');
}

export function transitionGuidedWorkflow(state, event) {
  if (!GUIDED_STEPS.includes(state.step)) return state;
  if (event === 'OPEN_REVIEW' && state.step !== 'review') return { ...state, step: 'review', returnStep: state.step };
  if (event === 'CLOSE_REVIEW' && state.step === 'review') {
    const { returnStep = 'input', ...rest } = state;
    return { ...rest, step: GUIDED_STEPS.includes(returnStep) ? returnStep : 'input' };
  }
  if (event === 'CONTINUE' && state.step === 'input' && state.hasContent) return { ...state, step: 'purpose' };
  if (event === 'SELECT_PURPOSE' && state.step === 'purpose') return { ...state, step: 'questions' };
  if (event === 'BUILD_RESULT' && state.step === 'questions') return { ...state, step: 'result' };
  if (event === 'EDIT_PURPOSE' && state.step === 'result') return { ...state, step: 'purpose' };
  return state;
}

export function addManualFindings(content, requestedValue, existing = []) {
  const source = String(content ?? '');
  const value = String(requestedValue ?? '').trim();
  if (!value) return existing;
  const additions = [];
  let start = source.indexOf(value);
  while (start >= 0) {
    const end = start + value.length;
    const overlaps = [...existing, ...additions].some((finding) => start < finding.end && end > finding.start);
    if (!overlaps) additions.push({ id: `CUSTOM-${start}-${value.length}`, type: 'CUSTOM', value, start, end, selected: true });
    start = source.indexOf(value, end);
  }
  return [...existing, ...additions].sort((left, right) => left.start - right.start);
}
