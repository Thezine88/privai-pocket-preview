# Ponte desktop via QR/link — Piano di implementazione

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un modo per continuare un lavoro dal computer — tastiera vera, stessa app — senza server a pagamento, senza installare nulla sul computer, senza che originali o chiavi lascino mai il telefono in modo permanente.

**Architecture:** Il telefono avvia un piccolo server HTTP locale (nativo) che serve la stessa app già bundlata da Capacitor e risponde a tre endpoint che rispecchiano la cassaforte (`get`/`set`/`remove`), ognuno protetto dal codice di sessione già generato da `pairingCode()`. Il computer arriva lì tramite un link pubblico e gratuito (GitHub Pages) che fa solo da reindirizzamento — non contiene mai dati — verso l'indirizzo locale del telefono. `app.mjs`, quando si accorge di girare fuori dalla WebView nativa con quel codice nell'URL, usa un nuovo magazzino remoto al posto del Keystore diretto: stessa app, stesso codice, cambia solo dove vive lo storage.

**Tech Stack:** JavaScript (moduli ES puri, nessun bundler), Java (Capacitor 8/Android, NanoHTTPD per il server locale), HTML/CSS statico per la paginetta pubblica.

## Global Constraints

- Nessun server a pagamento, nessun relay cloud, nessuna dipendenza che richieda un bundler JS — moduli ES puri (spec, `HANDOFF.md` §1).
- Il computer resta "solo browser": zero installazioni.
- La cassaforte (mapping, chiavi, lavori) vive **solo** nel Keystore del telefono; il computer non ne tiene mai una copia propria — ogni lettura/scrittura passa dal telefono in tempo reale.
- Un accesso col token scaduto o sbagliato va sempre rifiutato esplicitamente, mai lasciato passare silenziosamente.
- Riusa `createDesktopSessions`/`pairingCode` già scritti in `src/domain/vault.mjs`/`src/domain/plan.mjs` — nessuna nuova regola di piano da inventare.
- Layout desktop in formato 16:9, costruito con la skill `frontend-design` — non l'interfaccia da telefono allargata, niente estetica generica da IA.
- Nessuna compilazione Gradle possibile in questo ambiente: il codice nativo va scritto completo e corretto, la verifica reale resta per il prossimo APK su una rete Wi-Fi vera.

---

### Task 1: `createRemoteStore` in vault.mjs

**Files:**
- Modify: `src/domain/vault.mjs`
- Test: `tests/domain.test.mjs`

**Interfaces:**
- Consumes: nulla di nuovo — stessa forma di `createSecureStore` già nel file (`{ secure, get(key), set(key,value), remove(key) }`).
- Produces: `createRemoteStore(token, { fetchImpl = fetch } = {})`. Ogni chiamata è una richiesta HTTP allo stesso host che ha servito la pagina (percorso relativo `/api/store/:key`, mai un indirizzo assoluto): `GET` per `get`, `PUT` con corpo `{ value }` per `set`, `DELETE` per `remove`. Intestazione `Authorization: Bearer <token>` su ogni richiesta. `get` restituisce `null` su una risposta 404, lancia un errore su qualunque altro stato non-ok (mai un valore vecchio o vuoto spacciato per una lettura riuscita). Il Task 4 (nativo) implementa il lato server che risponde a queste chiamate; il Task 3 (`app.mjs`) è il primo a usarla.

- [ ] **Step 1: Scrivi i test (falliscono: la funzione non esiste ancora)**

Apri `tests/domain.test.mjs`. Aggiungi l'import in cima, insieme agli altri import da `vault.mjs`:

```js
import { createVault, RETENTION, retentionLabel, clampRetention, createRemoteStore } from '../src/domain/vault.mjs';
```

Poi aggiungi questo blocco in fondo al file:

```js
/* ------------------------------------------------------------------ */
/* Ponte desktop: il magazzino remoto                                  */
/* ------------------------------------------------------------------ */

test('createRemoteStore legge un valore, col token nell\'intestazione', async () => {
  const chiamate = [];
  const fetchFinto = async (url, opts) => {
    chiamate.push({ url, opts });
    return { ok: true, status: 200, json: async () => ({ value: { ciao: 'mondo' } }) };
  };
  const store = createRemoteStore('TOKEN123', { fetchImpl: fetchFinto });
  const valore = await store.get('prefs');
  assert.deepEqual(valore, { ciao: 'mondo' });
  assert.equal(chiamate.length, 1);
  assert.equal(chiamate[0].url, '/api/store/prefs');
  assert.equal(chiamate[0].opts.headers.Authorization, 'Bearer TOKEN123');
});

test('createRemoteStore restituisce null su una chiave assente (404), non un errore', async () => {
  const fetchFinto = async () => ({ ok: false, status: 404 });
  const store = createRemoteStore('TOKEN123', { fetchImpl: fetchFinto });
  assert.equal(await store.get('assente'), null);
});

test('createRemoteStore scrive un valore, serializzato nel corpo della richiesta', async () => {
  const chiamate = [];
  const fetchFinto = async (url, opts) => { chiamate.push({ url, opts }); return { ok: true, status: 200 }; };
  const store = createRemoteStore('TOKEN123', { fetchImpl: fetchFinto });
  await store.set('jobs', [{ id: 1 }]);
  assert.equal(chiamate[0].url, '/api/store/jobs');
  assert.equal(chiamate[0].opts.method, 'PUT');
  assert.equal(chiamate[0].opts.headers.Authorization, 'Bearer TOKEN123');
  assert.deepEqual(JSON.parse(chiamate[0].opts.body), { value: [{ id: 1 }] });
});

test('createRemoteStore elimina una chiave', async () => {
  const chiamate = [];
  const fetchFinto = async (url, opts) => { chiamate.push({ url, opts }); return { ok: true, status: 200 }; };
  const store = createRemoteStore('TOKEN123', { fetchImpl: fetchFinto });
  await store.remove('jobs');
  assert.equal(chiamate[0].url, '/api/store/jobs');
  assert.equal(chiamate[0].opts.method, 'DELETE');
});

test('createRemoteStore lancia un errore su una risposta non-ok diversa da 404: mai dati vecchi in silenzio', async () => {
  const fetchFinto = async () => ({ ok: false, status: 401 });
  const store = createRemoteStore('TOKEN123', { fetchImpl: fetchFinto });
  await assert.rejects(() => store.get('prefs'), /bridge-store-error-401/);
});

test('createRemoteStore si dichiara secure, come il Keystore: la UI non deve trattarlo come un ripiego meno sicuro', () => {
  const store = createRemoteStore('TOKEN123', { fetchImpl: async () => ({ ok: true, status: 200 }) });
  assert.equal(store.secure, true);
});
```

- [ ] **Step 2: Esegui i test, verifica che falliscano**

Run: `node --test tests/domain.test.mjs`
Expected: FAIL — `createRemoteStore is not a function` (o import error).

- [ ] **Step 3: Scrivi `createRemoteStore`**

In `src/domain/vault.mjs`, subito dopo la chiusura della funzione `createSecureStore` (dopo la sua `}` di chiusura, prima della riga `/* ------------------------------------------------------------------ */` che introduce `createVault`), inserisci:

```js
/**
 * Magazzino per la modalità ponte: il computer non tiene mai una copia
 * della cassaforte, ogni lettura/scrittura è una richiesta al telefono in
 * tempo reale. Percorso relativo di proposito — la pagina è sempre servita
 * dallo stesso host a cui sta parlando (il telefono), mai un indirizzo
 * assoluto diverso.
 *
 * @param {string} token codice di sessione (lo stesso di pairingCode())
 * @param {{ fetchImpl?: typeof fetch }} [options]
 */
export function createRemoteStore(token, { fetchImpl = fetch } = {}) {
  const headers = { Authorization: `Bearer ${token}` };

  return {
    secure: true,

    async get(key) {
      const response = await fetchImpl(`/api/store/${encodeURIComponent(key)}`, { headers });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`bridge-store-error-${response.status}`);
      const body = await response.json();
      return body.value;
    },

    async set(key, value) {
      const response = await fetchImpl(`/api/store/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      if (!response.ok) throw new Error(`bridge-store-error-${response.status}`);
    },

    async remove(key) {
      const response = await fetchImpl(`/api/store/${encodeURIComponent(key)}`, { method: 'DELETE', headers });
      if (!response.ok && response.status !== 404) throw new Error(`bridge-store-error-${response.status}`);
    },
  };
}

```

- [ ] **Step 4: Esegui i test, verifica che passino**

Run: `node --test tests/domain.test.mjs`
Expected: PASS, tutti i test del file verdi (compresi i 6 nuovi).

- [ ] **Step 5: Commit**

```bash
git add src/domain/vault.mjs tests/domain.test.mjs
git commit -m "Aggiunge createRemoteStore per la modalità ponte desktop

Stessa forma di createSecureStore, ma ogni lettura/scrittura è una
richiesta al telefono con il codice di sessione nell'intestazione.
Nessuna cache locale: un errore che non sia 404 lancia sempre, mai un
dato vecchio spacciato per una lettura riuscita."
```

---

### Task 2: Vendorizza il generatore QR vero

**Files:**
- Create: `vendor/qrcode.mjs`
- Create: `vendor/QRCODE-LICENSE.txt`
- Create: `src/domain/qr.mjs`
- Test: `tests/domain.test.mjs`

**Interfaces:**
- Consumes: nulla.
- Produces: `renderQrSvg(text)` da `src/domain/qr.mjs`, restituisce una stringa `<svg>...</svg>` completa e scansionabile. Il Task 5 (schermata "Collega al computer") la userà per mostrare il QR vero.

**Nota per chi implementa:** `src/app.mjs` contiene già una funzione `drawQr()` che il suo stesso commento dichiara "disegnata a mano" e puramente decorativa (usata oggi solo nella schermata piani) — non va toccata né riusata: qui serve un QR vero, che una fotocamera possa davvero leggere.

- [ ] **Step 1: Crea `vendor/qrcode.mjs`**

Contenuto esatto (verificato dalla fonte originale, `kazuhikoarase/qrcode-generator`, ramo `master`, file `js/dist/qrcode.mjs` — libreria MIT, nessuna dipendenza, già in formato modulo ES):

```js
//---------------------------------------------------------------------
//
// QR Code Generator for JavaScript
//
// Copyright (c) 2009 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
// http://www.opensource.org/licenses/mit-license.php
//
// The word 'QR Code' is registered trademark of
// DENSO WAVE INCORPORATED
// http://www.denso-wave.com/qrcode/faqpatent-e.html
//
//---------------------------------------------------------------------

//---------------------------------------------------------------------
// qrcode
//---------------------------------------------------------------------

