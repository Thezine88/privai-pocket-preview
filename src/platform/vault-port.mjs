const PREFIX = 'restamio:vault:';
const INDEX = `${PREFIX}index`;

function validKey(key) {
  if (typeof key !== 'string' || !key.trim()) throw new TypeError('Chiave Cassaforte non valida');
  return key;
}

export function createMemoryVault() {
  const values = new Map();
  return {
    async list() { return [...values.keys()]; },
    async read(key) { return values.get(validKey(key)) ?? null; },
    async write(key, value) { values.set(validKey(key), value); },
    async remove(key) { values.delete(validKey(key)); },
    async clear() { values.clear(); },
  };
}

export function createSessionVault(sessionStorage) {
  const list = () => {
    try { return JSON.parse(sessionStorage.getItem(INDEX)) ?? []; } catch { return []; }
  };
  const saveList = (keys) => sessionStorage.setItem(INDEX, JSON.stringify(keys));
  return {
    async list() { return list(); },
    async read(key) { return sessionStorage.getItem(`${PREFIX}${validKey(key)}`); },
    async write(key, value) {
      const safeKey = validKey(key);
      sessionStorage.setItem(`${PREFIX}${safeKey}`, value);
      saveList([...new Set([...list(), safeKey])]);
    },
    async remove(key) {
      const safeKey = validKey(key);
      sessionStorage.removeItem(`${PREFIX}${safeKey}`);
      saveList(list().filter((item) => item !== safeKey));
    },
    async clear() {
      for (const key of list()) sessionStorage.removeItem(`${PREFIX}${key}`);
      sessionStorage.removeItem(INDEX);
    },
  };
}
