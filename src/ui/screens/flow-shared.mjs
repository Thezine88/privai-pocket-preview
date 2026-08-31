import { escapeHtml, icon } from '../render.mjs';

export { escapeHtml, icon };
export const flowHeader = (title, { wordmark = false } = {}) => `<header class="flow-header"><button class="back-icon" data-action="back" aria-label="Indietro">${icon('back')}</button>${wordmark ? '<div class="wordmark"><span>Resta</span><span>Mio</span></div>' : `<h1>${escapeHtml(title)}</h1>`}<span aria-hidden="true"></span></header>`;
export const stickyCta = (label, action, extra = '') => `<footer class="flow-footer">${extra}<button class="button button--primary flow-cta" data-action="${action}">${label}</button></footer>`;