/**
* qrcode
* @param typeNumber 1 to 40
* @param errorCorrectionLevel 'L','M','Q','H'
*/
export const qrcode = function(typeNumber, errorCorrectionLevel) {

const PAD0 = 0xEC;
const PAD1 = 0x11;

let _typeNumber = typeNumber;
const _errorCorrectionLevel = QRErrorCorrectionLevel[errorCorrectionLevel];
let _modules = null;
let _moduleCount = 0;
let _dataCache = null;
const _dataList = [];

const _this = {};

const makeImpl = function(test, maskPattern) {

_moduleCount = _typeNumber * 4 + 17;
_modules = function(moduleCount) {
const modules = new Array(moduleCount);
for (let row = 0; row < moduleCount; row += 1) {
modules[row] = new Array(moduleCount);
for (let col = 0; col < moduleCount; col += 1) {
modules[row][col] = null;
}
}
return modules;
}(_moduleCount);

setupPositionProbePattern(0, 0);
setupPositionProbePattern(_moduleCount - 7, 0);
setupPositionProbePattern(0, _moduleCount - 7);
setupPositionAdjustPattern();
setupTimingPattern();
setupTypeInfo(test, maskPattern);

if (_typeNumber >= 7) {
setupTypeNumber(test);
}

if (_dataCache == null) {
_dataCache = createData(_typeNumber, _errorCorrectionLevel, _dataList);
}

mapData(_dataCache, maskPattern);
};

const setupPositionProbePattern = function(row, col) {

for (let r = -1; r <= 7; r += 1) {

if (row + r <= -1 || _moduleCount <= row + r) continue;

for (let c = -1; c <= 7; c += 1) {

if (col + c <= -1 || _moduleCount <= col + c) continue;

if ( (0 <= r && r <= 6 && (c == 0 || c == 6) )
|| (0 <= c && c <= 6 && (r == 0 || r == 6) )
|| (2 <= r && r <= 4 && 2 <= c && c <= 4) ) {
_modules[row + r][col + c] = true;
} else {
_modules[row + r][col + c] = false;
}
}
}
};

const getBestMaskPattern = function() {

let minLostPoint = 0;
let pattern = 0;

for (let i = 0; i < 8; i += 1) {

makeImpl(true, i);

const lostPoint = QRUtil.getLostPoint(_this);

if (i == 0 || minLostPoint > lostPoint) {
minLostPoint = lostPoint;
pattern = i;
}
}

return pattern;
};

const setupTimingPattern = function() {

for (let r = 8; r < _moduleCount - 8; r += 1) {
if (_modules[r][6] != null) {
continue;
}
_modules[r][6] = (r % 2 == 0);
}

for (let c = 8; c < _moduleCount - 8; c += 1) {
if (_modules[6][c] != null) {
continue;
}
_modules[6][c] = (c % 2 == 0);
}
};

const setupPositionAdjustPattern = function() {

const pos = QRUtil.getPatternPosition(_typeNumber);

for (let i = 0; i < pos.length; i += 1) {

for (let j = 0; j < pos.length; j += 1) {

const row = pos[i];
const col = pos[j];

if (_modules[row][col] != null) {
continue;
}

for (let r = -2; r <= 2; r += 1) {

for (let c = -2; c <= 2; c += 1) {

if (r == -2 || r == 2 || c == -2 || c == 2
|| (r == 0 && c == 0) ) {
_modules[row + r][col + c] = true;
} else {
_modules[row + r][col + c] = false;
}
}
}
}
}
};

const setupTypeNumber = function(test) {

const bits = QRUtil.getBCHTypeNumber(_typeNumber);

for (let i = 0; i < 18; i += 1) {
const mod = (!test && ( (bits >> i) & 1) == 1);
_modules[Math.floor(i / 3)][i % 3 + _moduleCount - 8 - 3] = mod;
}

for (let i = 0; i < 18; i += 1) {
const mod = (!test && ( (bits >> i) & 1) == 1);
_modules[i % 3 + _moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
}
};

const setupTypeInfo = function(test, maskPattern) {

const data = (_errorCorrectionLevel << 3) | maskPattern;
const bits = QRUtil.getBCHTypeInfo(data);

// vertical
for (let i = 0; i < 15; i += 1) {

const mod = (!test && ( (bits >> i) & 1) == 1);

if (i < 6) {
_modules[i][8] = mod;
} else if (i < 8) {
_modules[i + 1][8] = mod;
} else {
_modules[_moduleCount - 15 + i][8] = mod;
}
}

// horizontal
for (let i = 0; i < 15; i += 1) {

const mod = (!test && ( (bits >> i) & 1) == 1);

if (i < 8) {
_modules[8][_moduleCount - i - 1] = mod;
} else if (i < 9) {
_modules[8][15 - i - 1 + 1] = mod;
} else {
_modules[8][15 - i - 1] = mod;
}
}

// fixed module
_modules[_moduleCount - 8][8] = (!test);
};

const mapData = function(data, maskPattern) {

let inc = -1;
let row = _moduleCount - 1;
let bitIndex = 7;
let byteIndex = 0;
const maskFunc = QRUtil.getMaskFunction(maskPattern);

for (let col = _moduleCount - 1; col > 0; col -= 2) {

if (col == 6) col -= 1;

while (true) {

for (let c = 0; c < 2; c += 1) {

if (_modules[row][col - c] == null) {

let dark = false;

if (byteIndex < data.length) {
dark = ( ( (data[byteIndex] >>> bitIndex) & 1) == 1);
}

const mask = maskFunc(row, col - c);

if (mask) {
dark = !dark;
}

_modules[row][col - c] = dark;
bitIndex -= 1;

if (bitIndex == -1) {
byteIndex += 1;
bitIndex = 7;
}
}
}

row += inc;

if (row < 0 || _moduleCount <= row) {
row -= inc;
inc = -inc;
break;
}
}
}
};

const createBytes = function(buffer, rsBlocks) {

let offset = 0;

let maxDcCount = 0;
let maxEcCount = 0;

const dcdata = new Array(rsBlocks.length);
const ecdata = new Array(rsBlocks.length);

for (let r = 0; r < rsBlocks.length; r += 1) {

const dcCount = rsBlocks[r].dataCount;
const ecCount = rsBlocks[r].totalCount - dcCount;

maxDcCount = Math.max(maxDcCount, dcCount);
maxEcCount = Math.max(maxEcCount, ecCount);

dcdata[r] = new Array(dcCount);

for (let i = 0; i < dcdata[r].length; i += 1) {
dcdata[r][i] = 0xff & buffer.getBuffer()[i + offset];
}
offset += dcCount;

const rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
const rawPoly = qrPolynomial(dcdata[r], rsPoly.getLength() - 1);

const modPoly = rawPoly.mod(rsPoly);
ecdata[r] = new Array(rsPoly.getLength() - 1);
for (let i = 0; i < ecdata[r].length; i += 1) {
const modIndex = i + modPoly.getLength() - ecdata[r].length;
ecdata[r][i] = (modIndex >= 0)? modPoly.getAt(modIndex) : 0;
}
}

let totalCodeCount = 0;
for (let i = 0; i < rsBlocks.length; i += 1) {
totalCodeCount += rsBlocks[i].totalCount;
}

const data = new Array(totalCodeCount);
let index = 0;

for (let i = 0; i < maxDcCount; i += 1) {
for (let r = 0; r < rsBlocks.length; r += 1) {
if (i < dcdata[r].length) {
data[index] = dcdata[r][i];
index += 1;
}
}
}

for (let i = 0; i < maxEcCount; i += 1) {
for (let r = 0; r < rsBlocks.length; r += 1) {
if (i < ecdata[r].length) {
data[index] = ecdata[r][i];
index += 1;
}
}
}

return data;
};

const createData = function(typeNumber, errorCorrectionLevel, dataList) {

const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectionLevel);

const buffer = qrBitBuffer();

for (let i = 0; i < dataList.length; i += 1) {
const data = dataList[i];
buffer.put(data.getMode(), 4);
buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber) );
data.write(buffer);
}

// calc num max data.
let totalDataCount = 0;
for (let i = 0; i < rsBlocks.length; i += 1) {
totalDataCount += rsBlocks[i].dataCount;
}

if (buffer.getLengthInBits() > totalDataCount * 8) {
throw 'code length overflow. ('
+ buffer.getLengthInBits()
+ '>'
+ totalDataCount * 8
+ ')';
}

// end code
if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
buffer.put(0, 4);
}

// padding
while (buffer.getLengthInBits() % 8 != 0) {
buffer.putBit(false);
}

// padding
while (true) {

if (buffer.getLengthInBits() >= totalDataCount * 8) {
break;
}
buffer.put(PAD0, 8);

if (buffer.getLengthInBits() >= totalDataCount * 8) {
break;
}
buffer.put(PAD1, 8);
}

return createBytes(buffer, rsBlocks);
};

_this.addData = function(data, mode) {

mode = mode || 'Byte';

let newData = null;

switch(mode) {
case 'Numeric' :
newData = qrNumber(data);
break;
case 'Alphanumeric' :
newData = qrAlphaNum(data);
break;
case 'Byte' :
newData = qr8BitByte(data);
break;
case 'Kanji' :
newData = qrKanji(data);
break;
default :
throw 'mode:' + mode;
}

_dataList.push(newData);
_dataCache = null;
};

_this.isDark = function(row, col) {
if (row < 0 || _moduleCount <= row || col < 0 || _moduleCount <= col) {
throw row + ',' + col;
}
return _modules[row][col];
};

_this.getModuleCount = function() {
return _moduleCount;
};

_this.make = function() {
if (_typeNumber < 1) {
let typeNumber = 1;

for (; typeNumber < 40; typeNumber++) {
const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, _errorCorrectionLevel);
const buffer = qrBitBuffer();

for (let i = 0; i < _dataList.length; i++) {
const data = _dataList[i];
buffer.put(data.getMode(), 4);
buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber) );
data.write(buffer);
}

let totalDataCount = 0;
for (let i = 0; i < rsBlocks.length; i++) {
totalDataCount += rsBlocks[i].dataCount;
}

if (buffer.getLengthInBits() <= totalDataCount * 8) {
break;
}
}

_typeNumber = typeNumber;
}

makeImpl(false, getBestMaskPattern() );
};

_this.createTableTag = function(cellSize, margin) {

cellSize = cellSize || 2;
margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

let qrHtml = '';

qrHtml += '<table style="';
qrHtml += ' border-width: 0px; border-style: none;';
qrHtml += ' border-collapse: collapse;';
qrHtml += ' padding: 0px; margin: ' + margin + 'px;';
qrHtml += '">';
qrHtml += '<tbody>';

for (let r = 0; r < _this.getModuleCount(); r += 1) {

qrHtml += '<tr>';

for (let c = 0; c < _this.getModuleCount(); c += 1) {
qrHtml += '<td style="';
qrHtml += ' border-width: 0px; border-style: none;';
qrHtml += ' border-collapse: collapse;';
qrHtml += ' padding: 0px; margin: 0px;';
qrHtml += ' width: ' + cellSize + 'px;';
qrHtml += ' height: ' + cellSize + 'px;';
qrHtml += ' background-color: ';
qrHtml += _this.isDark(r, c)? '#000000' : '#ffffff';
qrHtml += ';';
qrHtml += '"/>';
}

qrHtml += '</tr>';
}

qrHtml += '</tbody>';
qrHtml += '</table>';

return qrHtml;
};

_this.createSvgTag = function(cellSize, margin, alt, title) {

let opts = {};
if (typeof arguments[0] == 'object') {
// Called by options.
opts = arguments[0];
// overwrite cellSize and margin.
cellSize = opts.cellSize;
margin = opts.margin;
alt = opts.alt;
title = opts.title;
}

cellSize = cellSize || 2;
margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

// Compose alt property surrogate
alt = (typeof alt === 'string') ? {text: alt} : alt || {};
alt.text = alt.text || null;
alt.id = (alt.text) ? alt.id || 'qrcode-description' : null;

// Compose title property surrogate
title = (typeof title === 'string') ? {text: title} : title || {};
title.text = title.text || null;
title.id = (title.text) ? title.id || 'qrcode-title' : null;

const size = _this.getModuleCount() * cellSize + margin * 2;
let c, mc, r, mr, qrSvg='', rect;

rect = 'l' + cellSize + ',0 0,' + cellSize +
' -' + cellSize + ',0 0,-' + cellSize + 'z ';

qrSvg += '<svg version="1.1" xmlns="http://www.w3.org/2000/svg"';
qrSvg += !opts.scalable ? ' width="' + size + 'px" height="' + size + 'px"' : '';
qrSvg += ' viewBox="0 0 ' + size + ' ' + size + '" ';
qrSvg += ' preserveAspectRatio="xMinYMin meet"';
qrSvg += (title.text || alt.text) ? ' role="img" aria-labelledby="' +
escapeXml([title.id, alt.id].join(' ').trim() ) + '"' : '';
qrSvg += '>';
qrSvg += (title.text) ? '<title id="' + escapeXml(title.id) + '">' +
escapeXml(title.text) + '</title>' : '';
qrSvg += (alt.text) ? '<description id="' + escapeXml(alt.id) + '">' +
escapeXml(alt.text) + '</description>' : '';
qrSvg += '<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>';
qrSvg += '<path d="';

for (r = 0; r < _this.getModuleCount(); r += 1) {
mr = r * cellSize + margin;
for (c = 0; c < _this.getModuleCount(); c += 1) {
if (_this.isDark(r, c) ) {
mc = c*cellSize+margin;
qrSvg += 'M' + mc + ',' + mr + rect;
}
}
}

qrSvg += '" stroke="transparent" fill="black"/>';
qrSvg += '</svg>';

return qrSvg;
};

_this.createDataURL = function(cellSize, margin) {

cellSize = cellSize || 2;
margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

const size = _this.getModuleCount() * cellSize + margin * 2;
const min = margin;
const max = size - margin;

return createDataURL(size, size, function(x, y) {
if (min <= x && x < max && min <= y && y < max) {
const c = Math.floor( (x - min) / cellSize);
const r = Math.floor( (y - min) / cellSize);
return _this.isDark(r, c)? 0 : 1;
} else {
return 1;
}
} );
};

_this.createImgTag = function(cellSize, margin, alt) {

cellSize = cellSize || 2;
margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

const size = _this.getModuleCount() * cellSize + margin * 2;

let img = '';
img += '<img';
img += ' src="';
img += _this.createDataURL(cellSize, margin);
img += '"';
img += ' width="';
img += size;
img += '"';
img += ' height="';
img += size;
img += '"';
if (alt) {
img += ' alt="';
img += escapeXml(alt);
img += '"';
}
img += '/>';

return img;
};

