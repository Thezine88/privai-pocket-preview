/**
 * Decisione per il riquadro Impostazioni Rapide "Proteggi appunti".
 *
 * Pura: riceve il testo degli appunti già letto e la mappa dei lavori
 * aperti, restituisce cosa fare, senza mai toccare appunti, cassaforte o
 * plugin nativi — chi la usa (src/app.mjs) si occupa degli effetti
 * collaterali. Separarla così la rende testabile come il resto del
 * rilevamento, invece di vivere solo dentro l'orchestrazione headless.
 */

import { detectSensitiveData, maskFindings, restoreProtectedText, shouldOfferRestore } from './pii.mjs';

/**
 * @param {string} clipboardText
 * @param {Record<string,string>} mapping   vault.combinedMapping()
 * @param {Array} vaultEntries              vault.listEntries() — rubrica personale
 * @returns {
 *   | { action: 'empty' }
 *   | { action: 'nothing' }
 *   | { action: 'restore', text: string }
 *   | { action: 'mask', text: string, mapping: Record<string,string>, count: number }
 * }
 */
export function decideQuickProtect(clipboardText, mapping = {}, vaultEntries = []) {
  const text = String(clipboardText ?? '').trim();
  if (!text) return { action: 'empty' };

  // Prima domanda: è già una NOSTRA risposta da ripristinare? Rimascherarla
  // per errore la romperebbe (i segnaposto non sono dati sensibili veri).
  if (shouldOfferRestore(text, mapping).offer) {
    const restored = restoreProtectedText(text, mapping);
    return { action: 'restore', text: restored.text };
  }

  // Stesso motore e stessa selezione di default del flusso manuale: solo il
  // rischio alto nasce mascherato, "forse nomi" e dati a basso rischio no.
  const findings = detectSensitiveData(text, { vault: vaultEntries });
  const result = maskFindings(text, findings);
  const count = Object.keys(result.mapping).length;
  if (count === 0) return { action: 'nothing' };
  return { action: 'mask', text: result.text, mapping: result.mapping, count };
}
