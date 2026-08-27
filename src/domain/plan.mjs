/**
 * Piani e limiti.
 *
 * Principio di prodotto, non negoziabile: **la protezione non si paga mai**.
 * Rilevamento, mascheratura, ripristino e rubrica di base restano nel piano
 * gratuito, sempre e senza contatori. Un utente che scopre di non poter
 * proteggere un dato perché ha finito le azioni gratuite non torna, e racconta
 * in giro perché.
 *
 * Il piano Pro si paga su tre cose che l'utente sente come comodità, non come
 * sicurezza negata:
 *   1. VOLUME     — più documenti insieme, cronologia e cassaforte senza limiti
 *   2. CONTINUITÀ — lavori che restano aperti quanto vuoi, su più dispositivi
 *   3. CONTROLLO  — cassaforte con blocco, regole e template personali
 */

export const PLANS = Object.freeze({
  free: {
    id: 'free',
    label: { it: 'Gratis', en: 'Free' },
    openJobs: 2,
    maxRetention: '1d',
    vaultEntries: 8,
    historyItems: 10,
    desktop: { sessions: 5, minutes: 10 },
  },
  pro: {
    id: 'pro',
    label: { it: 'Pro', en: 'Pro' },
    openJobs: Number.POSITIVE_INFINITY,
    maxRetention: 'forever',
    vaultEntries: Number.POSITIVE_INFINITY,
    historyItems: Number.POSITIVE_INFINITY,
    desktop: { sessions: Number.POSITIVE_INFINITY, minutes: Number.POSITIVE_INFINITY },
  },
});

export function planOf(id) {
  return PLANS[id] ?? PLANS.free;
}

export function isUnlimited(value) {
  return !Number.isFinite(value);
}

/* ------------------------------------------------------------------ */
/* Modalità desktop via QR                                             */
/* ------------------------------------------------------------------ */

/**
 * Nel piano gratuito: 5 sessioni da 10 minuti. Il conteggio vive sul
 * dispositivo insieme al resto — nessun account, nessun server.
 *
 * La sessione scade da sola: non c'è un pulsante "termina" da ricordarsi di
 * premere, perché è il tipo di cosa che l'utente dimentica e poi si ritrova
 * senza sessioni residue senza capire perché.
 */
export function createDesktopSessions(store, { now = () => Date.now() } = {}) {
  const read = async () => (await store.get('desktop')) ?? { used: 0, active: null };

  return {
    async status(plan) {
      const limits = planOf(plan).desktop;
      const state = await read();
      const active = state.active && state.active.endsAt > now() ? state.active : null;
      return {
        active,
        msLeft: active ? active.endsAt - now() : 0,
        used: state.used,
        remaining: isUnlimited(limits.sessions) ? Infinity : Math.max(0, limits.sessions - state.used),
        minutes: limits.minutes,
        unlimited: isUnlimited(limits.sessions),
      };
    },

    async start(plan, pairingCode) {
      const limits = planOf(plan).desktop;
      const state = await read();
      const current = state.active && state.active.endsAt > now() ? state.active : null;
      if (current) return { ok: true, session: current, resumed: true };
      if (!isUnlimited(limits.sessions) && state.used >= limits.sessions) {
        return { ok: false, reason: 'no-sessions-left' };
      }
      const span = isUnlimited(limits.minutes) ? Number.POSITIVE_INFINITY : limits.minutes * 60_000;
      const session = {
        code: pairingCode,
        startedAt: now(),
        endsAt: Number.isFinite(span) ? now() + span : Number.POSITIVE_INFINITY,
      };
      await store.set('desktop', { used: state.used + (isUnlimited(limits.sessions) ? 0 : 1), active: session });
      return { ok: true, session, resumed: false };
    },

    async stop() {
      const state = await read();
      await store.set('desktop', { ...state, active: null });
    },
  };
}

/** Codice di accoppiamento leggibile: si detta al telefono se la fotocamera non collabora. */
export function pairingCode(random = crypto) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // niente 0/O/1/I
  const bytes = random.getRandomValues(new Uint8Array(6));
  return [...bytes].map((byte) => alphabet[byte % alphabet.length]).join('');
}

/* ------------------------------------------------------------------ */

/**
 * I vantaggi Pro, scritti come benefici e non come funzioni.
 * Ordinati per quanto spesso l'utente ci sbatte contro nel piano gratuito.
 */
export const PRO_BENEFITS = [
  {
    id: 'retention',
    icon: 'retention',
    title: { it: 'I lavori restano aperti quanto vuoi', en: 'Jobs stay open as long as you want' },
    body: { it: 'Nel piano gratuito la cassaforte tiene un lavoro per un giorno. Con Pro nessuna scadenza: ripristini anche fra due settimane.', en: 'On the free plan the vault keeps a job for one day. With Pro there is no expiry: restore even two weeks later.' },
  },
  {
    id: 'batch',
    icon: 'batch',
    title: { it: 'Più documenti in un colpo solo', en: 'Several documents at once' },
    body: { it: 'Proteggi un’intera cartella senza ripetere ogni passaggio. La rubrica si applica a tutti.', en: 'Protect a whole folder without repeating each step. Your list applies to all of them.' },
  },
  {
    id: 'lock',
    icon: 'lock',
    title: { it: 'Cassaforte con blocco', en: 'Locked vault' },
    body: { it: 'Impronta o PIN per aprire i lavori salvati. Utile se il telefono gira per casa o per lo studio.', en: 'Fingerprint or PIN to open saved jobs. Useful when the phone gets passed around.' },
  },
  {
    id: 'desktop',
    icon: 'desktop',
    title: { it: 'Desktop senza limiti di tempo', en: 'Desktop with no time limit' },
    body: { it: 'Inquadra il QR e lavori dal computer. Gratis sono 5 sessioni da 10 minuti, con Pro non si contano.', en: 'Scan the QR and work from your computer. Free gives 5 sessions of 10 minutes; Pro does not count them.' },
  },
  {
    id: 'recipes',
    icon: 'saved',
    title: { it: 'Le tue richieste ricorrenti, salvate', en: 'Your recurring requests, saved' },
    body: { it: 'Salva le combinazioni che usi sempre: preventivo per il cliente tipo, sollecito standard, verbale del lunedì.', en: 'Save the combinations you always use: your standard quote, your usual chaser, Monday’s minutes.' },
  },
  {
    id: 'formats',
    icon: 'formats',
    title: { it: 'Word, scansioni e immagini', en: 'Word, scans and images' },
    body: { it: 'Apri .docx e leggi i PDF scansionati con riconoscimento del testo, sempre sul telefono.', en: 'Open .docx and read scanned PDFs with on-device text recognition.' },
  },
];
