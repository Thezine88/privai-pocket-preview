/**
 * Ingresso e uscita del contenuto.
 *
 * L'ingresso è la parte che nella v1 mancava del tutto: l'app non compariva nel
 * menu «Condividi» del telefono, quindi ogni lavoro cominciava con un
 * copia-incolla manuale. Qui il testo può arrivare da tre strade, e l'app non
 * deve sapere quale.
 */

const native = () => globalThis.Capacitor?.isNativePlatform?.() ? globalThis.Capacitor : null;

/* ------------------------------------------------------------------ */
/* In uscita                                                           */
/* ------------------------------------------------------------------ */

export function createOutbound({
  isNative = () => Boolean(native()),
  plugin = () => globalThis.Capacitor?.Plugins?.OutboundShare,
  webShare = navigator.share?.bind(navigator),
} = {}) {
  const bridge = () => (typeof plugin === 'function' ? plugin() : plugin);

  async function shareAnywhere(text, title) {
    if (isNative() && bridge()?.share) return bridge().share({ text, title });
    if (webShare) return webShare({ text, title });
    return { unavailable: true };
  }

  async function shareWithAI(text, title) {
    if (isNative() && bridge()?.shareWithAI) return bridge().shareWithAI({ text, title });
    return shareAnywhere(text, title);
  }

  return { shareAnywhere, shareWithAI };
}

/* ------------------------------------------------------------------ */
/* In ingresso                                                         */
/* ------------------------------------------------------------------ */

/**
 * Tre strade, in ordine di priorità:
 *  1. `window.__privaiShared` — MainActivity la valorizza prima del caricamento
 *     quando l'app viene aperta da una condivisione (avvio a freddo).
 *  2. evento `shared` del plugin ShareTarget — app già aperta in background.
 *  3. parametro `?shared` nell'URL — usato dalla PWA e dalla modalità desktop.
 *
 * @param {(payload: {text: string, source: string}) => void} onContent
 */
export function createInbound(onContent) {
  const deliver = (text, source) => {
    const value = String(text ?? '').trim();
    if (value) onContent({ text: value, source });
  };

  function start() {
    // 1 — avvio a freddo
    const pending = globalThis.__privaiShared;
    if (pending) {
      delete globalThis.__privaiShared;
      deliver(typeof pending === 'string' ? pending : pending.text, 'share');
    }

    // 2 — app già viva
    const plugin = globalThis.Capacitor?.Plugins?.ShareTarget;
    plugin?.addListener?.('shared', (event) => deliver(event?.text, 'share'));
    globalThis.addEventListener('privai:shared', (event) => deliver(event.detail?.text, 'share'));

    // Da qui in poi il lato nativo può usare l'evento invece del deposito:
    // l'interfaccia esiste ed è in ascolto.
    globalThis.__privaiReady = true;
    plugin?.ready?.().catch(() => {});

    // 3 — PWA e desktop
    const params = new URLSearchParams(location.search);
    if (params.has('shared')) {
      deliver(params.get('shared'), 'url');
      history.replaceState(null, '', location.pathname);
    }
  }

  return { start };
}

/* ------------------------------------------------------------------ */
/* Appunti                                                             */
/* ------------------------------------------------------------------ */

/**
 * Nel WebView di Android `navigator.clipboard.readText()` fallisce quando il
 * documento non ha il fuoco — cioè proprio al rientro da un'altra app, che è
 * il momento in cui ci serve. Il plugin nativo non ha quel vincolo, quindi si
 * prova prima quello.
 */
export async function readClipboard() {
  const plugin = globalThis.Capacitor?.Plugins?.Clipboard;
  if (plugin?.read) {
    try {
      const result = await plugin.read();
      if (typeof result?.value === 'string') return result.value;
    } catch { /* si ripiega sull'API del browser */ }
  }
  if (!navigator.clipboard?.readText) return null;
  try { return await navigator.clipboard.readText(); } catch { return null; }
}

export async function writeClipboard(text) {
  const plugin = globalThis.Capacitor?.Plugins?.Clipboard;
  if (plugin?.write) {
    try { return await plugin.write({ string: text }); } catch { /* ripiego */ }
  }
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const area = document.createElement('textarea');
  area.value = text;
  area.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
  document.body.append(area);
  area.select();
  const ok = document.execCommand('copy');
  area.remove();
  if (!ok) throw new Error('clipboard-unavailable');
  return undefined;
}