const escapeXml = function(s) {
let escaped = '';
for (let i = 0; i < s.length; i += 1) {
const c = s.charAt(i);
switch(c) {
case '<': escaped += '&lt;'; break;
case '>': escaped += '&gt;'; break;
case '&': escaped += '&amp;'; break;
case '"': escaped += '&quot;'; break;
default : escaped += c; break;
}
}
return escaped;
};

const _createHalfASCII = function(margin) {
const cellSize = 1;
margin = (typeof margin == 'undefined')? cellSize * 2 : margin;

const size = _this.getModuleCount() * cellSize + margin * 2;
const min = margin;
const max = size - margin;

let y, x, r1, r2, p;

const blocks = {
'██': '█',
'█ ': '▀',
' █': '▄',
' ': ' '
};

const blocksLastLineNoMargin = {
'██': '▀',
'█ ': '▀',
' █': ' ',
' ': ' '
};

let ascii = '';
for (y = 0; y < size; y += 2) {
r1 = Math.floor((y - min) / cellSize);
r2 = Math.floor((y + 1 - min) / cellSize);
for (x = 0; x < size; x += 1) {
p = '█';

if (min <= x && x < max && min <= y && y < max && _this.isDark(r1, Math.floor((x - min) / cellSize))) {
p = ' ';
}

if (min <= x && x < max && min <= y+1 && y+1 < max && _this.isDark(r2, Math.floor((x - min) / cellSize))) {
p += ' ';
}
else {
p += '█';
}

// Output 2 characters per pixel, to create full square. 1 character per pixels gives only half width of square.
ascii += (margin < 1 && y+1 >= max) ? blocksLastLineNoMargin[p] : blocks[p];
}

ascii += '\n';
}

if (size % 2 && margin > 0) {
return ascii.substring(0, ascii.length - size - 1) + Array(size+1).join('▀');
}

return ascii.substring(0, ascii.length-1);
};

_this.createASCII = function(cellSize, margin) {
cellSize = cellSize || 1;

if (cellSize < 2) {
return _createHalfASCII(margin);
}

cellSize -= 1;
margin = (typeof margin == 'undefined')? cellSize * 2 : margin;

const size = _this.getModuleCount() * cellSize + margin * 2;
const min = margin;
const max = size - margin;

let y, x, r, p;

const white = Array(cellSize+1).join('██');
const black = Array(cellSize+1).join(' ');

let ascii = '';
let line = '';
for (y = 0; y < size; y += 1) {
r = Math.floor( (y - min) / cellSize);
line = '';
for (x = 0; x < size; x += 1) {
p = 1;

if (min <= x && x < max && min <= y && y < max && _this.isDark(r, Math.floor((x - min) / cellSize))) {
p = 0;
}

// Output 2 characters per pixel, to create full square. 1 character per pixels gives only half width of square.
line += p ? white : black;
}

for (r = 0; r < cellSize; r += 1) {
ascii += line + '\n';
}
}

return ascii.substring(0, ascii.length-1);
};

_this.renderTo2dContext = function(context, cellSize) {
cellSize = cellSize || 2;
const length = _this.getModuleCount();
for (let row = 0; row < length; row++) {
for (let col = 0; col < length; col++) {
context.fillStyle = _this.isDark(row, col) ? 'black' : 'white';
context.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
}
}
}

return _this;
};

//---------------------------------------------------------------------
// qrcode.stringToBytes
//---------------------------------------------------------------------

qrcode.stringToBytes = function(s) {
const bytes = [];
for (let i = 0; i < s.length; i += 1) {
const c = s.charCodeAt(i);
bytes.push(c & 0xff);
}
return bytes;
};

//---------------------------------------------------------------------
// qrcode.createStringToBytes
//---------------------------------------------------------------------

/**
* @param unicodeData base64 string of byte array.
* [16bit Unicode],[16bit Bytes], ...
* @param numChars
*/
qrcode.createStringToBytes = function(unicodeData, numChars) {

// create conversion map.

const unicodeMap = function() {

const bin = base64DecodeInputStream(unicodeData);
const read = function() {
const b = bin.read();
if (b == -1) throw 'eof';
return b;
};

let count = 0;
const unicodeMap = {};
while (true) {
const b0 = bin.read();
if (b0 == -1) break;
const b1 = read();
const b2 = read();
const b3 = read();
const k = String.fromCharCode( (b0 << 8) | b1);
const v = (b2 << 8) | b3;
unicodeMap[k] = v;
count += 1;
}
if (count != numChars) {
throw count + ' != ' + numChars;
}

return unicodeMap;
}();

const unknownChar = '?'.charCodeAt(0);

return function(s) {
const bytes = [];
for (let i = 0; i < s.length; i += 1) {
const c = s.charCodeAt(i);
if (c < 128) {
bytes.push(c);
} else {
const b = unicodeMap[s.charAt(i)];
if (typeof b == 'number') {
if ( (b & 0xff) == b) {
// 1byte
bytes.push(b);
} else {
// 2bytes
bytes.push(b >>> 8);
bytes.push(b & 0xff);
}
} else {
bytes.push(unknownChar);
}
}
}
return bytes;
};
};

//---------------------------------------------------------------------
// QRMode
//---------------------------------------------------------------------

const QRMode = {
MODE_NUMBER : 1 << 0,
MODE_ALPHA_NUM : 1 << 1,
MODE_8BIT_BYTE : 1 << 2,
MODE_KANJI : 1 << 3
};

//---------------------------------------------------------------------
// QRErrorCorrectionLevel
//---------------------------------------------------------------------

const QRErrorCorrectionLevel = {
L : 1,
M : 0,
Q : 3,
H : 2
};

//---------------------------------------------------------------------
// QRMaskPattern
//---------------------------------------------------------------------

const QRMaskPattern = {
PATTERN000 : 0,
PATTERN001 : 1,
PATTERN010 : 2,
PATTERN011 : 3,
PATTERN100 : 4,
PATTERN101 : 5,
PATTERN110 : 6,
PATTERN111 : 7
};

//---------------------------------------------------------------------
// QRUtil
//---------------------------------------------------------------------

const QRUtil = function() {

const PATTERN_POSITION_TABLE = [
[],
[6, 18],
[6, 22],
[6, 26],
[6, 30],
[6, 34],
[6, 22, 38],
[6, 24, 42],
[6, 26, 46],
[6, 28, 50],
[6, 30, 54],
[6, 32, 58],
[6, 34, 62],
[6, 26, 46, 66],
[6, 26, 48, 70],
[6, 26, 50, 74],
[6, 30, 54, 78],
[6, 30, 56, 82],
[6, 30, 58, 86],
[6, 34, 62, 90],
[6, 28, 50, 72, 94],
[6, 26, 50, 74, 98],
[6, 30, 54, 78, 102],
[6, 28, 54, 80, 106],
[6, 32, 58, 84, 110],
[6, 30, 58, 86, 114],
[6, 34, 62, 90, 118],
[6, 26, 50, 74, 98, 122],
[6, 30, 54, 78, 102, 126],
[6, 26, 52, 78, 104, 130],
[6, 30, 56, 82, 108, 134],
[6, 34, 60, 86, 112, 138],
[6, 30, 58, 86, 114, 142],
[6, 34, 62, 90, 118, 146],
[6, 30, 54, 78, 102, 126, 150],
[6, 24, 50, 76, 102, 128, 154],
[6, 28, 54, 80, 106, 132, 158],
[6, 32, 58, 84, 110, 136, 162],
[6, 26, 54, 82, 110, 138, 166],
[6, 30, 58, 86, 114, 142, 170]
];
const G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0);
const G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0);
const G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);

const _this = {};

const getBCHDigit = function(data) {
let digit = 0;
while (data != 0) {
digit += 1;
data >>>= 1;
}
return digit;
};

_this.getBCHTypeInfo = function(data) {
let d = data << 10;
while (getBCHDigit(d) - getBCHDigit(G15) >= 0) {
d ^= (G15 << (getBCHDigit(d) - getBCHDigit(G15) ) );
}
return ( (data << 10) | d) ^ G15_MASK;
};

_this.getBCHTypeNumber = function(data) {
let d = data << 12;
while (getBCHDigit(d) - getBCHDigit(G18) >= 0) {
d ^= (G18 << (getBCHDigit(d) - getBCHDigit(G18) ) );
}
return (data << 12) | d;
};

_this.getPatternPosition = function(typeNumber) {
return PATTERN_POSITION_TABLE[typeNumber - 1];
};

_this.getMaskFunction = function(maskPattern) {

switch (maskPattern) {

case QRMaskPattern.PATTERN000 :
return function(i, j) { return (i + j) % 2 == 0; };
case QRMaskPattern.PATTERN001 :
return function(i, j) { return i % 2 == 0; };
case QRMaskPattern.PATTERN010 :
return function(i, j) { return j % 3 == 0; };
case QRMaskPattern.PATTERN011 :
return function(i, j) { return (i + j) % 3 == 0; };
case QRMaskPattern.PATTERN100 :
return function(i, j) { return (Math.floor(i / 2) + Math.floor(j / 3) ) % 2 == 0; };
case QRMaskPattern.PATTERN101 :
return function(i, j) { return (i * j) % 2 + (i * j) % 3 == 0; };
case QRMaskPattern.PATTERN110 :
return function(i, j) { return ( (i * j) % 2 + (i * j) % 3) % 2 == 0; };
case QRMaskPattern.PATTERN111 :
return function(i, j) { return ( (i * j) % 3 + (i + j) % 2) % 2 == 0; };

default :
throw 'bad maskPattern:' + maskPattern;
}
};

_this.getErrorCorrectPolynomial = function(errorCorrectLength) {
let a = qrPolynomial([1], 0);
for (let i = 0; i < errorCorrectLength; i += 1) {
a = a.multiply(qrPolynomial([1, QRMath.gexp(i)], 0) );
}
return a;
};

_this.getLengthInBits = function(mode, type) {

if (1 <= type && type < 10) {

// 1 - 9

switch(mode) {
case QRMode.MODE_NUMBER : return 10;
case QRMode.MODE_ALPHA_NUM : return 9;
case QRMode.MODE_8BIT_BYTE : return 8;
case QRMode.MODE_KANJI : return 8;
default :
throw 'mode:' + mode;
}

} else if (type < 27) {

// 10 - 26

switch(mode) {
case QRMode.MODE_NUMBER : return 12;
case QRMode.MODE_ALPHA_NUM : return 11;
case QRMode.MODE_8BIT_BYTE : return 16;
case QRMode.MODE_KANJI : return 10;
default :
throw 'mode:' + mode;
}

} else if (type < 41) {

// 27 - 40

switch(mode) {
case QRMode.MODE_NUMBER : return 14;
case QRMode.MODE_ALPHA_NUM : return 13;
case QRMode.MODE_8BIT_BYTE : return 16;
case QRMode.MODE_KANJI : return 12;
default :
throw 'mode:' + mode;
}

} else {
throw 'type:' + type;
}
};

_this.getLostPoint = function(qrcode) {

const moduleCount = qrcode.getModuleCount();

let lostPoint = 0;

// LEVEL1

for (let row = 0; row < moduleCount; row += 1) {
for (let col = 0; col < moduleCount; col += 1) {

let sameCount = 0;
const dark = qrcode.isDark(row, col);

for (let r = -1; r <= 1; r += 1) {

if (row + r < 0 || moduleCount <= row + r) {
continue;
}

for (let c = -1; c <= 1; c += 1) {

if (col + c < 0 || moduleCount <= col + c) {
continue;
}

if (r == 0 && c == 0) {
continue;
}

if (dark == qrcode.isDark(row + r, col + c) ) {
sameCount += 1;
}
}
}

if (sameCount > 5) {
lostPoint += (3 + sameCount - 5);
}
}
};

// LEVEL2

for (let row = 0; row < moduleCount - 1; row += 1) {
for (let col = 0; col < moduleCount - 1; col += 1) {
let count = 0;
if (qrcode.isDark(row, col) ) count += 1;
if (qrcode.isDark(row + 1, col) ) count += 1;
if (qrcode.isDark(row, col + 1) ) count += 1;
if (qrcode.isDark(row + 1, col + 1) ) count += 1;
if (count == 0 || count == 4) {
lostPoint += 3;
}
}
}

// LEVEL3

for (let row = 0; row < moduleCount; row += 1) {
for (let col = 0; col < moduleCount - 6; col += 1) {
if (qrcode.isDark(row, col)
&& !qrcode.isDark(row, col + 1)
&& qrcode.isDark(row, col + 2)
&& qrcode.isDark(row, col + 3)
&& qrcode.isDark(row, col + 4)
&& !qrcode.isDark(row, col + 5)
&& qrcode.isDark(row, col + 6) ) {
lostPoint += 40;
}
}
}

for (let col = 0; col < moduleCount; col += 1) {
for (let row = 0; row < moduleCount - 6; row += 1) {
if (qrcode.isDark(row, col)
&& !qrcode.isDark(row + 1, col)
&& qrcode.isDark(row + 2, col)
&& qrcode.isDark(row + 3, col)
&& qrcode.isDark(row + 4, col)
&& !qrcode.isDark(row + 5, col)
&& qrcode.isDark(row + 6, col) ) {
lostPoint += 40;
}
}
}

// LEVEL4

let darkCount = 0;

for (let col = 0; col < moduleCount; col += 1) {
for (let row = 0; row < moduleCount; row += 1) {
if (qrcode.isDark(row, col) ) {
darkCount += 1;
}
}
}

const ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
lostPoint += ratio * 10;

return lostPoint;
};

