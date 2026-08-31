import { escapeHtml, flowHeader } from './flow-shared.mjs';
import { inputDetectionState } from '../../application/live-detection.mjs';

export function renderContentInput(text = '', { error = '', findingsCount = 0, detectionPending = false } = {}) {
  const status = inputDetectionState(text, Array(findingsCount).fill(null), detectionPending);
  return `<div class="screen flow-screen input-screen">${flowHeader('Il tuo contenuto')}<main class="flow-content flow-content--input"><p class="flow-helper">Incolla o scrivi il testo che vuoi usare con l’AI.</p><div class="text-editor"><button data-action="paste-input" class="editor-paste">Incolla</button><textarea id="content-text" aria-label="Testo da proteggere" placeholder="Scrivi o incolla qui…">${escapeHtml(text)}</textarea></div>${error ? `<p class="inline-error">${escapeHtml(error)}</p>` : ''}<p class="live-detection" role="status" aria-live="polite"><strong data-live-count>${status.label}</strong><span>Controlla prima di proteggere</span></p><aside class="privacy-card"><span aria-hidden="true">✓</span><p><strong>Tutto sul telefono</strong><small>Il controllo avviene qui. Niente viene inviato a un server.</small></p></aside><button class="button button--primary inline-cta" data-action="protect-text" ${status.ctaDisabled ? 'disabled' : ''}>Proteggi il testo</button></main></div>`;
}
