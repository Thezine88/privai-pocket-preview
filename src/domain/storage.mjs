import { parseJob, serializeJob } from './job.mjs';

export function createJobStore(vault) {
  return {
    async listIds() { return vault.list(); },
    async open(id) {
      const serialized = await vault.read(id);
      return serialized == null ? null : parseJob(serialized);
    },
    async save(job) { await vault.write(job.id, serializeJob(job)); },
    async remove(id) { await vault.remove(id); },
    async clear() { await vault.clear(); },
  };
}

export function createStore(storage, { historyLimit = 8 } = {}) {
  const prefix = 'ai-pocket:';
  const read = (key, fallback) => {
    try { return JSON.parse(storage.getItem(prefix + key)) ?? fallback; } catch { return fallback; }
  };
  const write = (key, value) => storage.setItem(prefix + key, JSON.stringify(value));

  return {
    listRecent() { return read('recent', []); },
    saveRecent(item) {
      const recent = read('recent', []).filter((entry) => entry.id !== item.id);
      write('recent', [{ ...item, updatedAt: new Date().toISOString() }, ...recent].slice(0, historyLimit));
    },
    deleteRecent(id) { write('recent', read('recent', []).filter((item) => item.id !== id)); },
    saveProviderKey(provider, key) { write(`provider:${provider}`, { key }); },
    getProviderKey(provider) { return read(`provider:${provider}`, {}).key ?? ''; },
    deleteProviderKey(provider) { storage.removeItem(prefix + `provider:${provider}`); },
    providerSummary(provider) {
      const key = read(`provider:${provider}`, {}).key ?? '';
      return { configured: Boolean(key), masked: key ? `••••${key.slice(-4)}` : '' };
    },
    getLocale() { return read('locale', null); },
    saveLocale(locale) {
      if (!['it', 'en'].includes(locale)) throw new Error('Lingua non supportata');
      write('locale', locale);
    },
  };
}
