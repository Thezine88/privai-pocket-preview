const compactInlineWhitespace = (line) => line.replace(/[\t ]+/g, ' ').trim();

export function normalizeToMarkdown(input) {
  const lines = String(input ?? '').replace(/\r\n?/g, '\n').split('\n');
  const normalized = lines.map((raw, index) => {
    const line = compactInlineWhitespace(raw);
    if (!line) return '';
    if (/^[•·]\s*/u.test(line)) return `- ${line.replace(/^[•·]\s*/u, '')}`;
    if (/^-\s+/u.test(line)) return `- ${line.replace(/^-\s+/u, '')}`;
    if (index === 0 && /^[A-ZÀ-ÖØ-Þ0-9][A-ZÀ-ÖØ-Þ0-9\s]{3,}$/u.test(line)) {
      return `# ${line.charAt(0)}${line.slice(1).toLocaleLowerCase('it-IT')}`;
    }
    return line;
  });

  return normalized.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

const templateInstructions = {
  email: ['# Istruzioni Email', '- Proponi un oggetto chiaro.', '- Scrivi un corpo completo con tono professionale.', '- Concludi con una richiesta finale esplicita.', '- Non inventare fatti o dettagli assenti.'],
  post: ['# Istruzioni Post', '- Crea un’apertura chiara.', '- Organizza il corpo in modo leggibile.', '- Concludi con un invito all’azione pertinente.', '- Inserisci hashtag solo se utili.'],
  summary: ['# Istruzioni Riassunto', '- Estrai i punti principali.', '- Mantieni nomi e date presenti.', '- Separa decisioni e prossimi passi.', '- Indica separatamente le informazioni incerte.'],
  checklist: ['# Istruzioni Checklist', '- Per ogni voce indica azione, responsabile, scadenza, priorità e dipendenze.', '- Segnala i campi mancanti senza inventarli.'],
};

export function buildPromptPack({ template, goal, constraints = [], content, outputLanguage = 'same' }) {
  const sections = [];
  if (goal?.trim()) sections.push(`# Obiettivo\n\n${goal.trim()}`);
  if (templateInstructions[template]) sections.push(templateInstructions[template].join('\n'));
  const cleanConstraints = constraints.map((item) => item.trim()).filter(Boolean);
  if (cleanConstraints.length) {
    sections.push(`# Vincoli\n\n${cleanConstraints.map((item) => `- ${item}`).join('\n')}`);
  }
  const languageNames = { it: 'Italian', en: 'English' };
  if (languageNames[outputLanguage]) sections.push(`# Output language\n\n${languageNames[outputLanguage]}`);
  sections.push(`# Contenuto\n\n${normalizeToMarkdown(content)}`);
  return sections.join('\n\n');
}