return _this;
}();

//---------------------------------------------------------------------
// QRMath
//---------------------------------------------------------------------

const QRMath = function() {

const EXP_TABLE = new Array(256);
const LOG_TABLE = new Array(256);

// initialize tables
for (let i = 0; i < 8; i += 1) {
EXP_TABLE[i] = 1 << i;
}
for (let i = 8; i < 256; i += 1) {
EXP_TABLE[i] = EXP_TABLE[i - 4]
^ EXP_TABLE[i - 5]
^ EXP_TABLE[i - 6]
^ EXP_TABLE[i - 8];
}
for (let i = 0; i < 255; i += 1) {
LOG_TABLE[EXP_TABLE[i] ] = i;
}

const _this = {};

_this.glog = function(n) {

if (n < 1) {
throw 'glog(' + n + ')';
}

return LOG_TABLE[n];
};

_this.gexp = function(n) {

while (n < 0) {
n += 255;
}

while (n >= 256) {
n -= 255;
}

return EXP_TABLE[n];
};

return _this;
}();

//---------------------------------------------------------------------
// qrPolynomial
//---------------------------------------------------------------------

const qrPolynomial = function(num, shift) {

if (typeof num.length == 'undefined') {
throw num.length + '/' + shift;
}

const _num = function() {
let offset = 0;
while (offset < num.length && num[offset] == 0) {
offset += 1;
}
const _num = new Array(num.length - offset + shift);
for (let i = 0; i < num.length - offset; i += 1) {
_num[i] = num[i + offset];
}
return _num;
}();

const _this = {};

_this.getAt = function(index) {
return _num[index];
};

_this.getLength = function() {
return _num.length;
};

_this.multiply = function(e) {

const num = new Array(_this.getLength() + e.getLength() - 1);

for (let i = 0; i < _this.getLength(); i += 1) {
for (let j = 0; j < e.getLength(); j += 1) {
num[i + j] ^= QRMath.gexp(QRMath.glog(_this.getAt(i) ) + QRMath.glog(e.getAt(j) ) );
}
}

return qrPolynomial(num, 0);
};

_this.mod = function(e) {

if (_this.getLength() - e.getLength() < 0) {
return _this;
}

const ratio = QRMath.glog(_this.getAt(0) ) - QRMath.glog(e.getAt(0) );

const num = new Array(_this.getLength() );
for (let i = 0; i < _this.getLength(); i += 1) {
num[i] = _this.getAt(i);
}

for (let i = 0; i < e.getLength(); i += 1) {
num[i] ^= QRMath.gexp(QRMath.glog(e.getAt(i) ) + ratio);
}

// recursive call
return qrPolynomial(num, 0).mod(e);
};

return _this;
};

//---------------------------------------------------------------------
// QRRSBlock
//---------------------------------------------------------------------

const QRRSBlock = function() {

const RS_BLOCK_TABLE = [

// L
// M
// Q
// H

// 1
[1, 26, 19],
[1, 26, 16],
[1, 26, 13],
[1, 26, 9],

// 2
[1, 44, 34],
[1, 44, 28],
[1, 44, 22],
[1, 44, 16],

// 3
[1, 70, 55],
[1, 70, 44],
[2, 35, 17],
[2, 35, 13],

// 4
[1, 100, 80],
[2, 50, 32],
[2, 50, 24],
[4, 25, 9],

// 5
[1, 134, 108],
[2, 67, 43],
[2, 33, 15, 2, 34, 16],
[2, 33, 11, 2, 34, 12],

// 6
[2, 86, 68],
[4, 43, 27],
[4, 43, 19],
[4, 43, 15],

// 7
[2, 98, 78],
[4, 49, 31],
[2, 32, 14, 4, 33, 15],
[4, 39, 13, 1, 40, 14],

// 8
[2, 121, 97],
[2, 60, 38, 2, 61, 39],
[4, 40, 18, 2, 41, 19],
[4, 40, 14, 2, 41, 15],

// 9
[2, 146, 116],
[3, 58, 36, 2, 59, 37],
[4, 36, 16, 4, 37, 17],
[4, 36, 12, 4, 37, 13],

// 10
[2, 86, 68, 2, 87, 69],
[4, 69, 43, 1, 70, 44],
[6, 43, 19, 2, 44, 20],
[6, 43, 15, 2, 44, 16],

// 11
[4, 101, 81],
[1, 80, 50, 4, 81, 51],
[4, 50, 22, 4, 51, 23],
[3, 36, 12, 8, 37, 13],

// 12
[2, 116, 92, 2, 117, 93],
[6, 58, 36, 2, 59, 37],
[4, 46, 20, 6, 47, 21],
[7, 42, 14, 4, 43, 15],

// 13
[4, 133, 107],
[8, 59, 37, 1, 60, 38],
[8, 44, 20, 4, 45, 21],
[12, 33, 11, 4, 34, 12],

// 14
[3, 145, 115, 1, 146, 116],
[4, 64, 40, 5, 65, 41],
[11, 36, 16, 5, 37, 17],
[11, 36, 12, 5, 37, 13],

// 15
[5, 109, 87, 1, 110, 88],
[5, 65, 41, 5, 66, 42],
[5, 54, 24, 7, 55, 25],
[11, 36, 12, 7, 37, 13],

// 16
[5, 122, 98, 1, 123, 99],
[7, 73, 45, 3, 74, 46],
[15, 43, 19, 2, 44, 20],
[3, 45, 15, 13, 46, 16],

// 17
[1, 135, 107, 5, 136, 108],
[10, 74, 46, 1, 75, 47],
[1, 50, 22, 15, 51, 23],
[2, 42, 14, 17, 43, 15],

// 18
[5, 150, 120, 1, 151, 121],
[9, 69, 43, 4, 70, 44],
[17, 50, 22, 1, 51, 23],
[2, 42, 14, 19, 43, 15],

// 19
[3, 141, 113, 4, 142, 114],
[3, 70, 44, 11, 71, 45],
[17, 47, 21, 4, 48, 22],
[9, 39, 13, 16, 40, 14],

// 20
[3, 135, 107, 5, 136, 108],
[3, 67, 41, 13, 68, 42],
[15, 54, 24, 5, 55, 25],
[15, 43, 15, 10, 44, 16],

// 21
[4, 144, 116, 4, 145, 117],
[17, 68, 42],
[17, 50, 22, 6, 51, 23],
[19, 46, 16, 6, 47, 17],

// 22
[2, 139, 111, 7, 140, 112],
[17, 74, 46],
[7, 54, 24, 16, 55, 25],
[34, 37, 13],

// 23
[4, 151, 121, 5, 152, 122],
[4, 75, 47, 14, 76, 48],
[11, 54, 24, 14, 55, 25],
[16, 45, 15, 14, 46, 16],

// 24
[6, 147, 117, 4, 148, 118],
[6, 73, 45, 14, 74, 46],
[11, 54, 24, 16, 55, 25],
[30, 46, 16, 2, 47, 17],

// 25
[8, 132, 106, 4, 133, 107],
[8, 75, 47, 13, 76, 48],
[7, 54, 24, 22, 55, 25],
[22, 45, 15, 13, 46, 16],

// 26
[10, 142, 114, 2, 143, 115],
[19, 74, 46, 4, 75, 47],
[28, 50, 22, 6, 51, 23],
[33, 46, 16, 4, 47, 17],

// 27
[8, 152, 122, 4, 153, 123],
[22, 73, 45, 3, 74, 46],
[8, 53, 23, 26, 54, 24],
[12, 45, 15, 28, 46, 16],

// 28
[3, 147, 117, 10, 148, 118],
[3, 73, 45, 23, 74, 46],
[4, 54, 24, 31, 55, 25],
[11, 45, 15, 31, 46, 16],

// 29
[7, 146, 116, 7, 147, 117],
[21, 73, 45, 7, 74, 46],
[1, 53, 23, 37, 54, 24],
[19, 45, 15, 26, 46, 16],

// 30
[5, 145, 115, 10, 146, 116],
[19, 75, 47, 10, 76, 48],
[15, 54, 24, 25, 55, 25],
[23, 45, 15, 25, 46, 16],

// 31
[13, 145, 115, 3, 146, 116],
[2, 74, 46, 29, 75, 47],
[42, 54, 24, 1, 55, 25],
[23, 45, 15, 28, 46, 16],

// 32
[17, 145, 115],
[10, 74, 46, 23, 75, 47],
[10, 54, 24, 35, 55, 25],
[19, 45, 15, 35, 46, 16],

// 33
[17, 145, 115, 1, 146, 116],
[14, 74, 46, 21, 75, 47],
[29, 54, 24, 19, 55, 25],
[11, 45, 15, 46, 46, 16],

// 34
[13, 145, 115, 6, 146, 116],
[14, 74, 46, 23, 75, 47],
[44, 54, 24, 7, 55, 25],
[59, 46, 16, 1, 47, 17],

// 35
[12, 151, 121, 7, 152, 122],
[12, 75, 47, 26, 76, 48],
[39, 54, 24, 14, 55, 25],
[22, 45, 15, 41, 46, 16],

// 36
[6, 151, 121, 14, 152, 122],
[6, 75, 47, 34, 76, 48],
[46, 54, 24, 10, 55, 25],
[2, 45, 15, 64, 46, 16],

// 37
[17, 152, 122, 4, 153, 123],
[29, 74, 46, 14, 75, 47],
[49, 54, 24, 10, 55, 25],
[24, 45, 15, 46, 46, 16],

// 38
[4, 152, 122, 18, 153, 123],
[13, 74, 46, 32, 75, 47],
[48, 54, 24, 14, 55, 25],
[42, 45, 15, 32, 46, 16],

// 39
[20, 147, 117, 4, 148, 118],
[40, 75, 47, 7, 76, 48],
[43, 54, 24, 22, 55, 25],
[10, 45, 15, 67, 46, 16],

// 40
[19, 148, 118, 6, 149, 119],
[18, 75, 47, 31, 76, 48],
[34, 54, 24, 34, 55, 25],
[20, 45, 15, 61, 46, 16]
];

const qrRSBlock = function(totalCount, dataCount) {
const _this = {};
_this.totalCount = totalCount;
_this.dataCount = dataCount;
return _this;
};

const _this = {};

const getRsBlockTable = function(typeNumber, errorCorrectionLevel) {

switch(errorCorrectionLevel) {
case QRErrorCorrectionLevel.L :
return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
case QRErrorCorrectionLevel.M :
return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
case QRErrorCorrectionLevel.Q :
return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
case QRErrorCorrectionLevel.H :
return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
default :
return undefined;
}
};

_this.getRSBlocks = function(typeNumber, errorCorrectionLevel) {

const rsBlock = getRsBlockTable(typeNumber, errorCorrectionLevel);

if (typeof rsBlock == 'undefined') {
throw 'bad rs block @ typeNumber:' + typeNumber +
'/errorCorrectionLevel:' + errorCorrectionLevel;
}

const length = rsBlock.length / 3;

const list = [];

for (let i = 0; i < length; i += 1) {

const count = rsBlock[i * 3 + 0];
const totalCount = rsBlock[i * 3 + 1];
const dataCount = rsBlock[i * 3 + 2];

for (let j = 0; j < count; j += 1) {
list.push(qrRSBlock(totalCount, dataCount) );
}
}

return list;
};

return _this;
}();

//---------------------------------------------------------------------
// qrBitBuffer
//---------------------------------------------------------------------

const qrBitBuffer = function() {

const _buffer = [];
let _length = 0;

const _this = {};

_this.getBuffer = function() {
return _buffer;
};

_this.getAt = function(index) {
const bufIndex = Math.floor(index / 8);
return ( (_buffer[bufIndex] >>> (7 - index % 8) ) & 1) == 1;
};

_this.put = function(num, length) {
for (let i = 0; i < length; i += 1) {
_this.putBit( ( (num >>> (length - i - 1) ) & 1) == 1);
}
};

_this.getLengthInBits = function() {
return _length;
};

_this.putBit = function(bit) {

const bufIndex = Math.floor(_length / 8);
if (_buffer.length <= bufIndex) {
_buffer.push(0);
}

if (bit) {
_buffer[bufIndex] |= (0x80 >>> (_length % 8) );
}

_length += 1;
};

return _this;
};

