function requiredCacheId(cacheId) {
  if (typeof cacheId !== 'string' || !/^[a-zA-Z0-9-]+$/.test(cacheId)) throw new TypeError('Cache non valida');
  return cacheId;
}

function normalize(item) {
  const kind = String(item?.kind ?? '').toLowerCase();
  if (!['document', 'image'].includes(kind)) throw new TypeError('Condivisione non supportata');
  return { kind, mimeType: String(item.mimeType ?? ''), name: String(item.name ?? ''), size: Number(item.size ?? 0), cacheId: requiredCacheId(item.cacheId) };
}

export function createAndroidIncomingShare(plugin) {
  return {
    async pending() {
      const { item } = await plugin.getPending();
      return item ? normalize(item) : null;
    },
    async read(cacheId) { return plugin.read({ cacheId: requiredCacheId(cacheId) }); },
    async recognize(cacheId) { return plugin.recognize({ cacheId: requiredCacheId(cacheId) }); },
    async discard(cacheId) { return plugin.discard({ cacheId: requiredCacheId(cacheId) }); },
    listen(callback) { return plugin.addListener?.('incomingShare', (item) => callback(normalize(item))); },
  };
}
