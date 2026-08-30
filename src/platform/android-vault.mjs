export function createAndroidVault(plugin) {
  return {
    async list() { return (await plugin.list()).keys; },
    async read(key) { return (await plugin.read({ key })).value ?? null; },
    async write(key, value) { await plugin.write({ key, value }); },
    async remove(key) { await plugin.remove({ key }); },
    async clear() { await plugin.clear(); },
  };
}