//---------------------------------------------------------------------
// qrNumber
//---------------------------------------------------------------------

const qrNumber = function(data) {

const _mode = QRMode.MODE_NUMBER;
const _data = data;

const _this = {};

_this.getMode = function() {
return _mode;
};

_this.getLength = function(buffer) {
return _data.length;
};

_this.write = function(buffer) {

const data = _data;

let i = 0;

while (i + 2 < data.length) {
buffer.put(strToNum(data.substring(i, i + 3) ), 10);
i += 3;
}

if (i < data.length) {
if (data.length - i == 1) {
buffer.put(strToNum(data.substring(i, i + 1) ), 4);
} else if (data.length - i == 2) {
buffer.put(strToNum(data.substring(i, i + 2) ), 7);
}
}
};

const strToNum = function(s) {
let num = 0;
for (let i = 0; i < s.length; i += 1) {
num = num * 10 + chatToNum(s.charAt(i) );
}
return num;
};

const chatToNum = function(c) {
if ('0' <= c && c <= '9') {
return c.charCodeAt(0) - '0'.charCodeAt(0);
}
throw 'illegal char :' + c;
};

return _this;
};

//---------------------------------------------------------------------
// qrAlphaNum
//---------------------------------------------------------------------

const qrAlphaNum = function(data) {

const _mode = QRMode.MODE_ALPHA_NUM;
const _data = data;

const _this = {};

_this.getMode = function() {
return _mode;
};

_this.getLength = function(buffer) {
return _data.length;
};

_this.write = function(buffer) {

const s = _data;

let i = 0;

while (i + 1 < s.length) {
buffer.put(
getCode(s.charAt(i) ) * 45 +
getCode(s.charAt(i + 1) ), 11);
i += 2;
}

if (i < s.length) {
buffer.put(getCode(s.charAt(i) ), 6);
}
};

const getCode = function(c) {

if ('0' <= c && c <= '9') {
return c.charCodeAt(0) - '0'.charCodeAt(0);
} else if ('A' <= c && c <= 'Z') {
return c.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
} else {
switch (c) {
case ' ' : return 36;
case '$' : return 37;
case '%' : return 38;
case '*' : return 39;
case '+' : return 40;
case '-' : return 41;
case '.' : return 42;
case '/' : return 43;
case ':' : return 44;
default :
throw 'illegal char :' + c;
}
}
};

return _this;
};

//---------------------------------------------------------------------
// qr8BitByte
//---------------------------------------------------------------------

const qr8BitByte = function(data) {

const _mode = QRMode.MODE_8BIT_BYTE;
const _data = data;
const _bytes = qrcode.stringToBytes(data);

const _this = {};

_this.getMode = function() {
return _mode;
};

_this.getLength = function(buffer) {
return _bytes.length;
};

_this.write = function(buffer) {
for (let i = 0; i < _bytes.length; i += 1) {
buffer.put(_bytes[i], 8);
}
};

return _this;
};

//---------------------------------------------------------------------
// qrKanji
//---------------------------------------------------------------------

const qrKanji = function(data) {

const _mode = QRMode.MODE_KANJI;
const _data = data;

const stringToBytes = qrcode.stringToBytes;
!function(c, code) {
// self test for sjis support.
const test = stringToBytes(c);
if (test.length != 2 || ( (test[0] << 8) | test[1]) != code) {
throw 'sjis not supported.';
}
}('友', 0x9746);

const _bytes = stringToBytes(data);

const _this = {};

_this.getMode = function() {
return _mode;
};

_this.getLength = function(buffer) {
return ~~(_bytes.length / 2);
};

_this.write = function(buffer) {

const data = _bytes;

let i = 0;

while (i + 1 < data.length) {

let c = ( (0xff & data[i]) << 8) | (0xff & data[i + 1]);

if (0x8140 <= c && c <= 0x9FFC) {
c -= 0x8140;
} else if (0xE040 <= c && c <= 0xEBBF) {
c -= 0xC140;
} else {
throw 'illegal char at ' + (i + 1) + '/' + c;
}

c = ( (c >>> 8) & 0xff) * 0xC0 + (c & 0xff);

buffer.put(c, 13);

i += 2;
}

if (i < data.length) {
throw 'illegal char at ' + (i + 1);
}
};

return _this;
};

//=====================================================================
// GIF Support etc.
//

//---------------------------------------------------------------------
// byteArrayOutputStream
//---------------------------------------------------------------------

const byteArrayOutputStream = function() {

const _bytes = [];

const _this = {};

_this.writeByte = function(b) {
_bytes.push(b & 0xff);
};

_this.writeShort = function(i) {
_this.writeByte(i);
_this.writeByte(i >>> 8);
};

_this.writeBytes = function(b, off, len) {
off = off || 0;
len = len || b.length;
for (let i = 0; i < len; i += 1) {
_this.writeByte(b[i + off]);
}
};

_this.writeString = function(s) {
for (let i = 0; i < s.length; i += 1) {
_this.writeByte(s.charCodeAt(i) );
}
};

_this.toByteArray = function() {
return _bytes;
};

_this.toString = function() {
let s = '';
s += '[';
for (let i = 0; i < _bytes.length; i += 1) {
if (i > 0) {
s += ',';
}
s += _bytes[i];
}
s += ']';
return s;
};

return _this;
};

//---------------------------------------------------------------------
// base64EncodeOutputStream
//---------------------------------------------------------------------

const base64EncodeOutputStream = function() {

let _buffer = 0;
let _buflen = 0;
let _length = 0;
let _base64 = '';

const _this = {};

const writeEncoded = function(b) {
_base64 += String.fromCharCode(encode(b & 0x3f) );
};

const encode = function(n) {
if (n < 0) {
throw 'n:' + n;
} else if (n < 26) {
return 0x41 + n;
} else if (n < 52) {
return 0x61 + (n - 26);
} else if (n < 62) {
return 0x30 + (n - 52);
} else if (n == 62) {
return 0x2b;
} else if (n == 63) {
return 0x2f;
} else {
throw 'n:' + n;
}
};

_this.writeByte = function(n) {

_buffer = (_buffer << 8) | (n & 0xff);
_buflen += 8;
_length += 1;

while (_buflen >= 6) {
writeEncoded(_buffer >>> (_buflen - 6) );
_buflen -= 6;
}
};

_this.flush = function() {

if (_buflen > 0) {
writeEncoded(_buffer << (6 - _buflen) );
_buffer = 0;
_buflen = 0;
}

if (_length % 3 != 0) {
// padding
const padlen = 3 - _length % 3;
for (let i = 0; i < padlen; i += 1) {
_base64 += '=';
}
}
};

_this.toString = function() {
return _base64;
};

return _this;
};

//---------------------------------------------------------------------
// base64DecodeInputStream
//---------------------------------------------------------------------

const base64DecodeInputStream = function(str) {

const _str = str;
let _pos = 0;
let _buffer = 0;
let _buflen = 0;

const _this = {};

_this.read = function() {

while (_buflen < 8) {

if (_pos >= _str.length) {
if (_buflen == 0) {
return -1;
}
throw 'unexpected end of file./' + _buflen;
}

const c = _str.charAt(_pos);
_pos += 1;

if (c == '=') {
_buflen = 0;
return -1;
} else if (c.match(/^\s$/) ) {
// ignore if whitespace.
continue;
}

_buffer = (_buffer << 6) | decode(c.charCodeAt(0) );
_buflen += 6;
}

const n = (_buffer >>> (_buflen - 8) ) & 0xff;
_buflen -= 8;
return n;
};

const decode = function(c) {
if (0x41 <= c && c <= 0x5a) {
return c - 0x41;
} else if (0x61 <= c && c <= 0x7a) {
return c - 0x61 + 26;
} else if (0x30 <= c && c <= 0x39) {
return c - 0x30 + 52;
} else if (c == 0x2b) {
return 62;
} else if (c == 0x2f) {
return 63;
} else {
throw 'c:' + c;
}
};

return _this;
};

//---------------------------------------------------------------------
// gifImage (B/W)
//---------------------------------------------------------------------

const gifImage = function(width, height) {

const _width = width;
const _height = height;
const _data = new Array(width * height);

const _this = {};

_this.setPixel = function(x, y, pixel) {
_data[y * _width + x] = pixel;
};

_this.write = function(out) {

//---------------------------------
// GIF Signature

out.writeString('GIF87a');

//---------------------------------
// Screen Descriptor

out.writeShort(_width);
out.writeShort(_height);

out.writeByte(0x80); // 2bit
out.writeByte(0);
out.writeByte(0);

//---------------------------------
// Global Color Map

// black
out.writeByte(0x00);
out.writeByte(0x00);
out.writeByte(0x00);

// white
out.writeByte(0xff);
out.writeByte(0xff);
out.writeByte(0xff);

//---------------------------------
// Image Descriptor

out.writeString(',');
out.writeShort(0);
out.writeShort(0);
out.writeShort(_width);
out.writeShort(_height);
out.writeByte(0);

//---------------------------------
// Local Color Map

//---------------------------------
// Raster Data

const lzwMinCodeSize = 2;
const raster = getLZWRaster(lzwMinCodeSize);

out.writeByte(lzwMinCodeSize);

let offset = 0;

while (raster.length - offset > 255) {
out.writeByte(255);
out.writeBytes(raster, offset, 255);
offset += 255;
}

out.writeByte(raster.length - offset);
out.writeBytes(raster, offset, raster.length - offset);
out.writeByte(0x00);

//---------------------------------
// GIF Terminator
out.writeString(';');
};

const bitOutputStream = function(out) {

const _out = out;
let _bitLength = 0;
let _bitBuffer = 0;

const _this = {};

_this.write = function(data, length) {

if ( (data >>> length) != 0) {
throw 'length over';
}

while (_bitLength + length >= 8) {
_out.writeByte(0xff & ( (data << _bitLength) | _bitBuffer) );
length -= (8 - _bitLength);
data >>>= (8 - _bitLength);
_bitBuffer = 0;
_bitLength = 0;
}

_bitBuffer = (data << _bitLength) | _bitBuffer;
_bitLength = _bitLength + length;
};

_this.flush = function() {
if (_bitLength > 0) {
_out.writeByte(_bitBuffer);
}
};

return _this;
};

const getLZWRaster = function(lzwMinCodeSize) {

const clearCode = 1 << lzwMinCodeSize;
const endCode = (1 << lzwMinCodeSize) + 1;
let bitLength = lzwMinCodeSize + 1;

// Setup LZWTable
const table = lzwTable();

for (let i = 0; i < clearCode; i += 1) {
table.add(String.fromCharCode(i) );
}
table.add(String.fromCharCode(clearCode) );
table.add(String.fromCharCode(endCode) );

const byteOut = byteArrayOutputStream();
const bitOut = bitOutputStream(byteOut);

// clear code
bitOut.write(clearCode, bitLength);

let dataIndex = 0;

let s = String.fromCharCode(_data[dataIndex]);
dataIndex += 1;

while (dataIndex < _data.length) {

const c = String.fromCharCode(_data[dataIndex]);
dataIndex += 1;

if (table.contains(s + c) ) {

s = s + c;

} else {

bitOut.write(table.indexOf(s), bitLength);

if (table.size() < 0xfff) {

if (table.size() == (1 << bitLength) ) {
bitLength += 1;
}

table.add(s + c);
}

s = c;
}
}

bitOut.write(table.indexOf(s), bitLength);

// end code
bitOut.write(endCode, bitLength);

bitOut.flush();

return byteOut.toByteArray();
};

const lzwTable = function() {

const _map = {};
let _size = 0;

const _this = {};

_this.add = function(key) {
if (_this.contains(key) ) {
throw 'dup key:' + key;
}
_map[key] = _size;
_size += 1;
};

_this.size = function() {
return _size;
};

_this.indexOf = function(key) {
return _map[key];
};

_this.contains = function(key) {
return typeof _map[key] != 'undefined';
};

return _this;
};

return _this;
};

const createDataURL = function(width, height, getPixel) {
const gif = gifImage(width, height);
for (let y = 0; y < height; y += 1) {
for (let x = 0; x < width; x += 1) {
gif.setPixel(x, y, getPixel(x, y) );
}
}

const b = byteArrayOutputStream();
gif.write(b);

const base64 = base64EncodeOutputStream();
const bytes = b.toByteArray();
for (let i = 0; i < bytes.length; i += 1) {
base64.writeByte(bytes[i]);
}
base64.flush();

return 'data:image/gif;base64,' + base64;
};

export default qrcode;

