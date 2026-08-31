export const QUICK_ACTIONS = Object.freeze([
  { id: 'email', label: 'Scrivi un’email', icon: 'mail' },
  { id: 'summary', label: 'Riassumi', icon: 'list' },
  { id: 'cv', label: 'Migliora il CV', icon: 'cv' },
  { id: 'translate', label: 'Traduci', icon: 'file' },
  { id: 'checklist', label: 'Crea una lista', icon: 'list' },
  { id: 'clarify', label: 'Rendi più chiaro', icon: 'sliders' },
]);

export const DEFAULT_QUICK_ACTIONS = Object.freeze(['email', 'summary', 'cv']);
const known = new Set(QUICK_ACTIONS.map(({ id }) => id));

export function normalizeQuickActions(value) {
  if (!Array.isArray(value)) return [...DEFAULT_QUICK_ACTIONS];
  const result = [...new Set(value.filter((id) => known.has(id)))].slice(0, 3);
  for (const id of [...DEFAULT_QUICK_ACTIONS, ...known]) {
    if (result.length === 3) break;
    if (!result.includes(id)) result.push(id);
  }
  return result;
}

export function resolveQuickAction(requested, value) {
  const favourites = normalizeQuickActions(value);
  return requested === 'custom' || favourites.includes(requested) ? requested : favourites[0];
}

export function toggleQuickAction(value, id) {
  const current = normalizeQuickActions(value);
  if (!known.has(id)) return current;
  if (current.includes(id)) return current;
  return [...current.slice(0, 2), id];
}

export function moveQuickAction(value, id, direction) {
  const current = normalizeQuickActions(value);
  const from = current.indexOf(id);
  const to = from + Math.sign(direction);
  if (from < 0 || to < 0 || to >= current.length) return current;
  [current[from], current[to]] = [current[to], current[from]];
  return current;
}
