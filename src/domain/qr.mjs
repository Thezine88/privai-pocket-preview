/**
 * QR reale per il ponte desktop — non decorativo come drawQr() in app.mjs
 * (quello resta per la schermata piani, dove basta la cornice riconoscibile,
 * non un codice che una fotocamera debba davvero leggere).
 *
 * La generazione dei moduli viene tutta da vendor/qrcode.mjs (MIT,
 * kazuhikoarase/qrcode-generator, vedi vendor/QRCODE-LICENSE.txt). Qui c'è
 * solo il DISEGNO: la libreria sa dire quali moduli sono neri, non come
 * devono apparire, e createSvgTag() produce quadretti secchi.
 */
import qrcode from '../../vendor/qrcode.mjs';

/** Quota di moduli che il livello 'H' permette di perdere senza che il
 *  codice diventi illeggibile: ~30%. Il buco per la mascotte al centro sta
 *  molto sotto questa soglia (vedi FORO_RAGGIO). */
const CORREZIONE = 'H';

/** Raggio del foro centrale, in moduli-equivalenti sul lato: 0.16 significa
 *  che il disco copre il 16% del lato, cioè ~2% dell'area totale. Restare
 *  piccoli è ciò che tiene il codice leggibile: la correzione d'errore
 *  ricostruisce quello che sta sotto, ma solo se è poco. */
const FORO_RAGGIO = 0.16;

/** Un modulo è "occhio" se sta in uno dei tre quadrati 7×7 agli angoli: i
 *  riquadri che la fotocamera cerca per orientarsi. Vanno disegnati come
 *  cornice continua, non come griglia di puntini, altrimenti si perde
 *  proprio il segnale che rende il codice riconoscibile. */
function dentroOcchio(riga, colonna, n) {
  const inAngolo = (r0, c0) => riga >= r0 && riga < r0 + 7 && colonna >= c0 && colonna < c0 + 7;
  return inAngolo(0, 0) || inAngolo(0, n - 7) || inAngolo(n - 7, 0);
}

/** Cornice arrotondata + pupilla piena, per uno dei tre angoli. */
function occhio(r0, c0) {
  return `
    <rect x="${c0 + 0.5}" y="${r0 + 0.5}" width="6" height="6" rx="1.9"
          fill="none" stroke="currentColor" stroke-width="1"/>
    <rect x="${c0 + 2}" y="${r0 + 2}" width="3" height="3" rx="1.05" fill="currentColor"/>`;
}

/**
 * Un modulo nero come goccia arrotondata: gli angoli si arrotondano solo
 * dove NON c'è un vicino nero, così i moduli adiacenti si fondono in una
 * forma continua invece di restare quadretti separati. È l'effetto del
 * disegno che mi hai mostrato.
 */
function goccia(riga, colonna, nero) {
  const su = nero(riga - 1, colonna);
  const giu = nero(riga + 1, colonna);
  const sx = nero(riga, colonna - 1);
  const dx = nero(riga, colonna + 1);
  const r = 0.5;                     // raggio massimo: mezzo modulo = tondo pieno
  const as = su || sx ? 0 : r;       // angolo alto-sinistra
  const ad = su || dx ? 0 : r;       // alto-destra
  const bd = giu || dx ? 0 : r;      // basso-destra
  const bs = giu || sx ? 0 : r;      // basso-sinistra
  const x = colonna;
  const y = riga;
  return `<path d="M${x + as},${y}h${1 - as - ad}${ad ? `a${ad},${ad} 0 0 1 ${ad},${ad}` : ''}`
    + `v${1 - ad - bd}${bd ? `a${bd},${bd} 0 0 1 -${bd},${bd}` : ''}`
    + `h-${1 - bd - bs}${bs ? `a${bs},${bs} 0 0 1 -${bs},-${bs}` : ''}`
    + `v-${1 - bs - as}${as ? `a${as},${as} 0 0 1 ${as},-${as}` : ''}z"/>`;
}

/**
 * @param {string} testo
 * @param {{ logo?: string }} [opzioni] logo: URL dell'immagine al centro
 *        (la mascotte). Omesso, il centro resta pieno di moduli.
 * @returns {string} markup <svg>...</svg> completo, pronto da inserire nel DOM
 */
export function renderQrSvg(testo, { logo } = {}) {
  const qr = qrcode(0, CORREZIONE); // 0 = dimensione scelta dal contenuto
  qr.addData(testo);
  qr.make();

  const n = qr.getModuleCount();
  const margine = 2;                 // zona di silenzio attorno al codice
  const lato = n + margine * 2;
  const centro = n / 2;
  const raggioForo = logo ? n * FORO_RAGGIO : 0;

  // Un modulo conta come nero solo se è davvero acceso, non è dentro un
  // occhio (disegnati a parte) e non finisce sotto il foro centrale.
  const nero = (riga, colonna) => {
    if (riga < 0 || colonna < 0 || riga >= n || colonna >= n) return false;
    if (!qr.isDark(riga, colonna)) return false;
    if (dentroOcchio(riga, colonna, n)) return false;
    if (raggioForo) {
      const dx = riga + 0.5 - centro;
      const dy = colonna + 0.5 - centro;
      if (Math.hypot(dx, dy) < raggioForo + 1) return false;
    }
    return true;
  };

  let corpo = '';
  for (let riga = 0; riga < n; riga += 1) {
    for (let colonna = 0; colonna < n; colonna += 1) {
      if (nero(riga, colonna)) corpo += goccia(riga, colonna, nero);
    }
  }

  const occhi = occhio(0, 0) + occhio(0, n - 7) + occhio(n - 7, 0);

  // Il logo sta su un disco del colore dello sfondo: senza, i moduli
  // dietro lo renderebbero illeggibile e confonderebbero la fotocamera.
  const mascotte = logo ? `
    <circle cx="${centro}" cy="${centro}" r="${raggioForo + 0.6}" fill="var(--paper, #fff)"/>
    <image href="${logo}" x="${centro - raggioForo}" y="${centro - raggioForo}"
           width="${raggioForo * 2}" height="${raggioForo * 2}"
           preserveAspectRatio="xMidYMid meet"/>` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lato} ${lato}"
    width="100%" style="max-width:260px;color:var(--ink,#000)" shape-rendering="geometricPrecision">
    <g transform="translate(${margine},${margine})" fill="currentColor">
      ${corpo}${occhi}${mascotte}
    </g>
  </svg>`;
}