export const stringToBytes = qrcode.stringToBytes;
```

- [ ] **Step 2: Crea `vendor/QRCODE-LICENSE.txt`**

```
MIT License

Copyright (c) 2009 Kazuhiko Arase

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

Vendorizzato da https://github.com/kazuhikoarase/qrcode-generator
(ramo master, file js/dist/qrcode.mjs) per PrivAI Pocket. Nessuna modifica
al codice originale.
```

- [ ] **Step 3: Scrivi il wrapper `src/domain/qr.mjs`**

```js
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
```

- [ ] **Step 4: Scrivi i test**

In `tests/domain.test.mjs`, aggiungi l'import in cima:

```js
import { renderQrSvg } from '../src/domain/qr.mjs';
```

E questo blocco in fondo al file:

```js
/* ------------------------------------------------------------------ */
/* Ponte desktop: il QR vero                                           */
/* ------------------------------------------------------------------ */

test('renderQrSvg produce un vero SVG scansionabile, non un disegno decorativo a griglia fissa', () => {
  const svg = renderQrSvg('https://esempio.test/bridge?token=ABC123');
  assert.match(svg, /^<svg/);
  assert.match(svg, /<\/svg>\s*$/);
  assert.match(svg, /viewBox="0 0 \d+ \d+"/);
});

test('renderQrSvg gestisce un link lungo (indirizzo + porta + token) senza lanciare', () => {
  const lungo = 'https://thezine88.github.io/privai-pocket-preview/bridge/?ip=192.168.1.42&porta=45231&token=AB3XK9QZLM';
  assert.doesNotThrow(() => renderQrSvg(lungo));
});

test('renderQrSvg produce contenuto diverso per testi diversi (non è un placeholder statico)', () => {
  const uno = renderQrSvg('https://esempio.test/a');
  const due = renderQrSvg('https://esempio.test/completamente-diverso-e-piu-lungo-di-prima');
  assert.notEqual(uno, due);
});
```

- [ ] **Step 5: Esegui i test**

Run: `node --test tests/domain.test.mjs`
Expected: PASS, tutti verdi (compresi i 3 nuovi).

- [ ] **Step 6: Commit**

```bash
git add vendor/qrcode.mjs vendor/QRCODE-LICENSE.txt src/domain/qr.mjs tests/domain.test.mjs
git commit -m "Vendorizza un generatore QR vero per il ponte desktop

drawQr() in app.mjs è dichiarato dal suo stesso commento come
decorativo, non scansionabile — resta per la schermata piani.
Vendorizzato kazuhikoarase/qrcode-generator (MIT, già in formato
modulo ES), con un wrapper minimo (renderQrSvg) che sceglie solo i
parametri di resa."
```

---

### Task 3: Rilevamento della modalità ponte in app.mjs

**Files:**
- Modify: `src/app.mjs`
- Test: `tests/ui.test.mjs`

**Interfaces:**
- Consumes: `createRemoteStore` dal Task 1 (`src/domain/vault.mjs`).
- Produces: `bridgeToken()` — funzione che restituisce il token di sessione se l'app gira in modalità ponte, altrimenti `null`. `document.documentElement.dataset.context === 'desktop'` quando attivo — il Task 6 (layout 16:9) lo consuma per il CSS.

- [ ] **Step 1: Aggiungi l'import**

In `src/app.mjs`, trova la riga:

```js
import { createSecureStore, createVault, DEFAULT_RETENTION, retentionLabel, clampRetention } from './domain/vault.mjs';
```

Sostituiscila con:

```js
import { createSecureStore, createRemoteStore, createVault, DEFAULT_RETENTION, retentionLabel, clampRetention } from './domain/vault.mjs';
```

- [ ] **Step 2: Sostituisci la creazione dello store**

Trova:

```js
const store = createSecureStore();
const vault = createVault(store);
```

Sostituiscila con:

```js
/**
 * L'app gira in modalità ponte quando il computer l'ha caricata dal
 * server locale del telefono (vedi BridgeServerPlugin) invece che dalla
 * WebView nativa. Il segnale è il token nell'URL: solo quel server lo
 * aggiunge, e solo quando serve la pagina a un browser esterno — mai in
 * un avvio nativo normale.
 */
function bridgeToken() {
  if (globalThis.Capacitor?.isNativePlatform?.()) return null;
  return new URLSearchParams(location.search).get('token');
}

const store = bridgeToken() ? createRemoteStore(bridgeToken()) : createSecureStore();
const vault = createVault(store);
if (bridgeToken()) document.documentElement.dataset.context = 'desktop';
```

- [ ] **Step 3: Scrivi il test**

In `tests/ui.test.mjs`, aggiungi in fondo al file:

```js
test('bridge mode: un token nell\'URL senza bridge nativo significa il magazzino remoto, non il Keystore', async () => {
  const app = await readFile(new URL('../src/app.mjs', import.meta.url), 'utf8');
  assert.match(app, /createRemoteStore/);
  assert.match(app, /function bridgeToken/);
  assert.match(app, /dataset\.context\s*=\s*'desktop'/);
});
```

- [ ] **Step 4: Esegui tutta la suite**

Run: `node --test tests/*.test.mjs`
Expected: PASS, tutti verdi.

- [ ] **Step 5: Commit**

```bash
git add src/app.mjs tests/ui.test.mjs
git commit -m "Riconosce la modalità ponte: token nell'URL, niente WebView nativa

Quando vero, usa createRemoteStore invece del Keystore diretto e
segna document.documentElement.dataset.context = 'desktop' per il
layout dedicato a schermo largo."
```

---

### Task 4: `BridgeServerPlugin.java` — il server nativo

**Files:**
- Create: `android/app/src/main/java/app/privai/pocket/BridgeServerPlugin.java`
- Modify: `android/app/build.gradle`

**Interfaces:**
- Consumes: il contratto `GET/PUT/DELETE /api/store/:key` definito dal Task 1 (stessa forma di corpo/intestazioni). Serve i file da `assets/public/` — la cartella che Capacitor bundla già con l'intero contenuto web dell'app (`index.html`, `styles.css`, `src/**`, `vendor/**`), la stessa che la WebView nativa carica.
- Produces: due metodi Capacitor — `start({ token, endsAt })` → `{ ip, port }` (avvia il server, avvia ad accettare richieste autenticate col token fino a `endsAt`, un timestamp epoch in millisecondi); `stop()` (ferma tutto). Il Task 5 (schermata "Collega al computer") li chiama.

> **Nota per chi implementa:** nessun SDK Android in questo ambiente — scrivi il codice completo e corretto, la compilazione e la prova reale restano per il prossimo APK, come per gli altri plugin nativi di questo progetto.

- [ ] **Step 1: Aggiungi la dipendenza NanoHTTPD**

In `android/app/build.gradle`, trova il blocco `dependencies {` e aggiungi questa riga (libreria singola, MIT, senza dipendenze transitive pesanti — stesso criterio già usato per `SecureStorePlugin`):

```gradle
    implementation 'org.nanohttpd:nanohttpd:2.3.1'
```

- [ ] **Step 2: Scrivi il plugin**

Crea `android/app/src/main/java/app/privai/pocket/BridgeServerPlugin.java`:

```java
package app.privai.pocket;

import android.content.res.AssetManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Enumeration;

import fi.iki.elonen.NanoHTTPD;

/**
 * Il ponte desktop: un server HTTP minimo sulla rete locale, niente altro.
 * Due compiti, nessuna logica di dominio:
 *  1. Serve gli stessi file che la WebView nativa carica già (assets/public,
 *     dove Capacitor bundla index.html/styles.css/src/**), così il computer
 *     vede la STESSA app, non una seconda interfaccia da mantenere.
 *  2. Espone /api/store/:key, che rispecchia createSecureStore (get/set/
 *     remove) — ogni richiesta autenticata dal token della sessione
 *     attiva, mai un accesso silenzioso.
 *
 * La cassaforte resta SecureStorePlugin: questo plugin non la implementa
 * di nuovo, la richiama.
 */
@CapacitorPlugin(name = "BridgeServer")
public class BridgeServerPlugin extends Plugin {

    private Server server;
    private String activeToken;
    private long activeEndsAt;

    private class Server extends NanoHTTPD {

        Server(int port) {
            super(port);
        }

        @Override
        public Response serve(IHTTPSession session) {
            String uri = session.getUri();

            if (uri.startsWith("/api/store/")) {
                return serveStore(session, uri.substring("/api/store/".length()));
            }
            return serveStatic(uri);
        }

        private boolean authorized(IHTTPSession session) {
            String header = session.getHeaders().get("authorization");
            if (header == null || !header.startsWith("Bearer ")) return false;
            String token = header.substring("Bearer ".length());
            return token.equals(activeToken) && System.currentTimeMillis() < activeEndsAt;
        }

        private Response serveStore(IHTTPSession session, String key) {
            if (!authorized(session)) {
                return newFixedLengthResponse(Response.Status.UNAUTHORIZED, "application/json", "{}");
            }

            SecureStorePlugin secureStore = getBridge().getPlugin("SecureStore") != null
                ? (SecureStorePlugin) getBridge().getPlugin("SecureStore").getInstance()
                : null;
            if (secureStore == null) {
                return newFixedLengthResponse(Response.Status.INTERNAL_ERROR, "application/json", "{}");
            }

            try {
                switch (session.getMethod()) {
                    case GET: {
                        String value = secureStore.readRaw(key);
                        if (value == null) {
                            return newFixedLengthResponse(Response.Status.NOT_FOUND, "application/json", "{}");
                        }
                        return newFixedLengthResponse(Response.Status.OK, "application/json",
                            "{\"value\":" + value + "}");
                    }
                    case PUT: {
                        String body = readBody(session);
                        org.json.JSONObject json = new org.json.JSONObject(body);
                        secureStore.writeRaw(key, json.get("value").toString());
                        return newFixedLengthResponse(Response.Status.OK, "application/json", "{}");
                    }
                    case DELETE: {
                        secureStore.removeRaw(key);
                        return newFixedLengthResponse(Response.Status.OK, "application/json", "{}");
                    }
                    default:
                        return newFixedLengthResponse(Response.Status.METHOD_NOT_ALLOWED, "application/json", "{}");
                }
            } catch (Exception error) {
                return newFixedLengthResponse(Response.Status.INTERNAL_ERROR, "application/json", "{}");
            }
        }

        private String readBody(IHTTPSession session) throws IOException, ResponseException {
            java.util.Map<String, String> files = new java.util.HashMap<>();
            session.parseBody(files);
            return files.get("postData");
        }

        private Response serveStatic(String uri) {
            String path = "public" + (uri.equals("/") ? "/index.html" : uri);
            try {
                AssetManager assets = getContext().getAssets();
                InputStream input = assets.open(path);
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                byte[] buffer = new byte[4096];
                int read;
                while ((read = input.read(buffer)) != -1) out.write(buffer, 0, read);
                input.close();
                return newFixedLengthResponse(Response.Status.OK, mimeFor(path),
                    new java.io.ByteArrayInputStream(out.toByteArray()), out.size());
            } catch (IOException error) {
                return newFixedLengthResponse(Response.Status.NOT_FOUND, "text/plain", "non trovato");
            }
        }

        private String mimeFor(String path) {
            if (path.endsWith(".html")) return "text/html; charset=utf-8";
            if (path.endsWith(".css")) return "text/css; charset=utf-8";
            if (path.endsWith(".mjs") || path.endsWith(".js")) return "text/javascript; charset=utf-8";
            if (path.endsWith(".json") || path.endsWith(".webmanifest")) return "application/json; charset=utf-8";
            if (path.endsWith(".svg")) return "image/svg+xml";
            if (path.endsWith(".webp")) return "image/webp";
            if (path.endsWith(".png")) return "image/png";
            if (path.endsWith(".otf")) return "font/otf";
            return "application/octet-stream";
        }
    }

    /** Nessun permesso speciale richiesto: enumera le interfacce di rete
     *  già visibili all'app, valido sia su Wi-Fi sia sull'hotspot del
     *  telefono. */
    private static String localIpAddress() {
        try {
            Enumeration<NetworkInterface> ifaces = NetworkInterface.getNetworkInterfaces();
            while (ifaces.hasMoreElements()) {
                NetworkInterface iface = ifaces.nextElement();
                if (iface.isLoopback() || !iface.isUp()) continue;
                Enumeration<InetAddress> addrs = iface.getInetAddresses();
                while (addrs.hasMoreElements()) {
                    InetAddress addr = addrs.nextElement();
                    if (addr instanceof Inet4Address && !addr.isLoopbackAddress()) {
                        return addr.getHostAddress();
                    }
                }
            }
        } catch (Exception ignored) { }
        return null;
    }

