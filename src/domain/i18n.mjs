import { it } from '../locales/it.mjs';
import { en } from '../locales/en.mjs';

const dictionaries = { it, en };

/** L'app parte in italiano: è il pubblico principale. L'inglese è una scelta. */
export function normalizeLocale(value) {
  return String(value || '').toLowerCase().split('-')[0] === 'en' ? 'en' : 'it';
}

export function createTranslator(value) {
  const locale = normalizeLocale(value);
  return {
    locale,
    t(key, variables = {}) {
      const template = dictionaries[locale][key] ?? it[key] ?? `[${key}]`;
      return String(template).replace(/\{([A-Za-z][A-Za-z0-9]*)\}/g, (token, name) => (
        Object.hasOwn(variables, name) ? String(variables[name]) : token
      ));
    },
  };
}
