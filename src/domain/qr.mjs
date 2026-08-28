/**
 * QR reale per il ponte desktop — non decorativo come drawQr() in app.mjs
 * (quello resta per la schermata piani, dove basta la cornice riconoscibile,
 * non un codice che una fotocamera debba davvero leggere).
 *
 * Nessuna logica di generazione qui: solo la scelta dei parametri sopra
 * vendor/qrcode.mjs (MIT, kazuhikoarase/qrcode-generator, vedi
 * vendor/QRCODE-LICENSE.txt).
 */
import qrcode from '../../vendor/qrcode.mjs';

/**
 * @param {string} text
 * @returns {string} markup <svg>...</svg> completo, pronto da inserire nel DOM
 */
export function renderQrSvg(text) {
  const qr = qrcode(0, 'M'); // 0 = dimensione scelta automaticamente dal contenuto
  qr.addData(text);
  qr.make();
  return qr.createSvgTag({ cellSize: 4, margin: 8 });
}