    @PluginMethod
    public void start(PluginCall call) {
        String token = call.getString("token");
        Long endsAt = call.getLong("endsAt");
        if (token == null || endsAt == null) {
            call.reject("token o endsAt mancanti");
            return;
        }
        String ip = localIpAddress();
        if (ip == null) {
            call.reject("nessuna rete locale disponibile");
            return;
        }
        try {
            if (server != null) server.stop();
            server = new Server(0); // 0 = il sistema assegna una porta libera
            server.start(NanoHTTPD.SOCKET_READ_TIMEOUT, false);
            activeToken = token;
            activeEndsAt = endsAt;
            call.resolve(new JSObject().put("ip", ip).put("port", server.getListeningPort()));
        } catch (IOException error) {
            call.reject("impossibile avviare il server locale", error);
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (server != null) {
            server.stop();
            server = null;
        }
        activeToken = null;
        activeEndsAt = 0;
        call.resolve();
    }
}
```

- [ ] **Step 3: Aggiungi tre metodi a `SecureStorePlugin.java`**

`BridgeServerPlugin` sopra chiama `readRaw`/`writeRaw`/`removeRaw` su `SecureStorePlugin` — non esistono ancora, perché i metodi `@PluginMethod` esistenti (`get`/`set`/`remove`) sono pensati per essere chiamati dal bridge Capacitor (prendono un `PluginCall`), non da un altro plugin Java direttamente. Apri `android/app/src/main/java/app/privai/pocket/SecureStorePlugin.java` e aggiungi questi tre metodi pubblici, subito dopo la chiusura del metodo `remove(PluginCall call)` esistente (stessa cifratura, stesso `SharedPreferences`, nessuna logica duplicata — sono solo la stessa cosa senza l'involucro di `PluginCall`):

```java

    /** Stessa lettura di get(), ma per essere chiamata da un altro plugin
     *  Java (BridgeServerPlugin), non dal bridge Capacitor. Restituisce il
     *  JSON già serializzato così com'è in memoria, null se assente o
     *  illeggibile. */
    public String readRaw(String key) {
        String stored = prefs().getString(key, null);
        if (stored == null) return null;
        try {
            return decrypt(stored);
        } catch (Exception error) {
            prefs().edit().remove(key).apply();
            return null;
        }
    }

    /** Stessa scrittura di set(), per uso diretto da un altro plugin Java. */
    public void writeRaw(String key, String value) throws Exception {
        prefs().edit().putString(key, encrypt(value)).apply();
    }

