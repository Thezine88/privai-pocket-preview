import { en } from '../locales/en.mjs?v=17';
import { it } from '../locales/it.mjs?v=17';

export const SUPPORTED_LOCALES = Object.freeze(['it', 'en']);

const dictionaries = { en, it };

export function normalizeLocale(value) {
  return String(value || '').toLowerCase().split('-')[0] === 'it' ? 'it' : 'en';
}

export function createTranslator(value) {
  const locale = normalizeLocale(value);
  return {
    locale,
    t(key, variables = {}) {
      const template = dictionaries[locale][key] ?? en[key] ?? `[${key}]`;
      return template.replace(/\{([A-Za-z][A-Za-z0-9]*)\}/g, (token, name) => (
        Object.hasOwn(variables, name) ? String(variables[name]) : token
      ));
    },
  };
}
