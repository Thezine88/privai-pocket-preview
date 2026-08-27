/**
 * Il "lavoro aperto" e la rubrica personale.
 *
 * Il difetto più grave della v1: la corrispondenza fra segnaposto e dato reale
 * viveva solo in memoria. Uscire verso ChatGPT poteva distruggere la WebView, e
 * il ripristino promesso in onboarding diventava impossibile.
 *
 * Qui la mappa viene salvata, con una scadenza scelta dall'utente e la
 * cancellazione sempre a un tocco.
 *
 * SecureStore è un'astrazione volutamente sottile: sul web usa localStorage,
 * nell'app nativa usa il plugin che appoggia su Android Keystore /
 * EncryptedSharedPreferences. Il resto del codice non deve sapere quale dei due
 * sta girando.
 */

const PREFIX = 'privai:';

export const RETENTION = Object.freeze({
  '1h': 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  forever: Number.POSITIVE_INFINITY,
});

export const DEFAULT_RETENTION = '7d';

const ORDER = ['1h', '1d', '7d', 'forever'];

/**
 * Riporta la scadenza dentro il massimo consentito dal piano.
 * Senza questo, il piano gratuito mostra come già selezionata un'opzione
 * riservata a Pro: sembra un'offerta ritirata all'ultimo.
 */
export function clampRetention(retention, maxRetention) {
  const wanted = ORDER.indexOf(retention);
  const limit = ORDER.indexOf(maxRetention);
  if (wanted < 0 || limit < 0) return ORDER[0];
  return ORDER[Math.min(wanted, limit)];
}

function nativePlugin() {
  return globalThis.Capacitor?.isNativePlatform?.()
    ? globalThis.Capacitor?.Plugins?.SecureStore
    : null;
}

/**
 * @returns {{ get(key): Promise<any>, set(key, value): Promise<void>, remove(key): Promise<void>, secure: boolean }}
 */
export function createSecureStore({ fallback = globalThis.localStorage, plugin = nativePlugin } = {}) {
  const native = plugin();
  if (native?.get) {
    return {
      secure: true,
      async get(key) {
        const result = await native.get({ key: PREFIX + key });
        try { return result?.value ? JSON.parse(result.value) : null; } catch { return null; }
      },
      async set(key, value) { await native.set({ key: PREFIX + key, value: JSON.stringify(value) }); },
      async remove(key) { await native.remove({ key: PREFIX + key }); },
    };
  }
  return {
    secure: false,
    async get(key) {
      try { return JSON.parse(fallback.getItem(PREFIX + key)); } catch { return null; }
    },
    async set(key, value) { fallback.setItem(PREFIX + key, JSON.stringify(value)); },
    async remove(key) { fallback.removeItem(PREFIX + key); },
  };
}

/* ------------------------------------------------------------------ */

export function createVault(store) {
  const readJobs = async () => (await store.get('jobs')) ?? [];
  const writeJobs = (jobs) => store.set('jobs', jobs);

  function isExpired(job, now = Date.now()) {
    return Number.isFinite(job.expiresAt) && job.expiresAt <= now;
  }

  return {
    secure: store.secure,

    /** Elimina i lavori scaduti. Va chiamato a ogni avvio. */
    async purgeExpired(now = Date.now()) {
      const jobs = await readJobs();
      const alive = jobs.filter((job) => !isExpired(job, now));
      if (alive.length !== jobs.length) await writeJobs(alive);
      return jobs.length - alive.length;
    },

    async listJobs(now = Date.now()) {
      const jobs = await readJobs();
      return jobs
        .filter((job) => !isExpired(job, now))
        .sort((a, b) => b.updatedAt - a.updatedAt);
    },

    /**
     * Salva o aggiorna un lavoro. `mapping` è la parte delicata: è ciò che
     * permette di ricomporre i dati originali, e non deve mai lasciare il
     * dispositivo.
     */
    async saveJob({ id, title, mapping, protectedText, findingsCount = 0, retention = DEFAULT_RETENTION }) {
      const now = Date.now();
      const span = RETENTION[retention] ?? RETENTION[DEFAULT_RETENTION];
      const jobs = await readJobs();
      const existing = jobs.find((job) => job.id === id);
      const job = {
        id: id ?? String(now),
        title: title?.trim() || 'Lavoro senza titolo',
        mapping: mapping ?? {},
        protectedText: protectedText ?? '',
        findingsCount,
        retention,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        expiresAt: Number.isFinite(span) ? now + span : Number.POSITIVE_INFINITY,
        restoredAt: existing?.restoredAt ?? null,
      };
      await writeJobs([job, ...jobs.filter((entry) => entry.id !== job.id)].slice(0, 30));
      return job;
    },

    async markRestored(id) {
      const jobs = await readJobs();
      await writeJobs(jobs.map((job) => (job.id === id ? { ...job, restoredAt: Date.now() } : job)));
    },

    async deleteJob(id) {
      const jobs = await readJobs();
      await writeJobs(jobs.filter((job) => job.id !== id));
    },

    /** Unisce le mappe di tutti i lavori aperti: serve a riconoscere una
     *  risposta incollata senza chiedere all'utente da quale lavoro venga. */
    async combinedMapping() {
      const jobs = await this.listJobs();
      const combined = {};
      for (const job of jobs.slice().reverse()) Object.assign(combined, job.mapping);
      return combined;
    },

    /* --- rubrica personale --- */

    async listEntries() {
      return (await store.get('entries')) ?? [];
    },

    async addEntry(value, type = 'CUSTOM') {
      const label = String(value ?? '').trim();
      if (label.length < 2) return null;
      const entries = await this.listEntries();
      if (entries.some((entry) => entry.value.toLowerCase() === label.toLowerCase())) return null;
      const entry = { id: `${Date.now()}-${entries.length}`, value: label, type };
      await store.set('entries', [entry, ...entries]);
      return entry;
    },

    async deleteEntry(id) {
      const entries = await this.listEntries();
      await store.set('entries', entries.filter((entry) => entry.id !== id));
    },

    /** Il pulsante che in un'app di privacy deve esistere e trovarsi subito. */
    async wipeEverything() {
      for (const key of ['jobs', 'entries', 'recent', 'prefs']) await store.remove(key);
    },
  };
}

/** Etichetta leggibile per la scadenza di un lavoro. */
export function retentionLabel(job, locale = 'it', now = Date.now()) {
  if (!Number.isFinite(job?.expiresAt)) return locale === 'it' ? 'Nessuna scadenza' : 'No expiry';
  const left = job.expiresAt - now;
  if (left <= 0) return locale === 'it' ? 'Scaduto' : 'Expired';
  const hours = Math.round(left / 3_600_000);
  if (hours < 24) return locale === 'it' ? `Scade fra ${hours} h` : `Expires in ${hours} h`;
  const days = Math.round(hours / 24);
  return locale === 'it' ? `Scade fra ${days} g` : `Expires in ${days} d`;
}
