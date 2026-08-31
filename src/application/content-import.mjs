import { extractTextFromPdf, isPdfFile } from '../domain/pdf.mjs';

export async function readImportedContent(file, { extractPdf = extractTextFromPdf } = {}) {
  if (isPdfFile(file)) return (await extractPdf(file)).text;
  const name = String(file?.name ?? '').toLowerCase();
  if (!file || (!file.type?.startsWith('text/') && !name.endsWith('.txt') && !name.endsWith('.md'))) {
    throw new TypeError('FORMATO_NON_SUPPORTATO');
  }
  const text = await file.text();
  if (!text.trim()) throw new TypeError('FILE_SENZA_TESTO');
  return text;
}

export function readImportedBytes({ name, mimeType, bytes }, options) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes ?? []);
  const file = {
    name: String(name ?? ''), type: String(mimeType ?? ''), size: data.byteLength,
    text: async () => new TextDecoder().decode(data),
    arrayBuffer: async () => data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
  };
  return readImportedContent(file, options);
}
