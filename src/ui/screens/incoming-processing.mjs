import { escapeHtml, flowHeader, icon } from './flow-shared.mjs';

export function renderIncomingProcessing({ kind, name, error = '' }) {
  const image = kind === 'image';
  const title = image ? 'Sto analizzando l’immagine' : 'Sto leggendo il documento';
  return `<div class="screen flow-screen incoming-screen">${flowHeader('')}<main class="flow-content"><div class="incoming-icon">${icon(image ? 'file' : 'clipboard')}</div><h1 class="flow-title">${title}</h1><p class="flow-helper flow-helper--center">${escapeHtml(name)}</p>${error ? `<p class="incoming-error" role="alert">${escapeHtml(error)}</p><button class="button button--primary inline-cta" data-action="incoming-home">Torna alla Home</button>` : '<div class="incoming-progress" role="progressbar" aria-label="Elaborazione locale in corso"><span></span></div><p class="privacy-line">Tutto avviene sul telefono.</p>'}</main></div>`;
}