    /** Stessa cancellazione di remove(), per uso diretto da un altro plugin Java. */
    public void removeRaw(String key) {
        prefs().edit().remove(key).apply();
    }
```

**Attenzione per chi implementa:** `SecureStorePlugin` usa un prefisso (`PREFIX = 'privai:'` lato JS in `vault.mjs`) applicato PRIMA di arrivare al plugin nativo — verifica nel file se il plugin nativo si aspetta la chiave già con `privai:` davanti o no (guarda come la chiamano `get`/`set`/`remove` esistenti) e usa lo stesso schema in `readRaw`/`writeRaw`/`removeRaw`, così `BridgeServerPlugin` non deve conoscere quel dettaglio: la chiave che riceve da `/api/store/:key` è quella "nuda" che `createRemoteStore` manda (es. `prefs`, `jobs`), la stessa che `createSecureStore` passerebbe a `native.get({ key: PREFIX + key })` — se `PREFIX` va aggiunto lato nativo o lato JS è già deciso da come `get`/`set`/`remove` esistenti lo fanno oggi: segui quello schema esatto, non inventarne uno nuovo.

- [ ] **Step 4: Verifica manuale (nessuna compilazione possibile qui)**

Rileggi `BridgeServerPlugin.java` e `SecureStorePlugin.java` fianco a fianco: il nome del metodo, il numero di argomenti e il tipo restituito di `readRaw`/`writeRaw`/`removeRaw` devono combaciare esattamente fra dove sono dichiarati e dove sono chiamati. Nessun test automatico qui può prenderlo — è l'unico controllo possibile prima del prossimo APK.

- [ ] **Step 5: Commit**

```bash
git add android/app/build.gradle \
        android/app/src/main/java/app/privai/pocket/BridgeServerPlugin.java \
        android/app/src/main/java/app/privai/pocket/SecureStorePlugin.java
git commit -m "Aggiunge BridgeServerPlugin: il server locale del ponte desktop

NanoHTTPD (MIT, dipendenza Gradle singola) serve gli stessi file già
bundlati per la WebView nativa (assets/public) e risponde a
/api/store/:key rispecchiando createSecureStore — ogni richiesta
autenticata dal token della sessione attiva. SecureStorePlugin prende
tre metodi diretti (readRaw/writeRaw/removeRaw) per essere chiamato da
un altro plugin Java senza passare dal bridge Capacitor.

Non compilato in questo ambiente (nessun SDK Android) — da provare sul
prossimo APK, su una rete Wi-Fi reale."
```

---

### Task 5: Completa il dialogo "Continua sul computer"

**Scoperta durante la stesura del piano:** esiste già uno scheletro di questa schermata dalla sessione precedente — un dialogo `#dlg-desktop` in `index.html`, con `#qr-holder`/`#pairing-code`/`#desktop-timer`, e le funzioni `startDesktop()`/`tickDesktop()` in `app.mjs`, già agganciate al pulsante "Mostra il codice" nella card "Continua sul desktop" in Impostazioni. Tutto finto: `drawQr()` decorativo, e un dominio (`privai.app/desk`) che non esiste. Questo task **completa quello scheletro**, non ne costruisce uno parallelo — niente nuova vista, niente nuovo punto d'ingresso da collegare.

**Files:**
- Modify: `index.html` (il dialogo `#dlg-desktop` esistente)
- Modify: `src/app.mjs` (`startDesktop()`, `tickDesktop()`, l'import in cima)
- Modify: `src/locales/it.mjs`, `src/locales/en.mjs` (`desktop.body` non deve più nominare un dominio finto; due chiavi nuove per il pulsante di condivisione)
- Test: `tests/ui.test.mjs`

**Interfaces:**
- Consumes: `renderQrSvg` dal Task 2 (`src/domain/qr.mjs`); `createDesktopSessions`/`pairingCode` già in `src/domain/plan.mjs`, `desktop`/`outbound` già creati a livello di modulo in `app.mjs` (`const desktop = createDesktopSessions(store);`, `const outbound = createOutbound();`); `Capacitor.Plugins.BridgeServer.start({token, endsAt})` → `{ip, port}` e `.stop()` dal Task 4.
- Produces: nessuna nuova interfaccia consumata da altri task JS — il Task 7 (redirect pubblico) si aspetta solo che il link generato qui abbia la forma `https://thezine88.github.io/privai-pocket-preview/bridge/?ip=<ip>&porta=<port>&token=<token>`.

- [ ] **Step 1: Aggiorna il dialogo in `index.html`**

Trova il blocco (righe indicative, cercalo per contenuto — l'esatta numerazione può essere leggermente diversa):

```html
<dialog id="dlg-desktop">
  <form method="dialog" class="dialog-card">
    <h2 data-i18n="desktop.title">Continua sul computer</h2>
    <p data-i18n="desktop.body">Apri privai.app/desk dal computer e inquadra il codice, oppure digita le sei lettere.</p>
    <div id="qr-holder" style="display:grid;place-items:center;padding:8px 0"></div>
    <p style="text-align:center;font-size:26px;font-weight:900;letter-spacing:.18em" id="pairing-code"></p>
    <p class="lead" style="text-align:center" id="desktop-timer"></p>
    <div class="dialog-actions">
      <button class="btn btn-soft" value="cancel" type="submit" data-i18n="action.close">Chiudi</button>
    </div>
  </form>
</dialog>
```

Sostituiscilo con:

```html
<dialog id="dlg-desktop">
  <form method="dialog" class="dialog-card">
    <h2 data-i18n="desktop.title">Continua sul computer</h2>
    <p data-i18n="desktop.body">Apri l’app sul computer senza installare nulla: inquadra il QR, oppure condividi il link con te stesso — email, WhatsApp Web, note, quello che usi già.</p>
    <div id="qr-holder" style="display:grid;place-items:center;padding:8px 0"></div>
    <p class="lead" id="desktop-link" style="text-align:center;word-break:break-all;font-size:12px"></p>
    <button class="btn btn-soft btn-full" id="desktop-share" type="button" data-i18n="bridge.share">Condividi il link</button>
    <p class="lead" style="text-align:center;margin-top:12px" id="desktop-timer"></p>
    <div class="dialog-actions">
      <button class="btn btn-soft" value="cancel" type="submit" data-i18n="action.close">Chiudi</button>
    </div>
  </form>
</dialog>
```

(`#pairing-code`, il codice a 6 lettere mostrato da solo, sparisce: nel disegno approvato il token vive dentro il link/QR, non si digita a mano.)

- [ ] **Step 2: Aggiungi l'import**

In `src/app.mjs`, trova la riga che importa da `./domain/plan.mjs` e aggiungi subito dopo:

```js
import { renderQrSvg } from './domain/qr.mjs';
```

- [ ] **Step 3: Sostituisci `startDesktop()` e `tickDesktop()`**

Trova (cercalo per contenuto, la numerazione esatta delle righe può differire leggermente da questa):

```js
/* --- desktop via QR --- */

let desktopTimer = null;

async function startDesktop() {
  const code = pairingCode();
  const result = await desktop.start(state.plan, code);
  if (!result.ok) return toast(t('desktop.none'));

  $('#pairing-code').textContent = result.session.code;
  drawQr(`https://privai.app/desk#${result.session.code}`);
  tickDesktop(result.session);
  await ask('#dlg-desktop');
  clearInterval(desktopTimer);
  renderSettings();
}

function tickDesktop(session) {
  clearInterval(desktopTimer);
  const node = $('#desktop-timer');
  const update = () => {
    if (!Number.isFinite(session.endsAt)) { node.textContent = t('desktop.unlimited'); return; }
    const left = Math.max(0, session.endsAt - Date.now());
    const minutes = Math.floor(left / 60000);
    const seconds = String(Math.floor((left % 60000) / 1000)).padStart(2, '0');
    node.textContent = t('desktop.timer', { minutes, seconds });
    if (left <= 0) { clearInterval(desktopTimer); desktop.stop(); $('#dlg-desktop').close(); }
  };
  update();
  desktopTimer = setInterval(update, 1000);
}
```

Sostituiscilo con:

```js
/* --- desktop via QR/link --- */

let desktopTimer = null;

async function startDesktop() {
  const bridgePlugin = globalThis.Capacitor?.Plugins?.BridgeServer;
  if (!bridgePlugin) return toast(t('desktop.unavailable'));

  const token = pairingCode();
  const result = await desktop.start(state.plan, token);
  if (!result.ok) return toast(t('desktop.none'));

  let native;
  try {
    native = await bridgePlugin.start({ token, endsAt: result.session.endsAt });
  } catch {
    await desktop.stop();
    return toast(t('desktop.unavailable'));
  }

  const link = `https://thezine88.github.io/privai-pocket-preview/bridge/?ip=${encodeURIComponent(native.ip)}&porta=${native.port}&token=${encodeURIComponent(token)}`;
  $('#qr-holder').innerHTML = renderQrSvg(link);
  $('#desktop-link').textContent = link;
  $('#desktop-share').onclick = () => outbound.shareAnywhere(link, t('bridge.shareTitle'));

  tickDesktop(result.session);
  await ask('#dlg-desktop');

  clearInterval(desktopTimer);
  await bridgePlugin.stop?.();
  await desktop.stop();
  renderSettings();
}

function tickDesktop(session) {
  clearInterval(desktopTimer);
  const node = $('#desktop-timer');
  const update = () => {
    if (!Number.isFinite(session.endsAt)) { node.textContent = t('desktop.unlimited'); return; }
    const left = Math.max(0, session.endsAt - Date.now());
    const minutes = Math.floor(left / 60000);
    const seconds = String(Math.floor((left % 60000) / 1000)).padStart(2, '0');
    node.textContent = t('desktop.timer', { minutes, seconds });
    if (left <= 0) { clearInterval(desktopTimer); $('#dlg-desktop').close(); }
  };
  update();
  desktopTimer = setInterval(update, 1000);
}
```

(La chiusura per scadenza chiama solo `.close()`: la pulizia — fermare il server nativo, chiudere la sessione — sta tutta in `startDesktop()` dopo `await ask('#dlg-desktop')`, che si sblocca comunque quando il dialogo si chiude, sia per scadenza sia perché l'utente preme "Chiudi". Un solo percorso di pulizia, non due copie della stessa logica.)

- [ ] **Step 4: Aggiorna le chiavi di traduzione**

In `src/locales/it.mjs`, sostituisci la riga `'desktop.body': 'Apri privai.app/desk dal computer e inquadra il codice, oppure digita le sei lettere.',` con:

```js
  'desktop.body': 'Apri l’app sul computer senza installare nulla: inquadra il QR, oppure condividi il link con te stesso — email, WhatsApp Web, note, quello che usi già.',
```

Subito dopo la riga `'desktop.timer': ...`, aggiungi:

```js
  'desktop.unavailable': 'Il collegamento al computer non è disponibile su questo dispositivo.',
  'bridge.share': 'Condividi il link',
  'bridge.shareTitle': 'Collega questo computer a PrivAI Pocket',
```

In `src/locales/en.mjs`, trova la riga equivalente di `desktop.body` e sostituiscila con una traduzione coerente (stesso significato di quella italiana sopra), poi aggiungi le tre chiavi nuove nello stesso punto, tradotte:

```js
  'desktop.unavailable': 'Connecting to a computer is not available on this device.',
  'bridge.share': 'Share the link',
  'bridge.shareTitle': 'Connect this computer to PrivAI Pocket',
```

- [ ] **Step 5: Scrivi il test**

In `tests/ui.test.mjs`, aggiungi in fondo al file:

```js
test('il ponte desktop non nomina più un dominio finto, e sa condividere un link vero', async () => {
  const app = await readFile(new URL('../src/app.mjs', import.meta.url), 'utf8');
  assert.match(app, /BridgeServer/);
  assert.match(app, /renderQrSvg/);
  assert.doesNotMatch(app, /privai\.app\/desk/);
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /privai\.app\/desk/);
  assert.match(html, /id="desktop-share"/);
});
```

- [ ] **Step 6: Esegui tutta la suite**

Run: `node --test tests/*.test.mjs`
Expected: PASS, tutti verdi.

- [ ] **Step 7: Commit**

```bash
git add index.html src/app.mjs src/locales/it.mjs src/locales/en.mjs tests/ui.test.mjs
git commit -m "Completa il dialogo del ponte desktop: QR vero, link condivisibile

Lo scheletro esisteva già dalla sessione precedente (dialogo, timer di
sessione), ma era tutto finto: QR decorativo, un dominio (privai.app/desk)
mai esistito. Ora genera davvero il server locale (BridgeServerPlugin),
mostra un QR scansionabile (renderQrSvg) e permette di condividere il
link con lo stesso gesto già usato per condividere un documento."
```

---

### Task 6: Layout 16:9 per la modalità ponte

**Files:**
- Modify: `styles.css`
- Test: `tests/ui.test.mjs`

**Interfaces:**
- Consumes: `document.documentElement.dataset.context === 'desktop'` dal Task 3.
- Produces: nessuna nuova interfaccia — solo CSS.

**Nota per chi implementa — leggi prima di scrivere una riga:** questo task NON ha un blocco di codice pronto da incollare, di proposito. Il requisito esplicito della specifica (`docs/superpowers/specs/2026-08-28-desktop-bridge-design.md`) è che questo sia un vero progetto grafico per schermo largo, non l'interfaccia da telefono allargata — "niente estetica generica da IA". Un CSS scritto qui in anticipo, senza vedere il risultato, sarebbe esattamente quello che la specifica vieta.

**Passi da seguire per davvero:**

1. Invoca la skill `frontend-design` (non è opzionale: è un requisito della specifica, non un suggerimento).
2. Progetta come `.shell` e le viste principali (`work`, `vault`) si dispongono su uno schermo largo quando `document.documentElement.dataset.context === 'desktop'` — più spazio orizzontale, non la stessa colonna centrata del telefono semplicemente allargata. I colori, i componenti (`.btn`, `.card`, `.recipe`, ecc.) e i due temi chiaro/scuro restano quelli esistenti: cambia la disposizione, non l'aspetto.
3. Verifica il risultato in un browser vero, ridimensionato a un formato 16:9 (es. 1280×720), con `document.documentElement.dataset.context = 'desktop'` impostato a mano dalla console per simulare la modalità ponte senza bisogno del server nativo.
4. Scrivi il CSS in un blocco chiaramente delimitato in `styles.css`, es.:

```css
/* ===================================================================== */
/* Modalità ponte — schermo largo (16:9)                                 */
/* ===================================================================== */

:root[data-context="desktop"] {
  /* … */
}
```

- [ ] **Step 1: Progetta e scrivi il CSS** (vedi sopra — nessun contenuto pre-scritto in questo piano)

- [ ] **Step 2: Scrivi un test minimo che verifichi solo che il blocco esista**

Non può verificare la qualità del disegno (questo lo verifica un occhio umano, sul prossimo APK o nel browser durante la realizzazione) — solo che la modalità sia stata effettivamente implementata, non dimenticata:

```js
test('esiste un layout dedicato per la modalità ponte, non solo il telefono allargato', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(css, /\[data-context="desktop"\]/);
});
```

- [ ] **Step 3: Esegui tutta la suite**

Run: `node --test tests/*.test.mjs`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add styles.css tests/ui.test.mjs
git commit -m "Layout 16:9 per la modalità ponte desktop

Costruito con la skill frontend-design, come richiesto esplicitamente
dalla specifica — non l'interfaccia da telefono allargata."
```

---

### Task 7: Paginetta pubblica di reindirizzamento + GitHub Pages

**Files:**
- Create: `bridge/index.html`
- Modify (impostazione, non file): repository → Settings → Pages

**Interfaces:**
- Consumes: la forma del link generata dal Task 5 (`?ip=<ip>&porta=<port>&token=<token>`).
- Produces: nessuna interfaccia consumata da altro codice — è l'ultimo anello, quello che il browser del computer apre per primo.

> **Prima di eseguire la parte "Settings → Pages": è un'azione visibile all'esterno (il contenuto pubblico del repository cambia). Chiedi conferma esplicita prima di farlo, anche se il piano la descrive — non è un'azione da eseguire in autonomia solo perché è scritta qui.**

- [ ] **Step 1: Crea `bridge/index.html`**

Pagina statica, nessuna dipendenza, nessun framework. Legge `ip`/`porta`/`token` dalla propria query string, mostra un momento di apertura breve ("Eccoti, iniziamo!" — stesso sfondo/font/mascotte dell'onboarding, nessun video, nessuna libreria esterna) e poi reindirizza — la navigazione a un indirizzo `http://` da una pagina `https://` non viene bloccata dalla regola "mixed content" (quella blocca solo le richieste di rete fatte *dall'interno* di una pagina sicura verso un indirizzo non sicuro, non una navigazione vera e propria):

```html
<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PrivAI Pocket — Collega questo computer</title>
<meta property="og:title" content="🔒 Collega questo computer a PrivAI Pocket">
<meta property="og:description" content="Apri questo link sul computer che vuoi collegare al telefono, sulla stessa rete Wi-Fi.">
<style>
  @font-face {
    font-family: "Willy Rounded";
    src: url("../assets/fonts/willy-rounded.otf") format("opentype");
    font-weight: 400 900;
    font-display: swap;
  }
  * { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; }
  body {
    display: grid; place-items: center; text-align: center;
    font-family: "Willy Rounded", ui-rounded, system-ui, sans-serif;
    background: linear-gradient(160deg, #FF6B00 0%, #E85D00 60%, #C94E00 100%);
    color: #fff;
    padding: 24px;
  }
  h1 {
    font-size: clamp(28px, 6vw, 44px);
    margin: 0 0 12px;
    opacity: 0;
    transform: translateY(12px);
    animation: apparso 500ms ease forwards;
  }
  p { font-size: 15px; opacity: .9; max-width: 42ch; margin: 0 auto; }
  #errore { display: none; margin-top: 20px; font-size: 14px; opacity: .95; }
  @keyframes apparso { to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) {
    h1 { animation: none; opacity: 1; transform: none; }
  }
</style>
</head>
<body>
  <div>
    <h1>Eccoti, iniziamo!</h1>
    <p>Ti porto sul telefono che ha generato questo link…</p>
    <p id="errore">Non riesco a raggiungerlo. Controlla che computer e telefono siano sulla stessa rete Wi-Fi (o collegati all'hotspot del telefono), poi riprova dal telefono.</p>
  </div>
  <script>
    (function () {
      var parametri = new URLSearchParams(location.search);
      var ip = parametri.get('ip');
      var porta = parametri.get('porta');
      var token = parametri.get('token');
      if (!ip || !porta || !token) {
        document.getElementById('errore').style.display = 'block';
        return;
      }
      var destinazione = 'http://' + ip + ':' + porta + '/?token=' + encodeURIComponent(token);
      setTimeout(function () {
        location.href = destinazione;
        // Se il computer non è sulla stessa rete, la navigazione fallisce
        // silenziosamente dal punto di vista di questa pagina (il browser
        // mostra il proprio errore di connessione) — non c'è modo di
        // intercettarlo da qui per mostrare il messaggio sopra invece.
      }, 700);
    })();
  </script>
</body>
</html>
```

- [ ] **Step 2: Verifica manuale nel browser**

Apri il file direttamente (`file://.../bridge/index.html?ip=127.0.0.1&porta=9999&token=test`) in un browser: deve comparire "Eccoti, iniziamo!" per circa 700ms e poi tentare di andare a `http://127.0.0.1:9999/?token=test` (fallirà, non c'è nulla in ascolto lì — è atteso, verifica solo che la pagina non vada in errore prima del tentativo).

- [ ] **Step 3: Commit**

```bash
git add bridge/index.html
git commit -m "Aggiunge la paginetta pubblica di reindirizzamento del ponte desktop

Statica, nessuna dipendenza, nessun dato nell'URL a parte indirizzo
locale e token. Reindirizza con una navigazione vera (non una
richiesta di rete), quindi non viene bloccata dalla regola mixed
content nonostante la pagina sia servita in HTTPS e la destinazione
sia in HTTP semplice. Momento di apertura breve nello stile
dell'onboarding, nessun video né libreria esterna."
```

- [ ] **Step 4: Ripunta GitHub Pages a `lavoro-locale-v2` — SOLO dopo conferma esplicita dell'utente**

Impostazione del repository (`Settings → Pages → Branch`), non un commit — non tocca la cronologia di `main`, reversibile con un clic. Da fare tramite l'interfaccia web di GitHub, non da riga di comando. **Chiedi conferma prima di farlo, anche in fase di esecuzione del piano.**

---

### Task 8: Aggiorna HANDOFF.md

**Files:**
- Modify: `HANDOFF.md`

- [ ] **Step 1: Segna lo stato del ponte desktop**

Nella sezione §5 di `HANDOFF.md`, sostituisci la riga che inizia con `**Stato in questa sessione:** l'infrastruttura di accoppiamento...` con:

```
**Stato:** scritto (sessione del 28/08/2026) — `BridgeServerPlugin.java` (server locale, NanoHTTPD), `createRemoteStore` in `vault.mjs`, QR vero (`vendor/qrcode.mjs`, MIT), dialogo "Continua sul computer" completato con link condivisibile e paginetta pubblica di reindirizzamento (`bridge/index.html`, GitHub Pages). Specifica in `docs/superpowers/specs/2026-08-28-desktop-bridge-design.md`. **Non ancora compilato né provato su device** — nessun SDK Android in questa sessione, e nessuna rete Wi-Fi reale su cui provare il collegamento vero.
```

- [ ] **Step 2: Aggiorna la roadmap**

Nella sezione della roadmap che elenca il "salto di qualità", trova la riga sul ponte desktop via QR e segnala come "scritto, da provare" con lo stesso stile già usato per il riquadro Impostazioni Rapide.

- [ ] **Step 3: Commit**

```bash
git add HANDOFF.md
git commit -m "Aggiorna HANDOFF: ponte desktop scritto, non ancora provato"
```

---

## Autoverifica del piano

**Copertura della specifica:** ogni sezione di `docs/superpowers/specs/2026-08-28-desktop-bridge-design.md` ha un task corrispondente — architettura (Task 1, 3, 4), QR vero (Task 2), schermata (Task 5), layout 16:9 (Task 6), paginetta pubblica + Pages (Task 7), casi limite sulla sessione scaduta/rifiutata (Task 1 e 4, tramite l'autenticazione col token), documentazione (Task 8).

**Scoperta corretta durante la stesura:** il piano inizialmente prevedeva una nuova vista `.view[data-view="bridge"]` per il Task 5 — durante la stesura è emerso che esiste già un dialogo `#dlg-desktop` funzionante a metà dalla sessione precedente (QR finto, dominio inesistente). Il Task 5 è stato riscritto per completarlo, non duplicarlo.

**Limite noto, riportato dalla specifica:** la guardia sulla sessione (Task 4) autentica ogni richiesta col token e la sua scadenza, ma non impedisce a un secondo dispositivo di collegarsi con lo stesso token prima che scada — fuori scopo per questa prima versione, come già scritto nella specifica.
