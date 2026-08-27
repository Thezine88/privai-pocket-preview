/**
 * Logica pura dello swipe-per-eliminare.
 *
 * Separata dal tocco/puntatore vero e proprio: qui si decide SOLO cosa deve
 * succedere dato uno spostamento orizzontale, non come leggerlo dal DOM. Così
 * la regola («quanto serve per cancellare», «quanto per restare aperto») è
 * testabile senza un browser e senza simulare eventi pointer.
 */

export const SWIPE_ACTION_WIDTH = 84;       // quanto si scopre il pulsante "Elimina"
export const SWIPE_DELETE_DISTANCE = 132;   // uno swipe deciso cancella subito

/**
 * @param {number} totalOffset  spostamento orizzontale totale dalla riga a
 *   riposo (negativo = verso sinistra). Non il delta dell'ultimo movimento:
 *   l'offset assoluto, così la riga già aperta e uno swipe deciso si
 *   comportano in modo coerente.
 * @returns {{ x: number, outcome: 'closed'|'open'|'delete' }}
 */
export function swipeOutcome(totalOffset) {
  if (totalOffset <= -SWIPE_DELETE_DISTANCE) return { x: -SWIPE_DELETE_DISTANCE, outcome: 'delete' };
  if (totalOffset <= -SWIPE_ACTION_WIDTH / 2) return { x: -SWIPE_ACTION_WIDTH, outcome: 'open' };
  return { x: 0, outcome: 'closed' };
}

/** Il fermo elastico durante il trascinamento: mai a destra di 0, mai troppo a sinistra. */
export function clampDrag(totalOffset) {
  const min = -(SWIPE_DELETE_DISTANCE + 40);
  return Math.min(0, Math.max(min, totalOffset));
}

/**
 * Decide se un movimento va trattato come swipe orizzontale o lasciato
 * scorrere la lista in verticale. Una sola volta per gesto: il primo
 * spostamento oltre la soglia blocca la direzione per tutto il gesto.
 */
export function lockAxis(dx, dy, threshold = 6) {
  if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return null;
  return Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
}
